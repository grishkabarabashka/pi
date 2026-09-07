import { useApp } from '@/store/app';
import { Button, kindColor, kindLabel } from '@/ui/primitives';
import s from './Basket.module.css';

/** Visible at all times in `work` mode; it does not appear out of nowhere at closure. */
export function Basket({ ticketId }: { ticketId: string }) {
  const proposals = useApp((st) => st.proposals[ticketId]) ?? [];
  const openClosure = useApp((st) => st.openClosure);
  const openPage = useApp((st) => st.openPage);

  return (
    <div className={s.basket}>
      <header className={s.head}>
        <span className="caps">Basket</span>
        <span className="faint mono">{proposals.length}</span>
      </header>

      <ul className={s.items}>
        {proposals.length === 0 && <li className="faint">Empty so far</li>}
        {proposals.map((p) => {
          const pageId = p.sourceArticleId ?? p.anchor?.articleSysId;
          return (
            <li key={p.id} className={s.item}>
              <span className={s.kind} style={{ color: kindColor[p.kind] }}>{kindLabel[p.kind]}</span>
              <span className={s.text}>{p.text}</span>
              {pageId && (
                <button
                  type="button"
                  className={`faint ${s.target}`}
                  onClick={() => openPage(pageId, ticketId)}
                >
                  {p.targetLabel}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <Button variant="solid" onClick={() => openClosure(ticketId)}>Go to closure</Button>
    </div>
  );
}
