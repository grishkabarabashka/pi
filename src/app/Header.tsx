import { useApp, type View } from '@/store/app';
import { LoopRail, type LoopStage } from '@/ui/loop';
import { currentUser } from '~fixtures/team';
import s from './Header.module.css';

const views: { id: View; label: string; title: string }[] = [
  { id: 'work', label: 'Work', title: 'My tickets and the ticket I am on' },
  { id: 'queue', label: 'Queue', title: "The team's load: what is taken and by whom" },
  { id: 'knowledge', label: 'Knowledge', title: 'The projection of the articles, with freshness' },
  { id: 'docs', label: 'Concept', title: 'The documents this is built from, and the diagrams' },
];

/**
 * The header takes nothing away from the work screen: it adds views and returns to it
 * (D15, and D19 for the documentation shelf). The work state survives the transition.
 */
export function Header() {
  const view = useApp((st) => st.view);
  const setView = useApp((st) => st.setView);
  const openDoc = useApp((st) => st.openDoc);
  const selected = useApp((st) => st.tickets.find((t) => t.id === st.selectedId));
  const mode = useApp((st) => st.mode);

  // Where the screen sits in the loop of concept.md §4. Not every view is a link of it.
  const stage: LoopStage | null =
    view === 'work' && selected
      ? (mode === 'closing' ? 'review' : mode === 'closed' ? 'master' : 'signal')
      : view === 'knowledge' ? 'rebuild' : null;

  return (
    <header className={s.header}>
      <span className={s.brand}>Knowledge loop</span>

      <nav className={s.nav}>
        {views.map((v) => (
          <button
            key={v.id}
            type="button"
            title={v.title}
            className={`${s.tab} ${view === v.id ? s.tabActive : ''}`}
            onClick={() => (v.id === 'docs' ? openDoc() : setView(v.id))}
          >
            {v.label}
          </button>
        ))}
      </nav>

      {stage && <LoopRail current={stage} />}

      <div className={s.right}>
        {/* What is still open on the work screen is visible from any view. */}
        {selected && view !== 'work' && (
          <button type="button" className={s.resume} onClick={() => setView('work')}>
            <span className="mono">{selected.id}</span>
            <span className="faint">{mode === 'closing' ? 'closure' : mode === 'closed' ? 'closed' : 'in work'}</span>
          </button>
        )}

        <span className={s.user}>
          <span>{currentUser.name}</span>
          <span className="faint"> · {currentUser.region}</span>
        </span>
      </div>
    </header>
  );
}
