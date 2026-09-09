/**
 * Where in the knowledge loop the current action sits.
 *
 * The loop itself is `docs/concept.md` §4; the drawing is `docs/canvas/`. Nothing here
 * changes behaviour — it names, next to a control, what that control feeds. A person who
 * can see that a step mark is the feedback presses it differently from a person who
 * cannot (concept §5).
 */

import type { ReactNode } from 'react';
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

/** The strip in the header: which link of the loop the screen is on right now. */
export function LoopRail({ current }: { current: LoopStage }) {
  return (
    <div className={s.rail} title="Where in the knowledge loop this screen sits">
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
 * A micro-label next to a control: what this press feeds. Kept to a few words —
 * it is an annotation, not an explanation.
 */
export function LoopBadge({
  stage, children, title,
}: {
  stage: LoopStage; children: ReactNode; title?: string;
}) {
  return (
    <span className={s.badge} data-stage={stage} title={title ?? loopStages.find((x) => x.id === stage)?.what}>
      <span className={s.node} />
      {children}
    </span>
  );
}
