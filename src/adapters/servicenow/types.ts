import type {
  Ticket, ArticleHit, TicketHit, ChangeRef, Suggestion, StepInstance,
  ClosurePackage, AnchorRef, TrailEvent, Person,
} from '@/domain/types';

export interface TicketFilter {
  states?: Ticket['state'][];
  assignee?: string;
}

export interface SearchQuery {
  text: string;
  application?: string;
  limit?: number;
}

export interface TimeWindow { fromIso: string; toIso: string }

export interface ArticleBody {
  sysId: string;
  title: string;
  version: string;
  blocks: { id: string; body: string; anchor: AnchorRef | null }[];
}

export interface PublishRequest {
  /** Absent for `creation`: there is no fragment to address yet. */
  anchor?: AnchorRef;
  expectedContentHash?: string;
  text: string;
  /** `observation` writes into the marked-up observations section, not into the canon. */
  section: 'canonical' | 'observation';
  /** Shown in the article history next to the edit. */
  sourceTicketId: string;
}

export type PublishResult =
  | { ok: true; version: string }
  | { ok: false; reason: 'conflict'; currentBody: ArticleBody }
  | { ok: false; reason: 'error'; detail: string };

export interface JournalEntry {
  at: string;
  author: string;
  text: string;
}

/** The only boundary with ServiceNow. Nobody outside adapters/ knows about sys_id or tables. */
export interface ServiceNowAdapter {
  listTickets(filter: TicketFilter): Promise<Ticket[]>;
  getTicket(id: string): Promise<Ticket>;
  getTicketJournal(id: string): Promise<JournalEntry[]>;
  /** sys_user. Needed so the general queue can show who holds a ticket. We do not write. */
  listPeople(): Promise<Person[]>;
  getChangesNearCi(ciId: string, window: TimeWindow): Promise<ChangeRef[]>;
  getArticle(sysId: string): Promise<ArticleBody>;
  searchArticles(query: SearchQuery): Promise<ArticleHit[]>;
  searchClosedTickets(query: SearchQuery): Promise<TicketHit[]>;

  /** Not part of the SN contract, but the hint and the steps are assembled behind the same boundary. */
  getSuggestion(ticketId: string): Promise<Suggestion>;
  getSteps(ticketId: string): Promise<StepInstance[]>;

  assignTicket(id: string, assignee: string): Promise<void>;
  setTicketState(id: string, state: Ticket['state']): Promise<void>;
  pushNote(id: string, text: string): Promise<void>;
  closeTicket(id: string, pkg: ClosurePackage): Promise<void>;
  publishArticleVersion(req: PublishRequest): Promise<PublishResult>;

  /** The "open in ServiceNow" link leads straight to the right screen (D12). */
  deepLink(kind: 'ticket' | 'article' | 'change', id: string): string;
}

export type { TrailEvent };
