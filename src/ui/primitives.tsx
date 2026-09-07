import type { ReactNode } from 'react';
import type { Freshness, KnowledgeMatch, ProposalKind } from '@/domain/types';
import s from './primitives.module.css';

const matchColor: Record<KnowledgeMatch, string> = {
  strong: 'var(--strong)', weak: 'var(--weak)', stale: 'var(--stale)', none: 'var(--none)',
};

const matchTitle: Record<KnowledgeMatch, string> = {
  strong: 'there is a confirmed procedure',
  weak: 'the match is weak',
  stale: 'the procedure has not been confirmed for a long time',
  none: 'no matches',
};

export function KnowledgeDot({ match }: { match: KnowledgeMatch }) {
  return <span className={s.dot} style={{ background: matchColor[match] }} title={matchTitle[match]} />;
}

export function Chip({
  children, active, onClick, tone, title,
}: {
  children: ReactNode; active?: boolean; onClick?: () => void;
  tone?: string; title?: string;
}) {
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag
      className={`${s.chip} ${active ? s.chipActive : ''}`}
      style={tone ? { ['--chip-tone' as string]: tone } : undefined}
      onClick={onClick}
      title={title}
      type={onClick ? 'button' : undefined}
    >
      {children}
    </Tag>
  );
}

export function Button({
  children, onClick, variant = 'ghost', title,
}: {
  children: ReactNode; onClick?: () => void;
  variant?: 'ghost' | 'solid' | 'quiet'; title?: string;
}) {
  return (
    <button type="button" className={`${s.btn} ${s[variant]}`} onClick={onClick} title={title}>
      {children}
    </button>
  );
}

export function Panel({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className={s.panel}>
      <header className={s.panelHead}>
        <span className="caps">{title}</span>
        {aside}
      </header>
      {children}
    </section>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className={s.empty}>{children}</p>;
}

/** Freshness in words and checkable, with no hidden confidence numbers (I7). */
export function freshnessLabel(freshness: Freshness, lastConfirmedAt?: string, useCount?: number): string {
  if (freshness === 'unknown' || !lastConfirmedAt) return 'no confirmations';
  const days = Math.round((Date.now() - new Date(lastConfirmedAt).getTime()) / 864e5);
  const when = days < 1 ? 'today' : days < 45 ? `${days} days ago` : `${Math.round(days / 30)} months ago`;
  const used = useCount != null ? `, applied ${useCount} times` : '';
  return freshness === 'fresh' ? `confirmed ${when}${used}` : `not confirmed for ${when}${used}`;
}

export const freshnessColor = (f: Freshness) =>
  f === 'fresh' ? 'var(--strong)' : f === 'stale' ? 'var(--stale)' : 'var(--weak)';

export const kindLabel: Record<ProposalKind, string> = {
  confirmation: 'Confirmation',
  correction: 'Correction',
  extension: 'Extension',
  creation: 'New article',
  deprecation: 'Deprecation',
  link: 'Link',
  not_applicable: 'Not applicable',
};

export const kindColor: Record<ProposalKind, string> = {
  confirmation: 'var(--strong)',
  correction: 'var(--stale)',
  extension: 'var(--agent)',
  creation: 'var(--agent)',
  deprecation: 'var(--none)',
  link: 'var(--weak)',
  not_applicable: 'var(--weak)',
};

export function age(iso: string): string {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  return h < 48 ? `${h} h` : `${Math.round(h / 24)} d`;
}

export function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}
