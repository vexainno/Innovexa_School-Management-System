import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, CalendarCheck, Copy, Eraser, Plus, Send, Trash2 } from 'lucide-react';
import { actions, allSections, blockTime, className, fmtDate, lessonBlocks, staffName, teachers, useSchool } from '@/store/store';
import { roomFor, subjectsForGrade } from '@/store/seed';
import type { DayBlock, WeekDay } from '@/store/types';
import { Card, ClassSectionPicker, Dialog, Field, Header, Notice, Pill, Stat, Table, Tabs } from '@/components/kit';
import { useMe } from './shared';

const ALL_DAYS: WeekDay[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const KINDS: { id: DayBlock['kind']; label: string; tone: string }[] = [
  { id: 'assembly', label: 'Assembly / devotion', tone: 'bg-accent-100 text-accent-800' },
  { id: 'lesson', label: 'Lesson period', tone: 'bg-navy-100 text-navy-800' },
  { id: 'break', label: 'Break', tone: 'bg-success-100 text-success-800' },
  { id: 'lunch', label: 'Lunch', tone: 'bg-success-100 text-success-800' },
  { id: 'activity', label: 'Activity / clubs / study', tone: 'bg-warning-100 text-warning-800' },
  { id: 'dismissal', label: 'Dismissal', tone: 'bg-error-100 text-error-700' },
];
const kindTone = (k: DayBlock['kind']) => KINDS.find((x) => x.id === k)?.tone ?? '';
const mins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const addMins = (t: string, n: number) => { const v = mins(t) + n; return `${String(Math.floor(v / 60) % 24).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`; };
let bid = 0;
const newId = () => `blk-${Date.now().toString(36)}-${bid++}`;

function validate(blocks: DayBlock[]) {
  const issues: string[] = [];
  blocks.forEach((b, i) => {
    if (!b.label.trim()) issues.push(`Row ${i + 1} needs a name.`);
    if (b.kind !== 'dismissal' && mins(b.end) <= mins(b.start)) issues.push(`${b.label || `Row ${i + 1}`}: end time must be after start time.`);
    const next = blocks[i + 1];
    if (next && mins(next.start) < mins(b.end)) issues.push(`${b.label} overlaps ${next.label}.`);
  });
  if (!blocks.some((b) => b.kind === 'lesson')) issues.push('Add at least one lesson period.');
  return issues;
}

/** VP: build the school day (times, breaks, lunch, dismissal), then each class's weekly timetable, then publish. */
export function ClassSchedules() {
  const s = useSchool();
  const me = useMe();
  const [tab, setTab] = useState<'day' | 'classes' | 'publish'>('day');
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Weekly Class Schedule" subtitle="Set the school day, build each class's weekly timetable, then publish it to teachers, students and parents." action={
        <Pill tone={s.schedule.status === 'published' ? 'success' : 'warning'}>{s.schedule.status === 'published' ? `Published · effective ${fmtDate(s.schedule.effectiveFrom)}` : 'Draft — not yet published'}</Pill>
      } />
      <Tabs tabs={[{ id: 'day', label: '1. School day and times' }, { id: 'classes', label: '2. Class timetables' }, { id: 'publish', label: '3. Review and publish' }]} value={tab} onChange={setTab} />
      {tab === 'day' && <DayStructure onNext={() => setTab('classes')} />}
      {tab === 'classes' && <ClassTimetableEditor />}
      {tab === 'publish' && <PublishPanel by={me.name} />}
    </div>
  );
}

function DayStructure({ onNext }: { onNext: () => void }) {
  const s = useSchool();
  const [blocks, setBlocks] = useState<DayBlock[]>(s.schedule.blocks);
  const [days, setDays] = useState<WeekDay[]>(s.schedule.days);
  const [saved, setSaved] = useState(false);
  const issues = validate(blocks);
  const set = (i: number, patch: Partial<DayBlock>) => { setSaved(false); setBlocks(blocks.map((b, j) => (j === i ? { ...b, ...patch } : b))); };
  const move = (i: number, d: number) => { const n = [...blocks]; const [x] = n.splice(i, 1); n.splice(i + d, 0, x); setBlocks(n); setSaved(false); };
  const add = (kind: DayBlock['kind']) => {
    const last = blocks[blocks.length - 1];
    const start = last ? last.end : '08:00';
    const len = kind === 'lesson' ? 45 : kind === 'lunch' ? 45 : kind === 'break' ? 15 : kind === 'dismissal' ? 10 : 30;
    const lessons = blocks.filter((b) => b.kind === 'lesson').length;
    setBlocks([...blocks, { id: newId(), kind, label: kind === 'lesson' ? `Period ${lessons + 1}` : KINDS.find((k) => k.id === kind)!.label.split(' /')[0], start, end: addMins(start, len) }]);
    setSaved(false);
  };
  const renumber = () => { let n = 0; setBlocks(blocks.map((b) => (b.kind === 'lesson' ? { ...b, label: `Period ${++n}` } : b))); };
  const save = () => { actions.setScheduleDays(days); actions.setScheduleBlocks(blocks); setSaved(true); };
  const lessons = blocks.filter((b) => b.kind === 'lesson');
  const totalTeaching = lessons.reduce((a, b) => a + mins(b.end) - mins(b.start), 0);
  return (
    <div className="grid xl:grid-cols-[1fr_320px] gap-6">
      <Card title="School day" subtitle="Add every part of the day in order. Lesson periods become the timetable rows.">
        <fieldset className="mb-5">
          <legend className="label">School days</legend>
          <div className="flex flex-wrap gap-2">{ALL_DAYS.map((d) => <label key={d} className={`px-3 py-1.5 rounded-lg border text-sm cursor-pointer ${days.includes(d) ? 'border-navy-700 bg-navy-50' : 'border-navy-200'}`}><input type="checkbox" className="mr-2" checked={days.includes(d)} onChange={() => { setSaved(false); setDays(days.includes(d) ? days.filter((x) => x !== d) : ALL_DAYS.filter((x) => x === d || days.includes(x))); }} />{d}</label>)}</div>
        </fieldset>
        <div className="space-y-2 overflow-x-auto pb-1">
          {blocks.map((b, i) => (
            <div key={b.id} className="grid grid-cols-[auto_170px_1fr_140px_140px_auto] gap-2 items-center min-w-[720px]">
              <span className={`text-[11px] font-semibold px-2 py-1 rounded ${kindTone(b.kind)}`}>{i + 1}</span>
              <select aria-label="Type" className="input py-1.5 text-sm" value={b.kind} onChange={(e) => set(i, { kind: e.target.value as DayBlock['kind'] })}>{KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}</select>
              <input aria-label="Name" className="input py-1.5 text-sm" value={b.label} onChange={(e) => set(i, { label: e.target.value })} />
              <input aria-label="Start time" type="time" className="input py-1.5 text-sm" value={b.start} onChange={(e) => set(i, { start: e.target.value })} />
              <input aria-label="End time" type="time" className="input py-1.5 text-sm" value={b.end} onChange={(e) => set(i, { end: e.target.value })} />
              <span className="flex gap-1">
                <button type="button" aria-label="Move up" className="p-1.5 rounded hover:bg-navy-50 disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="w-4 h-4" /></button>
                <button type="button" aria-label="Move down" className="p-1.5 rounded hover:bg-navy-50 disabled:opacity-30" disabled={i === blocks.length - 1} onClick={() => move(i, 1)}><ArrowDown className="w-4 h-4" /></button>
                <button type="button" aria-label="Remove" className="p-1.5 rounded hover:bg-error-50 text-error-600" onClick={() => { setBlocks(blocks.filter((_, j) => j !== i)); setSaved(false); }}><Trash2 className="w-4 h-4" /></button>
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {KINDS.map((k) => <button key={k.id} type="button" className="btn-secondary text-xs py-1.5" onClick={() => add(k.id)}><Plus className="w-3.5 h-3.5" /> {k.label}</button>)}
          <button type="button" className="btn-ghost text-xs py-1.5" onClick={renumber}>Renumber periods</button>
        </div>
        {issues.length > 0 && <div className="mt-4"><Notice tone="error">{issues.join(' ')}</Notice></div>}
        {saved && <div className="mt-4"><Notice tone="success">School day saved. Lessons already placed stay attached to their period. Publish when the class timetables are ready.</Notice></div>}
        <div className="flex justify-end gap-2 mt-4">
          <button type="button" className="btn-secondary" onClick={() => { setBlocks(s.schedule.blocks); setDays(s.schedule.days); }}>Discard changes</button>
          <button type="button" className="btn-primary" disabled={issues.length > 0 || !days.length} onClick={save}>Save school day</button>
          <button type="button" className="btn-secondary" onClick={onNext}>Next: class timetables →</button>
        </div>
      </Card>
      <Card title="Day at a glance">
        <ol className="relative border-l-2 border-navy-100 ml-2 space-y-3">
          {blocks.map((b) => <li key={b.id} className="ml-4"><span className={`absolute -left-[7px] mt-1.5 w-3 h-3 rounded-full ${b.kind === 'lesson' ? 'bg-navy-600' : b.kind === 'dismissal' ? 'bg-error-500' : 'bg-success-500'}`} /><p className="text-sm font-medium text-navy-900">{b.label}</p><p className="text-xs text-navy-500">{blockTime(b)}</p></li>)}
        </ol>
        <div className="mt-4 pt-4 border-t border-navy-100 text-sm space-y-1">
          <p>{lessons.length} lesson periods · {Math.round(totalTeaching / 6) / 10} teaching hours a day</p>
          <p>{days.length} school days · {lessons.length * days.length} periods a week per class</p>
        </div>
      </Card>
    </div>
  );
}

function ClassTimetableEditor() {
  const s = useSchool();
  const first = allSections(s)[0];
  const [grade, setGrade] = useState<number | null>(first?.grade ?? null);
  const [section, setSection] = useState<string | null>(first?.section ?? null);
  const [edit, setEdit] = useState<{ day: WeekDay; period: number } | null>(null);
  const [form, setForm] = useState({ subject: '', teacherId: '', room: '' });
  const [copyFrom, setCopyFrom] = useState<WeekDay>('Monday');
  const lessons = lessonBlocks(s);
  const days = s.schedule.days;
  const slots = grade != null && section ? s.timetable.filter((t) => t.grade === grade && t.section === section) : [];
  const slot = (d: WeekDay, p: number) => slots.find((t) => t.day === d && t.period === p);
  const subjects = grade != null ? [...new Set([...subjectsForGrade(grade), ...s.assignments.filter((a) => a.grade === grade && a.section === section).map((a) => a.subject)]), 'Study Hall'] : [];
  const counts = useMemo(() => Object.fromEntries(subjects.map((x) => [x, slots.filter((t) => t.subject === x).length])), [subjects, slots]);
  const teacherClash = edit && form.teacherId ? s.timetable.find((t) => t.teacherId === form.teacherId && t.day === edit.day && t.period === edit.period && !(t.grade === grade && t.section === section)) : null;
  const roomClash = edit && form.room ? s.timetable.find((t) => t.room === form.room && t.day === edit.day && t.period === edit.period && !(t.grade === grade && t.section === section)) : null;
  const open = (day: WeekDay, period: number) => {
    const x = slot(day, period);
    setEdit({ day, period });
    setForm({ subject: x?.subject ?? '', teacherId: x?.teacherId ?? '', room: x?.room ?? (grade != null && section ? roomFor(grade, section) : '') });
  };
  const assigned = (sub: string) => s.assignments.find((a) => a.grade === grade && a.section === section && a.subject === sub)?.teacherId ?? '';
  const empty = days.length * lessons.length - slots.length;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <ClassSectionPicker grade={grade} section={section} onChange={(g, x) => { setGrade(g); setSection(x); }} />
        {grade != null && section && (
          <div className="flex flex-wrap items-end gap-2">
            <label><span className="label">Copy a day</span><select className="input py-2 text-sm" value={copyFrom} onChange={(e) => setCopyFrom(e.target.value as WeekDay)}>{days.map((d) => <option key={d}>{d}</option>)}</select></label>
            <button type="button" className="btn-secondary text-sm" onClick={() => days.filter((d) => d !== copyFrom).forEach((d) => actions.copyDay(grade, section, copyFrom, d))}><Copy className="w-4 h-4" /> Copy to all other days</button>
            <button type="button" className="btn-ghost text-sm text-error-600" onClick={() => { if (window.confirm(`Clear the whole Grade ${grade}${section} timetable?`)) actions.clearSectionTimetable(grade, section); }}><Eraser className="w-4 h-4" /> Clear</button>
          </div>
        )}
      </div>
      {grade != null && section && (
        <>
          {empty > 0 && <Notice tone="warning">{empty} lesson slot(s) are still empty for Grade {grade}{section}. Click a cell to place a lesson.</Notice>}
          <Card title={`Grade ${grade}${section} weekly timetable`} subtitle="Click any lesson cell to place or change a subject and teacher. Breaks, lunch and dismissal come from the school day.">
            <div className="overflow-x-auto -mx-5 sm:-mx-6">
              <table className="min-w-full text-xs">
                <thead><tr className="bg-navy-50"><th className="px-3 py-2 text-left">Time</th>{days.map((d) => <th key={d} className="px-3 py-2 text-left">{d}</th>)}</tr></thead>
                <tbody>
                  {(() => {
                    let n = 0;
                    return s.schedule.blocks.map((b) => {
                      if (b.kind !== 'lesson') return <tr key={b.id} className={`border-t border-navy-100 ${kindTone(b.kind)}`}><td className="px-3 py-1.5 whitespace-nowrap">{blockTime(b)}</td><td colSpan={days.length} className="px-3 py-1.5 text-center font-semibold uppercase tracking-wide text-[11px]">{b.label}</td></tr>;
                      n += 1;
                      const p = n;
                      return (
                        <tr key={b.id} className="border-t border-navy-100">
                          <td className="px-3 py-2 whitespace-nowrap text-navy-500">{blockTime(b)}<span className="block text-[10px]">{b.label}</span></td>
                          {days.map((d) => { const x = slot(d, p); return <td key={d} className="px-1 py-1"><button type="button" onClick={() => open(d, p)} className={`w-full min-h-[48px] text-left rounded-md px-2 py-1.5 border border-dashed ${x ? 'border-transparent bg-white hover:bg-navy-50' : 'border-navy-200 text-navy-300 hover:bg-navy-50'}`}>{x ? <><span className="font-medium text-navy-800">{x.subject}</span><span className="block text-navy-500">{x.teacherId ? staffName(s, x.teacherId) : 'No teacher'}</span></> : '+ Add lesson'}</button></td>; })}
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </Card>
          <Card title="Periods per subject this week">
            <div className="flex flex-wrap gap-2">{subjects.map((x) => <Pill key={x} tone={counts[x] ? 'navy' : 'warning'}>{x}: {counts[x] ?? 0}</Pill>)}</div>
          </Card>
        </>
      )}
      <Dialog open={!!edit} onClose={() => setEdit(null)} title={`${edit?.day}, ${lessons[(edit?.period ?? 1) - 1]?.label} (${lessons[(edit?.period ?? 1) - 1] ? blockTime(lessons[(edit?.period ?? 1) - 1]) : ''})`} footer={<>
        {slot(edit?.day ?? 'Monday', edit?.period ?? 0) && <button type="button" className="btn-ghost text-error-600 mr-auto" onClick={() => { if (edit && grade != null && section) actions.setTimetableSlot({ ...edit, grade, section }, { subject: '', teacherId: '' }); setEdit(null); }}>Remove lesson</button>}
        <button type="button" className="btn-secondary" onClick={() => setEdit(null)}>Cancel</button>
        <button type="button" className="btn-primary" disabled={!form.subject || !!teacherClash} onClick={() => { if (edit && grade != null && section) actions.setTimetableSlot({ ...edit, grade, section }, form); setEdit(null); }}>Save lesson</button>
      </>}>
        <div className="space-y-3">
          <Field label="Subject"><select className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value, teacherId: assigned(e.target.value) || form.teacherId })}><option value="">Select subject</option>{subjects.map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Teacher" hint={form.subject && assigned(form.subject) ? `Assigned ${form.subject} teacher for this class: ${staffName(s, assigned(form.subject))}` : undefined}><select className="input" value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })}><option value="">No teacher (supervised)</option>{teachers(s).map((t) => <option key={t.id} value={t.id}>{t.name} ({t.subjects.join(', ')})</option>)}</select></Field>
          <Field label="Classroom"><input className="input" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} /></Field>
          {teacherClash && <Notice tone="error">Teacher conflict: {staffName(s, form.teacherId)} already teaches Grade {teacherClash.grade}{teacherClash.section} at this time.</Notice>}
          {roomClash && !teacherClash && <Notice tone="warning">{form.room} is already used by Grade {roomClash.grade}{roomClash.section} at this time.</Notice>}
        </div>
      </Dialog>
    </div>
  );
}

function PublishPanel({ by }: { by: string }) {
  const s = useSchool();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [done, setDone] = useState(false);
  const lessons = lessonBlocks(s).length;
  const perClass = lessons * s.schedule.days.length;
  const rows = allSections(s).map(({ grade, section }) => {
    const n = s.timetable.filter((t) => t.grade === grade && t.section === section && s.schedule.days.includes(t.day)).length;
    return { grade, section, n };
  });
  const clashes = (() => {
    const seen = new Map<string, number>();
    s.timetable.forEach((t) => { if (t.teacherId) { const k = `${t.teacherId}|${t.day}|${t.period}`; seen.set(k, (seen.get(k) ?? 0) + 1); } });
    return [...seen.values()].filter((v) => v > 1).length;
  })();
  const incomplete = rows.filter((r) => r.n < perClass);
  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-4 gap-4">
        <Stat label="Classes" value={rows.length} />
        <Stat label="Complete timetables" value={rows.length - incomplete.length} tone="success" />
        <Stat label="With empty slots" value={incomplete.length} tone={incomplete.length ? 'warning' : 'success'} />
        <Stat label="Teacher conflicts" value={clashes} tone={clashes ? 'error' : 'success'} />
      </div>
      <Card title="Classes">
        <Table head={['Class', 'Lessons placed', 'Status']}>{rows.map((r) => <tr key={`${r.grade}${r.section}`}><td>{className(r.grade, r.section)}</td><td>{r.n} / {perClass}</td><td>{r.n >= perClass ? <Pill tone="success">Complete</Pill> : r.n === 0 ? <Pill tone="error">Not started</Pill> : <Pill tone="warning">{perClass - r.n} empty</Pill>}</td></tr>)}</Table>
      </Card>
      <Card title="Publish">
        {done && <div className="mb-3"><Notice tone="success">Published. Teachers, students and parents have been notified and now see the new timetable.</Notice></div>}
        {clashes > 0 && <div className="mb-3"><Notice tone="error">Resolve the teacher conflicts before publishing.</Notice></div>}
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Effective from"><input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <button type="button" className="btn-primary" disabled={clashes > 0} onClick={() => { actions.publishSchedule(date, by); setDone(true); }}><Send className="w-4 h-4" /> Publish timetable</button>
          {incomplete.length > 0 && <span className="text-xs text-navy-500">Empty slots will show as free periods.</span>}
        </div>
        <p className="text-xs text-navy-400 mt-3 flex items-center gap-1"><CalendarCheck className="w-3.5 h-3.5" /> Last published {fmtDate(s.schedule.publishedAt)}.</p>
      </Card>
    </div>
  );
}
