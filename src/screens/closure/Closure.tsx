import { useState } from 'react';
import { useApp, emptySlots } from '@/store/app';
import type { Proposal, Slot, Ticket } from '@/domain/types';
import { isGap } from '@/domain/types';
import { Button, kindColor, kindLabel } from '@/ui/primitives';
import { LoopBadge } from '@/ui/loop';
import s from './Closure.module.css';

export function Closure({ ticket }: { ticket: Ticket }) {
  const setMode = useApp((st) => st.setMode);
  const slots = useApp((st) => st.slots[ticket.id]) ?? emptySlots();
  const slotsState = useApp((st) => st.slotsState[ticket.id]);
  const proposals = useApp((st) => st.proposals[ticket.id]) ?? [];
  const close = useApp((st) => st.closeTicket);

  const gaps = slots.filter(isGap).length;
  const decided = proposals.filter((p) => p.status !== 'pending').length;

  return (
    <div className={s.screen}>
      <header className={s.head}>
        <span className="mono">{ticket.id}</span>
        <h1 className={s.title}>Closure</h1>
        <button type="button" className={s.back} onClick={() => setMode('work')}>
          back to work
        </button>
      </header>

      <div className={s.columns}>
        <section className={s.column}>
          <div className={s.columnHead}>
            <h2 className="caps">Into the ticket — the specifics of this case</h2>
            <LoopBadge stage="master">close_notes, by slot</LoopBadge>
          </div>
          <p className="faint">Assembled from the work trail, edit it where it is imprecise.</p>
          {slotsState === 'loading' && <p className="faint">the draft is being assembled, the fields are already editable</p>}
          {slotsState === 'failed' && <p className="faint">the model is silent, the draft is assembled from the step marks and the history</p>}

          <div className={s.slots}>
            {slots.map((slot) => <SlotField key={slot.id} ticketId={ticket.id} slot={slot} />)}
          </div>

          <div className={s.closeBox}>
            <Button variant="solid" onClick={() => close(ticket.id)}>Accept and close</Button>
            <span className="muted">
              {gaps === 0 ? 'all slots are filled' : `${gaps} ${gaps === 1 ? 'gap' : 'gaps'} will remain in the record`}
            </span>
            <LoopBadge stage="master">the record is written first, publication follows</LoopBadge>
          </div>
          <p className="faint">
            Closing is not blocked. A gap simply stays visible in the record and in the team statistics.
          </p>
        </section>

        <section className={s.column}>
          <div className={s.columnHead}>
            <h2 className="caps">Into the knowledge base — for others</h2>
            <LoopBadge stage="review">accept, edit or reject — nothing publishes itself</LoopBadge>
          </div>
          <p className="faint">
            Accumulated during the work, {decided} of {proposals.length} reviewed.
          </p>

          <div className={s.proposals}>
            {proposals.length === 0 && <p className="faint">No proposals: no deviation came up during the work.</p>}
            {proposals.map((p) => <ProposalCard key={p.id} ticketId={ticket.id} proposal={p} />)}
          </div>

          <p className={`faint ${s.footNote}`}>
            What is accepted is published to ServiceNow right after closing, under your name, with
            one-click revert. Observations go into a separate section of the article.
          </p>
        </section>
      </div>
    </div>
  );
}

function SlotField({ ticketId, slot }: { ticketId: string; slot: Slot }) {
  const edit = useApp((st) => st.editSlot);
  const gap = isGap(slot);

  return (
    <div className={`${s.slot} ${gap ? s.slotGap : ''}`}>
      <div className={s.slotHead}>
        <span>{slot.label}</span>
        <span className="faint">{gap ? 'gap' : slot.provenance}</span>
      </div>
      <textarea
        rows={2}
        value={slot.value}
        placeholder={gap ? slot.question : undefined}
        onChange={(e) => edit(ticketId, slot.id, e.target.value)}
      />
    </div>
  );
}

/** The one destination of each kind of proposal (closure.md, the dispatch table). */
function destination(p: Proposal): { tone: string; text: string } {
  if (p.kind === 'confirmation') {
    return { tone: 'var(--strong)', text: 'telemetry: freshness refreshed, the article text untouched' };
  }
  if (p.kind === 'not_applicable') {
    return { tone: 'var(--weak)', text: 'matching telemetry only — the article is not touched' };
  }
  if (p.kind === 'link') {
    return { tone: 'var(--weak)', text: 'telemetry: a link between two articles' };
  }
  return p.strength === 'weak'
    ? { tone: 'var(--weak)', text: 'the observations section of the article, apart from the canon' }
    : { tone: 'var(--strong)', text: 'the canonical text of the article, as a new version' };
}

function ProposalCard({ ticketId, proposal }: { ticketId: string; proposal: Proposal }) {
  const decide = useApp((st) => st.decideProposal);
  const save = useApp((st) => st.editProposal);
  const openPage = useApp((st) => st.openPage);
  const [draft, setDraft] = useState<string | null>(null);

  const pageId = proposal.sourceArticleId ?? proposal.anchor?.articleSysId;

  return (
    <article
      className={`${s.card} ${s[`card_${proposal.status}`]}`}
      style={{ ['--kind-tone' as string]: kindColor[proposal.kind] }}
    >
      <header className={s.cardHead} style={{ color: kindColor[proposal.kind] }}>
        {kindLabel[proposal.kind]} ·{' '}
        {pageId ? (
          // Where exactly the edit will land is visible before acceptance (D16).
          <button
            type="button"
            className={`muted ${s.targetLink}`}
            onClick={() => openPage(pageId, ticketId)}
          >
            {proposal.targetLabel}
          </button>
        ) : (
          <span className="muted">{proposal.targetLabel}</span>
        )}
      </header>

      {proposal.diff && (
        <div className={s.diff}>
          <div className={s.minus}>− {proposal.diff.minus}</div>
          <div className={s.plus}>+ {proposal.diff.plus}</div>
        </div>
      )}

      {draft === null ? (
        <p className={s.cardText}>{proposal.text}</p>
      ) : (
        <textarea rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} />
      )}

      <p className="faint">basis: {proposal.basis}</p>

      {/* Where it lands if accepted — stated before the press (closure.md, "Publication"). */}
      <p className={s.dest}>
        <span className={s.destDot} style={{ background: destination(proposal).tone }} />
        {destination(proposal).text}
      </p>

      {proposal.kind === 'not_applicable' && (
        <p className="faint">
          corrects the matching only: the telemetry is updated, the article text stays as it is
        </p>
      )}

      {proposal.kind === 'confirmation' && (
        <p className="faint">
          confirmation: refreshes the freshness of the article, the text stays as it is
        </p>
      )}

      {proposal.strength === 'weak' && proposal.kind !== 'not_applicable' && (
        <p className="faint">
          observation: it will go into a separate section of the article
          {proposal.promotionLeft != null && `, ${proposal.promotionLeft} more confirmations until promotion into the canon`}
        </p>
      )}

      {proposal.status === 'pending' ? (
        <div className={s.cardActions}>
          <Button
            onClick={() => {
              if (draft !== null) save(ticketId, proposal.id, draft);
              setDraft(null);
              decide(ticketId, proposal.id, 'accepted');
            }}
          >
            Accept
          </Button>
          <Button
            onClick={() => (draft === null ? setDraft(proposal.text) : (save(ticketId, proposal.id, draft), setDraft(null)))}
          >
            {draft === null ? 'Edit' : 'Save'}
          </Button>
          <Button variant="quiet" onClick={() => decide(ticketId, proposal.id, 'rejected')}>Reject</Button>
        </div>
      ) : (
        <span className="faint">{proposal.status === 'accepted' ? 'accepted' : 'rejected'}</span>
      )}
    </article>
  );
}
