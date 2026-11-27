import { useEffect, useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import type { Gradebook } from '@/store/types';
import {
  attendanceSummary, className, feeAccount, fmtDate, GRADEBOOK_LABEL, money, schoolDays, staffName, studentAverage,
  studentById, uploadedFiles, useSchool, categoryFor, CATEGORY_LABEL, studentAttendance,
} from '@/store/store';
import { downloadGradebook } from '@/store/files';
import { Dialog, Notice, Pill, catTone } from '@/components/kit';
import { ContactLinks } from './shared';

export function gradebookTone(s: Gradebook['status']) {
  return s === 'approved' ? 'success' : s === 'submitted' ? 'warning' : s === 'returned' ? 'error' : 'muted';
}

/** "Open Gradebook": the original teacher workbook, with download/open-with and an in-browser preview. */
export function GradebookDialog({ gradebook, onClose, actionsSlot }: { gradebook: Gradebook | null; onClose: () => void; actionsSlot?: React.ReactNode }) {
  const school = useSchool();
  const [preview, setPreview] = useState<string[][] | null>(null);
  const [busy, setBusy] = useState(false);
  const uploaded = gradebook ? uploadedFiles.get(gradebook.id) : undefined;
  useEffect(() => {
    setPreview(null);
    if (!uploaded) return;
    let cancelled = false;
    import('read-excel-file/browser')
      .then(({ readSheet }) => readSheet(uploaded))
      .then((rows) => { if (!cancelled) setPreview((rows as unknown[][]).slice(0, 60).map((r) => r.map((c) => (c == null ? '' : String(c))))); })
      .catch(() => { if (!cancelled) setPreview([]); });
    return () => { cancelled = true; };
  }, [uploaded]);
  if (!gradebook) return null;
  const g = gradebook;
  const rows = Object.entries(g.marks).map(([sid, m]) => ({ st: studentById(school, sid), m }));
  const download = async () => { setBusy(true); try { await downloadGradebook(school, g); } finally { setBusy(false); } };
  return (
    <Dialog open onClose={onClose} wide="xl" title={`Gradebook — ${className(g.grade, g.section)} · ${g.subject}`} footer={<>{actionsSlot}<button type="button" className="btn-secondary" onClick={onClose}>Close</button></>}>
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-navy-50 mb-4">
        <FileSpreadsheet className="w-10 h-10 text-success-700" />
        <div className="flex-1 min-w-[200px]">
          <p className="font-semibold text-navy-900">{g.fileName || 'No file submitted yet'}</p>
          <p className="text-xs text-navy-500">{Math.round(g.fileSize / 1024)} KB · submitted by {staffName(school, g.teacherId)} · {fmtDate(g.submittedAt)}{g.approvedAt ? ` · approved ${fmtDate(g.approvedAt)}` : ''}</p>
          <div className="mt-1"><Pill tone={gradebookTone(g.status)}>{GRADEBOOK_LABEL[g.status]}</Pill></div>
        </div>
        <button type="button" className="btn-primary" onClick={download} disabled={busy || !g.fileName}><Download className="w-4 h-4" /> {busy ? 'Preparing…' : 'Download / open in Excel'}</button>
      </div>
      <p className="text-xs text-navy-500 mb-3">The original file is preserved unchanged. Download it to open with Excel (or any spreadsheet app) on your computer. A read-only preview is shown below.</p>
      {uploaded ? (
        preview == null ? <p className="text-sm text-navy-500">Reading workbook…</p> : preview.length === 0 ? <Notice tone="warning">This file can't be previewed in the browser. Use “Download / open in Excel”.</Notice> : (
          <div className="overflow-auto max-h-[50vh] border border-navy-100 rounded-lg">
            <table className="text-xs w-full">{preview.map((r, i) => <tr key={i} className={i === 0 ? 'bg-navy-50 font-semibold' : ''}>{r.map((c, j) => <td key={j} className="border border-navy-100 px-2 py-1 whitespace-nowrap">{c}</td>)}</tr>)}</table>
          </div>
        )
      ) : (
        <div className="overflow-auto max-h-[50vh] border border-navy-100 rounded-lg">
          <table className="text-sm w-full">
            <thead className="bg-navy-50 sticky top-0"><tr>{['Student ID', 'Student', 'Classwork', 'Quizzes', 'Midterm', 'Final', 'Subject total'].map((h) => <th key={h} className="px-3 py-2 text-left text-xs text-navy-600">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map(({ st, m }, i) => (
                <tr key={i} className="border-t border-navy-100">
                  <td className="px-3 py-1.5 font-mono text-xs">{st?.studentNo}</td>
                  <td className="px-3 py-1.5">{st?.name}{st && st.status !== 'active' && <Pill tone="warning">{st.status}</Pill>}</td>
                  {[m.classwork, m.quizzes, m.midterm, m.final].map((v, j) => <td key={j} className={`px-3 py-1.5 ${v == null ? 'text-error-600 font-semibold' : ''}`}>{v ?? 'Missing'}</td>)}
                  <td className="px-3 py-1.5 font-semibold">{m.total ?? <span className="text-error-600">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {g.returnReason && <div className="mt-3"><Notice tone="error">Returned: {g.returnReason}</Notice></div>}
    </Dialog>
  );
}

export function StudentProfileDialog({ studentId, onClose, showFees = true }: { studentId: string | null; onClose: () => void; showFees?: boolean }) {
  const school = useSchool();
  if (!studentId) return null;
  const st = studentById(school, studentId);
  if (!st) return null;
  const avg = studentAverage(school, st.id);
  const att = attendanceSummary([st.id], schoolDays(20));
  const fee = feeAccount(school, st.id);
  const cat = avg != null ? categoryFor(avg, school.grading) : null;
  const rows: [string, React.ReactNode][] = [
    ['Student ID', <span className="font-mono">{st.studentNo}</span>],
    ['Current class', className(st.grade, st.section)],
    ['Year entered', String(st.yearEntered)],
    ['Previous classes', st.previousClasses.join(', ') || 'New intake'],
    ['Gender / Date of birth', `${st.gender === 'M' ? 'Male' : 'Female'} · ${fmtDate(st.dob)}`],
    ['Address', st.address],
    ['Guardian', `${st.guardianName} (${st.guardianRelation})`],
    ['Guardian contact', <ContactLinks phone={st.guardianPhone} email={st.guardianEmail} />],
    ['Parent account', st.parentLinked ? 'Linked' : 'Not linked'],
    ['Enrollment', st.status === 'active' ? 'Active' : `${st.status}${st.statusNote ? ` — ${st.statusNote}` : ''}`],
  ];
  return (
    <Dialog open onClose={onClose} title={st.name} wide>
      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl bg-navy-50 p-3"><p className="text-xs text-navy-500">Average</p><p className="text-xl font-bold text-navy-900">{avg ?? '—'}%</p>{cat && <Pill tone={catTone(cat)}>{CATEGORY_LABEL[cat]}</Pill>}</div>
        <div className="rounded-xl bg-navy-50 p-3"><p className="text-xs text-navy-500">Attendance (20 days)</p><p className="text-xl font-bold text-navy-900">{att.rate}%</p><p className="text-xs text-navy-500">{att.absent} absent · {att.late} late</p></div>
        {showFees && <div className="rounded-xl bg-navy-50 p-3"><p className="text-xs text-navy-500">Fee balance</p><p className="text-xl font-bold text-navy-900">{money(fee.balance)}</p><p className="text-xs text-navy-500">{money(fee.paid)} paid of {money(fee.charged - fee.concessions)}</p></div>}
      </div>
      <dl className="divide-y divide-navy-100 text-sm">
        {rows.map(([k, v]) => <div key={k} className="grid grid-cols-[170px_1fr] gap-3 py-2"><dt className="text-navy-500">{k}</dt><dd className="text-navy-900">{v}</dd></div>)}
      </dl>
    </Dialog>
  );
}

export function AttendanceHistory({ studentId }: { studentId: string }) {
  const days = schoolDays(20);
  const tone: Record<string, string> = { present: 'bg-success-500', late: 'bg-warning-500', absent: 'bg-error-500', excused: 'bg-navy-300' };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {days.slice().reverse().map((d) => {
          const s = studentAttendance(studentId, d);
          return <span key={d} title={`${fmtDate(d)}: ${s}`} className={`w-7 h-7 rounded-md ${tone[s]} text-[10px] text-white flex items-center justify-center`}>{new Date(`${d}T12:00:00`).getDate()}</span>;
        })}
      </div>
      <div className="flex flex-wrap gap-3 mt-2 text-xs text-navy-500">{Object.entries(tone).map(([k, c]) => <span key={k} className="inline-flex items-center gap-1"><span className={`w-2.5 h-2.5 rounded-sm ${c}`} />{k}</span>)}</div>
    </div>
  );
}
