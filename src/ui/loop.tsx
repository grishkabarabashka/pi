/**
 * Where in the knowledge loop the current action sits.
 *
 * **Demo scaffolding, not the working interface (D20).** These markers exist to show people
 * the mechanism while the mockup is being shown, and they come out before a pilot together
 * with the documentation shelf (D19). That is why they may float above the interface at all:
 * the rule against things that pop up over the work governs the product, and this is not it.
 *
 * The loop itself is `docs/concept.md` §4; the drawing is in the Concept view. Nothing here
 * changes behaviour — it names, next to a control, what that control feeds.
 *
 * Even as scaffolding, nothing appears unbidden: the marker is inline and small, and the
 * sentence opens on hover, focus or a press. It is never modal and never steals focus.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import s from './loop.module.css';

export type LoopStage = 'hint' | 'signal' | 'basket' | 'review' | 'master' | 'rebuild';

export const loopStages: { id: LoopStage; label: string; what: string }[] = [
  { id: 'hint', label: 'hint', what: 'the projection comes back as the hint on this ticket' },
  { id: 'signal', label: 'signals', what: 'the work raises marks, evidence and remarks' },
  { id: 'basket', label: 'basket', what: 'proposals accumulate, visible the whole time' },
  { id: 'review', label: 'review', what: 'closure: the person accepts, edits or rejects' },
  { id: 'master', label: 'master', what: 'written into ServiceNow — nothing bypasses it' },
  { id: 'rebuild', label: 'rebuild', what: 'the pipeline rebuilds the projection' },
];

const stageOf = (id: LoopStage) => loopStages.find((x) => x.id === id)!;

/** The strip in the header: which link of the loop the screen is on right now. */
export function LoopRail({ current }: { current: LoopStage }) {
  return (
    <div className={s.rail} title="Where in the knowledge loop this screen sits">
      <span>Where we are in knowledge loop:  &nbsp;</span>
      {loopStages.map((stage, i) => (
        <span
          key={stage.id}
          className={s.link}
          data-stage={stage.id}
          data-on={stage.id === current ? '' : undefined}
          title={stage.what}
        >
          {i > 0 && <span className={s.thread} aria-hidden="true" />}
          <span className={s.node} />
          <span className={s.name}>{stage.label}</span>
        </span>
      ))}
    </div>
  );
}

/**
 * A marker next to a control, and the sentence that says what the press feeds. The marker is
 * inline and small; the sentence floats above everything, so it is readable wherever the
 * control sits — including inside a panel that clips its own overflow.
 */
export function LoopBadge({ stage, children }: { stage: LoopStage; children: ReactNode }) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [at, setAt] = useState<{ top: number; left: number; above: boolean } | null>(null);
  const meta = stageOf(stage);

  const open = () => {
    const box = trigger.current?.getBoundingClientRect();
    if (!box) return;
    // Above the marker by default; below it when the top of the window is close.
    const above = box.top > 150;
    setAt({
      top: above ? box.top - 10 : box.bottom + 10,
      left: Math.min(Math.max(box.left + box.width / 2, 150), window.innerWidth - 150),
      above,
    });
  };
  const close = () => setAt(null);

  // A measured position goes stale the moment anything scrolls, so it is dropped instead.
  useEffect(() => {
    if (!at) return;
    const onAway = () => setAt(null);
    window.addEventListener('scroll', onAway, true);
    window.addEventListener('resize', onAway);
    return () => {
      window.removeEventListener('scroll', onAway, true);
      window.removeEventListener('resize', onAway);
    };
  }, [at]);

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className={s.marker}
        data-stage={stage}
        data-open={at ? '' : undefined}
        aria-expanded={at ? true : false}
        onMouseEnter={open}
        onMouseLeave={close}
        onFocus={open}
        onBlur={close}
        onClick={() => (at ? close() : open())}
      >
        <span className={s.node} />
        <span className={s.markerLabel}>{meta.label}</span>
      </button>

      {at
        && createPortal(
          <div
            className={s.pop}
            data-stage={stage}
            data-above={at.above ? '' : undefined}
            style={{ top: at.top, left: at.left }}
            role="tooltip"
          >
            <span className={s.popStage}>
              <span className={s.node} />
              in the loop · {meta.label}
            </span>
            <p className={s.popText}>{children}</p>
            <p className={s.popWhat}>{meta.what}</p>
          </div>,
          document.body,
        )}
    </>
  );
}
