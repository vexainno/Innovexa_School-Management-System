import type { SchoolState } from './types';
import { attendanceSummary, className, letterFor, roster, schoolDays, staffName, studentAverage, studentById, subjectTotals } from './store';

/**
 * The school's own report-card design, as a Word (.docx) file with placeholders such as {student_name}.
 * The platform fills the placeholders for each student, so the school's layout, logo and fonts are kept exactly.
 */
const STORE_KEY = 'innosysedu.reportTemplate.docx';

export const PLACEHOLDERS: [string, string][] = [
  ['{school_name}', 'School name'], ['{school_address}', 'School address'], ['{motto}', 'School motto'],
  ['{student_name}', 'Student full name'], ['{student_id}', 'Student ID'], ['{class}', 'Class and section, e.g. Grade 7A'],
  ['{grade}', 'Grade number'], ['{section}', 'Section letter'], ['{academic_year}', 'Academic year'], ['{period}', 'Current marking period / term'],
  ['{average}', 'Overall average'], ['{overall_grade}', 'Overall letter grade'], ['{remark}', 'Performance remark'],
  ['{position}', 'Class position'], ['{class_size}', 'Number of students in class'], ['{attendance_rate}', 'Attendance %'],
  ['{days_present}', 'Days present'], ['{days_absent}', 'Days absent'], ['{conduct}', 'Conduct'],
  ['{teacher_remark}', "Class sponsor's remark"], ['{academic_remark}', "Academic Officer's remark"], ['{principal_remark}', "Principal's remark"],
  ['{date_issued}', 'Date of issue'],
  ['{#subjects} … {/subjects}', 'Repeats a table row for every subject. Inside it use {subject} {teacher} {classwork} {quizzes} {midterm} {final} {total} {letter}'],
  ['{Mathematics_total}', 'A single subject total (also {English_total}, {General_Science_total}, …)'],
];

export function templateData(s: SchoolState, studentId: string) {
  const st = studentById(s, studentId)!;
  const rows = subjectTotals(s, studentId);
  const avg = studentAverage(s, studentId);
  const overall = avg != null ? letterFor(avg, s.grading) : null;
  const ranks = roster(s, st.grade, st.section).map((x) => ({ id: x.id, a: studentAverage(s, x.id) ?? 0 })).sort((a, b) => b.a - a.a);
  const att = attendanceSummary([studentId], schoolDays(55));
  const sheet = s.batches.find((b) => b.key === `${st.grade}${st.section}`)?.sheets[studentId];
  const flat: Record<string, string | number> = {};
  rows.forEach((r) => { flat[`${r.subject.replace(/\W+/g, '_')}_total`] = r.total ?? ''; });
  return {
    school_name: s.school.name, school_address: s.template.schoolAddress || s.school.address, motto: s.template.motto || s.school.motto,
    student_name: st.name, student_id: st.studentNo, class: className(st.grade, st.section), grade: st.grade, section: st.section,
    academic_year: s.school.academicYear, period: s.school.currentPeriod ?? '',
    average: avg ?? '', overall_grade: overall?.letter ?? '', remark: overall?.remark ?? '',
    position: ranks.findIndex((x) => x.id === studentId) + 1, class_size: ranks.length,
    attendance_rate: `${att.rate}%`, days_present: att.present + att.late, days_absent: att.absent,
    conduct: s.incidents.some((i) => i.studentId === studentId && i.severity !== 'minor') ? 'Needs improvement' : 'Satisfactory',
    teacher_remark: sheet?.teacherRemark ?? '', academic_remark: sheet?.academicRemark ?? '', principal_remark: sheet?.principalRemark ?? '',
    date_issued: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    subjects: rows.map((r) => ({ subject: r.subject, teacher: staffName(s, r.teacherId), classwork: r.marks?.classwork ?? '', quizzes: r.marks?.quizzes ?? '', midterm: r.marks?.midterm ?? '', final: r.marks?.final ?? '', total: r.total ?? '', letter: r.total != null ? letterFor(r.total, s.grading).letter : '' })),
    ...flat,
  };
}

/* ---------- storage of the uploaded template (kept in this browser) ---------- */

const toBase64 = (buf: ArrayBuffer) => { let b = ''; const a = new Uint8Array(buf); for (let i = 0; i < a.length; i += 0x8000) b += String.fromCharCode(...a.subarray(i, i + 0x8000)); return btoa(b); };
const fromBase64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0)).buffer;

export function saveTemplateFile(buf: ArrayBuffer) {
  localStorage.setItem(STORE_KEY, toBase64(buf));
}
export function loadTemplateFile(): ArrayBuffer | null {
  const v = localStorage.getItem(STORE_KEY);
  return v ? fromBase64(v) : null;
}
export function clearTemplateFile() {
  localStorage.removeItem(STORE_KEY);
}

/** Checks that the uploaded file is a valid Word template and lists the placeholders it uses. */
export async function inspectTemplate(buf: ArrayBuffer): Promise<{ ok: boolean; tags: string[]; error?: string }> {
  try {
    const [{ default: PizZip }, { default: Docxtemplater }] = await Promise.all([import('pizzip'), import('docxtemplater')]);
    const doc = new Docxtemplater(new PizZip(buf), { paragraphLoop: true, linebreaks: true });
    const text = doc.getFullText();
    const tags = [...new Set([...text.matchAll(/\{[#/]?[\w.]+\}/g)].map((m) => m[0]))];
    return { ok: true, tags };
  } catch (e) {
    const msg = (e as { properties?: { errors?: { properties?: { explanation?: string } }[] } }).properties?.errors?.[0]?.properties?.explanation;
    return { ok: false, tags: [], error: msg ?? 'This is not a valid Word (.docx) file, or a placeholder is broken (check that every { has a matching }).' };
  }
}

export async function fillTemplate(buf: ArrayBuffer, data: Record<string, unknown>): Promise<Blob> {
  const [{ default: PizZip }, { default: Docxtemplater }] = await Promise.all([import('pizzip'), import('docxtemplater')]);
  const doc = new Docxtemplater(new PizZip(buf), { paragraphLoop: true, linebreaks: true, nullGetter: () => '' });
  doc.render(data);
  return doc.getZip().generate({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }) as Blob;
}

export async function zipFiles(files: { name: string; blob: Blob }[]): Promise<Blob> {
  const { default: PizZip } = await import('pizzip');
  const zip = new PizZip();
  for (const f of files) zip.file(f.name, await f.blob.arrayBuffer());
  return zip.generate({ type: 'blob' }) as Blob;
}

/* ---------- starter template the school can open in Word and redesign ---------- */

const p = (text: string, opts: { bold?: boolean; size?: number; center?: boolean } = {}) =>
  `<w:p><w:pPr>${opts.center ? '<w:jc w:val="center"/>' : ''}<w:spacing w:after="60"/></w:pPr><w:r><w:rPr>${opts.bold ? '<w:b/>' : ''}${opts.size ? `<w:sz w:val="${opts.size}"/>` : ''}</w:rPr><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
const cell = (text: string, bold = false) => `<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr>${p(text, { bold })}</w:tc>`;
const row = (cells: string[], bold = false) => `<w:tr>${cells.map((c) => cell(c, bold)).join('')}</w:tr>`;

export async function starterTemplate(): Promise<Blob> {
  const { default: PizZip } = await import('pizzip');
  const borders = '<w:tblBorders>' + ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map((b) => `<w:${b} w:val="single" w:sz="6" w:color="1A2D54"/>`).join('') + '</w:tblBorders>';
  const body = [
    p('REPUBLIC OF LIBERIA · MINISTRY OF EDUCATION', { center: true, size: 18 }),
    p('{school_name}', { bold: true, size: 32, center: true }),
    p('{school_address}', { center: true, size: 18 }),
    p('{motto}', { center: true, size: 18 }),
    p('STUDENT GRADE SHEET', { bold: true, size: 24, center: true }),
    p('Student: {student_name}     Student ID: {student_id}'),
    p('Class: {class}     Academic year: {academic_year} {period}'),
    `<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/>${borders}</w:tblPr>`,
    row(['Subject', 'Classwork', 'Quizzes', 'Midterm', 'Final exam', 'Total', 'Grade'], true),
    row(['{#subjects}{subject}', '{classwork}', '{quizzes}', '{midterm}', '{final}', '{total}', '{letter}{/subjects}']),
    '</w:tbl>',
    p(''),
    p('Overall average: {average}%     Grade: {overall_grade} ({remark})     Position: {position} of {class_size}', { bold: true }),
    p('Attendance: {days_present} days present, {days_absent} absent ({attendance_rate})     Conduct: {conduct}'),
    p("Class sponsor's remark: {teacher_remark}"),
    p("Academic Officer's remark: {academic_remark}"),
    p("Principal's remark: {principal_remark}"),
    p(''), p(''),
    p('______________________          ______________________          ______________________'),
    p('Class sponsor                              Academic Officer                              Principal'),
    p('Date issued: {date_issued}', { size: 18 }),
  ].join('');
  const zip = new PizZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1000" w:right="1000" w:bottom="1000" w:left="1000"/></w:sectPr></w:body></w:document>`);
  return zip.generate({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }) as Blob;
}

export async function reportCardDocx(s: SchoolState, studentId: string): Promise<Blob | null> {
  const buf = loadTemplateFile();
  if (!buf || !s.reportTemplateFile?.active) return null;
  return fillTemplate(buf, templateData(s, studentId));
}
