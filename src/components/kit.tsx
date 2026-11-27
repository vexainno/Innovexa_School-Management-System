import { useState, type ReactNode } from 'react';
import { ChevronRight, Search, X } from 'lucide-react';
import { useSchool, gradesOf, sectionsOf } from '@/store/store';

/* Small, reusable building blocks shared by the rebuilt portals. */

type Tone = 'navy' | 'success' | 'warning' | 'error' | 'accent';
const TONES: Record<Tone, string> = {
  navy: 'bg-navy-50 text-navy-700',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  error: 'bg-error-50 text-error-700',
  accent: 'bg-accent-50 text-accent-700',
};

export function Stat({ label, value, sub, icon, tone = 'navy', onClick, footer }: {
  label: string; value: ReactNode; sub?: ReactNode; icon?: ReactNode; tone?: Tone; onClick?: () => void; footer?: ReactNode;
}) {
  const inner = (
    <>
      <span className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block text-sm font-medium text-navy-500">{label}</span>
          <span className="block text-2xl font-bold font-display text-navy-900 mt-1">{value}</span>
          {sub && <span className="block text-xs text-navy-500 mt-1">{sub}</span>}
        </span>
        {icon && <span className={`p-2.5 rounded-xl shrink-0 ${TONES[tone]}`}>{icon}</span>}
      </span>
      {footer && <span className="block mt-3">{footer}</span>}
      {onClick && <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-navy-600">Open <ChevronRight className="w-3 h-3" /></span>}
    </>
  );
  return onClick ? (
    <button type="button" onClick={onClick} className="card p-5 text-left w-full hover:shadow-card-hover hover:border-navy-300 transition-all focus:outline-none focus:ring-2 focus:ring-navy-500">{inner}</button>
  ) : (
    <div className="card p-5">{inner}</div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-navy-100 mb-5" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} type="button" onClick={() => onChange(t.id)}
          className={`px-3.5 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${value === t.id ? 'border-navy-700 text-navy-900' : 'border-transparent text-navy-500 hover:text-navy-800'}`}>
          {t.label}{t.count != null && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-navy-100 text-navy-700">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Pill({ tone = 'navy', children }: { tone?: Tone | 'muted'; children: ReactNode }) {
  const map: Record<string, string> = {
    navy: 'bg-navy-100 text-navy-700', success: 'bg-success-100 text-success-700', warning: 'bg-warning-100 text-warning-800',
    error: 'bg-error-100 text-error-700', accent: 'bg-accent-100 text-accent-800', muted: 'bg-slate-100 text-slate-600',
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${map[tone]}`}>{children}</span>;
}

export function Card({ title, subtitle, action, children, className = '' }: { title?: ReactNode; subtitle?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card p-5 sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            {title && <h2 className="text-base font-semibold font-display text-navy-900">{title}</h2>}
            {subtitle && <p className="text-xs text-navy-500 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Header({ title, subtitle, action, back }: { title: string; subtitle?: ReactNode; action?: ReactNode; back?: { label: string; onClick: () => void } }) {
  return (
    <div className="mb-6">
      {back && <button type="button" onClick={back.onClick} className="text-sm text-navy-500 hover:text-navy-800 mb-2">← {back.label}</button>}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-display text-navy-900">{title}</h1>
          {subtitle && <p className="text-sm text-navy-500 mt-1">{subtitle}</p>}
        </div>
        {action && <div className="flex flex-wrap gap-2">{action}</div>}
      </div>
    </div>
  );
}

export function Table({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: string }) {
  const hasRows = Array.isArray(children) ? children.flat().filter(Boolean).length > 0 : !!children;
  return (
    <div className="overflow-x-auto -mx-5 sm:-mx-6">
      <table className="table-base min-w-full">
        <thead><tr>{head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
        <tbody>
          {hasRows ? children : <tr><td colSpan={head.length} className="text-center text-navy-400 py-10">{empty ?? 'No records found.'}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="relative block">
      <span className="sr-only">{placeholder ?? 'Search'}</span>
      <Search className="w-4 h-4 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder ?? 'Search…'} className="input pl-9 py-2 text-sm" />
    </label>
  );
}

/** Class then section picker, shared by every page that drills into Grade → Section. */
export function ClassSectionPicker({ grade, section, onChange, allowAllSections }: {
  grade: number | null; section: string | null; onChange: (g: number | null, s: string | null) => void; allowAllSections?: boolean;
}) {
  const school = useSchool();
  return (
    <div className="flex flex-wrap gap-3">
      <label className="min-w-[150px]">
        <span className="label">Class</span>
        <select className="input py-2 text-sm" value={grade ?? ''} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null, null)}>
          <option value="">Select class</option>
          {gradesOf(school).map((g) => <option key={g} value={g}>Grade {g}</option>)}
        </select>
      </label>
      <label className="min-w-[150px]">
        <span className="label">Section</span>
        <select className="input py-2 text-sm" disabled={grade == null} value={section ?? ''} onChange={(e) => onChange(grade, e.target.value || null)}>
          <option value="">{allowAllSections ? 'All sections' : 'Select section'}</option>
          {grade != null && sectionsOf(school, grade).map((s) => <option key={s} value={s}>Section {s}</option>)}
        </select>
      </label>
    </div>
  );
}

export function Dialog({ open, onClose, title, children, wide, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean | 'xl'; footer?: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-navy-950/50" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${wide === 'xl' ? 'max-w-5xl' : wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[92vh] flex flex-col`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-navy-100">
          <h2 className="text-lg font-semibold font-display text-navy-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 rounded-lg text-navy-400 hover:bg-navy-50 hover:text-navy-800"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-navy-100 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

export function Notice({ tone = 'navy', children }: { tone?: Tone; children: ReactNode }) {
  const map: Record<Tone, string> = {
    navy: 'bg-navy-50 border-navy-200 text-navy-700', success: 'bg-success-50 border-success-200 text-success-800',
    warning: 'bg-warning-50 border-warning-200 text-warning-800', error: 'bg-error-50 border-error-200 text-error-700', accent: 'bg-accent-50 border-accent-200 text-accent-800',
  };
  return <div className={`rounded-lg border px-4 py-3 text-sm ${map[tone]}`}>{children}</div>;
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="block text-xs text-navy-400 mt-1">{hint}</span>}
    </label>
  );
}

/* --------------------------------- charts -------------------------------- */

export function StackedBars({ rows, series, onSelect }: {
  rows: { label: string; values: number[] }[];
  series: { name: string; color: string }[];
  onSelect?: (index: number) => void;
}) {
  const max = Math.max(1, ...rows.map((r) => r.values.reduce((a, b) => a + b, 0)));
  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-4 text-xs text-navy-600">
        {series.map((s) => <span key={s.name} className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: s.color }} />{s.name}</span>)}
      </div>
      <div className="space-y-3">
        {rows.map((r, i) => {
          const total = r.values.reduce((a, b) => a + b, 0);
          const Row = onSelect ? 'button' : 'div';
          return (
            <Row key={r.label} type={onSelect ? 'button' : undefined} onClick={onSelect ? () => onSelect(i) : undefined}
              className={`w-full grid grid-cols-[72px_1fr_44px] items-center gap-3 text-left ${onSelect ? 'rounded-lg hover:bg-navy-50 p-1 -m-1' : ''}`}>
              <span className="text-sm font-medium text-navy-700">{r.label}</span>
              <span className="flex h-7 rounded-md overflow-hidden bg-navy-50" style={{ width: `${(total / max) * 100}%`, minWidth: total ? 24 : 0 }}>
                {r.values.map((v, j) => v > 0 && (
                  <span key={j} title={`${series[j].name}: ${v}`} className="h-full flex items-center justify-center text-[11px] font-semibold text-white" style={{ width: `${(v / total) * 100}%`, background: series[j].color }}>
                    {v / total > 0.09 ? v : ''}
                  </span>
                ))}
              </span>
              <span className="text-xs text-navy-500 text-right">{total}</span>
            </Row>
          );
        })}
      </div>
    </div>
  );
}

export function ColumnPairs({ data, series, format }: { data: { label: string; values: number[] }[]; series: { name: string; color: string }[]; format?: (n: number) => string }) {
  const max = Math.max(1, ...data.flatMap((d) => d.values));
  const [hover, setHover] = useState<string | null>(null);
  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-4 text-xs text-navy-600">
        {series.map((s) => <span key={s.name} className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: s.color }} />{s.name}</span>)}
      </div>
      <div className="flex items-end gap-4 sm:gap-8 h-56 border-b border-navy-200 px-2">
        {data.map((d) => (
          <div key={d.label} className="flex-1 flex flex-col items-center h-full justify-end" onMouseEnter={() => setHover(d.label)} onMouseLeave={() => setHover(null)}>
            <div className="text-[11px] text-navy-600 mb-1 h-4">{hover === d.label ? d.values.map((v) => (format ? format(v) : v)).join(' / ') : ''}</div>
            <div className="flex items-end gap-1.5 w-full justify-center h-full">
              {d.values.map((v, i) => (
                <div key={i} title={`${series[i].name}: ${format ? format(v) : v}`} className="w-1/3 max-w-[38px] rounded-t-md transition-all" style={{ height: `${(v / max) * 100}%`, background: series[i].color, minHeight: v ? 3 : 0 }} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-4 sm:gap-8 px-2 mt-2">
        {data.map((d) => <div key={d.label} className="flex-1 text-center text-xs text-navy-500">{d.label}</div>)}
      </div>
    </div>
  );
}

export function Meter({ value, tone }: { value: number; tone?: string }) {
  return (
    <div className="h-2 w-full rounded-full bg-navy-100 overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: tone ?? '#243d6f' }} />
    </div>
  );
}

export const CAT_COLORS = { at_risk: '#dc2626', moderate: '#d97706', good: '#16a34a' } as const;
export const catTone = (c: 'at_risk' | 'moderate' | 'good'): 'error' | 'warning' | 'success' => (c === 'at_risk' ? 'error' : c === 'moderate' ? 'warning' : 'success');
