import type { AttendanceRecord, DisciplineCase, GradebookSubmission, Role, SystemUser } from '@/types';
import { ATTENDANCE, DISCIPLINE_CASES, GRADEBOOK_SUBMISSIONS, SYSTEM_USERS, CLASSES, SUBJECTS, STUDENTS } from '@/data/mockData';

export const WORKFLOW_KEYS = {
  gradebooks: 'innosysedu.gradebooks.v2',
  attendance: 'innosysedu.attendance.v2',
  discipline: 'innosysedu.discipline.v2',
  users: 'innosysedu.users.v2',
  classAssignments: 'innosysedu.classAssignments.v2',
  reportRelease: 'innosysedu.reportRelease.v2',
  reportCards: 'innosysedu.reportCards.v2',
  documents: 'innosysedu.documents.v2',
} as const;

export type WorkflowGradebook = GradebookSubmission & {
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileDataUrl?: string;
  session: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  reviewedAt?: string;
  reviewNote?: string;
};

export type WorkflowAttendance = AttendanceRecord & {
  session: 'morning' | 'afternoon' | 'evening';
  recordedBy: string;
  sponsorId: string;
  sponsorName: string;
  submittedAt?: string;
};

export type ReportRelease = {
  scheduledDate: string;
  scheduledTime: string;
  authorized: boolean;
  authorizedAt?: string;
};

export type ClassAssignment = {
  classId: string;
  sponsorId: string;
  sponsorName: string;
  updatedAt: string;
};

const safeParse = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
};

const save = <T,>(key: string, value: T) => localStorage.setItem(key, JSON.stringify(value));

export function getGradebooks(): WorkflowGradebook[] {
  return safeParse<WorkflowGradebook[]>(WORKFLOW_KEYS.gradebooks, GRADEBOOK_SUBMISSIONS.map((s, i) => ({
    ...s,
    session: 'morning',
    classId: CLASSES.find(c => c.name.replace(' - Section ', '') === s.className || c.name.includes(s.className.replace('Grade ', 'Grade ')))?.id || (s.className.includes('11') ? 'c5' : s.className.includes('10') ? 'c4' : s.className.includes('12') ? 'c6' : 'c5'),
    subjectId: SUBJECTS.find(sub => sub.name === s.subjectName && sub.className === s.className)?.id || 'sub1',
    teacherId: i === 2 ? 'u13' : 'u6',
  })));
}

export function setGradebooks(value: WorkflowGradebook[]) {
  save(WORKFLOW_KEYS.gradebooks, value);
  window.dispatchEvent(new CustomEvent('innosysedu:gradebooks-updated'));
}

export function getAttendance(): WorkflowAttendance[] {
  return safeParse<WorkflowAttendance[]>(WORKFLOW_KEYS.attendance, ATTENDANCE.map((a) => ({
    ...a,
    session: 'morning',
    recordedBy: a.classId === 'c5' ? 'u6' : 'u6',
    sponsorId: a.classId === 'c5' ? 'u6' : 'u6',
    sponsorName: 'Mr. Peter Wleh',
  })));
}

export function setAttendance(value: WorkflowAttendance[]) {
  save(WORKFLOW_KEYS.attendance, value);
  window.dispatchEvent(new CustomEvent('innosysedu:attendance-updated'));
}

export function getDisciplineCases(): DisciplineCase[] {
  return safeParse<DisciplineCase[]>(WORKFLOW_KEYS.discipline, DISCIPLINE_CASES);
}

export function setDisciplineCases(value: DisciplineCase[]) {
  save(WORKFLOW_KEYS.discipline, value);
  window.dispatchEvent(new CustomEvent('innosysedu:discipline-updated'));
}

export function getUsers(): SystemUser[] {
  return safeParse<SystemUser[]>(WORKFLOW_KEYS.users, SYSTEM_USERS);
}

export function setUsers(value: SystemUser[]) {
  save(WORKFLOW_KEYS.users, value);
  window.dispatchEvent(new CustomEvent('innosysedu:users-updated'));
}

export function getClassAssignments(): ClassAssignment[] {
  return safeParse<ClassAssignment[]>(WORKFLOW_KEYS.classAssignments, CLASSES.map(c => ({
    classId: c.id,
    sponsorId: c.teacherId || 'u6',
    sponsorName: c.teacherName || 'Mr. Peter Wleh',
    updatedAt: '2026-09-21',
  })));
}

export function setClassAssignments(value: ClassAssignment[]) {
  save(WORKFLOW_KEYS.classAssignments, value);
  window.dispatchEvent(new CustomEvent('innosysedu:class-assignments-updated'));
}

export function getReportRelease(): ReportRelease {
  return safeParse<ReportRelease>(WORKFLOW_KEYS.reportRelease, {
    scheduledDate: '2026-10-05', scheduledTime: '09:00', authorized: false,
  });
}

export function setReportRelease(value: ReportRelease) {
  save(WORKFLOW_KEYS.reportRelease, value);
  window.dispatchEvent(new CustomEvent('innosysedu:release-updated'));
}

export type ReportCard = {
  studentId: string;
  studentName: string;
  className: string;
  subjects: { subject: string; score: number; grade: string }[];
  average: number;
  overallGrade: string;
  generatedAt: string;
};

export function calculateGrade(score: number): string {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 75) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

export function generateReportCards(): ReportCard[] {
  const gradebooks = getGradebooks().filter(g => g.status === 'approved');
  const generatedAt = new Date().toISOString();
  return STUDENTS.filter(s => s.status === 'active').map(student => {
    const classSubjects = SUBJECTS.filter(sub => sub.className.includes(student.class));
    const subjects = classSubjects.map((subject, idx) => {
      const base = 72 + ((student.rollNo.charCodeAt(student.rollNo.length - 1) + idx * 7) % 24);
      const matching = gradebooks.find(g => g.classId === subject.classId && g.subjectId === subject.id);
      const score = matching ? Math.min(100, base + 3) : base;
      return { subject: subject.name, score, grade: calculateGrade(score) };
    });
    const average = subjects.length ? Math.round(subjects.reduce((a, b) => a + b.score, 0) / subjects.length) : 0;
    return { studentId: student.id, studentName: student.name, className: `Grade ${student.grade.replace('Grade ', '')}${student.class.replace(/^\d+/, '')}`, subjects, average, overallGrade: calculateGrade(average), generatedAt };
  });
}

export function saveReportCards(cards: ReportCard[]) {
  save(WORKFLOW_KEYS.reportCards, cards);
  window.dispatchEvent(new CustomEvent('innosysedu:report-cards-updated'));
}

export function getReportCards(): ReportCard[] {
  return safeParse<ReportCard[]>(WORKFLOW_KEYS.reportCards, []);
}

export function getStudentsForClass(classId: string) {
  const cls = CLASSES.find(c => c.id === classId);
  if (!cls) return [];
  return STUDENTS.filter(s => s.class === `${cls.grade.replace('Grade ', '')}${cls.section}` && s.status === 'active');
}

export function getTeacherClasses(teacherId = 'u6') {
  const assignments = getClassAssignments();
  return CLASSES.filter(c => assignments.some(a => a.classId === c.id && a.sponsorId === teacherId));
}

export type SubjectAssignment = { subjectId: string; teacherId: string; teacherName: string; updatedAt: string };

export function getSubjectAssignments(): SubjectAssignment[] {
  return safeParse<SubjectAssignment[]>('innosysedu.subjectAssignments.v2', SUBJECTS.map(s => ({ subjectId:s.id, teacherId:s.teacherId || 'u6', teacherName:s.teacherName || 'Mr. Peter Wleh', updatedAt:'2026-09-21' })));
}

export function setSubjectAssignments(value: SubjectAssignment[]) {
  save('innosysedu.subjectAssignments.v2', value);
  window.dispatchEvent(new CustomEvent('innosysedu:subject-assignments-updated'));
}

export function getTeacherSubjects(teacherId = 'u6') {
  const assignments=getSubjectAssignments();
  return SUBJECTS.filter(s => assignments.some(a => a.subjectId===s.id && a.teacherId===teacherId));
}

export function roleTitle(role: Role) {
  return role.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export async function saveGeneratedFile(content: BlobPart, suggestedName: string, mimeType = 'text/csv') {
  const blob = new Blob([content], { type: mimeType });
  const picker = (window as any).showSaveFilePicker;
  if (picker) {
    const ext = suggestedName.split('.').pop() || 'csv';
    const handle = await picker({
      suggestedName,
      types: [{ description: ext.toUpperCase() + ' document', accept: { [mimeType]: ['.' + ext] } }],
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=suggestedName; a.click(); URL.revokeObjectURL(url);
}
