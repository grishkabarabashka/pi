import type { Slot, StepInstance, TrailEvent, Ticket, Suggestion } from '@/domain/types';

/**
 * Every model call is asynchronous and optional (I2). No screen waits for a result
 * before updating state.
 *
 * The latency simulation modes are configurable so that the "slow model" and
 * "model unavailable" scenarios can be checked.
 */
export type AgentMode = 'normal' | 'slow' | 'down';

let mode: AgentMode = 'normal';
export const setAgentMode = (m: AgentMode) => { mode = m; };
export const getAgentMode = () => mode;

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function call<T>(fastMs: number, produce: () => T): Promise<T> {
  if (mode === 'down') { await wait(400); throw new Error('the model is unavailable'); }
  await wait(mode === 'slow' ? 30_000 : fastMs);
  return produce();
}

/** Polishing a note. The raw text is already in the feed by the time this is called. */
export function polishNote(raw: string): Promise<string> {
  return call(1400, () => {
    const trimmed = raw.trim().replace(/\s+/g, ' ');
    const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
  });
}

/** Answering a question. It arrives asynchronously; the question is already in the feed. */
export function answerQuestion(question: string, ticket: Ticket): Promise<string> {
  return call(1200, () =>
    `On ${ticket.id} (${ticket.application}): ${question.trim().replace(/\?+$/, '')} — ` +
    'see the sources section on the right, the past occurrences give a stable answer.',
  );
}

/**
 * A remark about a deviation. Asynchronous and optional: if it does not arrive,
 * the step mark has already raised its proposal by itself — it is a structural signal.
 */
export function remarkOnDeviation(step: StepInstance): Promise<string> {
  return call(900, () =>
    `The step "${step.text}" did not work. Record it as a deviation to the article?`,
  );
}

/** A remark about a stale article, raised when its steps start being marked. */
export function remarkOnStaleArticle(title: string, months: number): Promise<string> {
  return call(900, () =>
    `"${title}" has not been confirmed for ${months} months. If it worked, confirm it at closure.`,
  );
}

/**
 * Assembly of the resolution note slots. Built on structural signals
 * (step marks, states, history) rather than on the prose of the notes.
 * A slot with nothing to fill it stays empty with a pinpoint question.
 */
export function buildSlots(input: {
  ticket: Ticket;
  steps: StepInstance[];
  trail: TrailEvent[];
  suggestion?: Suggestion;
}): Promise<Slot[]> {
  return call(1600, () => draftSlots(input));
}

/**
 * The same assembly without the model. Used by the short path (D17) and as the
 * fallback when the model is unavailable: the structural signals are enough.
 */
export function draftSlots(input: {
  ticket: Ticket;
  steps: StepInstance[];
  trail: TrailEvent[];
  suggestion?: Suggestion;
}): Slot[] {
  const { ticket, steps, suggestion } = input;
  const done = steps.filter((s) => s.state === 'done');
  const failed = steps.filter((s) => s.state === 'failed');
  const history = suggestion?.alertHistory;

  return [
    {
      id: 'symptom',
      label: 'Symptom',
      value: ticket.title,
      provenance: ticket.origin === 'alert'
        ? 'from the alert description and the step marks'
        : 'from the user request',
    },
    {
      id: 'cause',
      label: 'Cause',
      value: history ? history.commonResolution : '',
      provenance: history
        ? `the alert repeat history, ${history.commonCount} of ${history.occurrences} occurrences`
        : '',
      question: history ? undefined : 'what turned out to be the source of the problem on this request',
    },
    {
      id: 'action',
      label: 'What was done',
      value: done.map((s) => s.text).join('; '),
      provenance: done.length ? `step marks, ${done.length} done` : '',
      question: done.length ? undefined : 'which actions led to the recovery',
    },
    {
      id: 'verification',
      label: 'Verification',
      // The verification step, when marked done, is itself the answer.
      value: done.some((s) => s.stepRef.headingPath.includes('Verification'))
        ? done.filter((s) => s.stepRef.headingPath.includes('Verification')).map((s) => s.text).join('; ')
        : '',
      provenance: done.some((s) => s.stepRef.headingPath.includes('Verification'))
        ? 'the verification step marked as done'
        : '',
      question: failed.length
        ? 'what confirmed the recovery after the step did not work'
        : 'what confirmed that the latency returned to normal',
    },
  ];
}
