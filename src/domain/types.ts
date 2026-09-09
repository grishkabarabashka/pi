// Types from docs/domain.md. Do not extend without editing the document.

export type TicketType = 'incident' | 'universal_request';
export type TicketState = 'queue' | 'work' | 'wait' | 'closing' | 'closed';
export type Origin = 'alert' | 'user';
export type KnowledgeMatch = 'strong' | 'weak' | 'stale' | 'none';
export type BucketId = string;
export type TagId = 'wait-user' | 'wait-team' | 'recurring' | 'next-shift';

export interface Ticket {
  id: string;
  sysId: string;
  type: TicketType;
  title: string;
  description: string;
  application: string;
  ciId?: string;
  priority: string;
  origin: Origin;
  alertSignature?: string;
  assignee?: string;
  state: TicketState;
  openedAt: string;
  closedAt?: string;
  bucket?: BucketId;
  tags: TagId[];
  knowledgeMatch: KnowledgeMatch;
}

export type TrailEventKind =
  | 'state_changed' | 'assigned' | 'article_suggested' | 'article_opened'
  | 'step_marked' | 'evidence_added' | 'note' | 'question' | 'agent_reply'
  | 'proposal_raised' | 'proposal_decided' | 'bucket_changed' | 'tag_changed'
  | 'pushed_to_sn';

export type PolishState = 'pending' | 'ready' | 'failed';

export interface NotePair {
  raw: string;
  polished: string | null;
  polishState: PolishState;
}

export interface AgentAction {
  id: string;
  label: string;
  /** What lands in the basket when pressed. `null` — the remark is simply dismissed. */
  proposal: Omit<Proposal, 'id' | 'ticketId' | 'status'> | null;
  /** Withdraws the pending proposal raised by the same source. Used by "Not now". */
  withdrawSourceStepId?: string;
}

/** Payload of an `evidence_added` event. Evidence stays on the ticket (I4). */
export interface EvidencePayload {
  text: string;
  isLink: boolean;
  label?: string;
}

export interface TrailEvent {
  id: string;
  ticketId: string;
  at: string;
  actor: 'user' | 'agent' | 'system';
  kind: TrailEventKind;
  payload: {
    note?: NotePair;
    text?: string;
    actions?: AgentAction[];
    decided?: string;
    evidence?: EvidencePayload;
    [k: string]: unknown;
  };
}

export type Freshness = 'fresh' | 'stale' | 'unknown';

export interface ArticleHit {
  articleId: string;
  title: string;
  matchReason: string;
  lastConfirmedAt?: string;
  useCount: number;
  freshness: Freshness;
}

export interface TicketHit {
  ticketId: string;
  title: string;
  outcome: string;
  closedAt: string;
}

export interface AlertHistory {
  signature: string;
  occurrences: number;
  /** How many of `occurrences` ended with the same resolution. Drives the short path (D17). */
  commonCount: number;
  commonResolution: string;
  exceptions: string;
}

export interface Suggestion {
  ticketId: string;
  articles: ArticleHit[];
  similarTickets: TicketHit[];
  alertHistory?: AlertHistory;
}

export interface AnchorRef {
  articleSysId: string;
  headingPath: string[];
  contentHash: string;
}

export type StepState = 'open' | 'done' | 'failed';

export interface StepInstance {
  id: string;
  ticketId: string;
  stepRef: AnchorRef;
  text: string;
  state: StepState;
}

export type ProposalKind =
  | 'confirmation' | 'correction' | 'extension' | 'creation'
  | 'deprecation' | 'link' | 'not_applicable';

export type ProposalStrength = 'strong' | 'weak';
export type ProposalStatus = 'pending' | 'accepted' | 'rejected';

export interface Proposal {
  id: string;
  ticketId: string;
  kind: ProposalKind;
  anchor?: AnchorRef;
  targetLabel: string;
  text: string;
  diff?: { minus: string; plus: string };
  basis: string;
  strength: ProposalStrength;
  promotionLeft?: number;
  status: ProposalStatus;
  /** Internal: the step that raised it, so the proposal can be withdrawn when the mark is undone. */
  sourceStepId?: string;
  /** Internal: the article the proposal was raised about, for confirmations and not-applicable marks. */
  sourceArticleId?: string;
}

export type SlotId = 'symptom' | 'cause' | 'action' | 'verification';

export interface Slot {
  id: SlotId;
  label: string;
  value: string;
  provenance: string;
  question?: string;
}

export const isGap = (slot: Slot): boolean => slot.value.trim() === '';

export interface ChangeRef {
  id: string;
  system: string;
  at: string;
  url: string;
}

export interface Bucket {
  id: BucketId;
  teamId: string;
  label: string;
  emphasis: 'swarm' | 'attention' | 'handover' | 'plain';
  order: number;
}

export interface Tag {
  id: TagId;
  label: string;
}

export interface ClosurePackage {
  slots: Slot[];
  acceptedProposals: Proposal[];
  trail: TrailEvent[];
  articlesUsed: { title: string; version: string; url: string }[];
}

// --- Publication and telemetry. See docs/domain.md and docs/screens/closure.md ---

export type PublicationTarget = 'article' | 'telemetry';
export type PublicationState = 'sending' | 'published' | 'conflict' | 'failed';

/** The result of dispatching one accepted proposal after closing (D18). */
export interface PublicationOutcome {
  proposalId: string;
  targetLabel: string;
  target: PublicationTarget;
  state: PublicationState;
  version?: string;
  detail?: string;
}

export type TelemetryWriteKind = 'confirmation' | 'not_applicable' | 'deviation' | 'use';

/** Telemetry lives only on our side (I6). Nothing else changes it. */
export interface TelemetryWrite {
  kind: TelemetryWriteKind;
  articleId: string;
  ticketId?: string;
  engineerId?: string;
  articleVersion?: string;
  at: string;
}

export interface ArticleTelemetry {
  articleId: string;
  useCount: number;
  confirmations: number;
  lastConfirmedAt?: string;
  deviations: number;
  notApplicableMarks: number;
}

// --- The knowledge projection. See docs/domain.md, the KnowledgePage section ---

export type ArticleType =
  | 'reference' | 'procedure_fault' | 'procedure_fulfilment' | 'procedure_interaction';

export type BlockSection =
  | 'applicability' | 'steps' | 'branching' | 'verification' | 'free';

export interface ProjectionBlock {
  id: string;
  pageId: string;
  section: BlockSection;
  body: string;
  /** null — synthesised by the pipeline, no counterpart in the article, not editable in place. */
  anchor: AnchorRef | null;
}

export interface Observation {
  id: string;
  pageId: string;
  text: string;
  basis: string;
  confirmations: number;
  promotionThreshold: number;
  raisedAt: string;
  sourceTicketIds: string[];
}

export interface PageHistoryEntry {
  id: string;
  at: string;
  author: string;
  sourceTicketId?: string;
  summary: string;
  revertable: boolean;
}

export type EdgeKind = 'shared_ci' | 'explicit_link' | 'cmdb_relation' | 'co_occurrence';

export interface Neighbor {
  pageId: string;
  title: string;
  kind: EdgeKind;
  derivedFrom: string;
  weight?: number;
}

export interface PageTelemetry {
  useCount: number;
  lastConfirmedAt?: string;
  deviations: number;
  notApplicableMarks: number;
  /** For `reference` only: confirmed by owner attestation, not by tickets. */
  lastAttestedAt?: string;
  ciChangesSinceAttestation?: number;
}

export interface KnowledgePage {
  id: string;
  articleSysId: string;
  title: string;
  type: ArticleType;
  application: string;
  version: string;
  blocks: ProjectionBlock[];
  observations: Observation[];
  neighbors: Neighbor[];
  history: PageHistoryEntry[];
  rebuiltAt: string;
  telemetry: PageTelemetry;
}

/** A row in the knowledge list. Without the article body — that is loaded on open. */
export interface KnowledgePageSummary {
  id: string;
  title: string;
  type: ArticleType;
  application: string;
  telemetry: PageTelemetry;
  observationsPending: number;
}

export interface Person {
  id: string;
  name: string;
  region: string;
}
