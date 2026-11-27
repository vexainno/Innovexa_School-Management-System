import { useMemo, useState } from 'react';
import { CheckCircle2, Download, FileSpreadsheet, Printer, RotateCcw, Upload } from 'lucide-react';
import { actions, className, fmtDate, getSchool, studentById, useSchool, type ImportRow } from '@/store/store';
import type { Account, SchoolState } from '@/store/types';
import { downloadBlob, downloadCsv, esc, printHtml } from '@/store/files';
import { Card, Header, Notice, Pill, SearchBox, Stat, Table } from '@/components/kit';
import { useMe } from './shared';

const COLUMNS = [
  'Student First Name', 'Student Last Name', 'Gender (M/F)', 'Date of Birth (YYYY-MM-DD)', 'Grade', 'Section', 'Student Email',
  'Parent/Guardian Full Name', 'Parent Email', 'Parent Phone', 'Relationship', 'Home Address', 'Existing Student ID (returning students)', 'Year Entered (returning students)',
] as const;
const REQUIRED = ['Student First Name', 'Student Last Name', 'Gender (M/F)', 'Grade', 'Section', 'Parent/Guardian Full Name', 'Parent Phone'];
const EXAMPLE = ['Blessing T.', 'Kamara', 'F', '2014-03-11', '7', 'A', 'blessing.kamara@gmail.com', 'Mr. Ansu Kamara', 'ansu.kamara@gmail.com', '+231 77 812 3341', 'Father', 'Paynesville, Monrovia', '', ''];
const EXAMPLE2 = ['Moses K.', 'Flomo', 'M', '2010-06-02', '11', 'B', 'moses.flomo@yahoo.com', 'Mrs. Hawa Flomo', 'hawa.flomo@yahoo.com', '+231 88 610 2290', 'Mother', 'Sinkor, Monrovia', 'INNO-2021-045', '2021'];

const emailOk = (e: string) => !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

type Parsed = { row: number; data: ImportRow; errors: string[]; warnings: string[] };

function normaliseHeader(h: string) {
  const x = h.toLowerCase().replace(/[^a-z]/g, '');
  return COLUMNS.find((c) => c.toLowerCase().replace(/[^a-z]/g, '') === x) ?? COLUMNS.find((c) => x && c.toLowerCase().replace(/[^a-z]/g, '').startsWith(x.slice(0, 12)));
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true;
    else if (c === ',') { cur.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; cur.push(cell); rows.push(cur); cur = []; cell = ''; }
    else cell += c;
  }
  if (cell || cur.length) { cur.push(cell); rows.push(cur); }
  return rows.filter((r) => r.some((x) => x.trim()));
}

function toISO(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v ?? '').trim();
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return s;
}

function validateRows(raw: unknown[][], s: SchoolState): Parsed[] {
  const hi = raw.findIndex((r) => r.some((c) => normaliseHeader(String(c ?? '')) === 'Student First Name'));
  if (hi < 0) return [];
  const map = raw[hi].map((h) => normaliseHeader(String(h ?? '')));
  const seenStudentEmail = new Set<string>();
  const existingEmails = new Map(s.accounts.map((a) => [a.email, a]));
  return raw.slice(hi + 1).filter((r) => r.some((c) => String(c ?? '').trim())).map((r, i) => {
    const get = (c: (typeof COLUMNS)[number]) => { const j = map.indexOf(c); return j >= 0 ? r[j] : ''; };
    const str = (c: (typeof COLUMNS)[number]) => String(get(c) ?? '').trim();
    const errors: string[] = [];
    const warnings: string[] = [];
    REQUIRED.forEach((c) => { if (!str(c as (typeof COLUMNS)[number])) errors.push(`${c} is missing`); });
    const g = str('Gender (M/F)').toUpperCase().charAt(0);
    if (g && g !== 'M' && g !== 'F') errors.push('Gender must be M or F');
    const grade = Number(str('Grade').replace(/[^\d]/g, ''));
    if (str('Grade') && (!grade || grade < 1 || grade > 12)) errors.push('Grade must be 1–12');
    const section = str('Section').toUpperCase();
    if (section && !/^[A-Z]$/.test(section)) errors.push('Section must be a single letter (A, B, C…)');
    const studentEmail = str('Student Email').toLowerCase();
    const parentEmail = str('Parent Email').toLowerCase();
    if (!emailOk(studentEmail)) errors.push('Student email is not valid');
    if (!emailOk(parentEmail)) errors.push('Parent email is not valid');
    if (studentEmail && studentEmail === parentEmail) errors.push('Student and parent emails must be different');
    if (studentEmail && seenStudentEmail.has(studentEmail)) errors.push('Student email appears twice in the file');
    if (studentEmail) seenStudentEmail.add(studentEmail);
    if (studentEmail && existingEmails.has(studentEmail)) errors.push('Student email already has an account');
    if (parentEmail && existingEmails.get(parentEmail)?.role && existingEmails.get(parentEmail)!.role !== 'parent') errors.push('Parent email belongs to a non-parent account');
    if (parentEmail && existingEmails.get(parentEmail)?.role === 'parent') warnings.push('Existing parent account — this child will be added to it');
    if (!studentEmail) warnings.push('No student email — the student will not get a login yet');
    if (!parentEmail) warnings.push('No parent email — the parent will not get a login yet');
    const existingNo = str('Existing Student ID (returning students)');
    if (existingNo && s.students.some((x) => x.studentNo === existingNo)) warnings.push(`Updates existing record ${existingNo}`);
    const dob = toISO(get('Date of Birth (YYYY-MM-DD)'));
    if (dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob)) errors.push('Date of birth must be YYYY-MM-DD');
    const ye = Number(str('Year Entered (returning students)')) || null;
    return {
      row: hi + i + 2,
      errors, warnings,
      data: {
        firstName: str('Student First Name'), lastName: str('Student Last Name'), gender: (g === 'M' ? 'M' : 'F'), dob, grade, section,
        studentEmail, parentName: str('Parent/Guardian Full Name'), parentEmail, parentPhone: str('Parent Phone'),
        relationship: str('Relationship') || 'Guardian', address: str('Home Address'), existingStudentNo: existingNo, yearEntered: ye,
      },
    };
  });
}

export function slipHtml(s: SchoolState, accts: Account[]) {
  return accts.map((a) => {
    const kids = a.studentIds.map((id) => studentById(s, id)).filter(Boolean).map((st) => `${st!.name} (${className(st!.grade, st!.section)})`).join(', ');
    return `<div class="box" style="margin-bottom:18px;page-break-inside:avoid"><h2 style="margin-top:0">${esc(s.school.name)} — Portal access</h2>
      <p><b>${esc(a.name)}</b> · ${esc(a.role === 'parent' ? 'Parent / Guardian' : 'Student')}${kids ? ` · ${esc(kids)}` : ''}</p>
      <table><tr><th>Sign-in email</th><td>${esc(a.email)}</td></tr><tr><th>Activation code</th><td style="font-size:20px;letter-spacing:4px"><b>${esc(a.activationCode)}</b></td></tr></table>
      <p class="muted">Open the school portal, choose “First time here? Activate your account”, enter this email and code, then create your own password. Keep your password private — the school will never ask for it.</p></div>`;
  }).join('');
}

export function BulkImport({ onDone }: { onDone: () => void }) {
  const s = useSchool();
  const me = useMe();
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Parsed[] | null>(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ count: number; accounts: Account[] } | null>(null);
  const valid = rows?.filter((r) => !r.errors.length) ?? [];
  const template = async () => {
    const { default: writeXlsxFile } = await import('write-excel-file/browser');
    const h = (value: string) => ({ value, fontWeight: 'bold' as const, backgroundColor: REQUIRED.includes(value) ? '#FDE68A' : '#DAE4F4' });
    const data = [COLUMNS.map((c) => h(c)), EXAMPLE.map((v) => ({ value: v })), EXAMPLE2.map((v) => ({ value: v }))];
    const blob = await writeXlsxFile(data as never, { columns: COLUMNS.map(() => ({ width: 22 })) } as never).toBlob();
    downloadBlob(blob, `${s.school.name.replace(/\s/g, '_')}_student_import_template.xlsx`);
  };
  const read = async (f: File | null) => {
    setFile(f); setRows(null); setError(''); setResult(null);
    if (!f) return;
    try {
      let raw: unknown[][];
      if (/\.csv$/i.test(f.name)) raw = parseCsv(await f.text());
      else {
        const { readSheet } = await import('read-excel-file/browser');
        raw = (await readSheet(f)) as unknown[][];
      }
      const parsed = validateRows(raw, s);
      if (!parsed.length) setError('No student rows found. Make sure the first row has the template column headings.');
      setRows(parsed);
    } catch {
      setError('This file could not be read. Save it as .xlsx or .csv and try again.');
    }
  };
  const doImport = () => {
    const before = new Set(s.accounts.map((a) => a.id));
    const created = actions.importStudents(valid.map((r) => r.data), me.name);
    const ids = new Set(created.map((c) => c.studentId));
    const accts = getSchool().accounts.filter((a) => (!before.has(a.id) || a.studentIds.some((id) => ids.has(id))) && a.status === 'invited');
    setResult({ count: created.length, accounts: accts });
  };
  if (result) {
    return (
      <Card>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-success-600 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-navy-900">{result.count} students imported</p>
            <p className="text-sm text-navy-600 mt-1">Each student received a student ID and a fee account from the fee structure. {result.accounts.length} portal accounts (students and parents) are ready to activate. Give each person their activation code — they create their own password the first time they sign in.</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <button type="button" className="btn-primary text-sm" onClick={() => printHtml('Activation slips', slipHtml(s, result.accounts))}><Printer className="w-4 h-4" /> Print activation slips</button>
              <button type="button" className="btn-secondary text-sm" onClick={() => downloadCsv('activation_codes', ['Name', 'Role', 'Email', 'Activation code', 'Linked students'], result.accounts.map((a) => [a.name, a.role, a.email, a.activationCode, a.studentIds.map((id) => studentById(s, id)?.name).join('; ')]))}><Download className="w-4 h-4" /> Download codes (.csv)</button>
              <button type="button" className="btn-secondary text-sm" onClick={() => { setResult(null); setRows(null); setFile(null); onDone(); }}>Done</button>
            </div>
          </div>
        </div>
      </Card>
    );
  }
  return (
    <div className="space-y-5">
      <Card title="1. Prepare the spreadsheet" subtitle="One row per student. Parents with several children use the same parent email on each row — their children are linked to one parent account.">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn-secondary" onClick={template}><FileSpreadsheet className="w-4 h-4" /> Download Excel template</button>
          <span className="text-xs text-navy-500">Yellow columns are required. Fill “Existing Student ID” and “Year Entered” for returning students so their records keep the same ID.</span>
        </div>
      </Card>
      <Card title="2. Upload the completed file">
        <label className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-navy-200 rounded-xl hover:bg-navy-50 cursor-pointer">
          <Upload className="w-7 h-7 text-navy-500" />
          <span className="text-sm font-medium text-navy-700">{file ? file.name : 'Choose .xlsx or .csv file'}</span>
          <input type="file" className="sr-only" accept=".xlsx,.csv" onChange={(e) => read(e.target.files?.[0] ?? null)} />
        </label>
        {error && <div className="mt-3"><Notice tone="error">{error}</Notice></div>}
      </Card>
      {rows && rows.length > 0 && (
        <Card title="3. Check and import" action={<button type="button" className="btn-primary" disabled={!valid.length} onClick={doImport}>Import {valid.length} student{valid.length === 1 ? '' : 's'}</button>}>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Stat label="Rows found" value={rows.length} />
            <Stat label="Ready to import" value={valid.length} tone="success" />
            <Stat label="Need fixing" value={rows.length - valid.length} tone={rows.length - valid.length ? 'error' : 'success'} />
          </div>
          {rows.length - valid.length > 0 && <div className="mb-3"><Notice tone="warning">Rows with problems are skipped. Fix them in the spreadsheet and upload again, or import the valid rows now.</Notice></div>}
          <Table head={['Row', 'Student', 'Class', 'Student email', 'Parent', 'Parent email', 'Check']}>
            {rows.map((r) => (
              <tr key={r.row} className={r.errors.length ? 'bg-error-50/50' : ''}>
                <td>{r.row}</td><td className="font-medium">{r.data.firstName} {r.data.lastName}</td><td>{r.data.grade ? `Grade ${r.data.grade}${r.data.section}` : '—'}</td>
                <td className="text-xs">{r.data.studentEmail || '—'}</td><td className="text-sm">{r.data.parentName}<p className="text-xs text-navy-500">{r.data.parentPhone}</p></td><td className="text-xs">{r.data.parentEmail || '—'}</td>
                <td className="text-xs">{r.errors.length ? <span className="text-error-700">{r.errors.join('; ')}</span> : <Pill tone="success">Ready</Pill>}{r.warnings.map((w) => <span key={w} className="block text-navy-500">{w}</span>)}</td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
    </div>
  );
}

export function AccountsPanel() {
  const s = useSchool();
  const [q, setQ] = useState('');
  const [role, setRole] = useState<'all' | 'student' | 'parent'>('all');
  const list = useMemo(() => s.accounts.filter((a) => (a.role === 'student' || a.role === 'parent') && (role === 'all' || a.role === role) && `${a.name} ${a.email}`.toLowerCase().includes(q.toLowerCase())), [s.accounts, q, role]);
  const invited = list.filter((a) => a.status === 'invited');
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Portal accounts" value={s.accounts.filter((a) => a.role === 'student' || a.role === 'parent').length} />
        <Stat label="Activated" value={s.accounts.filter((a) => (a.role === 'student' || a.role === 'parent') && a.status === 'active').length} tone="success" />
        <Stat label="Waiting for activation" value={s.accounts.filter((a) => (a.role === 'student' || a.role === 'parent') && a.status === 'invited').length} tone="warning" />
      </div>
      <Card action={<div className="flex flex-wrap gap-2"><div className="w-56"><SearchBox value={q} onChange={setQ} placeholder="Name or email" /></div><select className="input py-2 text-sm w-36" value={role} onChange={(e) => setRole(e.target.value as typeof role)} aria-label="Role"><option value="all">Students and parents</option><option value="student">Students</option><option value="parent">Parents</option></select>{invited.length > 0 && <button type="button" className="btn-secondary text-sm" onClick={() => printHtml('Activation slips', slipHtml(s, invited))}><Printer className="w-4 h-4" /> Print {invited.length} slips</button>}</div>}>
        <Table head={['Name', 'Role', 'Email', 'Linked students', 'Status', 'Activation code', '']} empty="No portal accounts yet. Import students to create them.">
          {list.map((a) => (
            <tr key={a.id}>
              <td className="font-medium">{a.name}</td><td>{a.role === 'parent' ? 'Parent' : 'Student'}</td><td className="text-xs">{a.email}</td>
              <td className="text-xs">{a.studentIds.map((id) => studentById(s, id)?.name).join(', ')}</td>
              <td><Pill tone={a.status === 'active' ? 'success' : a.status === 'invited' ? 'warning' : 'muted'}>{a.status === 'invited' ? 'Not activated' : a.status}</Pill></td>
              <td className="font-mono">{a.status === 'invited' ? a.activationCode : '—'}</td>
              <td className="whitespace-nowrap">
                <button type="button" className="text-xs text-navy-700 hover:underline mr-3" onClick={() => { if (window.confirm(`Reset access for ${a.email}? They will need a new activation code and must choose a new password.`)) actions.resetAccess(a.id); }}><RotateCcw className="inline w-3 h-3" /> Reset access</button>
                <button type="button" className="text-xs text-navy-700 hover:underline" onClick={() => actions.setAccountStatus(a.id, a.status === 'disabled' ? 'invited' : 'disabled')}>{a.status === 'disabled' ? 'Enable' : 'Disable'}</button>
              </td>
            </tr>
          ))}
        </Table>
        <p className="text-xs text-navy-400 mt-3">Passwords are created by each student or parent and are never visible to the school. Created {fmtDate(new Date().toISOString())}.</p>
      </Card>
    </div>
  );
}

export function RegistrationHeader() {
  return <Header title="Student Registration" subtitle="Register one student, or import a whole class list from Excel. Student IDs, fee accounts and portal accounts are created automatically." />;
}
