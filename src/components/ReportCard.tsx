import { useState } from 'react';
import { FileDown, Printer } from 'lucide-react';
import { reportCardDocx } from '@/store/docxTemplate';
import { downloadBlob } from '@/store/files';
import type { SchoolState } from '@/store/types';
import { attendanceSummary, className, letterFor, roster, schoolDays, staffName, studentAverage, studentById, subjectTotals } from '@/store/store';
import { esc, printHtml } from '@/store/files';

export function reportCardData(s: SchoolState, studentId: string) {
  const st = studentById(s, studentId);
  if (!st) return null;
  const rows = subjectTotals(s, studentId).map((r) => ({ ...r, letter: r.total != null ? letterFor(r.total, s.grading) : null, teacher: staffName(s, r.teacherId) }));
  const avg = studentAverage(s, studentId);
  const classmates = roster(s, st.grade, st.section).map((x) => ({ id: x.id, avg: studentAverage(s, x.id) ?? 0 })).sort((a, b) => b.avg - a.avg);
  const position = classmates.findIndex((x) => x.id === studentId) + 1;
  const att = attendanceSummary([studentId], schoolDays(55));
  const conduct = s.incidents.filter((i) => i.studentId === studentId && i.severity !== 'minor').length ? 'Needs improvement' : 'Satisfactory';
  const batch = s.batches.find((b) => b.key === `${st.grade}${st.section}`);
  const sheet = batch?.sheets[studentId];
  return { st, rows, avg, position, of: classmates.length, att, conduct, batch, sheet, overall: avg != null ? letterFor(avg, s.grading) : null };
}

export function ReportCardView({ school, studentId }: { school: SchoolState; studentId: string }) {
  const d = reportCardData(school, studentId);
  if (!d) return null;
  const t = school.template;
  const period = school.school.currentPeriod;
  const print = () => printHtml(`Report card — ${d.st.name}`, reportCardHtml(school, studentId));
  return (
    <div>
      <div className="flex flex-wrap justify-end gap-2 mb-3">
        {school.reportTemplateFile?.active && <DocxButton school={school} studentId={studentId} fileName={`Report_card_${d.st.studentNo}.docx`} />}
        <button type="button" className="btn-secondary text-sm" onClick={print}><Printer className="w-4 h-4" /> Print / Save as PDF</button>
      </div>
      <div className="border-2 rounded-lg p-5 sm:p-7 bg-white" style={{ borderColor: t.accent }}>
        <div className="text-center border-b pb-4 mb-4" style={{ borderColor: t.accent }}>
          <p className="text-xs uppercase tracking-[0.2em] text-navy-500">Republic of Liberia · Ministry of Education</p>
          <h2 className="text-xl font-bold font-display mt-1" style={{ color: t.accent }}>{school.school.name.toUpperCase()}</h2>
          <p className="text-xs text-navy-500">{t.schoolAddress}</p>
          <p className="text-xs italic text-navy-500">{t.motto}</p>
          <p className="mt-2 font-semibold text-navy-800">{t.title}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
          <Info k="Student" v={d.st.name} />
          <Info k="Student ID" v={d.st.studentNo} />
          <Info k="Class" v={className(d.st.grade, d.st.section)} />
          <Info k="Academic year" v={period ? `${school.school.academicYear} · ${period}` : school.school.academicYear} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-navy-200">
            <thead className="bg-navy-50 text-navy-700">
              <tr>
                <th className="p-2 text-left border border-navy-200">Subject</th>
                {school.grading.components.map((c) => <th key={c.key} className="p-2 border border-navy-200 text-center">{c.name}<span className="block text-[10px] font-normal">{c.weight}%</span></th>)}
                <th className="p-2 border border-navy-200 text-center">Total</th>
                {t.showLetterGrade && <th className="p-2 border border-navy-200 text-center">Grade</th>}
                {t.showGradePoint && <th className="p-2 border border-navy-200 text-center">GP</th>}
              </tr>
            </thead>
            <tbody>
              {d.rows.map((r) => (
                <tr key={r.subject}>
                  <td className="p-2 border border-navy-200 font-medium">{r.subject}</td>
                  {school.grading.components.map((c) => <td key={c.key} className="p-2 border border-navy-200 text-center">{r.marks?.[c.key] ?? <span className="text-error-600">—</span>}</td>)}
                  <td className="p-2 border border-navy-200 text-center font-semibold">{r.total ?? <span className="text-error-600">Missing</span>}</td>
                  {t.showLetterGrade && <td className="p-2 border border-navy-200 text-center">{r.letter?.letter ?? '—'}</td>}
                  {t.showGradePoint && <td className="p-2 border border-navy-200 text-center">{r.letter?.point.toFixed(1) ?? '—'}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-sm">
          <Info k="Overall average" v={d.avg != null ? `${d.avg}%` : '—'} strong />
          <Info k="Remark" v={d.overall ? `${d.overall.letter} — ${d.overall.remark}` : '—'} />
          {t.showPosition && <Info k="Class position" v={`${d.position} of ${d.of}`} />}
          {t.showAttendance && <Info k="Attendance" v={`${d.att.present + d.att.late} present · ${d.att.absent} absent (${d.att.rate}%)`} />}
          {t.showConduct && <Info k="Conduct" v={d.conduct} />}
        </div>
        <div className="mt-4 space-y-2 text-sm">
          {t.showTeacherRemark && <Remark k="Class sponsor's remark" v={d.sheet?.teacherRemark} />}
          {t.showAcademicRemark && <Remark k="Academic Officer's remark" v={d.sheet?.academicRemark} />}
          {t.showPrincipalRemark && <Remark k="Principal's remark" v={d.sheet?.principalRemark} />}
        </div>
        {t.showSignatures && (
          <div className="grid grid-cols-3 gap-6 mt-8 text-xs text-center text-navy-500">
            {['Class sponsor', 'Academic Officer', 'Principal'].map((x) => <div key={x}><div className="border-t border-navy-300 pt-1">{x}</div></div>)}
          </div>
        )}
        <p className="text-[11px] text-navy-400 mt-4 text-center">Calculated with grading configuration v{school.grading.version} ({school.grading.averageMethod} average). Subject totals are as submitted by subject teachers and approved by the Principal.</p>
      </div>
    </div>
  );
}

function DocxButton({ school, studentId, fileName }: { school: SchoolState; studentId: string; fileName: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return (
    <span className="flex items-center gap-2">
      {err && <span className="text-xs text-error-600">{err}</span>}
      <button type="button" className="btn-primary text-sm" disabled={busy} onClick={async () => { setBusy(true); setErr(''); try { const b = await reportCardDocx(school, studentId); if (b) downloadBlob(b, fileName); else setErr('Template not available on this device.'); } catch { setErr('Could not fill the template.'); } finally { setBusy(false); } }}><FileDown className="w-4 h-4" /> {busy ? 'Preparing…' : 'Download report card (school design)'}</button>
    </span>
  );
}

function Info({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-navy-400">{k}</p>
      <p className={`text-navy-900 ${strong ? 'font-bold text-lg' : 'font-medium'}`}>{v}</p>
    </div>
  );
}
function Remark({ k, v }: { k: string; v?: string }) {
  return <p><span className="text-navy-500">{k}: </span><span className="text-navy-900">{v || '—'}</span></p>;
}

export function reportCardHtml(s: SchoolState, studentId: string) {
  const d = reportCardData(s, studentId);
  if (!d) return '';
  const comps = s.grading.components;
  return `<div class="box"><div style="text-align:center"><div class="muted">REPUBLIC OF LIBERIA · MINISTRY OF EDUCATION</div><h1>${esc(s.school.name.toUpperCase())}</h1>
  <div class="muted">${esc(s.template.schoolAddress)}</div><h2>${esc(s.template.title)}</h2></div>
  <p><b>Student:</b> ${esc(d.st.name)} &nbsp; <b>ID:</b> ${esc(d.st.studentNo)} &nbsp; <b>Class:</b> ${esc(className(d.st.grade, d.st.section))} &nbsp; <b>Year:</b> ${esc(s.school.academicYear)}</p>
  <table><thead><tr><th>Subject</th>${comps.map((c) => `<th>${esc(c.name)} (${c.weight}%)</th>`).join('')}<th>Total</th><th>Grade</th></tr></thead><tbody>
  ${d.rows.map((r) => `<tr><td>${esc(r.subject)}</td>${comps.map((c) => `<td>${esc(r.marks?.[c.key] ?? '—')}</td>`).join('')}<td><b>${esc(r.total ?? 'Missing')}</b></td><td>${esc(r.letter?.letter ?? '—')}</td></tr>`).join('')}
  </tbody></table>
  <p><b>Overall average:</b> ${esc(d.avg ?? '—')}% &nbsp; <b>Remark:</b> ${esc(d.overall ? `${d.overall.letter} — ${d.overall.remark}` : '—')} &nbsp; <b>Position:</b> ${d.position} of ${d.of} &nbsp; <b>Attendance:</b> ${d.att.rate}%</p>
  <p><b>Class sponsor:</b> ${esc(d.sheet?.teacherRemark ?? '')}<br><b>Academic Officer:</b> ${esc(d.sheet?.academicRemark ?? '')}<br><b>Principal:</b> ${esc(d.sheet?.principalRemark ?? '')}</p>
  <table style="margin-top:40px;border:none"><tr>${['Class sponsor', 'Academic Officer', 'Principal'].map((x) => `<td style="border:none;border-top:1px solid #8ba9d8;text-align:center">${x}</td>`).join('<td style="border:none;width:20px"></td>')}</tr></table></div>`;
}
