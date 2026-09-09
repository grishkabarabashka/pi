import { useEffect, useRef, useState } from 'react';
import { useApp, shortPathOffer } from '@/store/app';
import { adapter } from '@/adapters/servicenow';
import type { StepInstance, Ticket, TrailEvent } from '@/domain/types';
import { Button, Chip, age, clock } from '@/ui/primitives';
import { LoopBadge } from '@/ui/loop';
import { buckets, tags as allTags } from '~fixtures/team';
import { Sources } from './Sources';
import { Basket } from './Basket';
import s from './Workspace.module.css';

export function Workspace({ ticket }: { ticket: Ticket }) {
  return (
    <div className={s.layout}>
      <div className={s.main}>
        <Header ticket={ticket} />
        <Feed ticket={ticket} />
        <ShortPath ticket={ticket} />
        <Composer ticket={ticket} />
      </div>
      <aside className={s.side}>
        <Sources ticket={ticket} />
        <Basket ticketId={ticket.id} />
      </aside>
    </div>
  );
}

function Header({ ticket }: { ticket: Ticket }) {
  const setBucket = useApp((st) => st.setBucket);
  const toggleTag = useApp((st) => st.toggleTag);
  const suggestion = useApp((st) => st.suggestions[ticket.id]);

  const origin = ticket.origin === 'alert'
    ? `monitoring alert${suggestion?.alertHistory ? `, ${suggestion.alertHistory.occurrences} past occurrences` : ''}`
    : 'user request';

  return (
    <header className={s.head}>
      <div className={s.headTop}>
        <span className="mono">{ticket.id}</span>
        <h1 className={s.title}>{ticket.title}</h1>
        <a
          className={s.snLink}
          href={adapter.deepLink('ticket', ticket.sysId)}
          target="_blank"
          rel="noreferrer"
        >
          open in ServiceNow
        </a>
      </div>

      <p className={`muted ${s.origin}`}>
        {origin} · {ticket.application} · {age(ticket.openedAt)}
      </p>

      <div className={s.marks}>
        {allTags.map((t) => (
          <Chip
            key={t.id}
            active={ticket.tags.includes(t.id)}
            onClick={() => toggleTag(ticket.id, t.id)}
            tone="var(--weak)"
          >
            {t.label}
          </Chip>
        ))}
        <span className={s.sep} />
        {buckets.map((b) => (
          <Chip
            key={b.id}
            active={ticket.bucket === b.id}
            onClick={() => setBucket(ticket.id, b.id)}
            tone={b.emphasis === 'swarm' ? 'var(--none)' : b.emphasis === 'attention' ? 'var(--stale)' : 'var(--agent)'}
          >
            {b.label}
          </Chip>
        ))}
      </div>

      <StateControls ticket={ticket} />
    </header>
  );
}

/**
 * State and pushing into the ticket. Notes reach ServiceNow at boundaries (D9),
 * and nothing here becomes disabled while a write is in flight (I2).
 */
function StateControls({ ticket }: { ticket: Ticket }) {
  const waitForReply = useApp((st) => st.waitForReply);
  const resumeWork = useApp((st) => st.resumeWork);
  const push = useApp((st) => st.pushToTicket);
  const pushState = useApp((st) => st.pushState[ticket.id]) ?? 'idle';
  const trailLength = useApp((st) => (st.trail[ticket.id] ?? []).length);
  const pushedUpTo = useApp((st) => st.pushedUpTo[ticket.id]) ?? 0;
  const unpushed = Math.max(0, trailLength - pushedUpTo);

  return (
    <div className={s.stateRow}>
      {ticket.state === 'wait' ? (
        <Button onClick={() => resumeWork(ticket.id)}>Resume</Button>
      ) : (
        <Button onClick={() => waitForReply(ticket.id)}>Waiting for a reply</Button>
      )}
      <Button onClick={() => push(ticket.id)}>Push into the ticket</Button>
      <LoopBadge stage="master">a consolidated note into the ticket record</LoopBadge>
      <span className="faint">
        {pushState === 'sending' && 'sending…'}
        {pushState === 'failed' && 'the note did not reach ServiceNow, nothing is lost — try again'}
        {pushState === 'idle' && (unpushed > 0
          ? `${unpushed} entries not yet pushed`
          : 'everything pushed')}
      </span>
    </div>
  );
}

function Feed({ ticket }: { ticket: Ticket }) {
  const steps = useApp((st) => st.steps[ticket.id]);
  const changes = useApp((st) => st.changes[ticket.id]);
  const trail = useApp((st) => st.trail[ticket.id]) ?? [];
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }); }, [trail.length]);

  const visible = trail.filter(
    (e) => e.kind === 'note' || e.kind === 'question' || e.kind === 'agent_reply'
      || e.kind === 'evidence_added' || e.kind === 'state_changed',
  );

  return (
    <div className={s.feed}>
      {steps && steps.length > 0 && <Steps ticketId={ticket.id} steps={steps} />}

      {changes && changes.length > 0 && (
        <section className={s.block}>
          <h2 className="caps">Changes nearby</h2>
          {changes.map((c) => (
            <p key={c.id} className={s.change}>
              <a className="mono" href={adapter.deepLink('change', c.id)} target="_blank" rel="noreferrer">{c.id}</a>
              <span className="muted"> {c.system}</span>
              <span className="faint"> · {clock(c.at)}</span>
            </p>
          ))}
        </section>
      )}

      <section className={s.events}>
        {visible.length === 0 && (
          <p className="faint">
            No entries yet. Note — Enter, question to the agent — Ctrl+Enter, evidence — Shift+Enter.
          </p>
        )}
        {visible.map((e) => <Event key={e.id} event={e} ticketId={ticket.id} />)}
        <div ref={bottom} />
      </section>
    </div>
  );
}

function Steps({ ticketId, steps }: { ticketId: string; steps: StepInstance[] }) {
  const cycle = useApp((st) => st.cycleStep);
  return (
    <section className={s.block}>
      <div className={s.blockHead}>
        <h2 className="caps">Suggested steps</h2>
        <LoopBadge stage="signal">every mark is a signal → the basket</LoopBadge>
      </div>
      <p className="faint">
        Mark them as you go. All done confirms the procedure; “did not help” raises a correction.
      </p>
      <ul className={s.steps}>
        {steps.map((step) => (
          <li key={step.id}>
            <button
              type="button"
              className={`${s.step} ${s[`step_${step.state}`]}`}
              onClick={() => cycle(ticketId, step.id)}
            >
              <span className={s.stepMark}>
                {step.state === 'done' ? '✓' : step.state === 'failed' ? '✕' : '○'}
              </span>
              <span className={s.stepText}>{step.text}</span>
              {step.state === 'failed' && <span className={s.stepNote}>did not help</span>}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Event({ event, ticketId }: { event: TrailEvent; ticketId: string }) {
  const showRaw = useApp((st) => st.showRawFor[event.id]);
  const toggleRaw = useApp((st) => st.toggleNoteRaw);
  const decide = useApp((st) => st.decideAgentAction);
  const [expanded, setExpanded] = useState(false);

  const label = event.kind === 'note' ? 'note'
    : event.kind === 'question' ? 'question'
      : event.kind === 'evidence_added' ? 'evidence'
        : event.kind === 'state_changed' ? 'state'
          : 'agent';
  const rail = event.kind === 'agent_reply' ? s.eventAgent
    : event.kind === 'question' ? s.eventQuestion
      : event.kind === 'evidence_added' ? s.eventEvidence
        : event.kind === 'state_changed' ? s.eventState
          : '';
  const note = event.payload.note;
  const evidence = event.payload.evidence;

  const text = note
    ? (showRaw || note.polishState === 'failed' || !note.polished ? note.raw : note.polished)
    : event.payload.text ?? '';

  return (
    <article className={`${s.event} ${rail}`}>
      <div className={s.eventMeta}>
        <span className="mono faint">{clock(event.at)}</span>
        <span className="faint">{label}</span>
      </div>

      {evidence ? (
        <div className={s.evidence}>
          {evidence.isLink ? (
            // A link instead of a copy: the data classification question does not arise.
            <a href={evidence.text} target="_blank" rel="noreferrer" className="mono">
              {evidence.label ?? evidence.text}
            </a>
          ) : (
            <>
              <pre className={`mono ${expanded ? s.evidenceFull : s.evidenceClipped}`}>{evidence.text}</pre>
              {evidence.text.split('\n').length > 5 && (
                <button type="button" className={s.linkBtn} onClick={() => setExpanded(!expanded)}>
                  {expanded ? 'collapse' : 'show all'}
                </button>
              )}
            </>
          )}
          <p className="faint">stays on the ticket, does not travel into an article by itself</p>
        </div>
      ) : (
        <p className={s.eventText}>{text}</p>
      )}

      {note && (
        <div className={s.eventFoot}>
          {note.polishState === 'pending' && <span className="faint">polishing in progress</span>}
          {note.polishState === 'failed' && <span className="faint">the polished text is not ready, the original is shown</span>}
          {note.polishState === 'ready' && (
            <button type="button" className={s.linkBtn} onClick={() => toggleRaw(event.id)}>
              {showRaw ? 'show the polished text' : 'show what I wrote'}
            </button>
          )}
        </div>
      )}

      {event.payload.actions && (
        <div className={s.eventActions}>
          {event.payload.actions.map((a) => (
            <Button key={a.id} onClick={() => decide(ticketId, event.id, a)}>{a.label}</Button>
          ))}
        </div>
      )}
      {event.payload.decided && <span className="faint">{event.payload.decided}</span>}
    </article>
  );
}

/** The short path. Appears only under the conditions of D17; otherwise there is nothing to offer. */
function ShortPath({ ticket }: { ticket: Ticket }) {
  const offer = useApp((st) => shortPathOffer(st, ticket.id));
  const closeAsLastTime = useApp((st) => st.closeAsLastTime);
  if (!offer) return null;

  return (
    <div className={s.shortPath}>
      <span className={s.shortPathText}>
        <span>{offer.text}</span>
        <LoopBadge stage="review">
          it fills the slots and opens the review — it does not close the ticket
        </LoopBadge>
      </span>
      <Button variant="solid" onClick={() => closeAsLastTime(ticket.id)}>Close as last time</Button>
    </div>
  );
}

function Composer({ ticket }: { ticket: Ticket }) {
  // The draft lives in the store: going to the queue or to knowledge does not lose it (D15).
  const value = useApp((st) => st.drafts[ticket.id]) ?? '';
  const setValue = useApp((st) => st.setDraft);
  const addNote = useApp((st) => st.addNote);
  const addEvidence = useApp((st) => st.addEvidence);
  const ask = useApp((st) => st.askQuestion);

  const submit = (kind: 'note' | 'question' | 'evidence') => {
    const text = value.trim();
    if (!text) return;
    setValue(ticket.id, '');
    if (kind === 'question') ask(ticket.id, text);
    else if (kind === 'evidence') addEvidence(ticket.id, text);
    else addNote(ticket.id, text);
  };

  return (
    <div className={s.composer}>
      <textarea
        className={s.input}
        rows={2}
        value={value}
        placeholder="A note, a log line, a link, a fragment of a thought"
        onChange={(e) => setValue(ticket.id, e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          submit(e.metaKey || e.ctrlKey ? 'question' : e.shiftKey ? 'evidence' : 'note');
        }}
      />
      <div className={s.blockHead}>
        <p className="faint">
          Enter — a note, the agent stays silent. Ctrl/Cmd + Enter — a question to the agent.
          Shift + Enter — evidence.
        </p>
        <LoopBadge stage="signal">stays on the ticket until you accept it at closure</LoopBadge>
      </div>
    </div>
  );
}
