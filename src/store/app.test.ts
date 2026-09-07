import { describe, expect, it, beforeEach, vi } from 'vitest';
import { useApp, emptySlots, emptyQueueFilters, shortPathOffer } from './app';
import { setAgentMode } from '@/agent/agent';
import { isGap } from '@/domain/types';
import type { StepInstance, Suggestion, Ticket } from '@/domain/types';
import { renderClosureNote } from '@/adapters/servicenow';

const reset = () => {
  useApp.setState({
    tickets: [], ticketsLoaded: false, people: [], selectedId: null, mode: 'work',
    trail: {}, steps: {}, proposals: {}, suggestions: {}, suggestionState: {},
    changes: {}, slots: {}, slotsState: {}, closureResult: {}, showRawFor: {},
    view: 'work', openedPageId: null, pages: {}, pageState: {},
    pageIndex: [], pageIndexState: 'idle', drafts: {},
    publications: {}, pushState: {}, pushedUpTo: {},
    queueFilters: { ...emptyQueueFilters },
  });
  setAgentMode('normal');
};

beforeEach(reset);

const ticket = (over: Partial<Ticket> = {}): Ticket => ({
  id: 'INC1', sysId: 'x', type: 'incident', title: 't', description: '',
  application: 'a', priority: 'P3', origin: 'alert', state: 'work',
  openedAt: new Date().toISOString(), tags: [], knowledgeMatch: 'none',
  ...over,
});

const step = (id: string, over: Partial<StepInstance> = {}): StepInstance => ({
  id, ticketId: 'INC1', text: `step ${id}`, state: 'open',
  stepRef: { articleSysId: 'kb1', headingPath: ['Steps', id], contentHash: `h${id}` },
  ...over,
});

describe('I2: the model does not block input', () => {
  it('a note lands in the feed synchronously while the model is unavailable', () => {
    setAgentMode('down');
    useApp.getState().addNote('INC1', 'queue depth 12400');
    const trail = useApp.getState().trail.INC1 ?? [];
    expect(trail).toHaveLength(1);
    expect(trail[0]?.payload.note?.raw).toBe('queue depth 12400');
    expect(trail[0]?.payload.note?.polishState).toBe('pending');
  });

  it('a note lands in the feed synchronously while the model is slow', () => {
    setAgentMode('slow');
    const t0 = performance.now();
    useApp.getState().addNote('INC1', 'a second note');
    expect(performance.now() - t0).toBeLessThan(100);
    expect(useApp.getState().trail.INC1).toHaveLength(1);
  });
});

describe('I3: closing is not blocked', () => {
  it('goes through with empty slots and an unreviewed basket', () => {
    useApp.setState({
      tickets: [ticket()],
      slots: { INC1: emptySlots() },
      proposals: { INC1: [{
        id: 'p1', ticketId: 'INC1', kind: 'correction', targetLabel: 'target',
        text: 't', basis: 'a step mark', strength: 'strong', status: 'pending',
      }] },
    });

    useApp.getState().closeTicket('INC1');

    const pkg = useApp.getState().closureResult.INC1!;
    expect(useApp.getState().mode).toBe('closed');
    expect(pkg.slots.every(isGap)).toBe(true);
    expect(pkg.acceptedProposals).toHaveLength(0);
    // The gap is visible in the master rather than omitted.
    expect(renderClosureNote(pkg)).toContain('Symptom: not filled in');
  });
});

describe('I7: every proposal has a basis', () => {
  it('a failed step mark raises a proposal with a non-empty basis', () => {
    useApp.setState({ steps: { INC1: [step('s1')] } });

    useApp.getState().cycleStep('INC1', 's1'); // open → done
    expect((useApp.getState().proposals.INC1 ?? []).filter((p) => p.kind === 'correction')).toHaveLength(0);

    useApp.getState().cycleStep('INC1', 's1'); // done → failed
    const corrections = (useApp.getState().proposals.INC1 ?? []).filter((p) => p.kind === 'correction');
    expect(corrections).toHaveLength(1);
    expect(corrections[0]?.basis).not.toBe('');

    useApp.getState().cycleStep('INC1', 's1'); // failed → open, the proposal is withdrawn
    expect((useApp.getState().proposals.INC1 ?? []).filter((p) => p.kind === 'correction')).toHaveLength(0);
  });

  it('a mark without evidence is weak, with evidence it is strong (agent.md)', () => {
    useApp.setState({ steps: { INC1: [step('s1')] } });
    useApp.getState().cycleStep('INC1', 's1');
    useApp.getState().cycleStep('INC1', 's1');
    expect(useApp.getState().proposals.INC1?.[0]?.strength).toBe('weak');

    useApp.getState().addEvidence('INC1', 'depth=41200 sustained 12m');
    expect(useApp.getState().proposals.INC1?.[0]?.strength).toBe('strong');
    expect(useApp.getState().proposals.INC1?.[0]?.basis).toContain('evidence');
  });
});

describe('Confirmation of an article', () => {
  it('all steps done raises a confirmation without a separate press', () => {
    useApp.setState({ steps: { INC1: [step('s1'), step('s2')] } });

    useApp.getState().cycleStep('INC1', 's1');
    expect((useApp.getState().proposals.INC1 ?? []).some((p) => p.kind === 'confirmation')).toBe(false);

    useApp.getState().cycleStep('INC1', 's2');
    const confirmation = (useApp.getState().proposals.INC1 ?? []).find((p) => p.kind === 'confirmation');
    expect(confirmation).toBeDefined();
    expect(confirmation?.strength).toBe('strong');
    expect(confirmation?.basis).toContain('all 2 steps');

    // Moving a step out of done withdraws the confirmation.
    useApp.getState().cycleStep('INC1', 's2');
    expect((useApp.getState().proposals.INC1 ?? []).some((p) => p.kind === 'confirmation')).toBe(false);
  });
});

describe('Not applicable', () => {
  it('corrects the matching, does not change the article text, and toggles off', () => {
    const article = {
      articleId: 'kb1', title: 'Article', matchReason: 'CI', useCount: 3, freshness: 'fresh' as const,
    };
    useApp.getState().toggleNotApplicable('INC1', article);
    const p = (useApp.getState().proposals.INC1 ?? [])[0]!;
    expect(p.kind).toBe('not_applicable');
    expect(p.basis).not.toBe('');
    expect(p.anchor).toBeUndefined();

    useApp.getState().toggleNotApplicable('INC1', article);
    expect(useApp.getState().proposals.INC1 ?? []).toHaveLength(0);
  });
});

describe('Evidence', () => {
  it('a link is stored as a link rather than as a copy of the data', () => {
    useApp.getState().addEvidence('INC1', 'https://dash.example.com/gw3?from=1&to=2');
    const event = (useApp.getState().trail.INC1 ?? [])[0]!;
    expect(event.kind).toBe('evidence_added');
    expect(event.payload.evidence?.isLink).toBe(true);
    expect(event.payload.evidence?.label).toBe('dash.example.com');
  });
});

describe('D17: the short path', () => {
  const history: Suggestion = {
    ticketId: 'INC1',
    articles: [],
    similarTickets: [],
    alertHistory: {
      signature: 'sig', occurrences: 14, commonCount: 12,
      commonResolution: 'the MQ queue was drained', exceptions: 'twice a real problem',
    },
  };

  it('is offered for a recurring alert whose course matched', () => {
    useApp.setState({
      tickets: [ticket({ alertSignature: 'sig' })],
      suggestions: { INC1: history },
      steps: { INC1: [step('s1', { state: 'done' })] },
    });
    expect(shortPathOffer(useApp.getState(), 'INC1')).not.toBeNull();
  });

  it('is not offered when a step failed, when there is no signature, and when there is no history', () => {
    useApp.setState({
      tickets: [ticket({ alertSignature: 'sig' })],
      suggestions: { INC1: history },
      steps: { INC1: [step('s1', { state: 'done' }), step('s2', { state: 'failed' })] },
    });
    expect(shortPathOffer(useApp.getState(), 'INC1')).toBeNull();

    useApp.setState({ steps: { INC1: [step('s1', { state: 'done' })] }, tickets: [ticket()] });
    expect(shortPathOffer(useApp.getState(), 'INC1')).toBeNull();

    useApp.setState({ tickets: [ticket({ alertSignature: 'sig' })], suggestions: { INC1: null } });
    expect(shortPathOffer(useApp.getState(), 'INC1')).toBeNull();
  });

  it('fills the slots from the history and the marks without closing the ticket', () => {
    useApp.setState({
      tickets: [ticket({ alertSignature: 'sig' })],
      suggestions: { INC1: history },
      steps: { INC1: [step('s1', { state: 'done' })] },
    });
    useApp.getState().closeAsLastTime('INC1');

    const st = useApp.getState();
    expect(st.mode).toBe('closing');
    expect(st.tickets[0]?.state).toBe('work');
    const cause = st.slots.INC1?.find((s) => s.id === 'cause');
    expect(cause?.value).toBe('the MQ queue was drained');
    expect(cause?.provenance).toContain('12 of 14');
  });
});

describe('D9: state changes and pushing into the ticket', () => {
  it('waiting for a reply changes the state and pushes a consolidated note', async () => {
    useApp.setState({ tickets: [ticket()] });
    useApp.getState().addNote('INC1', 'waiting for the vendor');

    useApp.getState().waitForReply('INC1');

    expect(useApp.getState().tickets[0]?.state).toBe('wait');
    expect((useApp.getState().trail.INC1 ?? []).some((e) => e.kind === 'state_changed')).toBe(true);
    expect(useApp.getState().pushState.INC1).toBe('sending');

    await vi.waitFor(() => {
      expect(useApp.getState().pushState.INC1).toBe('idle');
    });
    expect((useApp.getState().trail.INC1 ?? []).some((e) => e.kind === 'pushed_to_sn')).toBe(true);
  });
});

describe('I1: what is accepted reaches the master', () => {
  it('a correction goes to publication, a confirmation goes to telemetry', async () => {
    useApp.setState({
      tickets: [ticket()],
      slots: { INC1: emptySlots() },
      proposals: { INC1: [
        {
          id: 'p1', ticketId: 'INC1', kind: 'correction',
          anchor: { articleSysId: 'kb_0010441', headingPath: ['Steps', '3'], contentHash: 'h3' },
          targetLabel: 'article, step 3', text: 'new text',
          basis: 'a step mark and evidence', strength: 'strong', status: 'accepted',
        },
        {
          id: 'p2', ticketId: 'INC1', kind: 'confirmation',
          targetLabel: 'article', text: 'the procedure worked',
          basis: 'all steps done', strength: 'strong', status: 'accepted',
          sourceArticleId: 'kb_0010441',
        },
      ] },
    });

    useApp.getState().closeTicket('INC1');
    // Closing does not wait for the publication (D18).
    expect(useApp.getState().mode).toBe('closed');
    expect(useApp.getState().publications.INC1?.every((o) => o.state === 'sending')).toBe(true);

    await vi.waitFor(() => {
      const outcomes = useApp.getState().publications.INC1 ?? [];
      expect(outcomes.every((o) => o.state !== 'sending')).toBe(true);
    }, { timeout: 5000 });

    const outcomes = useApp.getState().publications.INC1 ?? [];
    const correction = outcomes.find((o) => o.proposalId === 'p1')!;
    const confirmation = outcomes.find((o) => o.proposalId === 'p2')!;
    expect(correction.target).toBe('article');
    expect(correction.state).toBe('published');
    expect(confirmation.target).toBe('telemetry');
    expect(confirmation.state).toBe('published');
  });

  it('a hash conflict does not roll back the closing and is shown to the person', async () => {
    useApp.setState({
      tickets: [ticket()],
      slots: { INC1: emptySlots() },
      proposals: { INC1: [{
        id: 'p1', ticketId: 'INC1', kind: 'correction',
        anchor: { articleSysId: 'kb_0010441', headingPath: ['Steps', '3'], contentHash: 'stale-hash' },
        targetLabel: 'article, step 3', text: 'new text',
        basis: 'a step mark and evidence', strength: 'strong', status: 'accepted',
      }] },
    });

    useApp.getState().closeTicket('INC1');

    await vi.waitFor(() => {
      expect(useApp.getState().publications.INC1?.[0]?.state).toBe('conflict');
    }, { timeout: 5000 });

    expect(useApp.getState().tickets[0]?.state).toBe('closed');
    expect(useApp.getState().publications.INC1?.[0]?.detail).toContain('rebuilt');
  });
});

describe('D15: state survives switching between views', () => {
  it('going to knowledge and back keeps the ticket, the mode, the draft and the basket', () => {
    useApp.setState({
      selectedId: 'INC1',
      mode: 'closing',
      stripExpanded: true,
      drafts: { INC1: 'depth 41200, unsent' },
      proposals: { INC1: [{
        id: 'p1', ticketId: 'INC1', kind: 'correction', targetLabel: 'target',
        text: 't', basis: 'a step mark', strength: 'strong', status: 'pending',
      }] },
    });

    useApp.getState().setView('knowledge');
    useApp.getState().setView('queue');
    useApp.getState().setView('work');

    const st = useApp.getState();
    expect(st.selectedId).toBe('INC1');
    expect(st.mode).toBe('closing');
    expect(st.stripExpanded).toBe(true);
    expect(st.drafts.INC1).toBe('depth 41200, unsent');
    expect(st.proposals.INC1).toHaveLength(1);
  });

  it('the queue filters survive going to another view', () => {
    useApp.getState().setQueueFilters({ noMatchOnly: true, application: 'FIX Gateway' });
    useApp.getState().setView('knowledge');
    useApp.getState().setView('queue');
    expect(useApp.getState().queueFilters.noMatchOnly).toBe(true);
    expect(useApp.getState().queueFilters.application).toBe('FIX Gateway');
  });

  it('opening a ticket from the queue returns to the work screen', () => {
    useApp.setState({ view: 'queue' });
    useApp.getState().selectTicket('INC0448213');
    expect(useApp.getState().view).toBe('work');
    expect(useApp.getState().selectedId).toBe('INC0448213');
  });
});

describe('D16: from a ticket we lead to the projection', () => {
  it('opening a knowledge page does not touch the work state and records the use', () => {
    useApp.setState({ selectedId: 'INC1', mode: 'closing' });
    useApp.getState().openPage('kb_0010441', 'INC1');
    const st = useApp.getState();
    expect(st.view).toBe('knowledge');
    expect(st.openedPageId).toBe('kb_0010441');
    expect(st.selectedId).toBe('INC1');
    expect(st.mode).toBe('closing');
    // Without this event useCount cannot be earned and the graph does not improve.
    expect((st.trail.INC1 ?? []).some((e) => e.kind === 'article_opened')).toBe(true);
  });
});
