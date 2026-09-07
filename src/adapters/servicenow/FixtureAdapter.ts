import type {
  Ticket, ChangeRef, ArticleHit, TicketHit, Suggestion, StepInstance, ClosurePackage, Person,
} from '@/domain/types';
import type {
  ServiceNowAdapter, TicketFilter, SearchQuery, TimeWindow,
  ArticleBody, PublishRequest, PublishResult, JournalEntry,
} from './types';
import { tickets as fixtureTickets } from '~fixtures/tickets';
import { people } from '~fixtures/team';
import { suggestions, steps, changesNearCi, articles } from '~fixtures/knowledge';

const INSTANCE = 'https://example.service-now.com';

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Works on top of file fixtures. The only implementation until Q1–Q5 are answered.
 * Keeps its own copy of the tickets so that writes have an observable effect.
 */
export class FixtureAdapter implements ServiceNowAdapter {
  private tickets: Ticket[] = fixtureTickets.map((t) => ({ ...t }));
  private journal = new Map<string, JournalEntry[]>();
  /** Article versions, so that a publication has an observable effect. */
  private versions = new Map<string, number>();

  /** An artificial network delay. No screen waits for it before rendering. */
  constructor(private readonly latencyMs = 220) {}

  async listTickets(filter: TicketFilter): Promise<Ticket[]> {
    await delay(this.latencyMs);
    return this.tickets.filter((t) => {
      if (filter.states && !filter.states.includes(t.state)) return false;
      if (filter.assignee && t.state !== 'queue' && t.assignee !== filter.assignee) return false;
      return true;
    }).map((t) => ({ ...t }));
  }

  async getTicket(id: string): Promise<Ticket> {
    await delay(this.latencyMs);
    const found = this.tickets.find((t) => t.id === id);
    if (!found) throw new Error(`ticket ${id} not found`);
    return { ...found };
  }

  async getTicketJournal(id: string): Promise<JournalEntry[]> {
    await delay(this.latencyMs);
    return this.journal.get(id) ?? [];
  }

  async listPeople(): Promise<Person[]> {
    await delay(this.latencyMs);
    return people.map((p) => ({ ...p }));
  }

  async getChangesNearCi(ciId: string, _window: TimeWindow): Promise<ChangeRef[]> {
    await delay(this.latencyMs);
    return changesNearCi[ciId] ?? [];
  }

  async getArticle(sysId: string): Promise<ArticleBody> {
    await delay(this.latencyMs);
    const body = articles[sysId];
    if (!body) throw new Error(`article ${sysId} not found`);
    return body;
  }

  async searchArticles(query: SearchQuery): Promise<ArticleHit[]> {
    await delay(this.latencyMs);
    return Object.values(suggestions)
      .flatMap((s) => s.articles)
      .filter((a) => a.title.toLowerCase().includes(query.text.toLowerCase()));
  }

  async searchClosedTickets(query: SearchQuery): Promise<TicketHit[]> {
    await delay(this.latencyMs);
    return Object.values(suggestions)
      .flatMap((s) => s.similarTickets)
      .filter((t) => t.title.toLowerCase().includes(query.text.toLowerCase()));
  }

  async getSuggestion(ticketId: string): Promise<Suggestion> {
    await delay(this.latencyMs * 3);
    return suggestions[ticketId] ?? { ticketId, articles: [], similarTickets: [] };
  }

  async getSteps(ticketId: string): Promise<StepInstance[]> {
    await delay(this.latencyMs);
    return (steps[ticketId] ?? []).map((s) => ({ ...s }));
  }

  async assignTicket(id: string, assignee: string): Promise<void> {
    await delay(this.latencyMs);
    const t = this.tickets.find((x) => x.id === id);
    if (t) { t.assignee = assignee; t.state = 'work'; }
  }

  async setTicketState(id: string, state: Ticket['state']): Promise<void> {
    await delay(this.latencyMs);
    const t = this.tickets.find((x) => x.id === id);
    // `closing` is an interface state and is not reflected in ServiceNow.
    if (t && state !== 'closing') t.state = state;
  }

  async pushNote(id: string, text: string): Promise<void> {
    await delay(this.latencyMs);
    const list = this.journal.get(id) ?? [];
    list.push({ at: new Date().toISOString(), author: 'me', text });
    this.journal.set(id, list);
  }

  async closeTicket(id: string, pkg: ClosurePackage): Promise<void> {
    await delay(this.latencyMs);
    const t = this.tickets.find((x) => x.id === id);
    if (t) t.state = 'closed';
    // An empty slot goes in as "not filled in" rather than being dropped.
    await this.pushNote(id, renderClosureNote(pkg));
  }

  async publishArticleVersion(req: PublishRequest): Promise<PublishResult> {
    await delay(this.latencyMs * 2);

    // A new article: there is no fragment to address yet.
    if (!req.anchor) return { ok: true, version: '1' };

    const body = articles[req.anchor.articleSysId];
    if (!body) return { ok: false, reason: 'error', detail: 'the article is not in the master' };

    // Observations go into a marked-up section and do not touch the canonical fragment.
    if (req.section === 'observation') return { ok: true, version: this.bumpVersion(body) };

    const block = body.blocks.find((b) => b.anchor?.contentHash === req.expectedContentHash);
    if (!block) return { ok: false, reason: 'conflict', currentBody: body };

    return { ok: true, version: this.bumpVersion(body) };
  }

  private bumpVersion(body: ArticleBody): string {
    const next = (this.versions.get(body.sysId) ?? Number(body.version)) + 1;
    this.versions.set(body.sysId, next);
    return String(next);
  }

  deepLink(kind: 'ticket' | 'article' | 'change', id: string): string {
    const table = kind === 'article' ? 'kb_knowledge' : kind === 'change' ? 'change_request' : 'task';
    return `${INSTANCE}/nav_to.do?uri=${table}.do%3Fsys_id=${encodeURIComponent(id)}`;
  }
}

export function renderClosureNote(pkg: ClosurePackage): string {
  const slot = (id: string) => {
    const s = pkg.slots.find((x) => x.id === id);
    return s && s.value.trim() ? s.value.trim() : 'not filled in';
  };
  const accepted = pkg.acceptedProposals.length
    ? pkg.acceptedProposals.map((p) => `  ${p.targetLabel}: ${p.text}`).join('\n')
    : '  no accepted proposals';
  const articlesUsed = pkg.articlesUsed.length
    ? pkg.articlesUsed.map((a) => `  ${a.title}, version ${a.version}, ${a.url}`).join('\n')
    : '  none';
  return [
    `Symptom: ${slot('symptom')}`,
    `Cause: ${slot('cause')}`,
    `What was done: ${slot('action')}`,
    `Verification: ${slot('verification')}`,
    '',
    'Chronology:',
    `  ${pkg.trail.length} work trail entries`,
    '',
    'Articles used:',
    articlesUsed,
    '',
    'Changes in the knowledge base:',
    accepted,
  ].join('\n');
}

/**
 * A consolidated note for a boundary: a state change, a handover, or an explicit press (D9).
 * Assembled without the model as well — then the raw texts are used (I2).
 */
export function renderConsolidatedNote(
  events: { kind: string; at: string; payload: Record<string, unknown> }[],
): string {
  const lines: string[] = [];
  for (const e of events) {
    const time = new Date(e.at).toISOString().slice(11, 16);
    const note = e.payload.note as { raw: string; polished: string | null } | undefined;
    if (e.kind === 'note' && note) lines.push(`${time} ${note.polished ?? note.raw}`);
    if (e.kind === 'step_marked') lines.push(`${time} step: ${String(e.payload.text ?? '')}`);
    if (e.kind === 'evidence_added') {
      const ev = e.payload.evidence as { text: string; isLink: boolean } | undefined;
      if (ev) lines.push(`${time} evidence: ${ev.isLink ? ev.text : ev.text.slice(0, 200)}`);
    }
    if (e.kind === 'state_changed') lines.push(`${time} state: ${String(e.payload.text ?? '')}`);
  }
  return lines.length ? lines.join('\n') : 'no entries since the previous push';
}
