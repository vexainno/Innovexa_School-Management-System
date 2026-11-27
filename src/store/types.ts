import type { Role } from '@/types';

/* ------------------------------------------------------------------
   Shared school data model. Every portal reads from this one model,
   so the Registrar, Principal, Academic Officer, Teacher, Finance,
   Parent and Student views always agree with one another.
------------------------------------------------------------------- */

export type StudentStatus = 'active' | 'transferred' | 'withdrawn' | 'graduated';

export interface SchoolStudent {
  id: string;
  studentNo: string;
  firstName: string;
  lastName: string;
  name: string;
  gender: 'M' | 'F';
  dob: string;
  grade: number;
  section: string;
  yearEntered: number;
  status: StudentStatus;
  guardianName: string;
  guardianRelation: string;
  guardianPhone: string;
  guardianEmail: string;
  address: string;
  parentLinked: boolean;
  previousClasses: string[];
  statusNote?: string;
}

export interface StaffMember {
  id: string;
  staffNo: string;
  name: string;
  role: 'teacher' | 'administration' | 'support';
  position: string;
  phone: string;
  email: string;
  subjects: string[];
  sponsorOf?: string;
  monthlySalary: number;
  joined: string;
}

export interface Assignment {
  grade: number;
  section: string;
  subject: string;
  teacherId: string;
}

export type WeekDay = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface DayBlock {
  id: string;
  kind: 'assembly' | 'lesson' | 'break' | 'lunch' | 'activity' | 'dismissal';
  label: string;
  start: string;
  end: string;
}

export interface ScheduleConfig {
  days: WeekDay[];
  blocks: DayBlock[];
  status: 'draft' | 'published';
  publishedAt?: string;
  effectiveFrom?: string;
}

export interface Account {
  id: string;
  email: string;
  name: string;
  role: Role;
  studentIds: string[];
  staffId?: string;
  status: 'invited' | 'active' | 'disabled';
  activationCode: string;
  passwordHash?: string;
  salt?: string;
  createdAt: string;
  createdBy: string;
}

export interface BookRequest {
  id: string;
  bookId: string;
  studentId: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'declined' | 'collected' | 'cancelled';
  pickupBy?: string;
  note?: string;
}

export interface MobileMoneyWallet {
  provider: 'MTN Mobile Money' | 'Orange Money';
  merchantName: string;
  number: string;
  dialCode: string;
}

export interface TimetableSlot {
  day: WeekDay;
  period: number;
  grade: number;
  section: string;
  subject: string;
  teacherId: string;
  room: string;
}

export interface MarkRow {
  classwork: number | null;
  quizzes: number | null;
  midterm: number | null;
  final: number | null;
  total: number | null;
}

export type GradebookStatus = 'draft' | 'submitted' | 'approved' | 'returned';

export interface Gradebook {
  id: string;
  grade: number;
  section: string;
  subject: string;
  teacherId: string;
  status: GradebookStatus;
  fileName: string;
  fileSize: number;
  submittedAt?: string;
  approvedAt?: string;
  returnedAt?: string;
  returnReason?: string;
  marks: Record<string, MarkRow>;
  history: HistoryEntry[];
}

export type BatchStatus =
  | 'not_ready'
  | 'awaiting_processing'
  | 'in_progress'
  | 'submitted'
  | 'returned'
  | 'authorized'
  | 'released';

export interface Gradesheet {
  status: 'draft' | 'requires_correction' | 'reviewed';
  teacherRemark: string;
  academicRemark: string;
  principalRemark: string;
  correctionNote?: string;
}

export interface ReportBatch {
  key: string;
  grade: number;
  section: string;
  status: Exclude<BatchStatus, 'not_ready' | 'awaiting_processing'>;
  sheets: Record<string, Gradesheet>;
  generatedAt?: string;
  submittedAt?: string;
  authorizedAt?: string;
  authorizedBy?: string;
  releasedAt?: string;
  releasedBy?: string;
  returnComment?: string;
  history: HistoryEntry[];
}

export interface HistoryEntry {
  at: string;
  by: string;
  action: string;
}

export interface GradingComponent {
  key: keyof Omit<MarkRow, 'total'>;
  name: string;
  weight: number;
  maxMarks: number;
}

export interface GradeBoundary {
  min: number;
  max: number;
  letter: string;
  point: number;
  remark: string;
}

export interface GradingConfig {
  version: number;
  effectiveFrom: string;
  components: GradingComponent[];
  boundaries: GradeBoundary[];
  averageMethod: 'simple' | 'weighted';
  subjectWeights: Record<string, number>;
  atRiskBelow: number;
  goodFrom: number;
  passMark: number;
}

export interface ReportTemplate {
  title: string;
  schoolAddress: string;
  motto: string;
  showLetterGrade: boolean;
  showGradePoint: boolean;
  showPosition: boolean;
  showAttendance: boolean;
  showConduct: boolean;
  showTeacherRemark: boolean;
  showAcademicRemark: boolean;
  showPrincipalRemark: boolean;
  showSignatures: boolean;
  accent: string;
}

export interface AcademicPeriod {
  id: string;
  name: string;
  kind: 'semester' | 'marking_period' | 'term';
  start: string;
  end: string;
  parent?: string;
}

export interface AcademicYear {
  id: string;
  name: string;
  start: string;
  end: string;
  status: 'current' | 'closed' | 'planned';
  periods: AcademicPeriod[];
}

export interface CalendarEvent {
  id: string;
  date: string;
  endDate?: string;
  title: string;
  kind: 'holiday' | 'exam' | 'deadline' | 'event' | 'meeting' | 'release';
  internal: boolean;
}

export interface Exam {
  id: string;
  name: string;
  kind: 'Classwork' | 'Quiz' | 'Test' | 'Midterm' | 'Final' | 'Practical' | 'National';
  grade: number;
  section: string;
  subject: string;
  date: string;
  maxMarks: number;
  status: 'scheduled' | 'completed' | 'marks_submitted' | 'missing_records';
}

export type StaffAttendanceStatus = 'present' | 'late' | 'absent' | 'on_leave' | 'not_recorded';

export interface StaffAttendance {
  staffId: string;
  date: string;
  status: StaffAttendanceStatus;
  arrival?: string;
  note?: string;
  recordedBy?: string;
}

export interface Substitution {
  id: string;
  date: string;
  absentTeacherId: string;
  day: WeekDay;
  period: number;
  grade: number;
  section: string;
  subject: string;
  substituteId: string;
  studentsInformed: boolean;
  scheduleUpdated: boolean;
}

export interface Incident {
  id: string;
  studentId: string;
  reportedBy: string;
  reportedByName: string;
  reportedAt: string;
  category: string;
  severity: 'minor' | 'moderate' | 'serious';
  location: string;
  description: string;
  status: 'new' | 'under_review' | 'investigating' | 'resolved' | 'referred_principal' | 'referred_counselor';
  investigation: HistoryEntry[];
  studentResponse?: string;
  outcome?: string;
  action?: string;
  parentVisible: boolean;
  history: HistoryEntry[];
}

export interface CounselingSummary {
  id: string;
  studentId: string;
  category: string;
  intensity: 'low' | 'medium' | 'high';
  openedAt: string;
  status: 'open' | 'monitoring' | 'closed';
}

export interface FeeItem {
  name: string;
  amount: number;
}

export interface FeeStructure {
  gradeFrom: number;
  gradeTo: number;
  items: FeeItem[];
  dueDate: string;
  instalments: { label: string; due: string; percent: number }[];
}

export interface Payment {
  id: string;
  receiptNo: string;
  studentId: string;
  amount: number;
  method: 'Cash' | 'Bank deposit' | 'Mobile money' | 'Card' | 'Card (demo)' | 'Mobile money (demo)';
  reference: string;
  date: string;
  recordedBy: string;
}

export interface Concession {
  id: string;
  studentId: string;
  kind: 'Scholarship' | 'Discount' | 'Waiver';
  amount: number;
  reason: string;
  approvedBy: string;
  date: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  vendor: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending';
  dueDate: string;
}

export interface BudgetLine {
  category: string;
  budgeted: number;
}

export interface SalaryRun {
  month: string;
  status: 'paid' | 'pending';
  paidOn?: string;
}

export interface Book {
  id: string;
  bookNo: string;
  title: string;
  author: string;
  category: string;
  isbn: string;
  copies: number;
  shelf: string;
  year: number;
  cover?: string;
  description?: string;
}

export interface Loan {
  id: string;
  bookId: string;
  studentId: string;
  borrowedAt: string;
  dueAt: string;
  returnedAt?: string;
  returnCondition?: 'good' | 'damaged';
}

export interface BookIssue {
  id: string;
  bookId: string;
  kind: 'damaged' | 'missing';
  date: string;
  studentId?: string;
  note: string;
  resolved: boolean;
}

export type Audience = 'all' | 'teachers' | 'parents' | 'students' | 'admin_staff';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  audience: Audience[];
  fromName: string;
  fromRole: Role;
  date: string;
  grade?: number;
  section?: string;
}

export interface AppNotification {
  id: string;
  createdAt: string;
  title: string;
  body: string;
  link?: string;
  toRoles?: Role[];
  toUserIds?: string[];
  /** Private: only this student and their linked guardians can see it. */
  toStudentIds?: string[];
  /** Private to the student only (not guardians). */
  studentOnly?: boolean;
  from?: string;
  fromName?: string;
  replies?: { from: 'student' | 'staff'; name: string; at: string; text: string }[];
  readBy: string[];
}

export interface MessageThread {
  id: string;
  parentUserId: string;
  staffId: string;
  staffName: string;
  studentId: string;
  subject: string;
  messages: { from: 'parent' | 'staff'; at: string; text: string }[];
}

export interface StaffReport {
  id: string;
  date: string;
  author: string;
  summary: string;
  teachersAbsent: number;
  incidents: number;
  submittedAt: string;
}

export interface OperationalLog {
  id: string;
  at: string;
  kind: 'incident' | 'movement' | 'activity' | 'meeting';
  title: string;
  detail: string;
  by: string;
  status?: string;
  date?: string;
}

export interface Application {
  id: string;
  firstName: string;
  lastName: string;
  gender: 'M' | 'F';
  dob: string;
  applyingFor: number;
  previousSchool: string;
  guardianName: string;
  guardianPhone: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'declined';
}

export interface Leadership {
  id: string;
  studentId: string;
  title: string;
  since: string;
}

export interface TenantSchool {
  id: string;
  name: string;
  county: string;
  plan: 'Starter' | 'Standard' | 'Premium';
  status: 'active' | 'suspended' | 'onboarding';
  students: number;
  staff: number;
  storageGb: number;
  renewal: string;
  modules: string[];
  admin: string;
}

export interface SupportTicket {
  id: string;
  schoolId: string;
  subject: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved';
  openedAt: string;
}

export interface PlatformLog {
  id: string;
  at: string;
  actor: string;
  action: string;
  target: string;
  justification?: string;
}

export interface Complaint {
  id: string;
  studentId: string;
  subject: string;
  detail: string;
  date: string;
  status: 'open' | 'in_review' | 'resolved';
  response?: string;
}

export interface FollowUp {
  id: string;
  incidentId: string;
  task: string;
  due: string;
  done: boolean;
}

export type QuestionType = 'mcq' | 'true_false' | 'short' | 'essay' | 'file';

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  /** mcq: option index as string; true_false: 'true' | 'false'; short: accepted answers separated by | */
  correct?: string;
  points: number;
  rubric?: string;
}

export interface Task {
  id: string;
  kind: 'assignment' | 'quiz';
  title: string;
  subject: string;
  grade: number;
  section: string;
  teacherId: string;
  instructions: string;
  maxMarks: number;
  status: 'draft' | 'published' | 'closed';
  createdAt: string;
  opensAt: string;
  closesAt: string;
  durationMin?: number;
  shuffle?: boolean;
  submissionType?: 'text' | 'file' | 'text_file';
  latePolicy: 'not_accepted' | 'accepted_marked_late';
  questions: Question[];
  /** Question paper or reference files the teacher attached (Word, PDF, images…). */
  attachments?: SubmittedFile[];
  resultsReleased: boolean;
}

export interface SubmittedFile { name: string; size: number; type: string; dataUrl?: string }

/** A class register: one teacher's attendance for one grade + section on one day. */
export interface ClassRegister {
  id: string;
  date: string;
  grade: number;
  section: string;
  marks: Record<string, 'present' | 'absent' | 'late' | 'excused'>;
  recordedBy: string;
  recordedAt: string;
}

export interface Submission {
  id: string;
  taskId: string;
  studentId: string;
  startedAt: string;
  submittedAt?: string;
  status: 'in_progress' | 'submitted' | 'graded';
  late: boolean;
  answers: Record<string, string>;
  text?: string;
  files: SubmittedFile[];
  autoScore?: number;
  perQuestion?: Record<string, number>;
  score?: number;
  feedback?: string;
  gradedAt?: string;
}

export interface SchoolState {
  version: number;
  school: {
    name: string;
    address: string;
    phone: string;
    email: string;
    motto: string;
    currency: string;
    timezone: string;
    academicYear: string;
    currentPeriod: string | null;
    bank: { bank: string; accountName: string; accountNo: string; branch: string; swift: string };
    parentTeacherMessaging: boolean;
    mobileMoney: MobileMoneyWallet[];
    paymentProvider: { name: string; connected: boolean };
    classes: { grade: number; sections: string[] }[];
  };
  mode: 'demo' | 'live';
  schedule: ScheduleConfig;
  accounts: Account[];
  bookRequests: BookRequest[];
  tasks: Task[];
  submissions: Submission[];
  /** Attendance registers saved by teachers; days without a register use the school's historical record. */
  classRegisters?: ClassRegister[];
  reportTemplateFile?: { name: string; size: number; uploadedAt: string; active: boolean };
  students: SchoolStudent[];
  staff: StaffMember[];
  assignments: Assignment[];
  timetable: TimetableSlot[];
  gradebooks: Gradebook[];
  batches: ReportBatch[];
  grading: GradingConfig;
  gradingHistory: GradingConfig[];
  template: ReportTemplate;
  years: AcademicYear[];
  calendar: CalendarEvent[];
  exams: Exam[];
  staffAttendance: StaffAttendance[];
  substitutions: Substitution[];
  incidents: Incident[];
  counseling: CounselingSummary[];
  feeStructures: FeeStructure[];
  payments: Payment[];
  concessions: Concession[];
  expenses: Expense[];
  budget: BudgetLine[];
  salaryRuns: SalaryRun[];
  books: Book[];
  loans: Loan[];
  bookIssues: BookIssue[];
  announcements: Announcement[];
  notifications: AppNotification[];
  threads: MessageThread[];
  staffReports: StaffReport[];
  opsLog: OperationalLog[];
  applications: Application[];
  leadership: Leadership[];
  complaints: Complaint[];
  followUps: FollowUp[];
  tenants: TenantSchool[];
  tickets: SupportTicket[];
  platformLog: PlatformLog[];
  backups: { id: string; at: string; sizeGb: number; kind: 'scheduled' | 'manual'; status: 'completed' | 'running' }[];
}
