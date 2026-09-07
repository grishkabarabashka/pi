import { useEffect } from 'react';
import { useApp } from '@/store/app';
import { AttentionStrip } from '@/screens/main/AttentionStrip';
import { TicketList } from '@/screens/main/TicketList';
import { Workspace } from '@/screens/workspace/Workspace';
import { Closure } from '@/screens/closure/Closure';
import { AfterClosure } from '@/screens/closure/AfterClosure';
import { Queue } from '@/screens/queue/Queue';
import { Knowledge } from '@/screens/knowledge/Knowledge';
import { AgentModeSwitch } from './AgentModeSwitch';
import { Header } from './Header';
import s from './App.module.css';

export function App() {
  const load = useApp((st) => st.loadTickets);
  const view = useApp((st) => st.view);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className={s.app}>
      <Header />
      {view === 'work' && <WorkView />}
      {view === 'queue' && <Queue />}
      {view === 'knowledge' && <Knowledge />}
      <AgentModeSwitch />
    </div>
  );
}

/**
 * The work screen. Leaving for another view does not unmount the work state —
 * it lives in the store, not in the components (D15).
 */
function WorkView() {
  const selectedId = useApp((st) => st.selectedId);
  const mode = useApp((st) => st.mode);
  const ticket = useApp((st) => st.tickets.find((t) => t.id === st.selectedId));

  return (
    <>
      <AttentionStrip />
      <div className={s.body}>
        <TicketList />
        {!selectedId || !ticket ? (
          <div className={s.blank}>
            <p className="muted">Pick a ticket on the left or take one from the general queue.</p>
          </div>
        ) : mode === 'closing' ? (
          <Closure ticket={ticket} />
        ) : mode === 'closed' ? (
          <AfterClosure ticket={ticket} />
        ) : (
          <Workspace ticket={ticket} />
        )}
      </div>
    </>
  );
}
