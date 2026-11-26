import { STUDENTS } from '@/data/mockData';

export type EarlyWarningCategory = 'attendance' | 'academic' | 'missing_work' | 'teacher_referral' | 'student_affairs';
export type EarlyWarningStatus = 'new' | 'under_review' | 'reviewed' | 'dismissed';
export type EarlyWarningSeverity = 'low' | 'moderate' | 'high';

export interface EarlyWarningEvidence {
  label: string;
  value: string;
  recordedAt: string;
  source: string;
}

export interface EarlyWarningAlert {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  category: EarlyWarningCategory;
  severity: EarlyWarningSeverity;
  title: string;
  explanation: string;
  detectedAt: string;
  status: EarlyWarningStatus;
  evidence: EarlyWarningEvidence[];
  reviewNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  actionTaken?: string;
}

export interface EarlyWarningRuleSettings {
  attendanceAbsenceThreshold: number;
  latenessThreshold: number;
  gradeDeclinePercentage: number;
  missingWorkThreshold: number;
  includeTeacherReferrals: boolean;
  includeStudentAffairsReferrals: boolean;
}

const ALERTS_KEY = 'innosysedu.early-warning.alerts.v1';
const RULES_KEY = 'innosysedu.early-warning.rules.v1';
const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};
const makeId = () => `ewa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const students = STUDENTS.slice(0, 6);
const seededReasons: Array<{
  category: EarlyWarningCategory;
  severity: EarlyWarningSeverity;
  title: string;
  explanation: string;
  evidence: EarlyWarningEvidence[];
}> = [
  {
    category: 'attendance', severity: 'high', title: 'Repeated absences recorded',
    explanation: 'The attendance summary shows a repeated absence pattern during the review period. This alert should be checked against attendance records and any approved explanations.',
    evidence: [
      { label: 'Absences in review period', value: '5 days', recordedAt: daysAgo(2), source: 'Attendance register' },
      { label: 'Review period', value: 'Last 30 school days', recordedAt: daysAgo(2), source: 'Attendance summary' },
    ],
  },
  {
    category: 'academic', severity: 'moderate', title: 'Academic performance trend changed',
    explanation: 'Recent assessment results show a downward pattern compared with earlier results. Review individual assessments and context before deciding whether support is needed.',
    evidence: [
      { label: 'Earlier average', value: '76%', recordedAt: daysAgo(28), source: 'Published assessment summary' },
      { label: 'Recent average', value: '61%', recordedAt: daysAgo(3), source: 'Assessment summary' },
    ],
  },
  {
    category: 'missing_work', severity: 'moderate', title: 'Several assignments remain incomplete',
    explanation: 'Multiple assignments are currently marked missing. Confirm that the work was assigned, deadlines have passed and submission records are up to date.',
    evidence: [
      { label: 'Missing assignments', value: '3', recordedAt: daysAgo(1), source: 'Assignment register' },
      { label: 'Classes affected', value: '2', recordedAt: daysAgo(1), source: 'Assignment register' },
    ],
  },
  {
    category: 'teacher_referral', severity: 'moderate', title: 'Teacher submitted a support referral',
    explanation: 'A teacher submitted a student-support concern. The alert contains the referral summary only; investigation notes and confidential counseling records are not included.',
    evidence: [
      { label: 'Referral source', value: 'Assigned class teacher', recordedAt: daysAgo(4), source: 'Teacher referral' },
      { label: 'Referral status', value: 'Awaiting counselor review', recordedAt: daysAgo(4), source: 'Referral workflow' },
    ],
  },
  {
    category: 'student_affairs', severity: 'high', title: 'Student affairs referral received',
    explanation: 'A referral from Student Affairs requires counselor review. Review the permitted referral summary and coordinate with the referring officer when appropriate.',
    evidence: [
      { label: 'Referral source', value: 'Dean of Students', recordedAt: daysAgo(2), source: 'Student affairs referral' },
      { label: 'Priority', value: 'Follow-up requested', recordedAt: daysAgo(2), source: 'Referral workflow' },
    ],
  },
  {
    category: 'attendance', severity: 'low', title: 'Attendance punctuality pattern noticed',
    explanation: 'Several late arrivals were recorded in the review period. Consider context and verify entries before deciding whether follow-up is appropriate.',
    evidence: [
      { label: 'Late arrivals', value: '4', recordedAt: daysAgo(5), source: 'Attendance register' },
      { label: 'Review period', value: 'Last 20 school days', recordedAt: daysAgo(5), source: 'Attendance summary' },
    ],
  },
];

const initialAlerts: EarlyWarningAlert[] = students.map((student, index) => {
  const reason = seededReasons[index % seededReasons.length];
  return {
    id: `ewa-seed-${index + 1}`,
    studentId: student.id,
    studentName: student.name,
    className: `Grade ${student.class}`,
    category: reason.category,
    severity: reason.severity,
    title: reason.title,
    explanation: reason.explanation,
    detectedAt: daysAgo(index + 1),
    status: index === 4 ? 'under_review' : 'new',
    evidence: reason.evidence,
  };
});

export const DEFAULT_EARLY_WARNING_RULES: EarlyWarningRuleSettings = {
  attendanceAbsenceThreshold: 4,
  latenessThreshold: 4,
  gradeDeclinePercentage: 15,
  missingWorkThreshold: 3,
  includeTeacherReferrals: true,
  includeStudentAffairsReferrals: true,
};

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStored<T>(key: string, value: T, eventName: string) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(eventName));
}

export function getEarlyWarningAlerts(): EarlyWarningAlert[] {
  return readStored(ALERTS_KEY, initialAlerts);
}

export function saveEarlyWarningAlerts(alerts: EarlyWarningAlert[]) {
  writeStored(ALERTS_KEY, alerts, 'innosysedu:early-warning-alerts-updated');
}

export function updateEarlyWarningAlert(
  id: string,
  changes: Partial<EarlyWarningAlert>,
): EarlyWarningAlert | undefined {
  const updated = getEarlyWarningAlerts().map((alert) =>
    alert.id === id ? { ...alert, ...changes, id } : alert,
  );
  saveEarlyWarningAlerts(updated);
  return updated.find((alert) => alert.id === id);
}

export function createEarlyWarningAlert(
  input: Omit<EarlyWarningAlert, 'id' | 'detectedAt' | 'status'>,
): EarlyWarningAlert {
  const student = STUDENTS.find((item) => item.id === input.studentId);
  if (!student) throw new Error('Select a valid student before creating an alert.');
  const duplicate = getEarlyWarningAlerts().find((alert) =>
    alert.studentId === input.studentId &&
    alert.category === input.category &&
    ['new', 'under_review'].includes(alert.status),
  );
  if (duplicate) return duplicate;

  const alert: EarlyWarningAlert = {
    ...input,
    id: makeId(),
    detectedAt: today(),
    status: 'new',
  };
  saveEarlyWarningAlerts([alert, ...getEarlyWarningAlerts()]);
  return alert;
}

export function getEarlyWarningRules(): EarlyWarningRuleSettings {
  return readStored(RULES_KEY, DEFAULT_EARLY_WARNING_RULES);
}

export function saveEarlyWarningRules(rules: EarlyWarningRuleSettings) {
  writeStored(RULES_KEY, rules, 'innosysedu:early-warning-rules-updated');
}

export function resetEarlyWarningDemoData() {
  localStorage.removeItem(ALERTS_KEY);
  localStorage.removeItem(RULES_KEY);
  window.dispatchEvent(new CustomEvent('innosysedu:early-warning-alerts-updated'));
  window.dispatchEvent(new CustomEvent('innosysedu:early-warning-rules-updated'));
}
