import { useMemo, useRef, useState } from 'react';
import {
  UserPlus, FileUp, CheckCircle2, AlertTriangle, GraduationCap, LogOut,
  Link2, Plus, Search, Users, Ban,
} from 'lucide-react';
import { PageHeader, StatCard, SectionCard, EmptyState, Modal } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useSchoolData, makeId } from '@/context/SchoolDataContext';
import { CLASSES, TEST_ACCOUNTS } from '@/data/mockData';
import type { GuardianLink, Student } from '@/types';

const GRADES = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];

function nextRollNo(students: Student[], grade: string, section: string): string {
  const num = grade.replace('Grade ', '');
  const peers = students.filter((s) => s.grade === grade && s.class.startsWith(num));
  return `${num}${section}-${String(peers.length + 1).padStart(3, '0')}`;
}

// ---------------- Register Student ----------------
export function RegistrarRegisterStudent() {
  const { students, addStudent, addNotification } = useSchoolData();
  const { user } = useAuth();
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [created, setCreated] = useState<Student | null>(null);
  const [form, setForm] = useState({
    firstName: '', middleName: '', lastName: '', dob: '', gender: 'M' as 'M' | 'F',
    nationality: 'Liberian', guardianName: '', relationship: 'Parent',
    guardianPhone: '', guardianEmail: '', grade: 'Grade 10', section: 'A',
    previousSchool: '', medicalAlerts: '',
  });

  const grade = form.grade;
  const classInfo = CLASSES.find((c) => c.grade === grade && c.section === form.section);

  const submit = () => {
    setError('');
    if (!form.firstName.trim() || !form.lastName.trim() || !form.dob) {
      setError('First name, last name and date of birth are required.');
      return;
    }
    if (!form.guardianName.trim() || !form.guardianPhone.trim()) {
      setError('Guardian name and phone number are required.');
      return;
    }
    if (!classInfo) {
      setError('Selected class does not exist.');
      return;
    }
    const age = new Date().getFullYear() - Number(form.dob.slice(0, 4));
    const student = addStudent({
      name: `${form.firstName} ${form.middleName ? form.middleName + ' ' : ''}${form.lastName}`.trim(),
      grade: form.grade,
      class: `${grade.replace('Grade ', '')}${form.section}`,
      rollNo: nextRollNo(students, grade, form.section),
      gender: form.gender,
      age,
      guardianName: form.guardianName,
      guardianPhone: form.guardianPhone,
      status: 'active',
      enrolledDate: new Date().toISOString().slice(0, 10),
    });
    setCreated(student);
    setNotice('');
    addNotification({
      recipientRoles: ['principal', 'academic_officer'],
      title: 'New student registered',
      message: `${student.name} was enrolled in ${form.grade} Section ${form.section} by the Registrar.`,
      category: 'registration',
      relatedPage: 'students',
    });
  };

  const reset = () => {
    setCreated(null);
    setForm({
      firstName: '', middleName: '', lastName: '', dob: '', gender: 'M', nationality: 'Liberian',
      guardianName: '', relationship: 'Parent', guardianPhone: '', guardianEmail: '',
      grade: 'Grade 10', section: 'A', previousSchool: '', medicalAlerts: '',
    });
  };

  if (created) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Registration Complete" subtitle="The student record is now shared across all portals." />
        <div className="card p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-success-50 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-success-600" />
          </div>
          <h2 className="text-xl font-bold text-navy-900">{created.name}</h2>
          <p className="text-sm text-navy-500 mt-1">Student ID: <strong>{created.rollNo}</strong> — {created.grade} Section {created.class.slice(-1)}</p>
          <div className="mt-6 max-w-md mx-auto text-left space-y-2 text-sm text-navy-600 bg-navy-50 rounded-xl p-4">
            <p>This record is now visible in:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Teacher class rosters for {created.grade}</li>
              <li>Academic Officer enrollment records</li>
              <li>Principal enrollment statistics</li>
              <li>The student's own portal after first sign-in</li>
            </ul>
          </div>
          <div className="flex justify-center gap-3 mt-6">
            <button onClick={reset} className="btn-primary"><UserPlus className="w-4 h-4" /> Register Another Student</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Register Student" subtitle="Complete admission form. Fields marked * are required." />
      {error && <div className="rounded-lg bg-error-50 border border-error-200 text-error-700 text-sm px-4 py-3">{error}</div>}
      {notice && <div className="rounded-lg bg-success-50 border border-success-200 text-success-700 text-sm px-4 py-3">{notice}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Personal Details">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">First Name *</label><input className="input-base" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
            <div><label className="form-label">Middle Name</label><input className="input-base" value={form.middleName} onChange={(e) => setForm({ ...form, middleName: e.target.value })} /></div>
            <div><label className="form-label">Last Name *</label><input className="input-base" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
            <div><label className="form-label">Date of Birth *</label><input type="date" className="input-base" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} /></div>
            <div>
              <label className="form-label">Gender</label>
              <select className="input-base" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as 'M' | 'F' })}>
                <option value="M">Male</option><option value="F">Female</option>
              </select>
            </div>
            <div><label className="form-label">Nationality</label><input className="input-base" value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} /></div>
          </div>
        </SectionCard>

        <SectionCard title="Guardian Details">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Guardian Name *</label><input className="input-base" value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} /></div>
            <div>
              <label className="form-label">Relationship</label>
              <select className="input-base" value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })}>
                {['Mother', 'Father', 'Aunt', 'Uncle', 'Grandparent', 'Other Relative', 'Guardian'].map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div><label className="form-label">Phone *</label><input className="input-base" value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} placeholder="+231 ..." /></div>
            <div><label className="form-label">Email</label><input type="email" className="input-base" value={form.guardianEmail} onChange={(e) => setForm({ ...form, guardianEmail: e.target.value })} /></div>
          </div>
        </SectionCard>

        <SectionCard title="Academic Placement">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Grade</label>
              <select className="input-base" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}>
                {GRADES.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Section</label>
              <select className="input-base" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}>
                <option>A</option><option>B</option>
              </select>
            </div>
            <div className="col-span-2 p-3 rounded-lg bg-navy-50 text-sm text-navy-600">
              Class: <strong>{classInfo?.name || '—'}</strong> · Room: {classInfo?.room || '—'} · Class teacher: {classInfo?.teacherName || '—'}
              <br />Auto-generated roll number: <strong>{nextRollNo(students, grade, form.section)}</strong>
            </div>
            <div className="col-span-2"><label className="form-label">Previous School</label><input className="input-base" value={form.previousSchool} onChange={(e) => setForm({ ...form, previousSchool: e.target.value })} /></div>
            <div className="col-span-2"><label className="form-label">Medical Alerts (optional, restricted visibility)</label><textarea className="input-base" rows={2} value={form.medicalAlerts} onChange={(e) => setForm({ ...form, medicalAlerts: e.target.value })} /></div>
          </div>
        </SectionCard>

        <SectionCard title="Review & Submit">
          <div className="space-y-3 text-sm text-navy-600">
            <p>Submitting this form will:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Generate a unique student ID and roll number</li>
              <li>Add the student to the {classInfo?.name || 'selected'} class roster immediately</li>
              <li>Notify the Principal and Academic Officer</li>
              <li>Make the record available for guardian linking</li>
            </ul>
            <p className="text-xs text-navy-400">The student's guardian can only see this record after exchanging a verified invitation code.</p>
            <button onClick={submit} className="btn-primary w-full"><UserPlus className="w-4 h-4" /> Register Student</button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

// ---------------- Bulk Import ----------------
interface ImportRow {
  name: string; grade: string; gender: string; guardianName: string; guardianPhone: string;
  errors: string[]; duplicate: boolean;
}

export function RegistrarBulkImport() {
  const { students, addStudent, addNotification } = useSchoolData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [fileName, setFileName] = useState('');
  const [imported, setImported] = useState(0);
  const [mapping, setMapping] = useState({ name: 'name', grade: 'grade', gender: 'gender', guardianName: 'guardian', guardianPhone: 'phone' });

  const handleFile = (file: File) => {
    setFileName(file.name);
    setImported(0);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) { setRows([]); return; }
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const parsed: ImportRow[] = lines.slice(1).map((line) => {
        const cols = line.split(',').map((c) => c.trim());
        const get = (key: keyof typeof mapping) => cols[headers.indexOf(mapping[key])] || '';
        const row: ImportRow = {
          name: get('name'), grade: get('grade'), gender: get('gender').toUpperCase().startsWith('F') ? 'F' : 'M',
          guardianName: get('guardianName'), guardianPhone: get('guardianPhone'), errors: [], duplicate: false,
        };
        if (!row.name) row.errors.push('Name is required');
        if (!GRADES.includes(row.grade)) row.errors.push(`Grade must be one of: ${GRADES.join(', ')}`);
        if (!row.guardianName) row.errors.push('Guardian name is required');
        if (!row.guardianPhone) row.errors.push('Guardian phone is required');
        row.duplicate = students.some((s) => s.name.toLowerCase() === row.name.toLowerCase());
        if (row.duplicate) row.errors.push('Duplicate name already exists');
        return row;
      });
      setRows(parsed);
    };
    reader.readAsText(file);
  };

  const validRows = rows?.filter((r) => r.errors.length === 0) || [];
  const invalidRows = rows?.filter((r) => r.errors.length > 0) || [];

  const doImport = () => {
    validRows.forEach((r) => {
      const cls = CLASSES.find((c) => c.grade === r.grade);
      addStudent({
        name: r.name, grade: r.grade,
        class: cls ? `${r.grade.replace('Grade ', '')}${cls.section}` : `${r.grade.replace('Grade ', '')}A`,
        rollNo: nextRollNo(students, r.grade, 'A'),
        gender: r.gender as 'M' | 'F',
        age: 12,
        guardianName: r.guardianName, guardianPhone: r.guardianPhone,
        status: 'active', enrolledDate: new Date().toISOString().slice(0, 10),
      });
    });
    setImported(validRows.length);
    addNotification({
      recipientRoles: ['principal', 'academic_officer'],
      title: 'Bulk import completed',
      message: `${validRows.length} students imported from CSV by the Registrar.`,
      category: 'registration',
      relatedPage: 'students',
    });
  };

  const downloadTemplate = () => {
    const csv = 'name,grade,gender,guardian,phone\nTest Student A,Grade 9,M,Guardian Name,+231 77 000 0000\nTest Student B,Grade 10,F,Guardian Name,+231 88 000 0000\n';
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'student-import-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Bulk Import"
        subtitle="Import students from a CSV file. Invalid rows are reported and never imported silently."
        action={<button onClick={downloadTemplate} className="btn-secondary">Download Template</button>}
      />

      <SectionCard title="1. Select File">
        <button onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-navy-200 rounded-xl py-10 text-center hover:border-navy-400 transition-colors">
          <FileUp className="mx-auto text-navy-300 mb-2" size={32} />
          <p className="text-sm font-medium text-navy-700">{fileName || 'Click to browse a CSV file'}</p>
          <p className="text-xs text-navy-400 mt-1">Columns: name, grade, gender, guardian, phone</p>
        </button>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </SectionCard>

      {rows && (
        <SectionCard title="2. Column Mapping">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(mapping).map(([field, col]) => (
              <div key={field}>
                <label className="form-label">{field}</label>
                <select className="input-base" value={col} onChange={(e) => setMapping({ ...mapping, [field]: e.target.value })}>
                  {['name', 'grade', 'gender', 'guardian', 'phone', '— ignore —'].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {rows && (
        <SectionCard title={`3. Preview & Validate (${validRows.length} valid, ${invalidRows.length} with errors)`}>
          <div className="overflow-x-auto">
            <table className="table-base min-w-[800px]">
              <thead><tr><th>Name</th><th>Grade</th><th>Gender</th><th>Guardian</th><th>Phone</th><th>Validation</th></tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td className="font-medium text-navy-800">{r.name || '—'}</td>
                    <td>{r.grade || '—'}</td>
                    <td>{r.gender}</td>
                    <td>{r.guardianName || '—'}</td>
                    <td>{r.guardianPhone || '—'}</td>
                    <td>
                      {r.errors.length === 0 ? (
                        <span className="badge badge-success">OK</span>
                      ) : (
                        <span className="badge badge-error">{r.errors.join('; ')}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setRows(null)} className="btn-secondary">Cancel</button>
            <button onClick={doImport} disabled={validRows.length === 0} className="btn-primary">
              Import {validRows.length} Students
            </button>
          </div>
        </SectionCard>
      )}

      {imported > 0 && (
        <div className="rounded-lg bg-success-50 border border-success-200 text-success-700 text-sm px-4 py-3">
          Import complete — {imported} students registered. {invalidRows.length > 0 && `${invalidRows.length} rows were skipped due to validation errors.`}
        </div>
      )}
    </div>
  );
}

// ---------------- Promotion ----------------
export function RegistrarPromotion() {
  const { students, updateStudent, addNotification } = useSchoolData();
  const [selected, setSelected] = useState<string[]>([]);
  const [notice, setNotice] = useState('');

  const toggle = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const activeByGrade = GRADES.map((g) => ({ grade: g, list: students.filter((s) => s.grade === g && s.status === 'active') }));

  const promoteSelected = () => {
    selected.forEach((id) => {
      const s = students.find((x) => x.id === id);
      if (!s) return;
      const idx = GRADES.indexOf(s.grade);
      if (idx >= GRADES.length - 1) {
        updateStudent(id, { status: 'inactive' });
      } else {
        updateStudent(id, { grade: GRADES[idx + 1] });
      }
    });
    addNotification({
      recipientRoles: ['principal', 'academic_officer', 'teacher'],
      title: 'Students promoted',
      message: `${selected.length} student(s) promoted by the Registrar.`,
      category: 'registration',
      relatedPage: 'students',
    });
    setNotice(`${selected.length} student(s) promoted. Grade 12 graduates are marked as completed.`);
    setSelected([]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Student Promotion"
        subtitle="Review eligibility and promote students to the next grade. Historical records are preserved."
        action={
          <button onClick={promoteSelected} disabled={selected.length === 0} className="btn-primary">
            <GraduationCap className="w-4 h-4" /> Promote Selected ({selected.length})
          </button>
        }
      />
      {notice && <div className="rounded-lg bg-success-50 border border-success-200 text-success-700 text-sm px-4 py-3">{notice}</div>}

      {activeByGrade.map(({ grade, list }) => (
        <SectionCard key={grade} title={`${grade} (${list.length} active)`}>
          {list.length === 0 ? (
            <EmptyState icon={<GraduationCap className="w-6 h-6" />} title="No active students" message="No students in this grade." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {list.map((s) => (
                <label key={s.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${selected.includes(s.id) ? 'border-navy-400 bg-navy-50' : 'border-navy-100 hover:border-navy-200'}`}>
                  <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggle(s.id)} className="rounded" />
                  <div>
                    <p className="text-sm font-medium text-navy-800">{s.name}</p>
                    <p className="text-xs text-navy-400">{s.class} — {s.rollNo}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </SectionCard>
      ))}
    </div>
  );
}

// ---------------- Withdrawal ----------------
export function RegistrarWithdrawal() {
  const { students, updateStudent, addNotification } = useSchoolData();
  const [target, setTarget] = useState<Student | null>(null);
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState('');
  const withdrawn = students.filter((s) => s.status === 'transferred' || s.status === 'inactive');

  const confirm = () => {
    if (!target || !reason.trim()) return;
    updateStudent(target.id, { status: 'transferred' });
    addNotification({
      recipientRoles: ['principal', 'academic_officer', 'teacher'],
      title: 'Student withdrawn',
      message: `${target.name} was withdrawn from school. Reason: ${reason}`,
      category: 'registration',
      relatedPage: 'students',
    });
    setNotice(`${target.name} marked as withdrawn. Historical academic and financial records are preserved.`);
    setTarget(null);
    setReason('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Student Withdrawal" subtitle="Record withdrawals without deleting any historical records." />
      {notice && <div className="rounded-lg bg-success-50 border border-success-200 text-success-700 text-sm px-4 py-3">{notice}</div>}

      <SectionCard title={`Active Students (${students.filter((s) => s.status === 'active').length})`}>
        <div className="overflow-x-auto">
          <table className="table-base min-w-[700px]">
            <thead><tr><th>Student</th><th>Class</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {students.filter((s) => s.status === 'active').map((s) => (
                <tr key={s.id}>
                  <td className="font-medium text-navy-800">{s.name}</td>
                  <td>{s.grade} {s.class}</td>
                  <td><span className="badge badge-success">{s.status}</span></td>
                  <td><button onClick={() => setTarget(s)} className="btn-secondary text-xs py-1.5 px-3 text-error-600 border-error-200 hover:bg-error-50">Withdraw</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title={`Withdrawn / Transferred (${withdrawn.length})`}>
        {withdrawn.length === 0 ? (
          <EmptyState icon={<LogOut className="w-8 h-8" />} title="No withdrawn students" message="Withdrawn students are archived here, never deleted." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base min-w-[600px]">
              <thead><tr><th>Student</th><th>Class</th><th>Status</th><th>Enrolled</th></tr></thead>
              <tbody>
                {withdrawn.map((s) => (
                  <tr key={s.id}>
                    <td className="font-medium text-navy-800">{s.name}</td>
                    <td>{s.grade} {s.class}</td>
                    <td><span className="badge badge-info">{s.status}</span></td>
                    <td>{s.enrolledDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {target && (
        <Modal open={!!target} onClose={() => setTarget(null)} title="Confirm Withdrawal" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-navy-600">Withdraw <strong>{target.name}</strong> from school? Their records will be archived, not deleted.</p>
            <div>
              <label className="form-label">Reason *</label>
              <textarea className="input-base" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Family relocation" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setTarget(null)} className="btn-secondary">Cancel</button>
              <button onClick={confirm} className="btn-danger"><Ban className="w-4 h-4" /> Confirm Withdrawal</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ---------------- Guardian Links ----------------
export function RegistrarGuardianLinks() {
  const { guardianLinks, addGuardianLink, updateGuardianLink, students, addNotification } = useSchoolData();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ guardianUserId: 'u12', studentId: '', relationship: 'Mother' });

  const parentUsers = TEST_ACCOUNTS.filter((u) => u.role === 'parent');
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return guardianLinks.filter(
      (l) => l.studentName.toLowerCase().includes(q) || l.guardianName.toLowerCase().includes(q) || l.code.toLowerCase().includes(q),
    );
  }, [guardianLinks, search]);

  const createLink = () => {
    const student = students.find((s) => s.id === form.studentId);
    const guardian = parentUsers.find((u) => u.id === form.guardianUserId);
    if (!student || !guardian) {
      setNotice('Select both a guardian and a student.');
      return;
    }
    if (guardianLinks.some((l) => l.guardianUserId === form.guardianUserId && l.studentId === form.studentId && l.status === 'linked')) {
      setNotice('This guardian is already linked to this student.');
      return;
    }
    const code = `INV-${makeId('c').toUpperCase().slice(0, 8)}`;
    const expires = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    addGuardianLink({
      guardianUserId: guardian.id, guardianName: guardian.name,
      studentId: student.id, studentName: student.name,
      relationship: form.relationship, status: 'pending', code, codeExpires: expires,
    });
    addNotification({
      recipientRoles: ['parent'],
      recipientUserIds: [guardian.id],
      title: 'Guardian invitation created',
      message: `An invitation code for ${student.name} was generated. Share it securely with the guardian.`,
      category: 'registration',
      relatedPage: 'children',
    });
    setNotice(`Invitation created. Code: ${code} (expires ${expires}, single use). The guardian must enter this code to gain access.`);
    setShowForm(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Guardian Linking"
        subtitle="Guardians can only access a student through a unique, single-use, time-limited invitation code."
        action={<button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4" /> New Invitation</button>}
      />
      {notice && <div className="rounded-lg bg-success-50 border border-success-200 text-success-700 text-sm px-4 py-3">{notice}</div>}

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 w-4 h-4" />
        <input className="input-base pl-10" placeholder="Search guardian, student or code" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <SectionCard title={`Linking Records (${filtered.length})`}>
        {filtered.length === 0 ? (
          <EmptyState icon={<Link2 className="w-8 h-8" />} title="No linking records" message="Create an invitation to link a guardian to a student." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base min-w-[900px]">
              <thead><tr><th>Guardian</th><th>Student</th><th>Relationship</th><th>Code</th><th>Expires</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id}>
                    <td className="font-medium text-navy-800">{l.guardianName}</td>
                    <td>{l.studentName}</td>
                    <td>{l.relationship}</td>
                    <td className="font-mono text-xs">{l.code}</td>
                    <td>{l.codeExpires}</td>
                    <td>
                      <span className={`badge ${l.status === 'linked' ? 'badge-success' : l.status === 'pending' ? 'badge-warning' : 'badge-error'}`}>{l.status}</span>
                    </td>
                    <td>
                      {l.status === 'pending' && (
                        <button
                          onClick={() => {
                            updateGuardianLink(l.id, { status: 'linked' });
                            addNotification({
                              recipientRoles: ['principal', 'registrar'],
                              title: 'Guardian linked',
                              message: `${l.guardianName} verified the code and is now linked to ${l.studentName}.`,
                              category: 'registration',
                              relatedPage: 'guardian-links',
                            });
                            setNotice(`${l.guardianName} is now linked to ${l.studentName}.`);
                          }}
                          className="btn-primary text-xs py-1.5 px-3"
                        >
                          Simulate Verification
                        </button>
                      )}
                      {l.status === 'linked' && (
                        <button
                          onClick={() => { updateGuardianLink(l.id, { status: 'revoked' }); setNotice(`Access revoked for ${l.guardianName} → ${l.studentName}.`); }}
                          className="btn-secondary text-xs py-1.5 px-3 text-error-600 border-error-200 hover:bg-error-50"
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {showForm && (
        <Modal open={showForm} onClose={() => setShowForm(false)} title="New Guardian Invitation">
          <div className="space-y-4">
            <div>
              <label className="form-label">Guardian Account</label>
              <select className="input-base" value={form.guardianUserId} onChange={(e) => setForm({ ...form, guardianUserId: e.target.value })}>
                {parentUsers.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Student</label>
              <select className="input-base" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
                <option value="">— select student —</option>
                {students.filter((s) => s.status === 'active').map((s) => <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Relationship</label>
              <select className="input-base" value={form.relationship} onChange={(e) => setForm({ ...form, relationship: e.target.value })}>
                {['Mother', 'Father', 'Aunt', 'Uncle', 'Grandparent', 'Other Relative', 'Guardian'].map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button onClick={createLink} className="btn-primary"><Users className="w-4 h-4" /> Create Invitation</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
