import { create } from 'zustand';
import { adapter, renderConsolidatedNote } from '@/adapters/servicenow';
import { projection } from '@/adapters/projection';
import { telemetry } from '@/adapters/telemetry';
import type {
  Ticket, TrailEvent, StepInstance, Proposal, Suggestion, Slot, NotePair,
  BucketId, TagId, ChangeRef, AgentAction, ClosurePackage, ArticleHit,
  KnowledgePage, KnowledgePageSummary, Person, PublicationOutcome, EvidencePayload,
} from '@/domain/types';
import {
  answerQuestion, buildSlots, draftSlots, polishNote,
  remarkOnDeviation, remarkOnStaleArticle,
} from '@/agent/agent';
import { currentUser } from '~fixtures/team';

const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();
const DAY = 864e5;

/** The marker of the proposal raised by "all steps are done"; there is only one per ticket. */
const ALL_STEPS = 'all-steps';

export type Mode = 'work' | 'closing' | 'closed';

/** A top-level view. The work screen is the home of the shift; the others return to it (D15). */
export type View = 'work' | 'queue' | 'knowledge';

export interface QueueFilters {
  application: string | null;
  origin: Ticket['origin'] | null;
  mineOnly: boolean;
  noMatchOnly: boolean;
}

export const emptyQueueFilters: QueueFilters = {
  application: null, origin: null, mineOnly: false, noMatchOnly: false,
};

interface State {
  tickets: Ticket[];
  ticketsLoaded: boolean;
  people: Person[];
  selectedId: string | null;
  mode: Mode;
  stripExpanded: boolean;

  /** Everything below survives switching between views (D15). */
  view: View;
  openedPageId: string | null;
  pages: Record<string, KnowledgePage>;
  pageState: Record<string, 'loading' | 'ready' | 'failed'>;
  pageIndex: KnowledgePageSummary[];
  pageIndexState: 'idle' | 'loading' | 'ready' | 'failed';
  queueFilters: QueueFilters;
  /** Unsent input field text per ticket. Going to another view does not lose it. */
  drafts: Record<string, string>;

  trail: Record<string, TrailEvent[]>;
  steps: Record<string, StepInstance[]>;
  proposals: Record<string, Proposal[]>;
  suggestions: Record<string, Suggestion | null>;
  suggestionState: Record<string, 'loading' | 'ready' | 'failed'>;
  changes: Record<string, ChangeRef[]>;
  slots: Record<string, Slot[]>;
  slotsState: Record<string, 'loading' | 'ready' | 'failed'>;
  closureResult: Record<string, ClosurePackage>;
  /** The state of publishing what was accepted, per ticket (D18). */
  publications: Record<string, PublicationOutcome[]>;
  /** The state of a manual push into the ticket. */
  pushState: Record<string, 'idle' | 'sending' | 'failed'>;
  /** How many trail entries have already been pushed into ServiceNow. */
  pushedUpTo: Record<string, number>;

  loadTickets: () => Promise<void>;
  selectTicket: (id: string) => void;
  takeTicket: (id: string) => void;
  setMode: (mode: Mode) => void;
  toggleStrip: () => void;

  setView: (view: View) => void;
  openPage: (pageId: string, fromTicketId?: string) => void;
  loadPageIndex: () => void;
  setQueueFilters: (patch: Partial<QueueFilters>) => void;
  setDraft: (ticketId: string, text: string) => void;

  setBucket: (ticketId: string, bucket: BucketId) => void;
  toggleTag: (ticketId: string, tag: TagId) => void;

  addNote: (ticketId: string, raw: string) => void;
  addEvidence: (ticketId: string, raw: string) => void;
  askQuestion: (ticketId: string, text: string) => void;
  toggleNoteRaw: (eventId: string) => void;
  showRawFor: Record<string, boolean>;

  cycleStep: (ticketId: string, stepId: string) => void;
  decideAgentAction: (ticketId: string, eventId: string, action: AgentAction) => void;
  toggleNotApplicable: (ticketId: string, article: ArticleHit) => void;

  waitForReply: (ticketId: string) => void;
  resumeWork: (ticketId: string) => void;
  pushToTicket: (ticketId: string) => void;

  openClosure: (ticketId: string) => void;
  closeAsLastTime: (ticketId: string) => void;
  editSlot: (ticketId: string, slotId: Slot['id'], value: string) => void;
  decideProposal: (ticketId: string, proposalId: string, status: 'accepted' | 'rejected') => void;
  editProposal: (ticketId: string, proposalId: string, text: string) => void;
  closeTicket: (ticketId: string) => void;
}

export const useApp = create<State>((set, get) => ({
  tickets: [],
  ticketsLoaded: false,
  people: [],
  selectedId: null,
  mode: 'work',
  stripExpanded: false,
  view: 'work',
  openedPageId: null,
  pages: {},
  pageState: {},
  pageIndex: [],
  pageIndexState: 'idle',
  queueFilters: { ...emptyQueueFilters },
  drafts: {},
  trail: {},
  steps: {},
  proposals: {},
  suggestions: {},
  suggestionState: {},
  changes: {},
  slots: {},
  slotsState: {},
  closureResult: {},
  publications: {},
  pushState: {},
  pushedUpTo: {},
  showRawFor: {},

  async loadTickets() {
    // The team's tickets in full: the list on the left filters to mine, the queue shows everyone.
    const tickets = await adapter.listTickets({});
    set({ tickets, ticketsLoaded: true });
    void adapter.listPeople().then((people) => set({ people }));
    const first = tickets.find((t) => t.state === 'work' && t.assignee === currentUser.id);
    if (first && !get().selectedId) get().selectTicket(first.id);
  },

  selectTicket(id) {
    // State switches synchronously; the hint is loaded afterwards (I2).
    // Opening a ticket from any view returns to the work screen (D15).
    set({ selectedId: id, view: 'work', mode: get().closureResult[id] ? 'closed' : 'work' });
    const s = get();
    if (!s.steps[id]) {
      void adapter.getSteps(id).then((steps) =>
        set((st) => ({ steps: { ...st.steps, [id]: steps } })),
      );
    }
    if (!s.suggestionState[id]) {
      set((st) => ({ suggestionState: { ...st.suggestionState, [id]: 'loading' } }));
      void adapter.getSuggestion(id).then(
        (sug) => {
          set((st) => ({
            suggestions: { ...st.suggestions, [id]: sug },
            suggestionState: { ...st.suggestionState, [id]: 'ready' },
          }));
          // One event per suggested article: without it useCount cannot be earned
          // and the co_occurrence edges never appear (workspace.md, section J).
          for (const a of sug.articles) {
            pushTrail(set, id, {
              actor: 'system', kind: 'article_suggested',
              payload: { text: a.title, articleId: a.articleId },
            });
          }
        },
        () => set((st) => ({ suggestionState: { ...st.suggestionState, [id]: 'failed' } })),
      );
    }
    const ticket = s.tickets.find((t) => t.id === id);
    if (ticket?.ciId && !s.changes[id]) {
      void adapter
        .getChangesNearCi(ticket.ciId, { fromIso: ticket.openedAt, toIso: now() })
        .then((changes) => set((st) => ({ changes: { ...st.changes, [id]: changes } })));
    }
  },

  takeTicket(id) {
    set((st) => ({
      tickets: st.tickets.map((t) =>
        t.id === id ? { ...t, state: 'work', assignee: currentUser.id } : t,
      ),
    }));
    pushTrail(set, id, { actor: 'system', kind: 'assigned', payload: { text: 'ticket taken into work' } });
    get().selectTicket(id);
    void adapter.assignTicket(id, currentUser.id);
  },

  setMode(mode) { set({ mode }); },
  toggleStrip() { set((st) => ({ stripExpanded: !st.stripExpanded })); },

  setView(view) {
    // Only the view changes. The open ticket, the mode, the drafts and the filters stay (D15).
    set({ view });
    if (view === 'knowledge') get().loadPageIndex();
  },

  openPage(pageId, fromTicketId) {
    set({ view: 'knowledge', openedPageId: pageId });
    get().loadPageIndex();

    if (fromTicketId) {
      pushTrail(set, fromTicketId, {
        actor: 'user', kind: 'article_opened', payload: { text: pageId, articleId: pageId },
      });
      void telemetry.write({ kind: 'use', articleId: pageId, ticketId: fromTicketId, at: now() });
    }

    const st = get();
    if (st.pages[pageId] || st.pageState[pageId] === 'loading') return;
    set((s) => ({ pageState: { ...s.pageState, [pageId]: 'loading' } }));
    void projection.getPage(pageId).then(
      (page) => set((s) => ({
        pages: { ...s.pages, [pageId]: page },
        pageState: { ...s.pageState, [pageId]: 'ready' },
      })),
      () => set((s) => ({ pageState: { ...s.pageState, [pageId]: 'failed' } })),
    );
  },

  loadPageIndex() {
    if (get().pageIndexState !== 'idle') return;
    set({ pageIndexState: 'loading' });
    void projection.listPages().then(
      (pageIndex) => set({ pageIndex, pageIndexState: 'ready' }),
      () => set({ pageIndexState: 'failed' }),
    );
  },

  setQueueFilters(patch) {
    set((st) => ({ queueFilters: { ...st.queueFilters, ...patch } }));
  },

  setDraft(ticketId, text) {
    set((st) => ({ drafts: { ...st.drafts, [ticketId]: text } }));
  },

  setBucket(ticketId, bucket) {
    set((st) => ({
      tickets: st.tickets.map((t) =>
        t.id === ticketId ? { ...t, bucket: t.bucket === bucket ? undefined : bucket } : t,
      ),
    }));
    pushTrail(set, ticketId, { actor: 'user', kind: 'bucket_changed', payload: { text: bucket } });
  },

  toggleTag(ticketId, tag) {
    set((st) => ({
      tickets: st.tickets.map((t) =>
        t.id === ticketId
          ? { ...t, tags: t.tags.includes(tag) ? t.tags.filter((x) => x !== tag) : [...t.tags, tag] }
          : t,
      ),
    }));
    pushTrail(set, ticketId, { actor: 'user', kind: 'tag_changed', payload: { text: tag } });
  },

  addNote(ticketId, raw) {
    // The text lands in the feed before any asynchronous work. Target: 100 ms (I2).
    const note: NotePair = { raw, polished: null, polishState: 'pending' };
    const eventId = pushTrail(set, ticketId, { actor: 'user', kind: 'note', payload: { note } });

    void polishNote(raw).then(
      (polished) => patchNote(set, ticketId, eventId, { polished, polishState: 'ready' }),
      () => patchNote(set, ticketId, eventId, { polishState: 'failed' }),
    );
  },

  addEvidence(ticketId, raw) {
    const text = raw.trim();
    const isLink = /^https?:\/\/\S+$/i.test(text);
    // A link instead of a copy: it is almost as useful and removes the classification question.
    const evidence: EvidencePayload = isLink
      ? { text, isLink: true, label: hostOf(text) }
      : { text, isLink: false };
    pushTrail(set, ticketId, { actor: 'user', kind: 'evidence_added', payload: { evidence } });
    // Evidence strengthens the basis of the corrections already raised on this ticket.
    restrengthenCorrections(set, get, ticketId);
  },

  askQuestion(ticketId, text) {
    pushTrail(set, ticketId, { actor: 'user', kind: 'question', payload: { text } });
    const ticket = get().tickets.find((t) => t.id === ticketId);
    if (!ticket) return;
    void answerQuestion(text, ticket).then(
      (answer) => pushTrail(set, ticketId, { actor: 'agent', kind: 'agent_reply', payload: { text: answer } }),
      () => pushTrail(set, ticketId, { actor: 'agent', kind: 'agent_reply', payload: { text: 'the agent did not answer' } }),
    );
  },

  toggleNoteRaw(eventId) {
    set((st) => ({ showRawFor: { ...st.showRawFor, [eventId]: !st.showRawFor[eventId] } }));
  },

  cycleStep(ticketId, stepId) {
    const next = { open: 'done', done: 'failed', failed: 'open' } as const;
    const list = get().steps[ticketId] ?? [];
    const step = list.find((s) => s.id === stepId);
    if (!step) return;
    const state = next[step.state];

    set((st) => ({
      steps: {
        ...st.steps,
        [ticketId]: (st.steps[ticketId] ?? []).map((s) => (s.id === stepId ? { ...s, state } : s)),
      },
    }));
    pushTrail(set, ticketId, { actor: 'user', kind: 'step_marked', payload: { text: `${step.text}: ${state}` } });

    if (state === 'failed') {
      // A structural signal: the proposal appears without the model taking part.
      const evidence = hasEvidence(get(), ticketId);
      addProposal(set, {
        id: uid(), ticketId, kind: 'correction', anchor: step.stepRef,
        targetLabel: `${articleTitle(get(), ticketId, step.stepRef.articleSysId)}, step ${step.stepRef.headingPath.at(-1)}`,
        text: `The step "${step.text}" does not lead to recovery in this class of cases.`,
        diff: { minus: step.text, plus: 'Check the MQ queue depth on upstream' },
        basis: evidence
          ? 'a "did not help" step mark and the evidence attached on this ticket'
          : 'a "did not help" step mark on this ticket',
        // The basis strength table in agent.md: a mark without evidence is weak.
        strength: evidence ? 'strong' : 'weak',
        status: 'pending', sourceStepId: stepId,
        sourceArticleId: step.stepRef.articleSysId,
      });

      // The remark is optional and arrives later. The proposal already exists without it.
      void remarkOnDeviation(step).then((text) => {
        pushTrail(set, ticketId, {
          actor: 'agent', kind: 'agent_reply',
          payload: {
            text,
            actions: [
              { id: uid(), label: 'Record', proposal: null },
              { id: uid(), label: 'Not now', proposal: null, withdrawSourceStepId: stepId },
            ],
          },
        });
      }, () => { /* the model is silent, the proposal stands (I2) */ });
    } else {
      // Undoing the mark withdraws the proposal it raised.
      withdrawByStep(set, ticketId, stepId);
    }

    syncConfirmation(set, get, ticketId);
    maybeRemarkOnStaleArticle(set, get, ticketId);
  },

  decideAgentAction(ticketId, eventId, action) {
    set((st) => ({
      trail: {
        ...st.trail,
        [ticketId]: (st.trail[ticketId] ?? []).map((e) =>
          e.id === eventId
            ? { ...e, payload: { ...e.payload, actions: undefined, decided: action.label } }
            : e,
        ),
      },
    }));
    if (action.withdrawSourceStepId) withdrawByStep(set, ticketId, action.withdrawSourceStepId);
    if (action.proposal) {
      addProposal(set, { ...action.proposal, id: uid(), ticketId, status: 'pending' });
    }
  },

  toggleNotApplicable(ticketId, article) {
    const existing = (get().proposals[ticketId] ?? []).find(
      (p) => p.kind === 'not_applicable' && p.sourceArticleId === article.articleId && p.status === 'pending',
    );
    if (existing) {
      set((st) => ({
        proposals: {
          ...st.proposals,
          [ticketId]: (st.proposals[ticketId] ?? []).filter((p) => p.id !== existing.id),
        },
      }));
      return;
    }
    // Not a correction of the content but a correction of the matching (concept 6.1).
    addProposal(set, {
      id: uid(), ticketId, kind: 'not_applicable',
      targetLabel: article.title,
      text: `"${article.title}" does not fit this class of cases.`,
      basis: 'marked as not matching on this ticket',
      strength: 'weak', status: 'pending',
      sourceArticleId: article.articleId,
    });
  },

  waitForReply(ticketId) {
    set((st) => ({
      tickets: st.tickets.map((t) => (t.id === ticketId ? { ...t, state: 'wait' } : t)),
    }));
    pushTrail(set, ticketId, {
      actor: 'user', kind: 'state_changed', payload: { text: 'work → wait' },
    });
    void adapter.setTicketState(ticketId, 'wait');
    // A boundary: a consolidated note goes into the ticket (D9).
    get().pushToTicket(ticketId);
  },

  resumeWork(ticketId) {
    set((st) => ({
      tickets: st.tickets.map((t) => (t.id === ticketId ? { ...t, state: 'work' } : t)),
    }));
    pushTrail(set, ticketId, {
      actor: 'user', kind: 'state_changed', payload: { text: 'wait → work' },
    });
    void adapter.setTicketState(ticketId, 'work');
  },

  pushToTicket(ticketId) {
    const st = get();
    const trail = st.trail[ticketId] ?? [];
    const from = st.pushedUpTo[ticketId] ?? 0;
    const fresh = trail.slice(from);
    // The button never becomes disabled; the state is shown next to it (I2).
    set((s) => ({ pushState: { ...s.pushState, [ticketId]: 'sending' } }));

    const text = renderConsolidatedNote(fresh);
    void adapter.pushNote(ticketId, text).then(
      () => {
        set((s) => ({
          pushState: { ...s.pushState, [ticketId]: 'idle' },
          pushedUpTo: { ...s.pushedUpTo, [ticketId]: trail.length },
        }));
        pushTrail(set, ticketId, {
          actor: 'system', kind: 'pushed_to_sn',
          payload: { text: `a consolidated note pushed, ${fresh.length} entries` },
        });
      },
      () => {
        // Nothing is lost: the trail stays on our side and the action can be repeated.
        set((s) => ({ pushState: { ...s.pushState, [ticketId]: 'failed' } }));
      },
    );
  },

  openClosure(ticketId) {
    set({ mode: 'closing' });
    if (get().slotsState[ticketId] === 'ready') return;
    set((st) => ({ slotsState: { ...st.slotsState, [ticketId]: 'loading' } }));
    const s = get();
    const ticket = s.tickets.find((t) => t.id === ticketId);
    if (!ticket) return;
    const input = {
      ticket,
      steps: s.steps[ticketId] ?? [],
      trail: s.trail[ticketId] ?? [],
      suggestion: s.suggestions[ticketId] ?? undefined,
    };
    void buildSlots(input).then(
      (slots) => set((st) => ({
        slots: { ...st.slots, [ticketId]: slots },
        slotsState: { ...st.slotsState, [ticketId]: 'ready' },
      })),
      // Without the model the structural signals still fill the slots.
      () => set((st) => ({
        slots: { ...st.slots, [ticketId]: draftSlots(input) },
        slotsState: { ...st.slotsState, [ticketId]: 'failed' },
      })),
    );
  },

  closeAsLastTime(ticketId) {
    const s = get();
    const ticket = s.tickets.find((t) => t.id === ticketId);
    if (!ticket) return;
    // The slots are filled from the history and the marks, synchronously and without the model.
    const slots = draftSlots({
      ticket,
      steps: s.steps[ticketId] ?? [],
      trail: s.trail[ticketId] ?? [],
      suggestion: s.suggestions[ticketId] ?? undefined,
    });
    set((st) => ({
      mode: 'closing',
      slots: { ...st.slots, [ticketId]: slots },
      slotsState: { ...st.slotsState, [ticketId]: 'ready' },
    }));
    // It does not close the ticket: the person still sees the composition (D17).
  },

  editSlot(ticketId, slotId, value) {
    set((st) => ({
      slots: {
        ...st.slots,
        [ticketId]: (st.slots[ticketId] ?? emptySlots()).map((s) =>
          s.id === slotId ? { ...s, value, provenance: s.provenance || 'edited by the engineer' } : s,
        ),
      },
    }));
  },

  decideProposal(ticketId, proposalId, status) {
    set((st) => ({
      proposals: {
        ...st.proposals,
        [ticketId]: (st.proposals[ticketId] ?? []).map((p) =>
          p.id === proposalId ? { ...p, status } : p,
        ),
      },
    }));
    pushTrail(set, ticketId, { actor: 'user', kind: 'proposal_decided', payload: { text: `${proposalId}: ${status}` } });
  },

  editProposal(ticketId, proposalId, text) {
    set((st) => ({
      proposals: {
        ...st.proposals,
        [ticketId]: (st.proposals[ticketId] ?? []).map((p) =>
          p.id === proposalId ? { ...p, text, status: 'pending' } : p,
        ),
      },
    }));
  },

  closeTicket(ticketId) {
    const s = get();
    const accepted = (s.proposals[ticketId] ?? []).filter((p) => p.status === 'accepted');
    const pkg: ClosurePackage = {
      slots: s.slots[ticketId] ?? emptySlots(),
      acceptedProposals: accepted,
      trail: s.trail[ticketId] ?? [],
      articlesUsed: (s.suggestions[ticketId]?.articles ?? []).map((a) => ({
        title: a.title, version: '7', url: adapter.deepLink('article', a.articleId),
      })),
    };
    // The transition is immediate; the write into ServiceNow follows (I3: nothing blocks).
    set((st) => ({
      mode: 'closed',
      closureResult: { ...st.closureResult, [ticketId]: pkg },
      tickets: st.tickets.map((t) => (t.id === ticketId ? { ...t, state: 'closed' } : t)),
      publications: {
        ...st.publications,
        [ticketId]: accepted.map((p) => ({
          proposalId: p.id,
          targetLabel: p.targetLabel,
          target: publicationTarget(p),
          state: 'sending' as const,
        })),
      },
    }));
    pushTrail(set, ticketId, { actor: 'system', kind: 'pushed_to_sn', payload: { text: 'the closure package has been sent' } });
    void adapter.closeTicket(ticketId, pkg);
    // Publication follows the closing and never blocks it (D18).
    void publishAccepted(set, ticketId, accepted);
  },
}));

type Setter = (fn: (st: State) => Partial<State>) => void;
type Getter = () => State;

function pushTrail(
  set: Setter,
  ticketId: string,
  event: Pick<TrailEvent, 'actor' | 'kind' | 'payload'>,
): string {
  const id = uid();
  set((st) => ({
    trail: {
      ...st.trail,
      [ticketId]: [...(st.trail[ticketId] ?? []), { id, ticketId, at: now(), ...event }],
    },
  }));
  return id;
}

function patchNote(set: Setter, ticketId: string, eventId: string, patch: Partial<NotePair>) {
  set((st) => ({
    trail: {
      ...st.trail,
      [ticketId]: (st.trail[ticketId] ?? []).map((e) =>
        e.id === eventId && e.payload.note
          ? { ...e, payload: { ...e.payload, note: { ...e.payload.note, ...patch } } }
          : e,
      ),
    },
  }));
}

function addProposal(set: Setter, proposal: Proposal) {
  set((st) => ({
    proposals: { ...st.proposals, [proposal.ticketId]: [...(st.proposals[proposal.ticketId] ?? []), proposal] },
  }));
}

function withdrawByStep(set: Setter, ticketId: string, stepId: string) {
  set((st) => ({
    proposals: {
      ...st.proposals,
      [ticketId]: (st.proposals[ticketId] ?? []).filter(
        (p) => !(p.sourceStepId === stepId && p.status === 'pending'),
      ),
    },
  }));
}

const hasEvidence = (st: State, ticketId: string) =>
  (st.trail[ticketId] ?? []).some((e) => e.kind === 'evidence_added');

function articleTitle(st: State, ticketId: string, articleId: string): string {
  const hit = (st.suggestions[ticketId]?.articles ?? []).find((a) => a.articleId === articleId);
  return hit?.title ?? articleId;
}

/** Evidence pasted after the mark raises the basis of the corrections already in the basket. */
function restrengthenCorrections(set: Setter, get: Getter, ticketId: string) {
  set((st) => ({
    proposals: {
      ...st.proposals,
      [ticketId]: (st.proposals[ticketId] ?? []).map((p) =>
        p.kind === 'correction' && p.status === 'pending' && p.strength === 'weak'
          ? {
            ...p,
            strength: 'strong' as const,
            basis: 'a "did not help" step mark and the evidence attached on this ticket',
          }
          : p,
      ),
    },
  }));
  void get; // the read happens inside set, the getter is kept for symmetry with the other helpers
}

/**
 * All the steps marked done means the procedure worked. This is the main source of
 * freshness and it must not require a separate press (workspace.md, "Confirming an article").
 */
function syncConfirmation(set: Setter, get: Getter, ticketId: string) {
  const st = get();
  const steps = st.steps[ticketId] ?? [];
  const existing = (st.proposals[ticketId] ?? []).find(
    (p) => p.sourceStepId === ALL_STEPS && p.status === 'pending',
  );
  const allDone = steps.length > 0 && steps.every((s) => s.state === 'done');

  if (allDone && !existing) {
    const articleId = steps[0]!.stepRef.articleSysId;
    addProposal(set, {
      id: uid(), ticketId, kind: 'confirmation',
      anchor: steps[0]!.stepRef,
      targetLabel: articleTitle(st, ticketId, articleId),
      text: 'The procedure worked as written.',
      basis: `all ${steps.length} steps of the procedure marked as done on this ticket`,
      strength: 'strong', status: 'pending',
      sourceStepId: ALL_STEPS, sourceArticleId: articleId,
    });
  }
  if (!allDone && existing) withdrawByStep(set, ticketId, ALL_STEPS);
}

/** One remark per ticket about an article that has not been confirmed for a long time. */
function maybeRemarkOnStaleArticle(set: Setter, get: Getter, ticketId: string) {
  const st = get();
  const already = (st.trail[ticketId] ?? []).some((e) => e.payload.staleRemark === true);
  if (already) return;

  const stale = (st.suggestions[ticketId]?.articles ?? []).find(
    (a) => a.lastConfirmedAt && Date.now() - new Date(a.lastConfirmedAt).getTime() > 90 * DAY,
  );
  if (!stale?.lastConfirmedAt) return;

  const months = Math.round((Date.now() - new Date(stale.lastConfirmedAt).getTime()) / (30 * DAY));
  void remarkOnStaleArticle(stale.title, months).then((text) => {
    pushTrail(set, ticketId, {
      actor: 'agent', kind: 'agent_reply',
      payload: {
        text,
        staleRemark: true,
        actions: [
          {
            id: uid(),
            label: 'Confirm',
            proposal: {
              kind: 'confirmation',
              targetLabel: stale.title,
              text: 'The procedure worked as written.',
              basis: `confirmed on this ticket after ${months} months without confirmation`,
              strength: 'strong',
              sourceArticleId: stale.articleId,
            },
          },
          { id: uid(), label: 'Not now', proposal: null },
        ],
      },
    });
  }, () => { /* the model is silent; the freshness signal on the card stays (I2) */ });
}

const publicationTarget = (p: Proposal) =>
  p.kind === 'confirmation' || p.kind === 'not_applicable' || p.kind === 'link'
    ? ('telemetry' as const)
    : ('article' as const);

/**
 * Dispatch of what was accepted. This is where the loop closes: without it an edit
 * reaches close_notes and never reaches the master (I1).
 */
async function publishAccepted(set: Setter, ticketId: string, accepted: Proposal[]) {
  for (const p of accepted) {
    const patch = (outcome: Partial<PublicationOutcome>) =>
      set((st) => ({
        publications: {
          ...st.publications,
          [ticketId]: (st.publications[ticketId] ?? []).map((o) =>
            o.proposalId === p.id ? { ...o, ...outcome } : o,
          ),
        },
      }));

    if (publicationTarget(p) === 'telemetry') {
      const kind = p.kind === 'confirmation' ? 'confirmation' as const
        : p.kind === 'not_applicable' ? 'not_applicable' as const
          : 'use' as const;
      await telemetry.write({
        kind,
        articleId: p.sourceArticleId ?? p.anchor?.articleSysId ?? '',
        ticketId,
        engineerId: currentUser.id,
        at: now(),
      });
      patch({ state: 'published', detail: 'telemetry updated, the article body unchanged' });
      continue;
    }

    const result = await adapter.publishArticleVersion({
      anchor: p.anchor,
      expectedContentHash: p.anchor?.contentHash,
      text: p.text,
      // A weak proposal goes into the observations section, not into the canon (D7).
      section: p.strength === 'weak' ? 'observation' : 'canonical',
      sourceTicketId: ticketId,
    });

    if (result.ok) {
      patch({ state: 'published', version: result.version });
      if (p.kind === 'correction') {
        await telemetry.write({
          kind: 'deviation',
          articleId: p.anchor?.articleSysId ?? '',
          ticketId,
          engineerId: currentUser.id,
          articleVersion: result.version,
          at: now(),
        });
      }
    } else if (result.reason === 'conflict') {
      // The article changed while the work was going on. Nothing is overwritten silently (I1).
      patch({
        state: 'conflict',
        detail: 'the article was changed in ServiceNow; the proposal has been rebuilt against the new body',
      });
    } else {
      patch({ state: 'failed', detail: result.detail });
    }
  }
}

const hostOf = (url: string): string => {
  try { return new URL(url).host; } catch { return 'link'; }
};

export function emptySlots(): Slot[] {
  return [
    { id: 'symptom', label: 'Symptom', value: '', provenance: '', question: 'how the request started' },
    { id: 'cause', label: 'Cause', value: '', provenance: '', question: 'what turned out to be the source of the problem' },
    { id: 'action', label: 'What was done', value: '', provenance: '', question: 'which actions led to the recovery' },
    { id: 'verification', label: 'Verification', value: '', provenance: '', question: 'what confirmed the recovery' },
  ];
}

/**
 * The short path is available only for a recurring alert whose course matched (D17).
 * With a weak match, a diverged course or no signature there is nothing to offer.
 */
export function shortPathOffer(st: State, ticketId: string): { text: string } | null {
  const ticket = st.tickets.find((t) => t.id === ticketId);
  const history = st.suggestions[ticketId]?.alertHistory;
  const steps = st.steps[ticketId] ?? [];
  if (!ticket?.alertSignature || !history) return null;
  if (steps.length === 0 || !steps.every((s) => s.state === 'done')) return null;
  return {
    text: `${history.commonResolution}. The course of the resolution matched on ${history.commonCount} of ${history.occurrences} occurrences.`,
  };
}
