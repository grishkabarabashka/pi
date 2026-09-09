# The loop, drawn

Four frames of the machine described in [`../concept.md`](../concept.md):

1. **the loop** — the circuit from work to the master and back, and the wall that evidence and telemetry never cross
2. **two clocks** — the fast loop inside one ticket against the slow loop over the whole corpus
3. **life of a unit** — white spot → observation → canon → stale → deprecated, with what pays for each transition
4. **signals** — the gestures on a ticket, what each one raises, and where it lands

## Where it is read

Inside the mockup, in the **Concept** view: "The loop, drawn" sits in the document list next to
`concept.md`, and the header carries a **Diagrams** button that opens it (D19). The frames render
in the same reader as the markdown, on the same ground.

The component itself lives in [`src/screens/docs/canvas/KnowledgeLoopCanvas.tsx`](../../src/screens/docs/canvas/KnowledgeLoopCanvas.tsx).
This folder keeps a standalone page that renders the same component on its own canvas ground, for
sharing the drawings without the application around them:

```sh
npm run dev     # then http://localhost:5173/docs/canvas/
npm run build   # emits dist/docs/canvas/index.html alongside the application
```

## Using a frame elsewhere

Every frame is exported on its own and carries no props, no store and no imports beyond React:

```tsx
import { LifecycleFrame } from '@/screens/docs/canvas/KnowledgeLoopCanvas';
```

`<KnowledgeLoopCanvas embedded />` drops the canvas ground and the file bar, which is how the
documentation reader shows it.

The styles live in a `<style>` tag inside the component, scoped under `.klc`, so a frame can be
dropped into any page without colliding with the application's CSS. The three faces come from
Google Fonts and are linked in the standalone `index.html`; inside the application they fall back
to the interface stack, which is the intended look there.

## What this is not

Documentation, not product code. It is not part of the application, it does not import from `src/`,
and it is not a specification: where a drawing and `concept.md` disagree, the document is right.

The encoding is consistent across the frames and matches the interface itself: a solid line is a
strong basis (it changes canonical text), a dashed line is a weak one (it lands in observations),
and the four colours are the knowledge dot from the ticket list — teal confirmed, amber stale, pink
nothing there yet, blue ours and never ServiceNow's.
