# The loop, drawn

Four frames of the machine described in [`../concept.md`](../concept.md):

1. **the loop** — the circuit from work to the master and back, and the wall that evidence and telemetry never cross
2. **two clocks** — the fast loop inside one ticket against the slow loop over the whole corpus
3. **life of a unit** — white spot → observation → canon → stale → deprecated, with what pays for each transition
4. **signals** — the gestures on a ticket, what each one raises, and where it lands

## Opening it

```sh
npm run dev     # then http://localhost:5173/docs/canvas/
npm run build   # emits dist/docs/canvas/index.html alongside the application
```

## Using a frame elsewhere

Every frame is exported on its own and carries no props, no store and no imports beyond React:

```tsx
import { LifecycleFrame } from '../../docs/canvas/KnowledgeLoopCanvas';
```

The styles live in a `<style>` tag inside the component, scoped under `.klc`, so a frame can be
dropped into any page without colliding with the application's CSS. The three faces come from
Google Fonts and are linked in `index.html`; without them the page falls back to the system stack
and still reads correctly.

## What this is not

Documentation, not product code. It is not part of the application, it does not import from `src/`,
and it is not a specification: where a drawing and `concept.md` disagree, the document is right.

The encoding is consistent across the frames and matches the interface itself: a solid line is a
strong basis (it changes canonical text), a dashed line is a weak one (it lands in observations),
and the four colours are the knowledge dot from the ticket list — teal confirmed, amber stale, pink
nothing there yet, blue ours and never ServiceNow's.
