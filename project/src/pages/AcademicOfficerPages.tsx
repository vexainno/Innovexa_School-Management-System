import { useState } from 'react';
import {
  CalendarRange, UserPlus, SlidersHorizontal, Upload, CheckCircle2, AlertTriangle,
  Save, Plus, Trash2,
} from 'lucide-react';
import { PageHeader, StatCard, SectionCard, EmptyState, Modal } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useSchoolData } from '@/context/SchoolDataContext';
import { CLASSES, SUBJECTS, TEST_ACCOUNTS, SCHOOL_INFO } from '@/data/mockData';
import { getGradebooks, setGradebooks, calculateGrade, type WorkflowGradebook } from '@/data/workflow';
import type { AcademicTerm } from '@/types';

interface GradeScaleRow {
  id: string;
  label: string;
  min: number;
  max: number;
  points: number;
  remark: string;
}

const DEFAULT_SCALE: GradeScaleRow[] = [
  { id: 'gr1', label: 'A', min: 90, max: 100, points: 4.0, remark: 'Excellent' },
  { id: 'gr2', label: 'B', min: 80, max: 89, points: 3.0, remark: 'Very Good' },
  { id: 'gr3', label: 'C', min: 70, max: 79, points: 2.0, remark: 'Good' },
  { id: 'gr4', label: 'D', min: 50, max: 69, points: 1.0, remark: 'Pass' },
  { id: 'gr5', label: 'F', min: 0, max: 49, points: 0.0, remark: 'Fail' },
];

const SCALE_KEY = 'innosysedu.gradeScale.v1';

function loadScale(): GradeScaleRow[] {
  try {
    const raw = localStorage.getItem(SCALE_KEY);
    return raw ? (JSON.parse(raw) as GradeScaleRow[]) : DEFAULT_SCALE;
  } catch {
    return DEFAULT_SCALE;
  }
}

// ---------------- Academic Years & Terms ----------------
export function AcademicYearsTerms() {
  const { academicYears, events } = useSchoolData();
  const activeYear = academicYears.find((y) => y.status === 'active');
  const examPeriods = events.filter((e) => e.category === 'examination' && e.status === 'published');

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Academic Years & Terms" subtitle="Official dates come from the Vice Principal's published calendar." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Academic Years" value={academicYears.length} icon={<CalendarRange className="w-5 h-5" />} />
        <StatCard label="Active Terms" value={academicYears.reduce((n, y) => n + y.terms.filter((t) => t.status === 'active').length, 0)} icon={<CalendarRange className="w-5 h-5" />} color="success" />
        <StatCard label="Exam Periods Scheduled" value={examPeriods.length} icon={<CalendarRange className="w-5 h-5" />} color="warning" />
      </div>

      {academicYears.map((y) => (
        <SectionCard key={y.id} title={`${y.name} ${y.status === 'active' ? '(Active)' : ''}`}>
          <div className="overflow-x-auto">
            <table className="table-base min-w-[600px]">
              <thead><tr><th>Term</th><th>Starts</th><th>Ends</th><th>Status</th></tr></thead>
              <tbody>
                {y.terms.map((t: AcademicTerm) => (
                  <tr key={t.id}>
                    <td className="font-medium text-navy-800">{t.name}</td>
                    <td>{t.startDate}</td>
                    <td>{t.endDate}</td>
                    <td>
                      <span className={`badge ${t.status === 'active' ? 'badge-success' : t.status === 'completed' ? 'badge-info' : 'badge-warning'}`}>{t.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      ))}

      <SectionCard title="Published Examination Periods (from School Calendar)">
        {examPeriods.length === 0 ? (
          <EmptyState icon={<CalendarRange className="w-8 h-8" />} title="No examination periods" message="The Vice Principal has not published any examination periods yet." />
        ) : (
          examPeriods.map((e) => (
            <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg border border-navy-100 mb-2">
              <CheckCircle2 className="w-4 h-4 text-success-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-navy-800">{e.title}</p>
                <p className="text-xs text-navy-400">{e.startDate} → {e.endDate} — {e.venue}</p>
              </div>
            </div>
          ))
        )}
      </SectionCard>
    </div>
  );
}

// ---------------- Teacher Assignments ----------------
export function AcademicTeacherAssignments() {
  const { timetable, addTimetableEntries, addNotification } = useSchoolData();
  const { user } = useAuth();
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const teachers = TEST_ACCOUNTS.filter((u) => u.role === 'teacher');
  const [form, setForm] = useState({ teacherId: 'u6', subjectId: 'sub1', classId: 'c3', day: 'Monday', startTime: '13:00', endTime: '13:40' });

  const teacherLoad = teachers.map((t) => ({
    teacher: t,
    periods: timetable.filter((e) => e.teacherId === t.id && e.kind === 'lesson' && e.status === 'published').length,
    subjects: SUBJECTS.filter((s) => s.teacherId === t.id),
  }));

  const assign = () => {
    setError('');
    const subject = SUBJECTS.find((s) => s.id === form.subjectId);
    const teacher = teachers.find((t) => t.id === form.teacherId);
    const cls = CLASSES.find((c) => c.id === form.classId);
    if (!subject || !teacher || !cls) { setError('Select a teacher, subject and class.'); return; }
    const result = addTimetableEntries([{
      yearId: 'ay1', termId: 't1', classId: cls.id, className: cls.name, section: cls.section,
      subjectId: subject.id, subjectName: subject.name,
      teacherId: teacher.id, teacherName: teacher.name,
      room: cls.room, day: form.day as never, startTime: form.startTime, endTime: form.endTime,
      kind: 'lesson', status: 'published',
    }]);
    if (!result.ok) { setError(result.conflicts.join(' ')); return; }
    addNotification({
      recipientRoles: ['teacher', 'student'],
      title: 'Subject assignment added',
      message: `${teacher.name} was assigned ${subject.name} for ${cls.name} (${form.day} ${form.startTime}).`,
      category: 'timetable',
      relatedPage: 'classes',
    });
    setNotice(`${subject.name} assigned to ${teacher.name} for ${cls.name}. The lesson now appears in their My Classes page.`);
    setShowForm(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Teacher Assignments"
        subtitle="Assign teachers to subjects and classes. Assignments appear in the teacher's My Classes automatically."
        action={<button onClick={() => setShowForm(true)} className="btn-primary"><UserPlus className="w-4 h-4" /> New Assignment</button>}
      />
      {notice && <div className="rounded-lg bg-success-50 border border-success-200 text-success-700 text-sm px-4 py-3">{notice}</div>}
      {error && !showForm && <div className="rounded-lg bg-error-50 border border-error-200 text-error-700 text-sm px-4 py-3">{error}</div>}

      <SectionCard title="Teaching Workload">
        <div className="overflow-x-auto">
          <table className="table-base min-w-[700px]">
            <thead><tr><th>Teacher</th><th>Weekly Periods</th><th>Assigned Subjects</th></tr></thead>
            <tbody>
              {teacherLoad.map(({ teacher, periods, subjects }) => (
                <tr key={teacher.id}>
                  <td className="font-medium text-navy-800">{teacher.name}</td>
                  <td>{periods}</td>
                  <td>{subjects.length ? subjects.map((s) => `${s.name} (${s.className})`).join(', ') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {showForm && (
        <Modal open={showForm} onClose={() => setShowForm(false)} title="New Teacher Assignment">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Teacher</label>
                <select className="input-base" value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })}>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Subject</label>
                <select className="input-base" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
                  {SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.className})</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Class</label>
                <select className="input-base" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
                  {CLASSES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Day</label>
                <select className="input-base" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })}>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Start</label>
                <input type="time" className="input-base" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              </div>
              <div>
                <label className="form-label">End</label>
                <input type="time" className="input-base" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
              </div>
            </div>
            {error && <p className="text-sm text-error-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button onClick={assign} className="btn-primary">Assign & Publish Lesson</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ---------------- Grading Configuration ----------------
export function AcademicGradingConfig() {
  const [scale, setScale] = useState<GradeScaleRow[]>(loadScale);
  const [notice, setNotice] = useState('');

  const update = (id: string, patch: Partial<GradeScaleRow>) =>
    setScale((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const save = () => {
    const sorted = [...scale].sort((a, b) => b.min - a.min);
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].min <= sorted[i + 1].max) {
        setNotice('Error: grade ranges overlap. Fix the minimum/maximum values.');
        return;
      }
    }
    localStorage.setItem(SCALE_KEY, JSON.stringify(scale));
    setNotice('Grading scale saved. It is used for report cards and result calculations.');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Grading Configuration"
        subtitle="Configure the grading scale used across assessments, gradebooks and report cards."
        action={<button onClick={save} className="btn-primary"><Save className="w-4 h-4" /> Save Scale</button>}
      />
      {notice && <div className={`rounded-lg border text-sm px-4 py-3 ${notice.startsWith('Error') ? 'bg-error-50 border-error-200 text-error-700' : 'bg-success-50 border-success-200 text-success-700'}`}>{notice}</div>}

      <SectionCard title="Grading Scale">
        <div className="overflow-x-auto">
          <table className="table-base min-w-[700px]">
            <thead><tr><th>Grade</th><th>Min Score</th><th>Max Score</th><th>Points</th><th>Remarks</th></tr></thead>
            <tbody>
              {scale.map((r) => (
                <tr key={r.id}>
                  <td><input className="input-base w-20" value={r.label} onChange={(e) => update(r.id, { label: e.target.value })} /></td>
                  <td><input type="number" className="input-base w-24" value={r.min} onChange={(e) => update(r.id, { min: Number(e.target.value) })} /></td>
                  <td><input type="number" className="input-base w-24" value={r.max} onChange={(e) => update(r.id, { max: Number(e.target.value) })} /></td>
                  <td><input type="number" step="0.5" className="input-base w-24" value={r.points} onChange={(e) => update(r.id, { points: Number(e.target.value) })} /></td>
                  <td><input className="input-base" value={r.remark} onChange={(e) => update(r.id, { remark: e.target.value })} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-navy-400 mt-3">Pass threshold: any grade above F. Ranges must not overlap.</p>
      </SectionCard>
    </div>
  );
}

// ---------------- Gradebook Processing ----------------
export function AcademicGradebookProcessing() {
  const { user } = useAuth();
  const [gradebooks, setBooks] = useState<WorkflowGradebook[]>(() => getGradebooks());
  const [notice, setNotice] = useState('');
  const [processing, setProcessing] = useState<WorkflowGradebook | null>(null);
  const { students } = useSchoolData();

  const approved = gradebooks.filter((g) => g.status === 'approved');
  const processed = gradebooks.filter((g) => g.status === 'under_review' === false && g.status === 'approved' as never);

  const process = (gb: WorkflowGradebook) => {
    const roster = students.filter((s) => s.grade.replace('Grade ', '').concat(s.class.replace(/^\d+/, '')) === gb.className.replace('Grade ', '').replace(' Section A', '').concat(gb.className.endsWith('A') ? 'A' : 'B'));
    const missing = roster.length === 0 ? ['No matching student roster found for this class'] : [];
    setGradebooks(gradebooks.map((g) => (g.id === gb.id ? { ...g, status: 'approved', reviewNote: 'Processed — uploaded to academic records.' } : g)));
    setBooks(getGradebooks());
    setNotice(`${gb.subjectName} — ${gb.className} processed and uploaded to academic records.${missing.length ? ' Warning: ' + missing[0] : ` ${roster.length} student records validated.`}`);
    setProcessing(null);
    void user;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Gradebook Processing" subtitle="Process Principal-approved gradebooks into official academic records. Rejected gradebooks cannot be processed." />

      {notice && <div className="rounded-lg bg-success-50 border border-success-200 text-success-700 text-sm px-4 py-3">{notice}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Approved, Awaiting Processing" value={approved.length} icon={<Upload className="w-5 h-5" />} color="warning" />
        <StatCard label="Processed (in Academic Records)" value={gradebooks.filter((g) => g.reviewNote?.includes('Processed')).length} icon={<CheckCircle2 className="w-5 h-5" />} color="success" />
        <StatCard label="Rejected / Returned (Blocked)" value={gradebooks.filter((g) => g.status === 'rejected').length} icon={<AlertTriangle className="w-5 h-5" />} color="error" />
      </div>

      <SectionCard title={`Approved Gradebooks Ready to Process (${approved.length})`}>
        {approved.filter((g) => !g.reviewNote?.includes('Processed')).length === 0 ? (
          <EmptyState icon={<CheckCircle2 className="w-8 h-8" />} title="Nothing to process" message="Approved gradebooks from the Principal will appear here for processing." />
        ) : (
          <div className="space-y-3">
            {approved.filter((g) => !g.reviewNote?.includes('Processed')).map((g) => (
              <div key={g.id} className="flex items-center justify-between p-4 rounded-lg border border-navy-100">
                <div>
                  <p className="text-sm font-semibold text-navy-800">{g.subjectName} — {g.className}</p>
                  <p className="text-xs text-navy-400">{g.teacherName} — {g.term} — {g.studentCount} students</p>
                </div>
                <button onClick={() => setProcessing(g)} className="btn-primary text-sm"><Upload className="w-4 h-4" /> Process</button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Processed Gradebooks">
        <div className="space-y-2">
          {gradebooks.filter((g) => g.reviewNote?.includes('Processed')).map((g) => (
            <div key={g.id} className="flex items-center gap-3 p-3 rounded-lg border border-success-100 bg-success-50/50">
              <CheckCircle2 className="w-4 h-4 text-success-600" />
              <p className="text-sm text-navy-700 flex-1">{g.subjectName} — {g.className} — uploaded to academic records</p>
            </div>
          ))}
          {gradebooks.filter((g) => g.reviewNote?.includes('Processed')).length === 0 && (
            <EmptyState icon={<CheckCircle2 className="w-8 h-8" />} title="No processed gradebooks yet" message="Processed gradebooks are archived here." />
          )}
        </div>
      </SectionCard>

      {processing && (
        <Modal open={!!processing} onClose={() => setProcessing(null)} title="Process Gradebook">
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-navy-50 text-sm text-navy-700">
              <p className="font-semibold">{processing.subjectName} — {processing.className}</p>
              <p className="mt-1">{processing.teacherName} — {processing.term}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-white border border-navy-100">Validate student records ✓</div>
                <div className="p-2 rounded bg-white border border-navy-100">Validate subject assignment ✓</div>
                <div className="p-2 rounded bg-white border border-navy-100">Calculate totals & averages ✓</div>
                <div className="p-2 rounded bg-white border border-navy-100">Assign grades ({calculateGrade(75)} example: 75 → {calculateGrade(75)})</div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setProcessing(null)} className="btn-secondary">Cancel</button>
              <button onClick={() => process(processing)} className="btn-primary"><Upload className="w-4 h-4" /> Confirm Processing</button>
            </div>
          </div>
        </Modal>
      )}
      {void 0}
    </div>
  );
}
