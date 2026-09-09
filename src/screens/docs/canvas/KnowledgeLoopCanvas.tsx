/**
 * The knowledge loop, drawn. Four frames of the machine described in `docs/concept.md`:
 * the loop and the wall across it, its two clocks, the life of one unit of knowledge,
 * and the gestures on a ticket that move it.
 *
 * Self-contained on purpose: no imports beyond React, no shared stylesheet, no store.
 * Drop `<KnowledgeLoopCanvas />` anywhere, or embed one frame — every frame is exported.
 *
 * It is read inside the mockup, in the Concept view alongside the documents. The standalone
 * page at `docs/canvas/` renders the same component on its own canvas ground.
 *
 * This is documentation, not product code. It is not part of the application and does not
 * import from `src/`. When a diagram and `concept.md` disagree, the document is right.
 */

import type { ReactNode } from 'react';

/* ------------------------------------------------------------------ styles */

const css = `
.klc {
  --klc-sans: "Public Sans", ui-sans-serif, system-ui, sans-serif;
  --klc-display: "Archivo", "Public Sans", ui-sans-serif, sans-serif;
  --klc-mono: "IBM Plex Mono", ui-monospace, "SFMono-Regular", monospace;

  --klc-canvas: #EDEFF3;
  --klc-dot: #D6DBE3;
  --klc-surface: #FFFFFF;
  --klc-surface-2: #F6F8FA;
  --klc-ink: #151821;
  --klc-muted: #6B7382;
  --klc-line: #D5DAE2;
  --klc-line-strong: #B7BFCB;
  --klc-edge: #8B93A1;
  --klc-accent: #2F6BF0;
  --klc-teal: #0E8C7B;
  --klc-amber: #B07C0A;
  --klc-pink: #CF4479;
  --klc-region: #F3F5F9;
  --klc-sn: #EDF2FC;
  --klc-shadow: 0 1px 2px rgba(21, 24, 33, .06), 0 8px 24px rgba(21, 24, 33, .05);

  background-color: var(--klc-canvas);
  background-image: radial-gradient(var(--klc-dot) 1px, transparent 1px);
  background-size: 24px 24px;
  background-position: -1px -1px;
  color: var(--klc-ink);
  font-family: var(--klc-sans);
  font-size: 15px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}

@media (prefers-color-scheme: dark) {
  .klc:not([data-theme="light"]) {
    --klc-canvas: #0F1218;
    --klc-dot: #1E232C;
    --klc-surface: #161A21;
    --klc-surface-2: #1B2029;
    --klc-ink: #E7EBF2;
    --klc-muted: #98A1B0;
    --klc-line: #2A313C;
    --klc-line-strong: #3B4250;
    --klc-edge: #7C8694;
    --klc-accent: #5F91FF;
    --klc-teal: #35B9A3;
    --klc-amber: #D6A02C;
    --klc-pink: #F07AA8;
    --klc-region: #131820;
    --klc-sn: #161F2E;
    --klc-shadow: 0 1px 2px rgba(0, 0, 0, .5), 0 10px 30px rgba(0, 0, 0, .35);
  }
}

.klc[data-theme="dark"] {
  --klc-canvas: #0F1218;
  --klc-dot: #1E232C;
  --klc-surface: #161A21;
  --klc-surface-2: #1B2029;
  --klc-ink: #E7EBF2;
  --klc-muted: #98A1B0;
  --klc-line: #2A313C;
  --klc-line-strong: #3B4250;
  --klc-edge: #7C8694;
  --klc-accent: #5F91FF;
  --klc-teal: #35B9A3;
  --klc-amber: #D6A02C;
  --klc-pink: #F07AA8;
  --klc-region: #131820;
  --klc-sn: #161F2E;
  --klc-shadow: 0 1px 2px rgba(0, 0, 0, .5), 0 10px 30px rgba(0, 0, 0, .35);
}

.klc .page { max-width: 1240px; margin: 0 auto; padding: 28px 24px 72px; }

/* Inside the documentation reader the page already provides the ground and the padding,
   so the canvas drops its own and reads as one more document. */
.klc-embed { background: none; }
.klc-embed .page { max-width: none; margin: 0; padding: 0; }
.klc-embed h1 { font-size: 24px; letter-spacing: -0.02em; }
.klc-embed .deck { font-size: 15px; }
.klc-embed .legend { margin-top: 24px; }

.klc .bar {
  display: flex; align-items: center; gap: 12px;
  padding: 8px 12px; margin-bottom: 40px;
  background: var(--klc-surface); border: 1px solid var(--klc-line);
  border-radius: 10px; box-shadow: var(--klc-shadow);
}
.klc .mark { width: 18px; height: 18px; border-radius: 5px; background: var(--klc-accent); flex: none; position: relative; }
.klc .mark::after { content: ""; position: absolute; inset: 5px 5px auto auto; width: 8px; height: 8px; border-radius: 50%; background: var(--klc-surface); }
.klc .file { font-family: var(--klc-mono); font-size: 12px; color: var(--klc-ink); }
.klc .file span { color: var(--klc-muted); }
.klc .spacer { flex: 1; }
.klc .chip {
  font-family: var(--klc-mono); font-size: 11px; color: var(--klc-muted);
  border: 1px solid var(--klc-line); border-radius: 999px; padding: 3px 10px; white-space: nowrap;
}
@media (max-width: 640px) { .klc .chip.hide-sm { display: none; } }

.klc h1 {
  font-family: var(--klc-display); font-weight: 700; font-size: clamp(34px, 6vw, 56px);
  line-height: 1.02; letter-spacing: -.025em; margin: 0 0 16px; text-wrap: balance;
}
.klc .deck { max-width: 64ch; color: var(--klc-muted); font-size: 17px; margin: 0 0 8px; }
.klc .deck strong { color: var(--klc-ink); font-weight: 600; }

.klc .legend {
  display: flex; flex-wrap: wrap; gap: 10px 28px; align-items: center;
  margin: 32px 0 44px; padding: 14px 16px;
  background: var(--klc-surface); border: 1px solid var(--klc-line); border-radius: 10px;
}
.klc .key { display: flex; align-items: center; gap: 9px; font-size: 12.5px; color: var(--klc-muted); }
.klc .key b { color: var(--klc-ink); font-weight: 600; }
.klc .swatch { width: 10px; height: 10px; border-radius: 3px; flex: none; }
.klc .rule { width: 26px; height: 0; border-top: 1.6px solid var(--klc-edge); flex: none; }
.klc .rule.dash { border-top-style: dashed; }

.klc .frame { margin: 0 0 52px; }
.klc .frame-label {
  font-family: var(--klc-mono); font-size: 11.5px; letter-spacing: .04em;
  color: var(--klc-accent); margin: 0 0 7px 2px;
}
.klc .frame-label em { color: var(--klc-muted); font-style: normal; }
.klc figure {
  margin: 0; padding: 22px 20px 18px;
  background: var(--klc-surface); border: 1px solid var(--klc-line);
  border-radius: 12px; box-shadow: var(--klc-shadow); position: relative;
}
.klc figure::before, .klc figure::after {
  content: ""; position: absolute; width: 7px; height: 7px;
  background: var(--klc-surface); border: 1.5px solid var(--klc-accent); border-radius: 2px;
  opacity: 0; transition: opacity .15s ease;
}
.klc figure::before { top: -4px; left: -4px; }
.klc figure::after { bottom: -4px; right: -4px; }
.klc figure:hover { border-color: var(--klc-accent); }
.klc figure:hover::before, .klc figure:hover::after { opacity: 1; }
@media (prefers-reduced-motion: reduce) {
  .klc figure::before, .klc figure::after { transition: none; }
}

.klc .scroll { overflow-x: auto; }
.klc .scroll svg { display: block; width: 100%; min-width: 880px; height: auto; }

.klc figcaption {
  margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--klc-line);
  color: var(--klc-muted); font-size: 13.5px; max-width: 92ch;
}
.klc figcaption b { color: var(--klc-ink); font-weight: 600; }
.klc figcaption code { font-family: var(--klc-mono); font-size: 12.5px; color: var(--klc-ink); }

.klc .nb { fill: var(--klc-surface-2); stroke: var(--klc-line-strong); stroke-width: 1.25; }
.klc .nb-sn { fill: var(--klc-sn); stroke: var(--klc-line-strong); stroke-width: 1.25; }
.klc .nb-ghost { fill: none; stroke: var(--klc-line-strong); stroke-width: 1.25; stroke-dasharray: 5 4; }
.klc .reg { fill: var(--klc-region); stroke: var(--klc-line-strong); stroke-width: 1; stroke-dasharray: 6 5; }
.klc .t { fill: var(--klc-ink); font: 600 13.5px var(--klc-sans); }
.klc .t-sm { fill: var(--klc-ink); font: 600 12.5px var(--klc-sans); }
.klc .s { fill: var(--klc-muted); font: 400 10.5px var(--klc-mono); }
.klc .el { fill: var(--klc-muted); font: 400 11.5px var(--klc-sans); }
.klc .el-em { fill: var(--klc-ink); font: 500 11.5px var(--klc-sans); }
.klc .rl { fill: var(--klc-muted); font: 500 10px var(--klc-mono); letter-spacing: .14em; }
.klc .hdr { fill: var(--klc-muted); font: 500 10.5px var(--klc-mono); letter-spacing: .12em; }
.klc .e { fill: none; stroke: var(--klc-edge); stroke-width: 1.4; }
.klc .e-weak { stroke-dasharray: 5 5; }
.klc .e-teal { stroke: var(--klc-teal); stroke-width: 1.6; }
.klc .e-blue { stroke: var(--klc-accent); }
.klc .e-pink { stroke: var(--klc-pink); }
.klc .ah { fill: var(--klc-edge); }
.klc .ah-teal { fill: var(--klc-teal); }
.klc .ah-blue { fill: var(--klc-accent); }
.klc .ah-pink { fill: var(--klc-pink); }
.klc .x { stroke: var(--klc-pink); stroke-width: 1.8; stroke-linecap: round; }
.klc .dot-teal { fill: var(--klc-teal); }
.klc .dot-blue { fill: var(--klc-accent); }
.klc .dot-amber { fill: var(--klc-amber); }
.klc .dot-pink { fill: var(--klc-pink); }
.klc .dot-grey { fill: var(--klc-edge); }

.klc footer {
  margin-top: 56px; padding-top: 18px; border-top: 1px solid var(--klc-line);
  color: var(--klc-muted); font-size: 13px; display: flex; flex-wrap: wrap; gap: 6px 22px;
}
.klc footer code { font-family: var(--klc-mono); font-size: 12.5px; }
`;

/* ------------------------------------------------------------------ shells */

function Frame({
  label,
  note,
  children,
  caption,
}: {
  label: string;
  note: string;
  children: ReactNode;
  caption: ReactNode;
}) {
  return (
    <section className="frame">
      <p className="frame-label">
        {label} <em>— {note}</em>
      </p>
      <figure>
        <div className="scroll">{children}</div>
        <figcaption>{caption}</figcaption>
      </figure>
    </section>
  );
}

/** An arrowhead marker. Ids are per-frame so several frames can share a page. */
function Arrow({ id, tone }: { id: string; tone?: 'teal' | 'blue' | 'pink' }) {
  return (
    <marker
      id={id}
      viewBox="0 0 10 10"
      refX="9"
      refY="5"
      markerWidth="7"
      markerHeight="7"
      orient="auto-start-reverse"
    >
      <path className={tone ? `ah-${tone}` : 'ah'} d="M0 0L10 5L0 10z" />
    </marker>
  );
}

/* ------------------------------------------------------------- frame: loop */

export function LoopFrame() {
  return (
    <Frame
      label="the loop"
      note="one closed circuit, two things that never cross"
      caption={
        <>
          <b>One circuit and one wall.</b> Everything an engineer accepts at closure goes to ServiceNow first and
          comes back only as a rebuilt projection — <code>projection = f(master)</code>, which is why there is no
          arrow from our side straight into the hint. Evidence (customer hostnames, log contents) and telemetry
          (what ServiceNow has nowhere to keep) stop at the wall: evidence reaches an article only as a generalised
          wording a person read and accepted.
        </>
      }
    >
      <svg
        viewBox="0 0 1200 660"
        role="img"
        aria-label="The knowledge loop: work on a ticket raises proposals into a basket, closure writes the record and publishes accepted proposals into ServiceNow, the pipeline rebuilds the projection, and the projection becomes the hint on the next ticket. Evidence and telemetry stay on our side and never cross into the master."
      >
        <defs>
          <Arrow id="a1" />
          <Arrow id="a1t" tone="teal" />
          <Arrow id="a1b" tone="blue" />
        </defs>

        <rect className="reg" x="32" y="56" width="790" height="568" rx="16" />
        <text className="rl" x="48" y="80">OUR SIDE</text>
        <rect className="reg" x="858" y="56" width="310" height="568" rx="16" />
        <text className="rl" x="874" y="80">SERVICENOW — THE MASTER</text>

        <rect className="nb" x="308" y="180" width="200" height="76" rx="10" />
        <circle className="dot-teal" cx="326" cy="200" r="4" />
        <text className="t" x="342" y="205">The hint</text>
        <text className="s" x="326" y="230">three labelled lists,</text>
        <text className="s" x="326" y="245">never one ranked one</text>

        <rect className="nb" x="552" y="180" width="200" height="76" rx="10" />
        <circle className="dot-blue" cx="570" cy="200" r="4" />
        <text className="t" x="586" y="205">Projection</text>
        <text className="s" x="570" y="230">read-only for us,</text>
        <text className="s" x="570" y="245">a function of the master</text>

        <rect className="nb" x="64" y="380" width="200" height="76" rx="10" />
        <circle className="dot-teal" cx="82" cy="400" r="4" />
        <text className="t" x="98" y="405">Work on a ticket</text>
        <text className="s" x="82" y="430">step marks · evidence ·</text>
        <text className="s" x="82" y="445">notes · dialogue</text>

        <rect className="nb" x="308" y="380" width="200" height="76" rx="10" />
        <circle className="dot-grey" cx="326" cy="400" r="4" />
        <text className="t" x="342" y="405">The change basket</text>
        <text className="s" x="326" y="430">visible the whole time,</text>
        <text className="s" x="326" y="445">no surprises at the end</text>

        <rect className="nb" x="552" y="380" width="200" height="76" rx="10" />
        <circle className="dot-grey" cx="570" cy="400" r="4" />
        <text className="t" x="586" y="405">Closure</text>
        <text className="s" x="570" y="430">a review of what</text>
        <text className="s" x="570" y="445">accumulated, not writing</text>

        <rect className="nb-sn" x="896" y="280" width="240" height="76" rx="10" />
        <circle className="dot-teal" cx="914" cy="300" r="4" />
        <text className="t" x="930" y="305">kb_knowledge</text>
        <text className="s" x="914" y="330">canon + observations.</text>
        <text className="s" x="914" y="345">Nothing bypasses it</text>

        <rect className="nb-sn" x="896" y="470" width="240" height="76" rx="10" />
        <circle className="dot-grey" cx="914" cy="490" r="4" />
        <text className="t" x="930" y="495">Ticket record</text>
        <text className="s" x="914" y="520">close_notes, by slot,</text>
        <text className="s" x="914" y="535">gaps marked as gaps</text>

        <rect className="nb" x="64" y="500" width="200" height="64" rx="10" />
        <circle className="dot-pink" cx="82" cy="520" r="4" />
        <text className="t-sm" x="98" y="525">Evidence</text>
        <text className="s" x="82" y="548">raw output · logs · links</text>

        <rect className="nb" x="308" y="500" width="200" height="64" rx="10" />
        <circle className="dot-blue" cx="326" cy="520" r="4" />
        <text className="t-sm" x="342" y="525">Telemetry</text>
        <text className="s" x="326" y="548">freshness · counts · weights</text>

        <path className="e" d="M264 418 H300" markerEnd="url(#a1)" />
        <text className="el" x="286" y="368" textAnchor="middle">marks raise proposals</text>

        <path className="e" d="M508 418 H544" markerEnd="url(#a1)" />
        <text className="el" x="530" y="368" textAnchor="middle">reviewed at closure</text>

        <path className="e e-teal" d="M752 418 H1012 V368" markerEnd="url(#a1t)" />
        <text className="el-em" x="838" y="392" textAnchor="middle">accepted proposals,</text>
        <text className="el" x="838" y="406" textAnchor="middle">published after the close</text>

        <path className="e" d="M652 456 V508 H888" markerEnd="url(#a1)" />
        <text className="el" x="772" y="498" textAnchor="middle">the record, written first</text>

        <path className="e e-teal" d="M1016 280 V120 H652 V172" markerEnd="url(#a1t)" />
        <text className="el" x="834" y="108" textAnchor="middle">pipeline rebuild · asynchronous</text>

        <path className="e" d="M548 218 H516" markerEnd="url(#a1)" />
        <text className="el" x="530" y="170" textAnchor="middle">
          articles · freshness in words · similar cases
        </text>

        <path className="e" d="M308 218 H164 V372" markerEnd="url(#a1)" />
        <text className="el" x="240" y="206" textAnchor="middle">on the next ticket</text>

        <path className="e" d="M164 456 V494" markerEnd="url(#a1)" />
        <text className="el" x="178" y="482">everything the work leaves</text>

        <path className="e e-blue" d="M600 456 V478 H414 V494" markerEnd="url(#a1b)" />
        <text className="el" x="506" y="470" textAnchor="middle">confirmations · not-applicable marks</text>

        <path className="e e-weak" d="M164 564 V592 H820" />
        <path className="e e-weak" d="M408 564 V592" />
        <path className="x" d="M830 584 L846 600 M846 584 L830 600" />
        <text className="el" x="560" y="580" textAnchor="middle">
          no automatic path into the master · I4, I6
        </text>
      </svg>
    </Frame>
  );
}

/* ----------------------------------------------------------- frame: clocks */

export function ClocksFrame() {
  return (
    <Frame
      label="two clocks"
      note="the same loop at two speeds, addressed to two people"
      caption={
        <>
          <b>Two loops, one master.</b> The fast loop catches what only this engineer knows right now — that step 3
          stopped working — while the trail is hot. The slow loop catches what no single ticket can show: eleven
          tickets that shared a storyline nobody wrote up. Different products, different clocks, different
          audiences, and the same destination.
        </>
      }
    >
      <svg
        viewBox="0 0 1200 380"
        role="img"
        aria-label="The fast loop runs in minutes inside one ticket and ends in a write to ServiceNow. The slow loop runs in the background over weeks, clusters closed tickets, and hands a proposal to the application owner. Every closure feeds the slow loop."
      >
        <defs>
          <Arrow id="a2" />
          <Arrow id="a2b" tone="blue" />
        </defs>

        <text className="hdr" x="48" y="42">FAST — MINUTES · ONE TICKET · THE ENGINEER ON SHIFT</text>

        <rect className="nb" x="48" y="70" width="150" height="52" rx="9" />
        <circle className="dot-grey" cx="66" cy="96" r="4" />
        <text className="t-sm" x="82" y="101">Ticket taken</text>

        <rect className="nb" x="224" y="70" width="150" height="52" rx="9" />
        <circle className="dot-teal" cx="242" cy="96" r="4" />
        <text className="t-sm" x="258" y="101">The hint</text>

        <rect className="nb" x="400" y="70" width="150" height="52" rx="9" />
        <circle className="dot-teal" cx="418" cy="96" r="4" />
        <text className="t-sm" x="434" y="101">Work · marks</text>

        <rect className="nb" x="576" y="70" width="150" height="52" rx="9" />
        <circle className="dot-grey" cx="594" cy="96" r="4" />
        <text className="t-sm" x="610" y="101">The basket</text>

        <rect className="nb" x="752" y="70" width="150" height="52" rx="9" />
        <circle className="dot-grey" cx="770" cy="96" r="4" />
        <text className="t-sm" x="786" y="101">Closure</text>

        <rect className="nb-sn" x="928" y="70" width="150" height="52" rx="9" />
        <circle className="dot-teal" cx="946" cy="96" r="4" />
        <text className="t-sm" x="962" y="101">Written to SN</text>

        <path className="e" d="M198 96 H220" markerEnd="url(#a2)" />
        <path className="e" d="M374 96 H396" markerEnd="url(#a2)" />
        <path className="e" d="M550 96 H572" markerEnd="url(#a2)" />
        <path className="e" d="M726 96 H748" markerEnd="url(#a2)" />
        <path className="e" d="M902 96 H924" markerEnd="url(#a2)" />

        <text className="hdr" x="48" y="240">SLOW — WEEKS · THE WHOLE CORPUS · THE APPLICATION OWNER</text>

        <rect className="nb" x="48" y="268" width="210" height="52" rx="9" />
        <circle className="dot-grey" cx="66" cy="294" r="4" />
        <text className="t-sm" x="82" y="299">Closed tickets</text>

        <rect className="nb" x="298" y="268" width="210" height="52" rx="9" />
        <circle className="dot-grey" cx="316" cy="294" r="4" />
        <text className="t-sm" x="332" y="299">Clustering</text>

        <rect className="nb" x="548" y="268" width="210" height="52" rx="9" />
        <circle className="dot-pink" cx="566" cy="294" r="4" />
        <text className="t-sm" x="582" y="299">A storyline, no article</text>

        <rect className="nb" x="798" y="268" width="210" height="52" rx="9" />
        <circle className="dot-teal" cx="816" cy="294" r="4" />
        <text className="t-sm" x="832" y="299">The owner writes it up</text>

        <path className="e" d="M258 294 H294" markerEnd="url(#a2)" />
        <path className="e" d="M508 294 H544" markerEnd="url(#a2)" />
        <path className="e" d="M758 294 H794" markerEnd="url(#a2)" />

        <path className="e e-blue e-weak" d="M1003 122 V182 H153 V264" markerEnd="url(#a2b)" />
        <text className="el" x="576" y="172" textAnchor="middle">every closure feeds the slow loop</text>

        <text className="el" x="48" y="356">
          Nobody writes a new article during a shift — so the slow loop’s output lands on the owner’s desk, never on
          the engineer’s screen.
        </text>
      </svg>
    </Frame>
  );
}

/* -------------------------------------------------------- frame: lifecycle */

export function LifecycleFrame() {
  return (
    <Frame
      label="life of a unit"
      note="every transition paid for by a signal from ordinary work"
      caption={
        <>
          <b>Nothing here is a document that simply exists.</b> A white spot is a ticket closed with no match — the
          honest name for missing knowledge. An observation is published immediately but kept apart from the canon
          until two engineers on two tickets, or the owner, vouch for it. Canon is refreshed in place by work that
          went to plan, and rewritten only by a failure with evidence behind it.
        </>
      }
    >
      <svg
        viewBox="0 0 1200 430"
        role="img"
        aria-label="A unit of knowledge moves from white spot to observation to canon, is refreshed or corrected in place, goes stale without use, and is either applied and confirmed again or deprecated by the owner. An observation with no movement for six months is dropped."
      >
        <defs>
          <Arrow id="a3" />
          <Arrow id="a3t" tone="teal" />
        </defs>

        <rect className="nb" x="48" y="170" width="164" height="64" rx="10" />
        <circle className="dot-pink" cx="66" cy="192" r="4" />
        <text className="t-sm" x="82" y="197">White spot</text>
        <text className="s" x="66" y="220">closed with no match</text>

        <rect className="nb" x="284" y="170" width="164" height="64" rx="10" />
        <circle className="dot-grey" cx="302" cy="192" r="4" />
        <text className="t-sm" x="318" y="197">Observation</text>
        <text className="s" x="302" y="220">in the article, apart</text>

        <rect className="nb" x="520" y="170" width="164" height="64" rx="10" />
        <circle className="dot-teal" cx="538" cy="192" r="4" />
        <text className="t-sm" x="554" y="197">Canon</text>
        <text className="s" x="538" y="220">the procedure itself</text>

        <rect className="nb" x="756" y="170" width="164" height="64" rx="10" />
        <circle className="dot-amber" cx="774" cy="192" r="4" />
        <text className="t-sm" x="790" y="197">Stale</text>
        <text className="s" x="774" y="220">unused, unconfirmed</text>

        <rect className="nb-ghost" x="992" y="170" width="164" height="64" rx="10" />
        <circle className="dot-grey" cx="1010" cy="192" r="4" />
        <text className="t-sm" x="1026" y="197">Deprecated</text>
        <text className="s" x="1010" y="220">blast radius shown</text>

        <rect className="nb-ghost" x="284" y="344" width="164" height="56" rx="10" />
        <circle className="dot-grey" cx="302" cy="366" r="4" />
        <text className="t-sm" x="318" y="371">Dropped</text>
        <text className="s" x="302" y="390">listed, not deleted</text>

        <path className="e" d="M212 202 H278" markerEnd="url(#a3)" />
        <text className="el" x="245" y="142" textAnchor="middle">a remark during</text>
        <text className="el" x="245" y="156" textAnchor="middle">the work</text>

        <path className="e e-teal" d="M448 202 H514" markerEnd="url(#a3t)" />
        <text className="el-em" x="481" y="142" textAnchor="middle">two engineers,</text>
        <text className="el" x="481" y="156" textAnchor="middle">or one owner</text>

        <path className="e" d="M684 202 H750" markerEnd="url(#a3)" />
        <text className="el" x="717" y="142" textAnchor="middle">months without</text>
        <text className="el" x="717" y="156" textAnchor="middle">use or confirmation</text>

        <path className="e" d="M920 202 H986" markerEnd="url(#a3)" />
        <text className="el" x="953" y="149" textAnchor="middle">the owner retires it</text>

        <path className="e e-teal" d="M130 170 C130 72 420 62 552 164" markerEnd="url(#a3t)" />
        <text className="el" x="330" y="54" textAnchor="middle">
          the slow loop finds a cluster · the owner writes it up
        </text>

        <path className="e e-teal" d="M838 170 C838 104 706 100 650 164" markerEnd="url(#a3t)" />
        <text className="el" x="752" y="90" textAnchor="middle">applied and confirmed again</text>

        <path className="e e-teal" d="M548 234 C548 300 656 300 656 240" markerEnd="url(#a3t)" />
        <text className="el" x="602" y="326" textAnchor="middle">
          all steps done → freshness refreshed, text untouched
        </text>
        <text className="el" x="602" y="342" textAnchor="middle">
          a “did not help” mark with evidence → the step text changes
        </text>

        <path className="e e-weak" d="M366 234 V338" markerEnd="url(#a3)" />
        <text className="el" x="380" y="284">six months</text>
        <text className="el" x="380" y="298">without movement</text>
      </svg>
    </Frame>
  );
}

/* ---------------------------------------------------------- frame: signals */

export function SignalsFrame() {
  return (
    <Frame
      label="signals"
      note="the gestures already being made, and what each one moves"
      caption={
        <>
          <b>This is the whole contribution we ask for.</b> Nothing on the left is a writing task, and only the row
          with evidence behind it is allowed to rewrite canonical text — one person’s word goes to observations and
          waits for a second, independent case. A “not about our case” press corrects the <i>matching</i> and never
          touches the article; an opened article is what earns the use count and the co-occurrence edges, so the
          graph improves with nobody maintaining it.
        </>
      }
    >
      <svg
        viewBox="0 0 1200 610"
        role="img"
        aria-label="Each gesture on a ticket raises one kind of proposal, and each kind of proposal has one destination: a failed step with evidence corrects canonical text, a failed step or a remark without evidence lands in observations, all steps done and a matched alert history raise a confirmation into telemetry, a not-applicable mark and an opened article update telemetry only, and a ticket closed with no match becomes a white spot on the owner's list."
      >
        <defs>
          <Arrow id="a4" />
          <Arrow id="a4t" tone="teal" />
          <Arrow id="a4b" tone="blue" />
          <Arrow id="a4p" tone="pink" />
        </defs>

        <text className="hdr" x="48" y="24">THE GESTURE · WHAT IT COSTS</text>
        <text className="hdr" x="430" y="24">WHAT IT RAISES</text>
        <text className="hdr" x="812" y="24">WHERE IT LANDS</text>

        <rect className="nb" x="48" y="44" width="282" height="52" rx="9" />
        <circle className="dot-teal" cx="66" cy="70" r="4" />
        <text className="t-sm" x="82" y="66">“Did not help”, with evidence</text>
        <text className="s" x="82" y="85">one press + a paste</text>

        <rect className="nb" x="48" y="112" width="282" height="52" rx="9" />
        <circle className="dot-grey" cx="66" cy="138" r="4" />
        <text className="t-sm" x="82" y="134">“Did not help”, nothing attached</text>
        <text className="s" x="82" y="153">one press</text>

        <rect className="nb" x="48" y="180" width="282" height="52" rx="9" />
        <circle className="dot-grey" cx="66" cy="206" r="4" />
        <text className="t-sm" x="82" y="202">A remark in the dialogue</text>
        <text className="s" x="82" y="221">voluntary typing</text>

        <rect className="nb" x="48" y="248" width="282" height="52" rx="9" />
        <circle className="dot-teal" cx="66" cy="274" r="4" />
        <text className="t-sm" x="82" y="270">Every step marked done</text>
        <text className="s" x="82" y="289">nothing extra — no separate press</text>

        <rect className="nb" x="48" y="316" width="282" height="52" rx="9" />
        <circle className="dot-teal" cx="66" cy="342" r="4" />
        <text className="t-sm" x="82" y="338">A repeat alert, course matched</text>
        <text className="s" x="82" y="357">nothing — “close as last time”</text>

        <rect className="nb" x="48" y="384" width="282" height="52" rx="9" />
        <circle className="dot-grey" cx="66" cy="410" r="4" />
        <text className="t-sm" x="82" y="406">“Not about our case”</text>
        <text className="s" x="82" y="425">one press</text>

        <rect className="nb" x="48" y="452" width="282" height="52" rx="9" />
        <circle className="dot-blue" cx="66" cy="478" r="4" />
        <text className="t-sm" x="82" y="474">An article opened</text>
        <text className="s" x="82" y="493">one press</text>

        <rect className="nb" x="48" y="520" width="282" height="52" rx="9" />
        <circle className="dot-pink" cx="66" cy="546" r="4" />
        <text className="t-sm" x="82" y="542">Closed with no match at all</text>
        <text className="s" x="82" y="561">nothing</text>

        <rect className="nb" x="430" y="44" width="282" height="52" rx="9" />
        <circle className="dot-teal" cx="448" cy="70" r="4" />
        <text className="t-sm" x="464" y="66">Correction · strong</text>
        <text className="s" x="464" y="85">the basis names the evidence</text>

        <rect className="nb" x="430" y="146" width="282" height="52" rx="9" />
        <circle className="dot-grey" cx="448" cy="172" r="4" />
        <text className="t-sm" x="464" y="168">Observation · weak</text>
        <text className="s" x="464" y="187">one person’s word, so far</text>

        <rect className="nb" x="430" y="282" width="282" height="52" rx="9" />
        <circle className="dot-teal" cx="448" cy="308" r="4" />
        <text className="t-sm" x="464" y="304">Confirmation</text>
        <text className="s" x="464" y="323">raised by the course of the work</text>

        <rect className="nb" x="430" y="384" width="282" height="52" rx="9" />
        <circle className="dot-grey" cx="448" cy="410" r="4" />
        <text className="t-sm" x="464" y="406">Not applicable</text>
        <text className="s" x="464" y="425">the matching is wrong, not the text</text>

        <rect className="nb" x="430" y="452" width="282" height="52" rx="9" />
        <circle className="dot-blue" cx="448" cy="478" r="4" />
        <text className="t-sm" x="464" y="474">A trail event</text>
        <text className="s" x="464" y="493">article_opened</text>

        <rect className="nb" x="430" y="520" width="282" height="52" rx="9" />
        <circle className="dot-pink" cx="448" cy="546" r="4" />
        <text className="t-sm" x="464" y="542">A white spot</text>
        <text className="s" x="464" y="561">knowledge that does not exist</text>

        <rect className="nb-sn" x="812" y="44" width="340" height="56" rx="10" />
        <circle className="dot-teal" cx="830" cy="66" r="4" />
        <text className="t-sm" x="846" y="71">Canonical text · ServiceNow</text>
        <text className="s" x="830" y="90">a new version, with authorship</text>

        <rect className="nb-sn" x="812" y="146" width="340" height="56" rx="10" />
        <circle className="dot-grey" cx="830" cy="168" r="4" />
        <text className="t-sm" x="846" y="173">Observations · ServiceNow</text>
        <text className="s" x="830" y="192">a marked-up section of the article</text>

        <rect className="nb" x="812" y="372" width="340" height="56" rx="10" />
        <circle className="dot-blue" cx="830" cy="394" r="4" />
        <text className="t-sm" x="846" y="399">Telemetry · ours</text>
        <text className="s" x="830" y="418">freshness · use count · co-occurrence</text>

        <rect className="nb" x="812" y="520" width="340" height="56" rx="10" />
        <circle className="dot-pink" cx="830" cy="542" r="4" />
        <text className="t-sm" x="846" y="547">The owner’s list · the slow loop</text>
        <text className="s" x="830" y="566">a missing article, not a bad one</text>

        <path className="e e-teal" d="M330 70 C380 70 380 70 424 70" markerEnd="url(#a4t)" />
        <path className="e e-weak" d="M330 138 C380 138 380 172 424 172" markerEnd="url(#a4)" />
        <path className="e e-weak" d="M330 206 C380 206 380 172 424 172" markerEnd="url(#a4)" />
        <path className="e e-teal" d="M330 274 C380 274 380 308 424 308" markerEnd="url(#a4t)" />
        <path className="e e-teal" d="M330 342 C380 342 380 308 424 308" markerEnd="url(#a4t)" />
        <path className="e e-weak" d="M330 410 C380 410 380 410 424 410" markerEnd="url(#a4)" />
        <path className="e e-blue" d="M330 478 C380 478 380 478 424 478" markerEnd="url(#a4b)" />
        <path className="e e-pink" d="M330 546 C380 546 380 546 424 546" markerEnd="url(#a4p)" />

        <path className="e e-teal" d="M712 70 C762 70 762 72 806 72" markerEnd="url(#a4t)" />
        <path className="e e-weak" d="M712 172 C762 172 762 174 806 174" markerEnd="url(#a4)" />
        <path className="e e-blue" d="M712 308 C762 308 762 400 806 400" markerEnd="url(#a4b)" />
        <path className="e e-blue" d="M712 410 C762 410 762 400 806 400" markerEnd="url(#a4b)" />
        <path className="e e-blue" d="M712 478 C762 478 762 400 806 400" markerEnd="url(#a4b)" />
        <path className="e e-pink" d="M712 546 C762 546 762 548 806 548" markerEnd="url(#a4p)" />

        <path className="e e-teal e-weak" d="M982 146 V106" markerEnd="url(#a4t)" />
        <text className="el-em" x="968" y="126" textAnchor="end">
          promotion: two engineers on two tickets, or one owner
        </text>
      </svg>
    </Frame>
  );
}

/* -------------------------------------------------------------- the canvas */

export function KnowledgeLoopCanvas({ embedded = false }: { embedded?: boolean } = {}) {
  return (
    <div className={embedded ? 'klc klc-embed' : 'klc'}>
      <style>{css}</style>
      <div className="page">
        {!embedded && (
          <div className="bar">
            <span className="mark" aria-hidden="true" />
            <span className="file">
              knowledge-loop<span>.canvas</span>
            </span>
            <span className="spacer" />
            <span className="chip hide-sm">source: docs/concept.md</span>
            <span className="chip">4 frames</span>
          </div>
        )}

        <h1>The knowledge loop</h1>
        <p className="deck">
          Four drawings of the same machine: <strong>where knowledge lives</strong> and what it is walled off from,{' '}
          <strong>the two clocks</strong> it runs on, <strong>the life of one unit of it</strong> from white spot to
          deprecation, and <strong>the gestures on a ticket</strong> that move it — the presses an engineer already
          makes, which is the whole point.
        </p>

        <div className="legend">
          <span className="key">
            <span className="rule" />
            <b>Solid</b> — a strong basis: it changes canonical text
          </span>
          <span className="key">
            <span className="rule dash" />
            <b>Dashed</b> — a weak basis: it lands in observations
          </span>
          <span className="key">
            <span className="swatch" style={{ background: 'var(--klc-teal)' }} />
            <b>Teal</b> confirmed
          </span>
          <span className="key">
            <span className="swatch" style={{ background: 'var(--klc-amber)' }} />
            <b>Amber</b> stale
          </span>
          <span className="key">
            <span className="swatch" style={{ background: 'var(--klc-pink)' }} />
            <b>Pink</b> nothing there yet
          </span>
          <span className="key">
            <span className="swatch" style={{ background: 'var(--klc-accent)' }} />
            <b>Blue</b> ours, never ServiceNow’s
          </span>
        </div>

        <LoopFrame />
        <ClocksFrame />
        <LifecycleFrame />
        <SignalsFrame />

        <footer>
          <span>
            Specified in <code>docs/concept.md</code> §3–§6
          </span>
          <span>
            Invariants <code>I1 · I4 · I6 · I7</code>
          </span>
          <span>
            Decisions <code>D2 · D7 · D13 · D17 · D18</code>
          </span>
        </footer>
      </div>
    </div>
  );
}

export default KnowledgeLoopCanvas;
