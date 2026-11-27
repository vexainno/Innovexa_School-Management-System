import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, CheckCircle2, Clock, FileText, Paperclip, Send, Timer, Trash2, Upload } from 'lucide-react';
import { actions, studentIdForUser, taskStateFor, TASK_STATE_LABEL, useSchool } from '@/store/store';
import type { Question, Submission, SubmittedFile, Task } from '@/store/types';
import { resizeImage } from '@/components/BookCover';
import { Card, Dialog, Header, Notice, Pill, Stat, Table, Tabs } from '@/components/kit';
import { useMe } from './shared';

const fmtDT = (iso: string) => new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const stateTone = (st: string) => (st === 'released' ? 'success' : st === 'submitted' || st === 'marked' ? 'navy' : st === 'open' || st === 'in_progress' ? 'warning' : st === 'overdue' || st === 'missed' ? 'error' : 'muted');

function useMyTasks(kind: Task['kind']) {
  const me = useMe();
  const s = useSchool();
  const sid = studentIdForUser(me);
  const st = s.students.find((x) => x.id === sid);
  const tasks = s.tasks.filter((t) => t.kind === kind && t.status !== 'draft' && st && t.grade === st.grade && t.section === st.section)
    .sort((a, b) => a.closesAt.localeCompare(b.closesAt));
  const subOf = (t: Task) => s.submissions.find((x) => x.taskId === t.id && x.studentId === sid);
  return { s, sid, tasks, subOf };
}

async function toSubmittedFile(f: File): Promise<SubmittedFile> {
  if (f.type.startsWith('image/')) {
    try { return { name: f.name, size: f.size, type: 'image/jpeg', dataUrl: await resizeImage(f, 1400) }; } catch { /* fall through */ }
  }
  if (f.size <= 700_000) {
    const dataUrl = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(f); });
    return { name: f.name, size: f.size, type: f.type || 'application/octet-stream', dataUrl };
  }
  return { name: f.name, size: f.size, type: f.type || 'application/octet-stream' };
}

function Score({ t, sub }: { t: Task; sub?: Submission }) {
  if (!sub || sub.status !== 'graded' || !t.resultsReleased) return null;
  return (
    <div className="rounded-xl bg-success-50 border border-success-200 p-4">
      <p className="text-sm text-success-800">Your mark</p>
      <p className="text-2xl font-bold text-success-800">{sub.score} / {t.maxMarks}</p>
      {sub.feedback && <p className="text-sm text-navy-700 mt-1"><b>Teacher's feedback:</b> {sub.feedback}</p>}
    </div>
  );
}

/* ------------------------------ Assignments ------------------------------ */

export function StudentAssignmentsPage() {
  const { s, sid, tasks, subOf } = useMyTasks('assignment');
  const [tab, setTab] = useState<'todo' | 'submitted' | 'graded'>('todo');
  const [open, setOpen] = useState<string | null>(null);
  const groups = {
    todo: tasks.filter((t) => ['open', 'in_progress', 'overdue', 'upcoming'].includes(taskStateFor(t, subOf(t)))),
    submitted: tasks.filter((t) => ['submitted', 'marked', 'missed'].includes(taskStateFor(t, subOf(t)))),
    graded: tasks.filter((t) => taskStateFor(t, subOf(t)) === 'released'),
  };
  const task = tasks.find((t) => t.id === open);
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="My Assignments" subtitle="Assignments from your teachers. Type your answer or upload documents and photos of your handwritten work, then submit before the deadline." />
      <div className="grid sm:grid-cols-3 gap-4">
        <Stat label="To do" value={groups.todo.length} tone="warning" onClick={() => setTab('todo')} />
        <Stat label="Submitted" value={groups.submitted.filter((t) => subOf(t)).length} onClick={() => setTab('submitted')} />
        <Stat label="Graded" value={groups.graded.length} tone="success" onClick={() => setTab('graded')} />
      </div>
      <Tabs tabs={[{ id: 'todo', label: 'To do', count: groups.todo.length }, { id: 'submitted', label: 'Submitted', count: groups.submitted.length }, { id: 'graded', label: 'Graded', count: groups.graded.length }]} value={tab} onChange={setTab} />
      <div className="grid md:grid-cols-2 gap-4">
        {groups[tab].length === 0 && <Card><p className="text-sm text-navy-500">Nothing here.</p></Card>}
        {groups[tab].map((t) => { const sub = subOf(t); const st = taskStateFor(t, sub); return (
          <button key={t.id} type="button" onClick={() => setOpen(t.id)} className="card p-5 text-left hover:border-navy-300">
            <div className="flex justify-between gap-3"><p className="font-semibold text-navy-900">{t.title}</p><Pill tone={stateTone(st)}>{TASK_STATE_LABEL[st]}</Pill></div>
            <p className="text-sm text-navy-600 mt-1">{t.subject} · {s.staff.find((x) => x.id === t.teacherId)?.name}</p>
            <p className="text-xs text-navy-500 mt-2 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Due {fmtDT(t.closesAt)} · {t.maxMarks} marks</p>
            {st === 'released' && sub && <p className="text-sm font-semibold text-success-700 mt-2">{sub.score} / {t.maxMarks}</p>}
          </button>
        ); })}
      </div>
      {task && <AssignmentDialog key={task.id} task={task} studentId={sid} onClose={() => setOpen(null)} />}
    </div>
  );
}

function AssignmentDialog({ task: t, studentId, onClose }: { task: Task; studentId: string; onClose: () => void }) {
  const s = useSchool();
  const sub = s.submissions.find((x) => x.taskId === t.id && x.studentId === studentId);
  const state = taskStateFor(t, sub);
  const editable = (state === 'open' || state === 'in_progress' || state === 'overdue');
  const [text, setText] = useState(sub?.text ?? '');
  const [files, setFiles] = useState<SubmittedFile[]>(sub?.files ?? []);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [saved, setSaved] = useState('');
  const allowText = t.submissionType !== 'file';
  const allowFiles = t.submissionType !== 'text';
  const ensure = () => sub?.id ?? actions.startSubmission(t.id, studentId);
  const add = async (list: FileList | null) => {
    if (!list) return;
    setBusy(true);
    const next = [...files];
    for (const f of Array.from(list)) next.push(await toSubmittedFile(f));
    setFiles(next); setBusy(false); setSaved('');
  };
  const move = (i: number, d: number) => { const n = [...files]; const [x] = n.splice(i, 1); n.splice(i + d, 0, x); setFiles(n); };
  const saveDraft = () => { const id = ensure(); actions.saveSubmission(id, { text, files }); setSaved('Draft saved.'); };
  const submit = () => { const id = ensure(); actions.saveSubmission(id, { text, files }); actions.submitSubmission(id); setConfirm(false); };
  const empty = !text.trim() && files.length === 0;
  return (
    <Dialog open onClose={onClose} wide="xl" title={t.title} footer={editable ? <>
      {saved && <span className="text-xs text-success-700 mr-auto">{saved}</span>}
      <button type="button" className="btn-secondary" onClick={saveDraft}>Save draft</button>
      <button type="button" className="btn-primary" disabled={empty || busy} onClick={() => setConfirm(true)}><Send className="w-4 h-4" /> Submit assignment</button>
    </> : undefined}>
      <div className="flex flex-wrap gap-2 mb-3"><Pill tone={stateTone(state)}>{TASK_STATE_LABEL[state]}</Pill><Pill>{t.subject}</Pill><Pill>{t.maxMarks} marks</Pill><Pill tone={state === 'overdue' ? 'error' : 'navy'}>Due {fmtDT(t.closesAt)}</Pill></div>
      <div className="rounded-xl bg-navy-50 p-4 text-sm text-navy-800 whitespace-pre-line">{t.instructions}</div>
      {state === 'overdue' && <div className="mt-3"><Notice tone="warning">The deadline has passed. Your teacher still accepts this work, but it will be marked late.</Notice></div>}
      {state === 'missed' && <div className="mt-3"><Notice tone="error">This assignment is closed and was not submitted.</Notice></div>}
      {sub && sub.status !== 'in_progress' && <div className="mt-3"><Notice tone="success"><CheckCircle2 className="inline w-4 h-4 mr-1" /> Submitted {sub.submittedAt && fmtDT(sub.submittedAt)}{sub.late ? ' (late)' : ''}. {sub.status === 'graded' && t.resultsReleased ? '' : 'Your teacher will mark it and release the result.'}</Notice></div>}
      <div className="mt-3"><Score t={t} sub={sub} /></div>
      {(editable || sub?.text) && allowText && (
        <div className="mt-4">
          <span className="label">Your answer</span>
          <textarea className="input min-h-[160px]" value={text} readOnly={!editable} onChange={(e) => { setText(e.target.value); setSaved(''); }} placeholder="Type your answer here…" />
        </div>
      )}
      {allowFiles && (editable || files.length > 0) && (
        <div className="mt-4">
          <span className="label">Attachments {editable && '(PDF, Word, or photos of handwritten pages)'}</span>
          {editable && (
            <label className="flex flex-col items-center justify-center gap-1 p-6 border-2 border-dashed border-navy-200 rounded-xl hover:bg-navy-50 cursor-pointer">
              <Upload className="w-6 h-6 text-navy-500" />
              <span className="text-sm font-medium text-navy-700">{busy ? 'Adding…' : 'Add files or take photos'}</span>
              <input type="file" multiple accept="image/*,.pdf,.doc,.docx" capture="environment" className="sr-only" onChange={(e) => { void add(e.target.files); e.target.value = ''; }} />
            </label>
          )}
          <div className="grid sm:grid-cols-3 gap-3 mt-3">
            {files.map((f, i) => (
              <div key={i} className="rounded-lg border border-navy-100 p-2">
                {f.dataUrl && f.type.startsWith('image/') ? <img src={f.dataUrl} alt={f.name} className="w-full h-32 object-cover rounded" /> : <div className="h-32 rounded bg-navy-50 flex items-center justify-center"><FileText className="w-8 h-8 text-navy-400" /></div>}
                <p className="text-xs truncate mt-1">Page {i + 1}: {f.name}</p>
                {editable && <div className="flex gap-1 mt-1">
                  <button type="button" aria-label="Move earlier" className="p-1 rounded hover:bg-navy-50 disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="w-3.5 h-3.5" /></button>
                  <button type="button" aria-label="Move later" className="p-1 rounded hover:bg-navy-50 disabled:opacity-30" disabled={i === files.length - 1} onClick={() => move(i, 1)}><ArrowDown className="w-3.5 h-3.5" /></button>
                  <button type="button" aria-label="Remove" className="p-1 rounded hover:bg-error-50 text-error-600 ml-auto" onClick={() => setFiles(files.filter((_, j) => j !== i))}><Trash2 className="w-3.5 h-3.5" /></button>
                </div>}
              </div>
            ))}
          </div>
        </div>
      )}
      <Dialog open={confirm} onClose={() => setConfirm(false)} title="Submit assignment?" footer={<><button type="button" className="btn-secondary" onClick={() => setConfirm(false)}>Not yet</button><button type="button" className="btn-primary" onClick={submit}>Submit</button></>}>
        <p className="text-sm">You are submitting {text.trim() ? 'a typed answer' : ''}{text.trim() && files.length ? ' and ' : ''}{files.length ? `${files.length} file(s)` : ''} for <b>{t.title}</b>. You can't change it after submitting.</p>
      </Dialog>
    </Dialog>
  );
}

/* ------------------------------ Online assessments ------------------------------ */

function order(t: Task, studentId: string): Question[] {
  if (!t.shuffle) return t.questions;
  const seed = [...studentId].reduce((a, c) => a + c.charCodeAt(0), 0);
  return [...t.questions].sort((a, b) => ((a.id.charCodeAt(a.id.length - 1) * seed) % 97) - ((b.id.charCodeAt(b.id.length - 1) * seed) % 97));
}

export function StudentQuizzesPage() {
  const { s, sid, tasks, subOf } = useMyTasks('quiz');
  const [taking, setTaking] = useState<string | null>(null);
  const [review, setReview] = useState<string | null>(null);
  const [confirmStart, setConfirmStart] = useState<Task | null>(null);
  // A quiz left open past its time limit is submitted automatically with the answers saved so far.
  useEffect(() => {
    for (const t of tasks) {
      const sub = subOf(t);
      if (sub?.status !== 'in_progress' || taking === t.id) continue;
      const end = Math.min(new Date(t.closesAt).getTime(), t.durationMin ? new Date(sub.startedAt).getTime() + t.durationMin * 60000 : Infinity);
      if (Date.now() >= end) actions.submitSubmission(sub.id);
    }
  });
  const active = tasks.find((t) => t.id === taking);
  if (active) return <QuizRunner task={active} studentId={sid} onDone={() => setTaking(null)} />;
  const reviewing = tasks.find((t) => t.id === review);
  const available = tasks.filter((t) => ['open', 'in_progress'].includes(taskStateFor(t, subOf(t))));
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Online Assessments" subtitle="Quizzes and tests from your teachers. Start when you're ready — a timer begins when you start." />
      <div className="grid sm:grid-cols-3 gap-4">
        <Stat label="Available now" value={available.length} tone="warning" />
        <Stat label="Completed" value={tasks.filter((t) => subOf(t)?.status && subOf(t)!.status !== 'in_progress').length} />
        <Stat label="Results released" value={tasks.filter((t) => taskStateFor(t, subOf(t)) === 'released').length} tone="success" />
      </div>
      <Card>
        <Table head={['Assessment', 'Subject', 'Window', 'Time limit', 'Marks', 'Status', '']} empty="No online assessments yet.">
          {tasks.map((t) => { const sub = subOf(t); const st = taskStateFor(t, sub); return (
            <tr key={t.id}>
              <td className="font-medium">{t.title}<p className="text-xs text-navy-500">{t.questions.length} questions · {s.staff.find((x) => x.id === t.teacherId)?.name}</p></td>
              <td>{t.subject}</td>
              <td className="text-xs">{fmtDT(t.opensAt)} –<br />{fmtDT(t.closesAt)}</td>
              <td>{t.durationMin ? `${t.durationMin} min` : 'None'}</td>
              <td>{st === 'released' && sub ? <b>{sub.score} / {t.maxMarks}</b> : t.maxMarks}</td>
              <td><Pill tone={stateTone(st)}>{TASK_STATE_LABEL[st]}</Pill></td>
              <td>
                {st === 'open' && <button type="button" className="btn-primary text-xs py-1.5" onClick={() => setConfirmStart(t)}>Start</button>}
                {st === 'in_progress' && <button type="button" className="btn-primary text-xs py-1.5" onClick={() => setTaking(t.id)}>Continue</button>}
                {(st === 'submitted' || st === 'marked' || st === 'released') && <button type="button" className="btn-secondary text-xs py-1.5" onClick={() => setReview(t.id)}>View</button>}
              </td>
            </tr>
          ); })}
        </Table>
      </Card>
      <Dialog open={!!confirmStart} onClose={() => setConfirmStart(null)} title={confirmStart?.title ?? ''} footer={<><button type="button" className="btn-secondary" onClick={() => setConfirmStart(null)}>Not now</button><button type="button" className="btn-primary" onClick={() => { if (confirmStart) { actions.startSubmission(confirmStart.id, sid); setTaking(confirmStart.id); } setConfirmStart(null); }}>Start now</button></>}>
        {confirmStart && <div className="space-y-2 text-sm"><p className="whitespace-pre-line">{confirmStart.instructions}</p><p>{confirmStart.questions.length} questions · {confirmStart.maxMarks} marks{confirmStart.durationMin ? ` · ${confirmStart.durationMin} minutes once you start` : ''}.</p><p className="text-navy-500">Your answers save automatically. When time runs out, your answers are submitted for you.</p></div>}
      </Dialog>
      {reviewing && <QuizReview task={reviewing} sub={subOf(reviewing)} studentId={sid} onClose={() => setReview(null)} />}
    </div>
  );
}

function QuizReview({ task: t, sub, studentId, onClose }: { task: Task; sub?: Submission; studentId: string; onClose: () => void }) {
  const released = t.resultsReleased && sub?.status === 'graded';
  return (
    <Dialog open onClose={onClose} wide title={t.title}>
      {!released ? <Notice>Submitted {sub?.submittedAt && fmtDT(sub.submittedAt)}. Your result will appear here when your teacher releases it.</Notice> : <Score t={t} sub={sub} />}
      {released && sub && (
        <div className="space-y-3 mt-4">
          {order(t, studentId).map((q, i) => {
            const a = sub.answers[q.id] ?? '';
            const got = sub.perQuestion?.[q.id] ?? 0;
            return (
              <div key={q.id} className="rounded-lg border border-navy-100 p-3 text-sm">
                <div className="flex justify-between gap-2"><p className="font-medium">{i + 1}. {q.text}</p><span className={got === q.points ? 'text-success-700' : 'text-error-600'}>{got}/{q.points}</span></div>
                <p className="mt-1 text-navy-600">Your answer: {q.type === 'mcq' ? q.options?.[Number(a)] ?? '—' : q.type === 'true_false' ? (a ? (a === 'true' ? 'True' : 'False') : '—') : a || '—'}</p>
                {(q.type === 'mcq' || q.type === 'true_false') && got !== q.points && <p className="text-xs text-success-700">Correct answer: {q.type === 'mcq' ? q.options?.[Number(q.correct)] : q.correct === 'true' ? 'True' : 'False'}</p>}
              </div>
            );
          })}
        </div>
      )}
    </Dialog>
  );
}

function QuizRunner({ task: t, studentId, onDone }: { task: Task; studentId: string; onDone: () => void }) {
  const s = useSchool();
  const sub = s.submissions.find((x) => x.taskId === t.id && x.studentId === studentId);
  const qs = useMemo(() => order(t, studentId), [t, studentId]);
  const [answers, setAnswers] = useState<Record<string, string>>(sub?.answers ?? {});
  const [confirm, setConfirm] = useState(false);
  const [now, setNow] = useState(Date.now());
  const submitted = useRef(false);
  const deadline = Math.min(new Date(t.closesAt).getTime(), sub && t.durationMin ? new Date(sub.startedAt).getTime() + t.durationMin * 60000 : Infinity);
  const left = Math.max(0, Math.floor((deadline - now) / 1000));
  const finish = () => {
    if (!sub || submitted.current) return;
    submitted.current = true;
    actions.saveSubmission(sub.id, { answers });
    actions.submitSubmission(sub.id);
    onDone();
  };
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);
  useEffect(() => { if (Number.isFinite(deadline) && left === 0) finish(); }); // auto-submit when time is up
  const set = (q: string, v: string) => { const next = { ...answers, [q]: v }; setAnswers(next); if (sub) actions.saveSubmission(sub.id, { answers: next }); };
  const answered = qs.filter((q) => (answers[q.id] ?? '').trim()).length;
  if (!sub || sub.status !== 'in_progress') return <Notice>This assessment has already been submitted. <button type="button" className="underline" onClick={onDone}>Back</button></Notice>;
  return (
    <div className="space-y-5 animate-fade-in max-w-3xl mx-auto">
      <div className="sticky top-16 z-10 card p-4 flex flex-wrap items-center justify-between gap-3">
        <div><p className="font-semibold text-navy-900">{t.title}</p><p className="text-xs text-navy-500">{t.subject} · {answered} of {qs.length} answered · answers save automatically</p></div>
        {Number.isFinite(deadline) && <span className={`flex items-center gap-2 font-mono text-lg font-bold px-3 py-1 rounded-lg ${left < 120 ? 'bg-error-100 text-error-700' : 'bg-navy-100 text-navy-800'}`}><Timer className="w-5 h-5" />{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</span>}
      </div>
      {qs.map((q, i) => (
        <Card key={q.id}>
          <div className="flex justify-between gap-3"><p className="font-medium text-navy-900 whitespace-pre-line">{i + 1}. {q.text}</p><span className="text-xs text-navy-500 whitespace-nowrap">{q.points} mark{q.points === 1 ? '' : 's'}</span></div>
          <div className="mt-3">
            {q.type === 'mcq' && <div className="space-y-2">{(q.options ?? []).map((o, j) => o.trim() && <label key={j} className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer ${answers[q.id] === String(j) ? 'border-navy-600 bg-navy-50' : 'border-navy-200'}`}><input type="radio" name={q.id} checked={answers[q.id] === String(j)} onChange={() => set(q.id, String(j))} /><span className="text-sm"><b className="mr-1">{String.fromCharCode(65 + j)}.</b>{o}</span></label>)}</div>}
            {q.type === 'true_false' && <div className="flex gap-3">{['true', 'false'].map((v) => <label key={v} className={`flex-1 flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer ${answers[q.id] === v ? 'border-navy-600 bg-navy-50' : 'border-navy-200'}`}><input type="radio" name={q.id} checked={answers[q.id] === v} onChange={() => set(q.id, v)} />{v === 'true' ? 'True' : 'False'}</label>)}</div>}
            {q.type === 'short' && <input className="input" value={answers[q.id] ?? ''} onChange={(e) => set(q.id, e.target.value)} placeholder="Your answer" aria-label={`Answer ${i + 1}`} />}
            {q.type === 'essay' && <textarea className="input min-h-[140px]" value={answers[q.id] ?? ''} onChange={(e) => set(q.id, e.target.value)} placeholder="Write your answer" aria-label={`Answer ${i + 1}`} />}
            {q.type === 'file' && (
              <div>
                <label className="btn-secondary text-sm cursor-pointer"><Paperclip className="w-4 h-4" /> Attach file or photo<input type="file" accept="image/*,.pdf,.doc,.docx" capture="environment" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; const sf = await toSubmittedFile(f); const files = [...(sub.files ?? []).filter((x) => !x.name.startsWith(`${q.id}__`)), { ...sf, name: `${q.id}__${sf.name}` }]; actions.saveSubmission(sub.id, { files }); set(q.id, sf.name); }} /></label>
                {answers[q.id] && <p className="text-sm text-navy-600 mt-2">Attached: {answers[q.id]}</p>}
              </div>
            )}
          </div>
        </Card>
      ))}
      <div className="flex justify-between items-center">
        <button type="button" className="btn-secondary" onClick={onDone}>Save and leave</button>
        <button type="button" className="btn-primary" onClick={() => setConfirm(true)}><Send className="w-4 h-4" /> Submit answers</button>
      </div>
      <p className="text-xs text-navy-400 text-center">If you leave, the timer keeps running. Unsubmitted answers are submitted automatically when time runs out.</p>
      <Dialog open={confirm} onClose={() => setConfirm(false)} title="Submit your answers?" footer={<><button type="button" className="btn-secondary" onClick={() => setConfirm(false)}>Keep working</button><button type="button" className="btn-primary" onClick={finish}>Submit</button></>}>
        <p className="text-sm">You answered {answered} of {qs.length} questions. You can't change your answers after submitting.</p>
      </Dialog>
    </div>
  );
}
