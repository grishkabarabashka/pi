/**
 * Markdown for the documentation view. The source is the same `docs/*.md` the repository
 * keeps — bundled at build time, so the reader shows exactly what is in the files and never
 * a second copy that can drift.
 *
 * Mermaid is loaded lazily, only when a document that contains a diagram is opened.
 */

import { marked, type Tokens } from 'marked';

const escapeHtml = (text: string): string =>
  text.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);

marked.use({
  gfm: true,
  renderer: {
    code({ text, lang }: Tokens.Code): string {
      if (lang === 'mermaid') {
        // The source stays inside the figure: if mermaid fails to load or the graph does
        // not parse, the reader sees the diagram's text rather than an empty box.
        return `<figure class="graph" data-graph="${encodeURIComponent(text)}"><pre>${escapeHtml(text)}</pre></figure>`;
      }
      return `<pre><code>${escapeHtml(text)}</code></pre>`;
    },
  },
});

export function renderMarkdown(source: string): string {
  return marked.parse(source, { async: false });
}

type Mermaid = typeof import('mermaid').default;
let loading: Promise<Mermaid> | null = null;

function loadMermaid(): Promise<Mermaid> {
  loading ??= import('mermaid').then(({ default: mermaid }) => {
    const dark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: dark ? 'dark' : 'neutral',
      fontFamily: getComputedStyle(document.body).fontFamily,
    });
    return mermaid;
  });
  return loading;
}

let seq = 0;

/** Draws every mermaid block inside `root`. Failures are silent: the source stays visible. */
export async function drawGraphs(root: HTMLElement): Promise<void> {
  const nodes = [...root.querySelectorAll<HTMLElement>('figure.graph[data-graph]')];
  if (nodes.length === 0) return;

  const mermaid = await loadMermaid();
  for (const node of nodes) {
    const source = decodeURIComponent(node.dataset.graph ?? '');
    if (!source) continue;
    try {
      const { svg } = await mermaid.render(`graph-${(seq += 1)}`, source);
      node.innerHTML = svg;
      delete node.dataset.graph;
    } catch {
      // A diagram that does not parse is left as text rather than hidden.
      delete node.dataset.graph;
    }
  }
}
