import { useMemo, useState } from 'react';
import { CheckCircle2, Download, FileSpreadsheet, Send, Upload } from 'lucide-react';
import {
  actions, attendanceSummary, className, fmtDate, GRADEBOOK_LABEL, roster, schoolDays, studentById, teacherTotal, useSchool,
} from '@/store/store';
import type { MarkRow } from '@/store/types';
import { downloadBlob, downloadCsv } from '@/store/files';
import { Card, Dialog, Header, Meter, Notice, Pill, Stat, Table, Tabs } from '@/components/kit';
import { SectionTimetable } from './academic';
import { gradebookTone } from './common';
import { useMe, type PageProps } from './shared';

function useMyAssignments() {
  const me = useMe();
  const s = useSchool();
  const mine = s.assignments.filter((a) => a.teacherId === me.id);
  const sections = [...new Map(mine.map((a) => [`${a.grade}${a.section}`, { grade: a.grade, section: a.section }])).values()].sort((a, b) => a.grade - b.grade || a.section.localeCompare(b.section));
  return { me, s, mine, sections };
}

export function TeacherClasses() {
  const { me, s, mine, sections } = useMyAssignments();
  const [open, setOpen] = useState<string | null>(null);
  const sel = sections.find((x) => `${x.grade}${x.section}` === open);
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="My Classes" subtitle="Only the classes and sections assigned to you." />
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {sections.map(({ grade, section }) => {
          const r = roster(s, grade, section);
          const subs = mine.filter((a) => a.grade === grade && a.section === section).map((a) => a.subject);
          const sponsor = s.staff.find((x) => x.id === me.id)?.sponsorOf === `${grade}${section}`;
          return (
            <button key={`${grade}${section}`} type="button" onClick={() => setOpen(`${grade}${section}`)} className="card p-5 text-left hover:border-navy-300">
              <div className="flex justify-between items-start"><h3 className="font-semibold text-lg text-navy-900">Grade {grade}{section}</h3>{sponsor && <Pill tone="accent">Class sponsor</Pill>}</div>
              <p className="text-sm text-navy-600">{r.length} students · {s.timetable.find((t) => t.grade === grade && t.section === section)?.room}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">{subs.map((x) => <Pill key={x}>{x}</Pill>)}</div>
            </button>
          );
        })}
      </div>
      <Dialog open={!!sel} onClose={() => setOpen(null)} title={sel ? `Grade ${sel.grade}${sel.section}` : ''} wide>
        {sel && <Table head={['Student ID', 'Name', 'Gender', 'Attendance (20d)']}>{roster(s, sel.grade, sel.section).map((k) => <tr key={k.id}><td className="font-mono text-xs">{k.studentNo}</td><td>{k.name}</td><td>{k.gender}</td><td>{attendanceSummary([k.id], schoolDays(20)).rate}%</td></tr>)}</Table>}
      </Dialog>
    </div>
  );
}

export function TeacherSubjects() {
  const { s, mine } = useMyAssignments();
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="My Subjects" />
      <Card>
        <Table head={['Subject', 'Class', 'Students', 'Periods / week', 'Gradebook']}>
          {mine.map((a) => {
            const g = s.gradebooks.find((x) => x.grade === a.grade && x.section === a.section && x.subject === a.subject);
            return <tr key={`${a.grade}${a.section}${a.subject}`}><td className="font-medium">{a.subject}</td><td>{className(a.grade, a.section)}</td><td>{roster(s, a.grade, a.section).length}</td><td>{s.timetable.filter((t) => t.teacherId === a.teacherId && t.grade === a.grade && t.section === a.section && t.subject === a.subject).length}</td><td>{g && <Pill tone={gradebookTone(g.status)}>{GRADEBOOK_LABEL[g.status]}</Pill>}</td></tr>;
          })}
        </Table>
      </Card>
    </div>
  );
}

export function TeacherTimetable() {
  const { me, s, sections } = useMyAssignments();
  const subs = s.substitutions.filter((x) => x.substituteId === me.id || x.absentTeacherId === me.id);
  const exams = s.exams.filter((e) => sections.some((x) => x.grade === e.grade && x.section === e.section) && s.assignments.some((a) => a.teacherId === me.id && a.grade === e.grade && a.section === e.section && a.subject === e.subject) && e.date >= new Date().toISOString().slice(0, 10)).slice(0, 10);
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="My Timetable" subtitle="Your official weekly timetable, published by the Vice Principal. Changes require VP permission." />
      <Card title="Weekly timetable"><SectionTimetable teacherId={me.id} /></Card>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Timetable changes">
          {subs.length === 0 ? <p className="text-sm text-navy-500">No changes this week.</p> : (
            <Table head={['Date', 'Lesson', 'Change']}>
              {subs.map((x) => <tr key={x.id}><td>{fmtDate(x.date)}</td><td>{x.subject} {className(x.grade, x.section)} · P{x.period}</td><td>{x.substituteId === me.id ? 'You are the substitute' : `Covered by ${s.staff.find((t) => t.id === x.substituteId)?.name}`}</td></tr>)}
            </Table>
          )}
        </Card>
        <Card title="Upcoming examinations">
          <Table head={['Examination', 'Class', 'Date']}>{exams.map((e) => <tr key={e.id}><td>{e.name}</td><td>{className(e.grade, e.section)}</td><td>{fmtDate(e.date)}</td></tr>)}</Table>
        </Card>
      </div>
    </div>
  );
}

/** Grade and section chosen separately, limited to the classes this teacher is assigned to. */
function useGradeSection(sections: { grade: number; section: string }[]) {
  const grades = [...new Set(sections.map((x) => x.grade))].sort((a, b) => a - b);
  const [grade, setGrade] = useState<number>(grades[0] ?? 0);
  const sectionsFor = (g: number) => sections.filter((x) => x.grade === g).map((x) => x.section).sort();
  const [section, setSection] = useState<string>(sectionsFor(grades[0] ?? 0)[0] ?? '');
  const pickGrade = (g: number) => { setGrade(g); setSection(sectionsFor(g)[0] ?? ''); };
  const picker = (
    <div className="grid grid-cols-2 gap-3 sm:w-80">
      <label className="block"><span className="label">Grade</span>
        <select className="input" value={grade} onChange={(e) => pickGrade(Number(e.target.value))}>{grades.map((g) => <option key={g} value={g}>Grade {g}</option>)}</select>
      </label>
      <label className="block"><span className="label">Section</span>
        <select className="input" value={section} onChange={(e) => setSection(e.target.value)}>{sectionsFor(grade).map((x) => <option key={x} value={x}>Section {x}</option>)}</select>
      </label>
    </div>
  );
  return { grade, section, picker, ready: !!grade && !!section };
}

export function StudentLists() {
  const { s, sections } = useMyAssignments();
  const { grade, section, picker, ready } = useGradeSection(sections);
  const list = ready ? roster(s, grade, section) : [];
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Student Lists" subtitle="Choose a grade and section you teach." action={ready && <button type="button" className="btn-secondary text-sm" onClick={() => downloadCsv(`Grade${grade}${section}_class_list`, ['Student ID', 'Name', 'Gender'], list.map((k) => [k.studentNo, k.name, k.gender]))}><Download className="w-4 h-4" /> Download</button>} />
      <Card>{sections.length ? picker : <p className="text-sm text-navy-500">You have no classes assigned yet.</p>}</Card>
      {ready && (
        <Card title={`Grade ${grade} · Section ${section} — ${list.length} students`}>
          <Table head={['#', 'Student ID', 'Name', 'Gender', 'Attendance (20d)']}>
            {list.map((k, i) => <tr key={k.id}><td>{i + 1}</td><td className="font-mono text-xs">{k.studentNo}</td><td className="font-medium">{k.name}</td><td>{k.gender}</td><td>{attendanceSummary([k.id], schoolDays(20)).rate}%</td></tr>)}
          </Table>
        </Card>
      )}
    </div>
  );
}

/* --------------------------- Class attendance --------------------------- */

type Mark = 'present' | 'absent' | 'late' | 'excused';
const MARKS: { id: Mark; label: string; on: string }[] = [
  { id: 'present', label: 'Present', on: 'bg-success-600 text-white border-success-600' },
  { id: 'absent', label: 'Absent', on: 'bg-error-600 text-white border-error-600' },
  { id: 'late', label: 'Late', on: 'bg-warning-500 text-white border-warning-500' },
  { id: 'excused', label: 'Excused', on: 'bg-navy-700 text-white border-navy-700' },
];

export function TeacherAttendance() {
  const { me, s, sections } = useMyAssignments();
  const { grade, section, picker, ready } = useGradeSection(sections);
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const list = ready ? roster(s, grade, section) : [];
  const saved = s.classRegisters?.find((r) => r.date === date && r.grade === grade && r.section === section);
  const [edits, setEdits] = useState<Record<string, Mark>>({});
  const [done, setDone] = useState('');
  const key = `${grade}${section}${date}`;
  const [lastKey, setLastKey] = useState(key);
  if (key !== lastKey) { setLastKey(key); setEdits({}); setDone(''); }
  const markOf = (id: string): Mark => edits[id] ?? saved?.marks[id] ?? 'present';
  const all = (m: Mark) => setEdits(Object.fromEntries(list.map((k) => [k.id, m])));
  const counts = MARKS.map((m) => ({ ...m, n: list.filter((k) => markOf(k.id) === m.id).length }));
  const save = () => {
    actions.saveClassRegister({ date, grade, section, marks: Object.fromEntries(list.map((k) => [k.id, markOf(k.id)])), recordedBy: me.id }, me.name);
    setEdits({});
    setDone(`Attendance for Grade ${grade} Section ${section} saved. The Vice Principal can see it, and parents of absent students were notified.`);
  };
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Attendance" subtitle="Take the class register for a grade and section you teach." action={ready && list.length > 0 && <button type="button" className="btn-primary" onClick={save}><CheckCircle2 className="w-4 h-4" /> {saved ? 'Update register' : 'Save register'}</button>} />
      <Card>
        <div className="flex flex-wrap items-end gap-4">
          {sections.length ? picker : <p className="text-sm text-navy-500">You have no classes assigned yet.</p>}
          <label className="block"><span className="label">Date</span><input type="date" className="input" max={today} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} /></label>
        </div>
      </Card>
      {done && <Notice tone="success">{done}</Notice>}
      {ready && (
        <Card title={`Grade ${grade} · Section ${section} — ${fmtDate(date)}`} subtitle={saved ? `Saved ${new Date(saved.recordedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} by ${s.staff.find((x) => x.id === saved.recordedBy)?.name ?? 'a teacher'}` : 'Not yet taken — everyone starts as present.'}
          action={<div className="flex gap-2"><button type="button" className="btn-secondary text-xs" onClick={() => all('present')}>All present</button><button type="button" className="btn-secondary text-xs" onClick={() => all('absent')}>All absent</button></div>}>
          <div className="flex flex-wrap gap-2 mb-4">{counts.map((c) => <Pill key={c.id} tone={c.id === 'present' ? 'success' : c.id === 'absent' ? 'error' : c.id === 'late' ? 'warning' : 'navy'}>{c.label}: {c.n}</Pill>)}</div>
          <div className="space-y-2">
            {list.map((k, i) => (
              <div key={k.id} className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-navy-100">
                <span className="w-6 text-xs text-navy-400">{i + 1}</span>
                <div className="flex-1 min-w-[160px]"><p className="text-sm font-medium text-navy-800">{k.name}</p><p className="text-xs font-mono text-navy-500">{k.studentNo}</p></div>
                <div className="flex gap-1" role="radiogroup" aria-label={`Attendance for ${k.name}`}>
                  {MARKS.map((m) => <button key={m.id} type="button" role="radio" aria-checked={markOf(k.id) === m.id} onClick={() => { setEdits((p) => ({ ...p, [k.id]: m.id })); setDone(''); }} className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${markOf(k.id) === m.id ? m.on : 'border-navy-200 text-navy-600 hover:bg-navy-50'}`}>{m.label}</button>)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* --------------------------- Gradebook submission --------------------------- */

type Parsed = { marks: Record<string, MarkRow>; matched: number; unmatched: string[] } | null;

async function parseWorkbook(file: File, ids: Map<string, string>): Promise<Parsed> {
  if (!/\.xlsx$/i.test(file.name)) return null;
  try {
    const { readSheet } = await import('read-excel-file/browser');
    const rows = (await readSheet(file)) as unknown[][];
    const hi = rows.findIndex((r) => r.some((c) => String(c ?? '').toLowerCase().includes('student id')));
    if (hi < 0) return null;
    const head = rows[hi].map((c) => String(c ?? '').toLowerCase());
    const col = (k: string) => head.findIndex((h) => h.includes(k));
    const c = { id: col('student id'), cw: col('classwork'), qz: col('quiz'), mid: col('midterm'), fin: col('final'), tot: col('total') };
    const num = (v: unknown) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v));
    const marks: Record<string, MarkRow> = {};
    const unmatched: string[] = [];
    for (const r of rows.slice(hi + 1)) {
      const no = String(r[c.id] ?? '').trim();
      if (!no) continue;
      const sid = ids.get(no);
      if (!sid) { unmatched.push(no); continue; }
      const row = { classwork: num(r[c.cw]), quizzes: num(r[c.qz]), midterm: num(r[c.mid]), final: num(r[c.fin]) };
      marks[sid] = { ...row, total: c.tot >= 0 ? num(r[c.tot]) ?? teacherTotal(row) : teacherTotal(row) };
    }
    return { marks, matched: Object.keys(marks).length, unmatched };
  } catch {
    return null;
  }
}

export function GradebookSubmission() {
  const { me, s, mine, sections } = useMyAssignments();
  const grades = [...new Set(sections.map((x) => x.grade))];
  const [grade, setGrade] = useState<number | ''>(grades[0] ?? '');
  const secs = sections.filter((x) => x.grade === grade).map((x) => x.section);
  const [section, setSection] = useState(secs[0] ?? '');
  const subs = mine.filter((a) => a.grade === grade && a.section === section).map((a) => a.subject);
  const [subject, setSubject] = useState(subs[0] ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<Parsed>(null);
  const [done, setDone] = useState('');
  const current = s.gradebooks.find((g) => g.grade === grade && g.section === section && g.subject === subject);
  const ids = useMemo(() => new Map(s.students.map((x) => [x.studentNo, x.id])), [s.students]);
  const locked = current && (current.status === 'submitted' || current.status === 'approved');
  const pick = async (f: File | null) => { setFile(f); setDone(''); setParsed(f ? await parseWorkbook(f, ids) : null); };
  const template = async () => {
    if (grade === '' || !section || !subject) return;
    const { default: writeXlsxFile } = await import('write-excel-file/browser');
    const h = (value: string) => ({ value, fontWeight: 'bold' as const, backgroundColor: '#DAE4F4' });
    const rows = [[{ value: `${s.school.name} — Gradebook template` }], [{ value: `Grade ${grade}${section} · ${subject} · ${s.school.academicYear}` }], [], [h('Student ID'), h('Student name'), h('Classwork'), h('Quizzes'), h('Midterm'), h('Final exam'), h('Subject total')], ...roster(s, grade, section).map((k) => [{ value: k.studentNo }, { value: k.name }])];
    downloadBlob(await writeXlsxFile(rows as never, { columns: [{ width: 16 }, { width: 28 }, { width: 11 }, { width: 11 }, { width: 11 }, { width: 11 }, { width: 13 }] } as never).toBlob(), `Template_${grade}${section}_${subject.replace(/\s/g, '')}.xlsx`);
  };
  const submit = () => {
    if (!file || grade === '' || !section || !subject) return;
    actions.submitGradebook({ grade, section, subject, teacherId: me.id, teacherName: me.name, file, marks: parsed?.marks });
    setDone(`Grade ${grade}${section} ${subject} gradebook submitted. The Principal has been notified.`);
    setFile(null); setParsed(null);
  };
  const myBooks = s.gradebooks.filter((g) => g.teacherId === me.id);
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Gradebook" subtitle="Select the class, section and subject, then upload your prepared Excel gradebook. It goes directly to the Principal for approval." />
      <Card title="Submit a gradebook">
        <div className="grid md:grid-cols-3 gap-4">
          <label><span className="label">Class</span><select className="input" value={grade} onChange={(e) => { const g = Number(e.target.value); setGrade(g); const sec = sections.filter((x) => x.grade === g).map((x) => x.section)[0] ?? ''; setSection(sec); setSubject(mine.find((a) => a.grade === g && a.section === sec)?.subject ?? ''); }}>{grades.map((g) => <option key={g} value={g}>Grade {g}</option>)}</select></label>
          <label><span className="label">Class Section</span><select className="input" value={section} onChange={(e) => { setSection(e.target.value); setSubject(mine.find((a) => a.grade === grade && a.section === e.target.value)?.subject ?? ''); }}>{secs.map((x) => <option key={x} value={x}>Section {x}</option>)}</select></label>
          <label><span className="label">Subject</span><select className="input" value={subject} onChange={(e) => setSubject(e.target.value)}>{subs.map((x) => <option key={x} value={x}>{x}</option>)}</select></label>
        </div>
        {current && <p className="text-sm mt-3">Current status: <Pill tone={gradebookTone(current.status)}>{GRADEBOOK_LABEL[current.status]}</Pill>{current.returnReason && current.status === 'returned' && <span className="block mt-2"><Notice tone="error">Principal's note: {current.returnReason}</Notice></span>}</p>}
        {locked ? (
          <div className="mt-4"><Notice tone={current?.status === 'approved' ? 'success' : 'navy'}>{current?.status === 'approved' ? 'This gradebook has been approved. Contact the Academic Officer if a correction is needed.' : 'Already submitted and awaiting the Principal. You can resubmit only if it is returned.'}</Notice></div>
        ) : (
          <>
            <div className="mt-5">
              <span className="label">Gradebook file</span>
              <label className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-navy-200 rounded-xl hover:bg-navy-50 cursor-pointer">
                <Upload className="w-7 h-7 text-navy-500" />
                <span className="text-sm font-medium text-navy-700">Choose Excel gradebook</span>
                <span className="text-xs text-navy-400">.xlsx, .xls or .csv from your computer</span>
                <input type="file" className="sr-only" accept=".xlsx,.xls,.csv" onChange={(e) => pick(e.target.files?.[0] ?? null)} />
              </label>
              <button type="button" className="text-sm text-navy-600 hover:underline mt-2" onClick={template}>Download a blank template for this class</button>
            </div>
            {file && (
              <div className="mt-3 p-3 rounded-lg bg-navy-50 flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-success-700" />
                <div className="flex-1"><p className="text-sm font-medium text-navy-800">{file.name}</p><p className="text-xs text-navy-500">{Math.round(file.size / 1024)} KB · {parsed ? `${parsed.matched} students matched by Student ID${parsed.unmatched.length ? `, ${parsed.unmatched.length} unknown ID(s)` : ''}` : 'Marks will be read by the Academic Officer from the original file'}</p></div>
                <button type="button" className="text-navy-400 hover:text-error-600 text-sm" onClick={() => pick(null)}>Remove</button>
              </div>
            )}
            <div className="flex justify-end mt-5"><button type="button" onClick={submit} disabled={!file || !subject} className="btn-primary"><Send className="w-4 h-4" /> Submit to Principal</button></div>
          </>
        )}
        {done && <div className="mt-4"><Notice tone="success"><CheckCircle2 className="inline w-4 h-4 mr-1" /> {done}</Notice></div>}
      </Card>
      <Card title="My gradebooks">
        <Table head={['Class', 'Subject', 'File', 'Submitted', 'Status']}>
          {myBooks.map((g) => <tr key={g.id}><td>{className(g.grade, g.section)}</td><td>{g.subject}</td><td className="text-xs">{g.fileName || '—'}</td><td className="text-xs">{fmtDate(g.submittedAt)}</td><td><Pill tone={gradebookTone(g.status)}>{GRADEBOOK_LABEL[g.status]}</Pill></td></tr>)}
        </Table>
      </Card>
    </div>
  );
}

/* --------------------------- Reports --------------------------- */

export function AcademicProgress() {
  const { s, mine } = useMyAssignments();
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Academic Progress" subtitle="Class averages, highest and lowest scores, completion and students needing support — for your classes only." />
      <div className="grid md:grid-cols-2 gap-4">
        {mine.map((a) => {
          const g = s.gradebooks.find((x) => x.grade === a.grade && x.section === a.section && x.subject === a.subject);
          const totals = g ? Object.entries(g.marks).filter(([sid]) => studentById(s, sid)?.status === 'active').map(([, m]) => m.total) : [];
          const vals = totals.filter((x): x is number => x != null);
          const avg = vals.length ? Math.round(vals.reduce((p, q) => p + q, 0) / vals.length) : 0;
          const support = g ? Object.entries(g.marks).filter(([, m]) => (m.total ?? 0) < s.grading.passMark).length : 0;
          return (
            <Card key={`${a.grade}${a.section}${a.subject}`} title={`${a.subject} · Grade ${a.grade}${a.section}`}>
              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                <div><p className="text-xl font-bold">{avg}%</p><p className="text-xs text-navy-500">Average</p></div>
                <div><p className="text-xl font-bold">{vals.length ? Math.max(...vals) : '—'}</p><p className="text-xs text-navy-500">Highest</p></div>
                <div><p className="text-xl font-bold">{vals.length ? Math.min(...vals) : '—'}</p><p className="text-xs text-navy-500">Lowest</p></div>
                <div><p className="text-xl font-bold text-error-600">{support}</p><p className="text-xs text-navy-500">Need support</p></div>
              </div>
              <div className="mt-3"><p className="text-xs text-navy-500 mb-1">Assessment completion {totals.length ? Math.round((vals.length / totals.length) * 100) : 0}% ({totals.length - vals.length} missing)</p><Meter value={totals.length ? (vals.length / totals.length) * 100 : 0} /></div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function StudentPerformance() {
  const { s, mine, sections } = useMyAssignments();
  const { grade, section, picker } = useGradeSection(sections);
  const subjects = mine.filter((a) => a.grade === grade && a.section === section).map((a) => a.subject);
  const [subj, setSubj] = useState('');
  const subject = subjects.includes(subj) ? subj : subjects[0] ?? '';
  const g = s.gradebooks.find((x) => x.grade === grade && x.section === section && x.subject === subject);
  const rows = g ? Object.entries(g.marks).map(([sid, m]) => ({ st: studentById(s, sid), m })).filter((r) => r.st?.status === 'active') : [];
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Student Performance" />
      <Card>
        <div className="flex flex-wrap items-end gap-4">
          {picker}
          <label className="block"><span className="label">Subject</span><select className="input" value={subject} onChange={(e) => setSubj(e.target.value)}>{subjects.map((x) => <option key={x}>{x}</option>)}</select></label>
        </div>
      </Card>
      <Card>
        <Table head={['Student', 'Classwork', 'Quizzes', 'Midterm', 'Final', 'Total', '']}>
          {rows.sort((a, b) => (a.m.total ?? 0) - (b.m.total ?? 0)).map(({ st, m }) => <tr key={st!.id}><td className="font-medium">{st!.name}</td><td>{m.classwork ?? '—'}</td><td>{m.quizzes ?? '—'}</td><td>{m.midterm ?? '—'}</td><td>{m.final ?? <span className="text-error-600">Missing</span>}</td><td className="font-semibold">{m.total ?? '—'}</td><td>{(m.total ?? 0) < s.grading.passMark && <Pill tone="error">Needs support</Pill>}</td></tr>)}
        </Table>
      </Card>
    </div>
  );
}

/* --------------------------- Communication --------------------------- */

export function TeacherCommunication({ onNavigate }: PageProps) {
  const { me, s, sections } = useMyAssignments();
  const [tab, setTab] = useState<'parents' | 'incident' | 'announce'>('parents');
  const threads = s.threads.filter((t) => t.staffId === me.id);
  const [active, setActive] = useState<string | null>(threads[0]?.id ?? null);
  const [reply, setReply] = useState('');
  const myStudents = sections.flatMap((x) => roster(s, x.grade, x.section));
  const [inc, setInc] = useState({ studentId: '', category: 'Disruptive behaviour', severity: 'minor' as 'minor' | 'moderate' | 'serious', location: '', description: '' });
  const [ann, setAnn] = useState({ key: sections[0] ? `${sections[0].grade}${sections[0].section}` : '', title: '', message: '' });
  const [flash, setFlash] = useState('');
  const thread = threads.find((t) => t.id === active);
  const myIncidents = s.incidents.filter((i) => i.reportedBy === me.id);
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Communication" subtitle="Parent messages (as permitted by the school), incident reports to the Dean and class announcements." />
      <Tabs tabs={[{ id: 'parents', label: 'Parent messages', count: threads.length }, { id: 'incident', label: 'Report an incident' }, { id: 'announce', label: 'Class announcement' }]} value={tab} onChange={(t) => { setTab(t); setFlash(''); }} />
      {flash && <Notice tone="success">{flash}</Notice>}
      {tab === 'parents' && (
        !s.school.parentTeacherMessaging ? <Notice tone="warning">Parent–teacher messaging is turned off by the school.</Notice> : (
          <div className="grid lg:grid-cols-[280px_1fr] gap-4">
            <Card>{threads.length === 0 ? <p className="text-sm text-navy-500">No conversations yet.</p> : threads.map((t) => <button key={t.id} type="button" onClick={() => setActive(t.id)} className={`w-full text-left p-2 rounded-lg ${active === t.id ? 'bg-navy-50' : ''}`}><p className="text-sm font-medium">{t.subject}</p><p className="text-xs text-navy-500">{studentById(s, t.studentId)?.guardianName} · {studentById(s, t.studentId)?.name}</p></button>)}</Card>
            <Card title={thread?.subject}>
              {thread && <>
                <div className="space-y-3 max-h-80 overflow-y-auto">{thread.messages.map((m, i) => <div key={i} className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${m.from === 'staff' ? 'ml-auto bg-navy-700 text-white' : 'bg-navy-50'}`}>{m.text}<p className="text-[10px] opacity-70 mt-1">{fmtDate(m.at)}</p></div>)}</div>
                <div className="flex gap-2 mt-4"><input className="input" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply to the parent…" /><button type="button" className="btn-primary" disabled={!reply.trim()} onClick={() => { actions.sendMessage(thread.id, { parentUserId: thread.parentUserId, staffId: me.id, staffName: me.name, studentId: thread.studentId, subject: thread.subject, from: 'staff', text: reply.trim() }); setReply(''); }}>Send</button></div>
              </>}
            </Card>
          </div>
        )
      )}
      {tab === 'incident' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card title="Incident report to the Dean of Students" subtitle="State the facts. You can follow its status but not the Dean's confidential notes.">
            <div className="space-y-3">
              <label className="block"><span className="label">Student (your classes only)</span><select className="input" value={inc.studentId} onChange={(e) => setInc({ ...inc, studentId: e.target.value })}><option value="">Select student</option>{myStudents.map((k) => <option key={k.id} value={k.id}>{k.name} — {className(k.grade, k.section)}</option>)}</select></label>
              <div className="grid grid-cols-2 gap-3">
                <label><span className="label">Category</span><select className="input" value={inc.category} onChange={(e) => setInc({ ...inc, category: e.target.value })}>{['Disruptive behaviour', 'Fighting', 'Bullying', 'Truancy', 'Academic dishonesty', 'Disrespect to staff', 'Uniform violation', 'Damage to property', 'Other'].map((c) => <option key={c}>{c}</option>)}</select></label>
                <label><span className="label">Severity</span><select className="input" value={inc.severity} onChange={(e) => setInc({ ...inc, severity: e.target.value as typeof inc.severity })}><option value="minor">Minor</option><option value="moderate">Moderate</option><option value="serious">Serious</option></select></label>
              </div>
              <label className="block"><span className="label">Location</span><input className="input" value={inc.location} onChange={(e) => setInc({ ...inc, location: e.target.value })} placeholder="e.g. Room 1001" /></label>
              <label className="block"><span className="label">What happened</span><textarea className="input min-h-[110px]" value={inc.description} onChange={(e) => setInc({ ...inc, description: e.target.value })} /></label>
              <button type="button" className="btn-primary w-full" disabled={!inc.studentId || inc.description.trim().length < 10} onClick={() => { actions.reportIncident({ ...inc, reportedBy: me.id, reportedByName: me.name }); setFlash('Incident report sent. The Dean of Students has been notified.'); setInc({ ...inc, studentId: '', location: '', description: '' }); }}>Submit to Dean</button>
            </div>
          </Card>
          <Card title="My reports">
            <Table head={['Student', 'Category', 'Date', 'Status']}>
              {myIncidents.map((i) => <tr key={i.id}><td>{studentById(s, i.studentId)?.name}</td><td>{i.category}</td><td className="text-xs">{fmtDate(i.reportedAt)}</td><td><Pill>{i.status.replace('_', ' ')}</Pill></td></tr>)}
            </Table>
          </Card>
        </div>
      )}
      {tab === 'announce' && (
        <Card title="Announcement to one of your classes" subtitle="Visible to students in the selected class and their guardians.">
          <div className="space-y-3 max-w-2xl">
            <label className="block"><span className="label">Class</span><select className="input" value={ann.key} onChange={(e) => setAnn({ ...ann, key: e.target.value })}>{sections.map((x) => <option key={`${x.grade}${x.section}`} value={`${x.grade}${x.section}`}>Grade {x.grade}{x.section}</option>)}</select></label>
            <label className="block"><span className="label">Title</span><input className="input" value={ann.title} onChange={(e) => setAnn({ ...ann, title: e.target.value })} /></label>
            <label className="block"><span className="label">Message</span><textarea className="input min-h-[100px]" value={ann.message} onChange={(e) => setAnn({ ...ann, message: e.target.value })} /></label>
            <div className="flex justify-between"><button type="button" className="btn-ghost text-sm" onClick={() => onNavigate('notifications')}>My notifications</button><button type="button" className="btn-primary" disabled={!ann.title || !ann.message} onClick={() => { const sel = sections.find((x) => `${x.grade}${x.section}` === ann.key)!; actions.postAnnouncement({ title: ann.title, message: ann.message, audience: ['students', 'parents'], fromName: me.name, fromRole: 'teacher', grade: sel.grade, section: sel.section }); setFlash(`Announcement published to Grade ${ann.key}.`); setAnn({ ...ann, title: '', message: '' }); }}>Publish</button></div>
          </div>
        </Card>
      )}
    </div>
  );
}

export function TeacherStats() {
  const { s, mine, sections } = useMyAssignments();
  return <div className="grid grid-cols-3 gap-4"><Stat label="Classes" value={sections.length} /><Stat label="Subjects" value={mine.length} /><Stat label="Students" value={sections.reduce((a, x) => a + roster(s, x.grade, x.section).length, 0)} /></div>;
}
