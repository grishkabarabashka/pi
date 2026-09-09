/**
 * The documents themselves, readable from inside the mockup (D19). The list on the left is
 * the reading order from `docs/README.md`; the reader on the right renders the file as it is.
 *
 * This is the shelf of the mockup, not a fourth product screen: it takes nothing away from
 * the work screen and nothing here writes anywhere.
 */

import { useEffect, useMemo, useRef, type MouseEvent } from 'react';
import { useApp } from '@/store/app';
import { drawGraphs, renderMarkdown } from './markdown';
import s from './Docs.module.css';

/** Every document in the repository, bundled at build time. */
const files = import.meta.glob('/docs/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

interface Entry { path: string; label: string; note: string }
interface Group { title: string; entries: Entry[] }

const groups: Group[] = [
  {
    title: 'Start here',
    entries: [
      { path: '/docs/concept.md', label: 'Concept', note: 'the whole idea in one document' },
      { path: '/docs/README.md', label: 'Map', note: 'what is where, and reading routes' },
    ],
  },
  {
    title: 'The rules',
    entries: [
      { path: '/docs/invariants.md', label: 'Invariants', note: 'I1–I7, and how each breaks unnoticed' },
      { path: '/docs/decisions.md', label: 'Decisions', note: 'what was decided, and what was rejected' },
      { path: '/docs/open-questions.md', label: 'Open questions', note: 'what is unknown, and what it blocks' },
    ],
  },
  {
    title: 'What is built',
    entries: [
      { path: '/docs/domain.md', label: 'Domain', note: 'entities, fields, states' },
      { path: '/docs/screens/main.md', label: 'Screen · main', note: 'the list and the attention strip' },
      { path: '/docs/screens/workspace.md', label: 'Screen · workspace', note: 'the feed, the steps, the sources' },
      { path: '/docs/screens/closure.md', label: 'Screen · closure', note: 'slots, proposals, publication' },
      { path: '/docs/screens/queue.md', label: 'Screen · queue', note: "the team's load" },
      { path: '/docs/screens/knowledge-page.md', label: 'Screen · knowledge', note: 'the projection of an article' },
    ],
  },
  {
    title: 'The seams',
    entries: [
      { path: '/docs/servicenow.md', label: 'ServiceNow', note: 'the adapter contract' },
      { path: '/docs/agent.md', label: 'The agent', note: 'where the model is called' },
      { path: '/docs/roadmap.md', label: 'Roadmap', note: 'the waves and the risks' },
    ],
  },
];

export const firstDoc = '/docs/concept.md';

export function Docs() {
  const path = useApp((st) => st.openedDocPath) ?? firstDoc;
  const openDoc = useApp((st) => st.openDoc);
  const body = useRef<HTMLDivElement>(null);

  const source = files[path];
  // Our own documents, bundled from the repository — there is no user input in this string.
  const html = useMemo(() => (source ? renderMarkdown(source) : ''), [source]);

  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
    if (body.current) void drawGraphs(body.current);
  }, [html]);

  /** A link from one document to another opens in the reader; everything else behaves normally. */
  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const link = (e.target as HTMLElement).closest('a');
    const href = link?.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#')) return;
    const target = new URL(href, `file://${path}`).pathname;
    if (files[target]) {
      e.preventDefault();
      openDoc(target);
    } else if (target.startsWith('/docs/canvas')) {
      e.preventDefault();
      window.open('/docs/canvas/', '_blank', 'noreferrer');
    }
  };

  return (
    <div className={s.screen}>
      <nav className={s.list}>
        <a className={s.canvas} href="/docs/canvas/" target="_blank" rel="noreferrer">
          <span className={s.canvasTitle}>The loop, drawn ↗</span>
          <span className="faint">four frames: the loop, its two clocks, the life of a unit, the signals</span>
        </a>

        {groups.map((group) => (
          <section key={group.title} className={s.group}>
            <span className="caps">{group.title}</span>
            {group.entries.map((entry) => (
              <button
                key={entry.path}
                type="button"
                className={`${s.entry} ${entry.path === path ? s.entryActive : ''}`}
                onClick={() => openDoc(entry.path)}
              >
                <span className={s.entryLabel}>{entry.label}</span>
                <span className="faint">{entry.note}</span>
              </button>
            ))}
          </section>
        ))}

        <p className={`faint ${s.foot}`}>
          Rendered from the files in <span className="mono">docs/</span>. Where a screen and a
          document disagree, the document is right.
        </p>
      </nav>

      <div className={s.reader} ref={body}>
        {source ? (
          <article className={s.doc} onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <p className="faint">This document is not bundled: {path}</p>
        )}
      </div>
    </div>
  );
}

export default Docs;
