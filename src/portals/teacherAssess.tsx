import { useMemo, useState } from 'react';
import { CheckCircle2, Copy, Download, FilePlus2, Plus, Send, Trash2, XCircle } from 'lucide-react';
import {
  actions, className, isAutoMarked, needsManualMarking, roster, studentById, useSchool,
} from '@/store/store';
import type { Question, QuestionType, Submission, Task } from '@/store/types';
import { downloadCsv } from '@/store/files';
import { Card, Dialog, Field, Header, Notice, Pill, Stat, Table, Tabs } from '@/components/kit';
import { useMe, type PageProps } from './shared';

const QTYPES: { id: QuestionType; label: string }[] = [
  { id: 'mcq', label: 'Multiple choice' }, { id: 'true_false', label: 'True / false' }, { id: 'short', label: 'Short answer' },
  { id: 'essay', label: 'Essay (marked by teacher)' }, { id: 'file', label: 'File upload (marked by teacher)' },
];
const toLocal = (iso: string) => { const d = new Date(iso); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
const fromLocal = (v: string) => new Date(v).toISOString();
const fmtDT = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
let qn = 0;
const qid = () => `q-${Date.now().toString(36)}-${qn++}`;

function useMine() {
  const me = useMe();
  const s = useSchool();
  const mine = s.assignments.filter((a) => a.teacherId === me.id);
  const sections = [...new Map(mine.map((a) => [`${a.grade}${a.section}`, { grade: a.grade, section: a.section }])).values()];
  return { me, s, mine, sections };
}

const statusPill = (t: Task) => <Pill tone={t.status === 'published' ? (new Date().toISOString() > t.closesAt ? 'warning' : 'success') : t.status === 'draft' ? 'muted' : 'navy'}>{t.status === 'published' ? (new Date().toISOString() > t.closesAt ? 'Past deadline' : 'Published') : t.status === 'draft' ? 'Draft' : 'Closed'}</Pill>;

/* ------------------------------ Editor ------------------------------ */

function blankTask(kind: Task['kind'], teacherId: string, first?: { grade: number; section: string; subject: string }): Task {
  const open = new Date(); open.setMinutes(0, 0, 0);
  const close = new Date(open); close.setDate(close.getDate() + (kind === 'quiz' ? 2 : 7)); close.setHours(23, 0, 0, 0);
  return {
    id: '', kind, title: '', subject: first?.subject ?? '', grade: first?.grade ?? 0, section: first?.section ?? '', teacherId, instructions: '', maxMarks: kind === 'quiz' ? 0 : 20,
    status: 'draft', createdAt: '', opensAt: open.toISOString(), closesAt: close.toISOString(), durationMin: kind === 'quiz' ? 30 : undefined, shuffle: false,
    submissionType: 'text_file', latePolicy: kind === 'quiz' ? 'not_accepted' : 'accepted_marked_late', questions: [], resultsReleased: false,
  };
}

function TaskEditor({ task, onClose }: { task: Task; onClose: () => void }) {
  const { me, s, mine } = useMine();
  const [t, setT] = useState<Task>(task);
  const [bank, setBank] = useState('');
  const set = (patch: Partial<Task>) => setT({ ...t, ...patch });
  const subjects = mine.filter((a) => a.grade === t.grade && a.section === t.section).map((a) => a.subject);
  const quizTotal = t.questions.reduce((a, q) => a + (Number(q.points) || 0), 0);
  const setQ = (i: number, patch: Partial<Question>) => set({ questions: t.questions.map((q, j) => (j === i ? { ...q, ...patch } : q)) });
  const addQ = (type: QuestionType) => set({ questions: [...t.questions, { id: qid(), type, text: '', points: type === 'essay' ? 5 : 1, options: type === 'mcq' ? ['', '', '', ''] : undefined, correct: type === 'true_false' ? 'true' : type === 'mcq' ? '0' : undefined }] });
  const bankQs = s.tasks.filter((x) => x.teacherId === me.id && x.id !== t.id).flatMap((x) => x.questions.map((q) => ({ q, from: x.title })));
  const problems: string[] = [];
  if (!t.title.trim()) problems.push('Add a title.');
  if (!t.grade || !t.section || !t.subject) problems.push('Choose class, section and subject.');
  if (t.closesAt <= t.opensAt) problems.push('Closing time must be after opening time.');
  if (t.kind === 'quiz') {
    if (!t.questions.length) problems.push('Add at least one question.');
    t.questions.forEach((q, i) => {
      if (!q.text.trim()) problems.push(`Question ${i + 1} has no text.`);
      if (q.type === 'mcq' && (q.options ?? []).filter((o) => o.trim()).length < 2) problems.push(`Question ${i + 1} needs at least two options.`);
      if (q.type === 'mcq' && !(q.options ?? [])[Number(q.correct)]?.trim()) problems.push(`Question ${i + 1}: mark the correct option.`);
    });
  }
  const save = (publish: boolean) => {
    const data = { ...t, maxMarks: t.kind === 'quiz' ? quizTotal : t.maxMarks, status: 'draft' as const };
    const { createdAt: _c, resultsReleased: _r, ...rest } = data;
    void _c; void _r;
    const id = actions.saveTask({ ...rest, id: t.id || undefined });
    if (publish) actions.publishTask(id, me.name);
    onClose();
  };
  return (
    <Dialog open onClose={onClose} wide="xl" title={`${t.id ? 'Edit' : 'Create'} ${t.kind === 'quiz' ? 'online assessment' : 'assignment'}`} footer={<>
      {problems.length > 0 && <span className="text-xs text-error-600 mr-auto max-w-md">{problems[0]}</span>}
      <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
      <button type="button" className="btn-secondary" disabled={!t.title.trim()} onClick={() => save(false)}>Save draft</button>
      <button type="button" className="btn-primary" disabled={problems.length > 0} onClick={() => save(true)}><Send className="w-4 h-4" /> Publish to class</button>
    </>}>
      <div className="space-y-4">
        <div className="grid md:grid-cols-4 gap-3">
          <div className="md:col-span-2"><Field label="Title"><input className="input" value={t.title} onChange={(e) => set({ title: e.target.value })} placeholder={t.kind === 'quiz' ? 'e.g. Algebra Quiz 3' : 'e.g. Mathematics – Algebra Exercises'} /></Field></div>
          <Field label="Class and section"><select className="input" value={`${t.grade}|${t.section}`} onChange={(e) => { const [g, sec] = e.target.value.split('|'); const sub = mine.find((a) => a.grade === Number(g) && a.section === sec)?.subject ?? ''; set({ grade: Number(g), section: sec, subject: sub }); }}><option value="0|">Select</option>{[...new Set(mine.map((a) => `${a.grade}|${a.section}`))].map((k) => <option key={k} value={k}>Grade {k.replace('|', '')}</option>)}</select></Field>
          <Field label="Subject"><select className="input" value={t.subject} onChange={(e) => set({ subject: e.target.value })}>{subjects.map((x) => <option key={x}>{x}</option>)}</select></Field>
        </div>
        <Field label="Instructions"><textarea className="input min-h-[80px]" value={t.instructions} onChange={(e) => set({ instructions: e.target.value })} placeholder="What should students do?" /></Field>
        <div className="grid md:grid-cols-4 gap-3">
          <Field label={t.kind === 'quiz' ? 'Opens' : 'Available from'}><input type="datetime-local" className="input" value={toLocal(t.opensAt)} onChange={(e) => e.target.value && set({ opensAt: fromLocal(e.target.value) })} /></Field>
          <Field label={t.kind === 'quiz' ? 'Closes' : 'Submission deadline'}><input type="datetime-local" className="input" value={toLocal(t.closesAt)} onChange={(e) => e.target.value && set({ closesAt: fromLocal(e.target.value) })} /></Field>
          {t.kind === 'quiz' ? <>
            <Field label="Time limit (minutes)"><input type="number" min="0" className="input" value={t.durationMin ?? 0} onChange={(e) => set({ durationMin: Number(e.target.value) || undefined })} /></Field>
            <Field label="Total marks"><input className="input bg-navy-50" readOnly value={quizTotal} /></Field>
          </> : <>
            <Field label="Maximum marks"><input type="number" min="1" className="input" value={t.maxMarks} onChange={(e) => set({ maxMarks: Number(e.target.value) })} /></Field>
            <Field label="Submission type"><select className="input" value={t.submissionType} onChange={(e) => set({ submissionType: e.target.value as Task['submissionType'] })}><option value="text_file">Typed answer and/or files</option><option value="file">File upload (PDF, Word, photos)</option><option value="text">Typed answer only</option></select></Field>
          </>}
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={t.latePolicy === 'accepted_marked_late'} onChange={(e) => set({ latePolicy: e.target.checked ? 'accepted_marked_late' : 'not_accepted' })} /> Accept late submissions (marked late)</label>
          {t.kind === 'quiz' && <label className="flex items-center gap-2"><input type="checkbox" checked={!!t.shuffle} onChange={(e) => set({ shuffle: e.target.checked })} /> Shuffle question order for each student</label>}
        </div>
        {t.kind === 'quiz' && (
          <div className="space-y-3">
            <h3 className="font-semibold text-navy-900">Questions</h3>
            {t.questions.map((q, i) => (
              <div key={q.id} className="rounded-xl border border-navy-100 p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-navy-700">Q{i + 1}</span>
                  <select className="input py-1.5 text-sm w-56" value={q.type} onChange={(e) => { const type = e.target.value as QuestionType; setQ(i, { type, options: type === 'mcq' ? q.options ?? ['', '', '', ''] : undefined, correct: type === 'true_false' ? 'true' : type === 'mcq' ? '0' : type === 'short' ? q.correct : undefined }); }} aria-label="Question type">{QTYPES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select>
                  <label className="flex items-center gap-1 text-sm ml-auto">Marks <input type="number" min="0" className="input py-1.5 w-20" value={q.points} onChange={(e) => setQ(i, { points: Number(e.target.value) })} /></label>
                  <button type="button" aria-label="Remove question" className="p-1.5 rounded text-error-600 hover:bg-error-50" onClick={() => set({ questions: t.questions.filter((_, j) => j !== i) })}><Trash2 className="w-4 h-4" /></button>
                </div>
                <textarea className="input min-h-[60px]" placeholder="Question" value={q.text} onChange={(e) => setQ(i, { text: e.target.value })} aria-label={`Question ${i + 1}`} />
                {q.type === 'mcq' && (
                  <div className="space-y-2">
                    {(q.options ?? []).map((o, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <input type="radio" name={`c-${q.id}`} checked={q.correct === String(j)} onChange={() => setQ(i, { correct: String(j) })} aria-label={`Option ${j + 1} is correct`} />
                        <input className="input py-1.5 text-sm" placeholder={`Option ${String.fromCharCode(65 + j)}`} value={o} onChange={(e) => setQ(i, { options: (q.options ?? []).map((x, k) => (k === j ? e.target.value : x)) })} />
                        <button type="button" className="text-navy-400 hover:text-error-600" aria-label="Remove option" onClick={() => setQ(i, { options: (q.options ?? []).filter((_, k) => k !== j), correct: q.correct === String(j) ? '0' : q.correct })}><XCircle className="w-4 h-4" /></button>
                      </div>
                    ))}
                    <button type="button" className="text-sm text-navy-600" onClick={() => setQ(i, { options: [...(q.options ?? []), ''] })}>+ Add option</button>
                    <p className="text-xs text-navy-400">Select the circle next to the correct answer.</p>
                  </div>
                )}
                {q.type === 'true_false' && <Field label="Correct answer"><select className="input w-40" value={q.correct} onChange={(e) => setQ(i, { correct: e.target.value })}><option value="true">True</option><option value="false">False</option></select></Field>}
                {q.type === 'short' && <Field label="Accepted answers (separate with |) — leave empty to mark by hand"><input className="input" value={q.correct ?? ''} onChange={(e) => setQ(i, { correct: e.target.value })} placeholder="e.g. Monrovia|monrovia city" /></Field>}
                {(q.type === 'essay' || q.type === 'file') && <Field label="Marking rubric (for you)"><input className="input" value={q.rubric ?? ''} onChange={(e) => setQ(i, { rubric: e.target.value })} placeholder="e.g. 2 marks method, 1 mark answer" /></Field>}
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              {QTYPES.map((x) => <button key={x.id} type="button" className="btn-secondary text-xs py-1.5" onClick={() => addQ(x.id)}><Plus className="w-3.5 h-3.5" /> {x.label}</button>)}
              {bankQs.length > 0 && (
                <span className="flex gap-2 items-center">
                  <select className="input py-1.5 text-xs w-64" value={bank} onChange={(e) => setBank(e.target.value)} aria-label="Question bank"><option value="">Reuse from question bank…</option>{bankQs.map(({ q, from }) => <option key={q.id} value={q.id}>{q.text.slice(0, 50)} — {from}</option>)}</select>
                  <button type="button" className="btn-secondary text-xs py-1.5" disabled={!bank} onClick={() => { const found = bankQs.find((x) => x.q.id === bank); if (found) set({ questions: [...t.questions, { ...found.q, id: qid() }] }); setBank(''); }}><Copy className="w-3.5 h-3.5" /> Add</button>
                </span>
              )}
            </div>
            <p className="text-xs text-navy-500">Multiple choice, true/false and short answers with an answer key are marked automatically. Essay and file-upload questions are marked by you.</p>
          </div>
        )}
      </div>
    </Dialog>
  );
}

/* ------------------------------ Lists ------------------------------ */

function TaskList({ kind, onNavigate }: { kind: Task['kind'] } & PageProps) {
  const { me, s, mine } = useMine();
  const [editing, setEditing] = useState<Task | null>(null);
  const list = s.tasks.filter((t) => t.teacherId === me.id && t.kind === kind);
  const first = mine[0];
  const counts = (t: Task) => { const subs = s.submissions.filter((x) => x.taskId === t.id && x.status !== 'in_progress'); return { done: subs.length, of: roster(s, t.grade, t.section).length, toMark: subs.filter((x) => x.status === 'submitted').length }; };
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title={kind === 'quiz' ? 'Online Assessments' : 'Assignments'} subtitle={kind === 'quiz' ? 'Create timed online quizzes and tests. Students are notified and take them in their portal.' : 'Create assignments for your classes. Students submit typed answers, documents or photos of their work.'}
        action={<button type="button" className="btn-primary" onClick={() => setEditing(blankTask(kind, me.id, first))}><FilePlus2 className="w-4 h-4" /> {kind === 'quiz' ? 'Create online assessment' : 'Create assignment'}</button>} />
      <div className="grid sm:grid-cols-4 gap-4">
        <Stat label="Published" value={list.filter((t) => t.status === 'published').length} tone="success" />
        <Stat label="Drafts" value={list.filter((t) => t.status === 'draft').length} />
        <Stat label="Waiting to be marked" value={list.reduce((a, t) => a + counts(t).toMark, 0)} tone="warning" onClick={() => onNavigate('marking')} />
        <Stat label="Results released" value={list.filter((t) => t.resultsReleased).length} tone="accent" />
      </div>
      <Card>
        <Table head={['Title', 'Class', 'Subject', kind === 'quiz' ? 'Opens – closes' : 'Deadline', 'Marks', 'Submitted', 'Status', '']} empty={`No ${kind === 'quiz' ? 'online assessments' : 'assignments'} yet.`}>
          {list.map((t) => { const c = counts(t); return (
            <tr key={t.id}>
              <td className="font-medium">{t.title}{t.kind === 'quiz' && <p className="text-xs text-navy-500">{t.questions.length} questions{t.durationMin ? ` · ${t.durationMin} min` : ''}</p>}</td>
              <td>{className(t.grade, t.section)}</td><td>{t.subject}</td>
              <td className="text-xs">{t.kind === 'quiz' ? `${fmtDT(t.opensAt)} – ${fmtDT(t.closesAt)}` : fmtDT(t.closesAt)}</td>
              <td>{t.maxMarks}</td>
              <td>{t.status === 'draft' ? '—' : `${c.done} / ${c.of}`}{c.toMark > 0 && <p className="text-xs text-warning-700">{c.toMark} to mark</p>}</td>
              <td>{statusPill(t)}</td>
              <td className="whitespace-nowrap">
                {t.status === 'draft' && <><button type="button" className="text-xs text-navy-700 hover:underline mr-2" onClick={() => setEditing(t)}>Edit</button><button type="button" className="btn-primary text-xs py-1 mr-2" onClick={() => actions.publishTask(t.id, me.name)}>Publish</button><button type="button" className="text-xs text-error-600 hover:underline" onClick={() => actions.deleteTask(t.id)}>Delete</button></>}
                {t.status !== 'draft' && <button type="button" className="btn-secondary text-xs py-1 mr-2" onClick={() => onNavigate(`submissions:${t.id}`)}>Submissions</button>}
                {t.status === 'published' && <button type="button" className="text-xs text-navy-700 hover:underline" onClick={() => actions.closeTask(t.id)}>Close</button>}
              </td>
            </tr>
          ); })}
        </Table>
      </Card>
      {editing && <TaskEditor task={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

export const TeacherAssignmentsPage = (p: PageProps) => <TaskList kind="assignment" {...p} />;
export const OnlineAssessmentsPage = (p: PageProps) => <TaskList kind="quiz" {...p} />;

export function QuestionBank() {
  const { me, s } = useMine();
  const [type, setType] = useState('');
  const [subject, setSubject] = useState('');
  const rows = s.tasks.filter((t) => t.teacherId === me.id).flatMap((t) => t.questions.map((q) => ({ q, t }))).filter(({ q, t }) => (!type || q.type === type) && (!subject || t.subject === subject));
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Assessment Questions" subtitle="Your question bank — every question you've written. Reuse any of them when building a new online assessment." action={<>
        <select className="input py-2 text-sm" value={type} onChange={(e) => setType(e.target.value)} aria-label="Type"><option value="">All types</option>{QTYPES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select>
        <select className="input py-2 text-sm" value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Subject"><option value="">All subjects</option>{[...new Set(s.tasks.filter((t) => t.teacherId === me.id).map((t) => t.subject))].map((x) => <option key={x}>{x}</option>)}</select>
      </>} />
      <Card>
        <Table head={['Question', 'Type', 'Answer key', 'Marks', 'Used in']} empty="No questions yet. Create an online assessment to start your bank.">
          {rows.map(({ q, t }) => <tr key={`${t.id}-${q.id}`}><td className="text-sm max-w-md">{q.text}</td><td><Pill>{QTYPES.find((x) => x.id === q.type)?.label}</Pill></td><td className="text-xs">{q.type === 'mcq' ? q.options?.[Number(q.correct)] : q.type === 'true_false' ? q.correct : q.type === 'short' ? q.correct?.split('|')[0] || 'Marked by hand' : q.rubric || 'Marked by hand'}</td><td>{q.points}</td><td className="text-xs">{t.title} · {className(t.grade, t.section)}</td></tr>)}
        </Table>
      </Card>
    </div>
  );
}

/* ------------------------------ Submissions & marking ------------------------------ */

function GradeDialog({ sub, onClose }: { sub: Submission; onClose: () => void }) {
  const s = useSchool();
  const t = s.tasks.find((x) => x.id === sub.taskId)!;
  const st = studentById(s, sub.studentId);
  const [per, setPer] = useState<Record<string, number>>({ ...(sub.perQuestion ?? {}) });
  const [score, setScore] = useState<number>(sub.score ?? sub.autoScore ?? 0);
  const [feedback, setFeedback] = useState(sub.feedback ?? '');
  const quizScore = t.questions.reduce((a, q) => a + (per[q.id] ?? 0), 0);
  const final = t.kind === 'quiz' ? quizScore : score;
  return (
    <Dialog open onClose={onClose} wide="xl" title={`${st?.name} — ${t.title}`} footer={<>
      <span className="mr-auto text-sm font-semibold">Total: {final} / {t.maxMarks}</span>
      <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
      <button type="button" className="btn-primary" disabled={final > t.maxMarks || final < 0} onClick={() => { actions.gradeSubmission(sub.id, per, final, feedback); onClose(); }}><CheckCircle2 className="w-4 h-4" /> Save mark</button>
    </>}>
      <p className="text-sm text-navy-500 mb-4">{st?.studentNo} · {className(t.grade, t.section)} · submitted {sub.submittedAt ? fmtDT(sub.submittedAt) : '—'} {sub.late && <Pill tone="warning">Late</Pill>}</p>
      {t.kind === 'quiz' ? (
        <div className="space-y-3">
          {t.questions.map((q, i) => {
            const a = sub.answers[q.id] ?? '';
            const shown = q.type === 'mcq' ? q.options?.[Number(a)] ?? '—' : q.type === 'true_false' ? (a ? (a === 'true' ? 'True' : 'False') : '—') : a || '—';
            const auto = isAutoMarked(q);
            return (
              <div key={q.id} className="rounded-lg border border-navy-100 p-3">
                <div className="flex justify-between gap-3"><p className="text-sm font-medium text-navy-900">Q{i + 1}. {q.text}</p><span className="text-xs text-navy-500 whitespace-nowrap">{q.points} marks</span></div>
                <p className="text-sm mt-2 whitespace-pre-line"><span className="text-navy-500">Answer: </span>{shown}</p>
                {auto && <p className="text-xs mt-1">{(per[q.id] ?? 0) === q.points ? <span className="text-success-700">✔ Correct (auto-marked)</span> : <span className="text-error-600">✖ Incorrect — key: {q.type === 'mcq' ? q.options?.[Number(q.correct)] : q.type === 'true_false' ? q.correct : q.correct?.split('|')[0]}</span>}</p>}
                {q.rubric && <p className="text-xs text-navy-500 mt-1">Rubric: {q.rubric}</p>}
                <label className="flex items-center gap-2 text-sm mt-2">Marks <input type="number" min="0" max={q.points} className="input py-1 w-20" value={per[q.id] ?? 0} onChange={(e) => setPer({ ...per, [q.id]: Math.min(q.points, Math.max(0, Number(e.target.value))) })} /> / {q.points} {auto && <span className="text-xs text-navy-400">(you can override)</span>}</label>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {sub.text && <div><p className="label">Typed answer</p><div className="rounded-lg bg-navy-50 p-3 text-sm whitespace-pre-line">{sub.text}</div></div>}
          <div><p className="label">Files ({sub.files.length})</p>
            {sub.files.length === 0 ? <p className="text-sm text-navy-500">No files attached.</p> : (
              <div className="grid sm:grid-cols-3 gap-3">
                {sub.files.map((f, i) => (
                  <div key={i} className="rounded-lg border border-navy-100 p-2 text-sm">
                    {f.dataUrl && f.type.startsWith('image/') ? <img src={f.dataUrl} alt={f.name} className="w-full h-40 object-contain bg-navy-50 rounded" /> : <div className="h-40 rounded bg-navy-50 flex items-center justify-center text-navy-400 text-xs">{f.type.includes('pdf') ? 'PDF document' : f.type.startsWith('image/') ? 'Image' : 'Document'}</div>}
                    <p className="truncate mt-1">{f.name}</p>
                    {f.dataUrl ? <a className="text-xs text-navy-700 underline" href={f.dataUrl} download={f.name}><Download className="inline w-3 h-3" /> Download</a> : <p className="text-[11px] text-navy-400">Preview not stored in demo data</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm">Mark <input type="number" min="0" max={t.maxMarks} className="input py-1.5 w-24" value={score} onChange={(e) => setScore(Number(e.target.value))} /> / {t.maxMarks}</label>
        </div>
      )}
      <div className="mt-4"><Field label="Feedback to the student"><textarea className="input min-h-[70px]" value={feedback} onChange={(e) => setFeedback(e.target.value)} /></Field></div>
    </Dialog>
  );
}

export function SubmissionsPage({ param }: PageProps) {
  const { me, s } = useMine();
  const mineTasks = s.tasks.filter((t) => t.teacherId === me.id && t.status !== 'draft');
  const [taskId, setTaskId] = useState(param && mineTasks.some((t) => t.id === param) ? param : mineTasks[0]?.id ?? '');
  const [grading, setGrading] = useState<Submission | null>(null);
  const t = mineTasks.find((x) => x.id === taskId);
  const kids = t ? roster(s, t.grade, t.section) : [];
  const subs = s.submissions.filter((x) => x.taskId === taskId);
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Submissions" subtitle="Who has submitted, who hasn't, and what still needs marking." action={<select className="input py-2 text-sm min-w-[280px]" value={taskId} onChange={(e) => setTaskId(e.target.value)} aria-label="Assignment or assessment">{mineTasks.map((x) => <option key={x.id} value={x.id}>{x.kind === 'quiz' ? 'Quiz' : 'Assignment'}: {x.title} ({className(x.grade, x.section)})</option>)}</select>} />
      {!t ? <Notice>Publish an assignment or online assessment to see submissions here.</Notice> : (
        <>
          <div className="grid sm:grid-cols-4 gap-4">
            <Stat label="Submitted" value={`${subs.filter((x) => x.status !== 'in_progress').length} / ${kids.length}`} />
            <Stat label="To mark" value={subs.filter((x) => x.status === 'submitted').length} tone="warning" />
            <Stat label="Marked" value={subs.filter((x) => x.status === 'graded').length} tone="success" />
            <Stat label="Late" value={subs.filter((x) => x.late).length} tone="error" />
          </div>
          <Card title={t.title} subtitle={`${className(t.grade, t.section)} · ${t.subject} · ${t.kind === 'quiz' ? 'closes' : 'due'} ${fmtDT(t.closesAt)}`} action={<div className="flex gap-2">
            <button type="button" className="btn-secondary text-sm" onClick={() => downloadCsv(`${t.title.replace(/\W+/g, '_')}_marks`, ['Student ID', 'Name', 'Status', 'Submitted', 'Late', 'Score', 'Out of'], kids.map((k) => { const x = subs.find((y) => y.studentId === k.id); return [k.studentNo, k.name, x?.status ?? 'not started', x?.submittedAt?.slice(0, 16) ?? '', x?.late ? 'yes' : '', x?.score ?? x?.autoScore ?? '', t.maxMarks]; }))}><Download className="w-4 h-4" /> Marks (.csv)</button>
            {!t.resultsReleased ? <button type="button" className="btn-primary text-sm" disabled={!subs.some((x) => x.status === 'graded')} onClick={() => actions.releaseResults(t.id)}>Release results to students</button> : <Pill tone="success">Results released</Pill>}
          </div>}>
            <Table head={['Student', 'Status', 'Submitted', 'Score', '']}>
              {kids.map((k) => { const x = subs.find((y) => y.studentId === k.id); return (
                <tr key={k.id}>
                  <td className="font-medium">{k.name}<p className="text-xs text-navy-500 font-mono">{k.studentNo}</p></td>
                  <td>{!x ? <Pill tone="muted">Not started</Pill> : x.status === 'in_progress' ? <Pill tone="accent">In progress</Pill> : x.status === 'submitted' ? <Pill tone="warning">To mark</Pill> : <Pill tone="success">Marked</Pill>}{x?.late && <Pill tone="error">Late</Pill>}</td>
                  <td className="text-xs">{x?.submittedAt ? fmtDT(x.submittedAt) : '—'}</td>
                  <td>{x?.score != null ? `${x.score} / ${t.maxMarks}` : x?.autoScore != null ? <span className="text-xs">{x.autoScore} auto{needsManualMarking(t) ? ' + manual' : ''}</span> : '—'}</td>
                  <td>{x && x.status !== 'in_progress' && <button type="button" className="btn-secondary text-xs py-1" onClick={() => setGrading(x)}>{x.status === 'graded' ? 'Review' : 'Mark'}</button>}</td>
                </tr>
              ); })}
            </Table>
          </Card>
        </>
      )}
      {grading && <GradeDialog sub={grading} onClose={() => setGrading(null)} />}
    </div>
  );
}

export function MarkingPage({ onNavigate }: PageProps) {
  const { me, s } = useMine();
  const [grading, setGrading] = useState<Submission | null>(null);
  const [tab, setTab] = useState<'queue' | 'release'>('queue');
  const mineIds = useMemo(() => new Set(s.tasks.filter((t) => t.teacherId === me.id).map((t) => t.id)), [s.tasks, me.id]);
  const queue = s.submissions.filter((x) => mineIds.has(x.taskId) && x.status === 'submitted');
  const unreleased = s.tasks.filter((t) => mineIds.has(t.id) && !t.resultsReleased && s.submissions.some((x) => x.taskId === t.id && x.status === 'graded'));
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Marking and Grading" subtitle="Mark written work and file uploads, add feedback, then release results to students." />
      <Tabs tabs={[{ id: 'queue', label: 'To mark', count: queue.length }, { id: 'release', label: 'Ready to release', count: unreleased.length }]} value={tab} onChange={setTab} />
      {tab === 'queue' ? (
        <Card>
          <Table head={['Student', 'Assignment / assessment', 'Class', 'Submitted', 'Auto score', '']} empty="Nothing waiting to be marked.">
            {queue.map((x) => { const t = s.tasks.find((y) => y.id === x.taskId)!; const st = studentById(s, x.studentId); return <tr key={x.id}><td className="font-medium">{st?.name}</td><td>{t.title}<p className="text-xs text-navy-500">{t.kind === 'quiz' ? 'Online assessment' : 'Assignment'}</p></td><td>{className(t.grade, t.section)}</td><td className="text-xs">{x.submittedAt && fmtDT(x.submittedAt)} {x.late && <Pill tone="error">Late</Pill>}</td><td>{x.autoScore ?? '—'}</td><td><button type="button" className="btn-primary text-xs py-1" onClick={() => setGrading(x)}>Mark</button></td></tr>; })}
          </Table>
        </Card>
      ) : (
        <Card>
          <Table head={['Assignment / assessment', 'Class', 'Marked', 'Waiting', '']} empty="All results are released.">
            {unreleased.map((t) => { const subs = s.submissions.filter((x) => x.taskId === t.id); return <tr key={t.id}><td className="font-medium">{t.title}</td><td>{className(t.grade, t.section)}</td><td>{subs.filter((x) => x.status === 'graded').length}</td><td>{subs.filter((x) => x.status === 'submitted').length}</td><td className="whitespace-nowrap"><button type="button" className="btn-secondary text-xs py-1 mr-2" onClick={() => onNavigate(`submissions:${t.id}`)}>Open</button><button type="button" className="btn-primary text-xs py-1" onClick={() => actions.releaseResults(t.id)}>Release results</button></td></tr>; })}
          </Table>
        </Card>
      )}
      {grading && <GradeDialog sub={grading} onClose={() => setGrading(null)} />}
    </div>
  );
}

