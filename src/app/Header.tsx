import { useApp, type View } from '@/store/app';
import { currentUser } from '~fixtures/team';
import s from './Header.module.css';

const views: { id: View; label: string }[] = [
  { id: 'work', label: 'Work' },
  { id: 'queue', label: 'Queue' },
  { id: 'knowledge', label: 'Knowledge' },
];

/**
 * The header takes nothing away from the work screen: it adds two views and
 * returns to it (D15). The work state survives the transition.
 */
export function Header() {
  const view = useApp((st) => st.view);
  const setView = useApp((st) => st.setView);
  const selected = useApp((st) => st.tickets.find((t) => t.id === st.selectedId));
  const mode = useApp((st) => st.mode);

  return (
    <header className={s.header}>
      <span className={s.brand}>Knowledge loop</span>

      <nav className={s.nav}>
        {views.map((v) => (
          <button
            key={v.id}
            type="button"
            className={`${s.tab} ${view === v.id ? s.tabActive : ''}`}
            onClick={() => setView(v.id)}
          >
            {v.label}
          </button>
        ))}
      </nav>

      {/* What is still open on the work screen is visible from any view. */}
      {selected && view !== 'work' && (
        <button type="button" className={s.resume} onClick={() => setView('work')}>
          <span className="mono">{selected.id}</span>
          <span className="faint">{mode === 'closing' ? 'closure' : 'in work'}</span>
        </button>
      )}

      <span className={s.user}>
        <span>{currentUser.name}</span>
        <span className="faint"> · {currentUser.region}</span>
      </span>
    </header>
  );
}
