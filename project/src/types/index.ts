export type Role =
  | 'principal'
  | 'vice_principal'
  | 'dean'
  | 'registrar'
  | 'academic_officer'
  | 'teacher'
  | 'counselor'
  | 'finance'
  | 'librarian'
  | 'super_admin'
  | 'student'
  | 'parent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  avatarColor: string;
  phone?: string;
  linkedStudentIds?: string[];
}

export interface Student {
  id: string;
  name: string;
  grade: string;
  class: string;
  rollNo: string;
  gender: 'M' | 'F';
  age: number;
  guardianName: string;
  guardianPhone: string;
  status: 'active' | 'inactive' | 'transferred';
  enrolledDate: string;
  photoColor: string;
}

export interface ClassInfo {
  id: string;
  name: string;
  grade: string;
  section: string;
  teacherId?: string;
  teacherName?: string;
  studentCount: number;
  room: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  classId: string;
  className: string;
  teacherId?: string;
  teacherName?: string;
}

export interface Assessment {
  id: string;
  title: string;
  type: 'assignment' | 'quiz' | 'test' | 'participation' | 'midterm' | 'final';
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  date: string;
  totalMarks: number;
  status: 'draft' | 'published' | 'graded';
}

export interface GradeEntry {
  id: string;
  studentId: string;
  studentName: string;
  assessmentId: string;
  assessmentTitle: string;
  subjectName: string;
  score: number;
  totalMarks: number;
  grade: string;
  status: 'entered' | 'submitted' | 'approved' | 'released';
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  note?: string;
}

export interface GradebookSubmission {
  id: string;
  teacherName: string;
  subjectName: string;
  className: string;
  term: string;
  submittedDate: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  studentCount: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  subject: string;
  category: string;
  gradeLevel: string;
  copiesTotal: number;
  copiesAvailable: number;
  status: 'available' | 'limited' | 'unavailable';
  coverColor: string;
}

export interface BookRequest {
  id: string;
  bookId: string;
  bookTitle: string;
  studentName: string;
  studentId: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'borrowed' | 'returned';
  dueDate?: string;
  returnDate?: string;
}

export interface Invoice {
  id: string;
  studentName: string;
  studentId: string;
  description: string;
  amount: number;
  amountPaid: number;
  term: string;
  status: 'paid' | 'partial' | 'unpaid' | 'overdue';
  dueDate: string;
  issueDate: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  studentName: string;
  amount: number;
  method: 'bank_slip' | 'online' | 'cash';
  date: string;
  status: 'pending_verification' | 'verified' | 'rejected';
  reference: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  author: string;
  authorRole: Role;
  date: string;
  audience: string;
  priority: 'normal' | 'important' | 'urgent';
}

export interface DisciplineCase {
  id: string;
  studentName: string;
  studentId: string;
  class: string;
  incident: string;
  date: string;
  severity: 'minor' | 'moderate' | 'major';
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  action: string;
  reportedBy: string;
}

export interface CounselingCase {
  id: string;
  studentName: string;
  studentId: string;
  class: string;
  category: 'academic' | 'behavioral' | 'social' | 'family' | 'other';
  status: 'open' | 'in_progress' | 'follow_up' | 'closed';
  dateOpened: string;
  lastSession?: string;
  notes: string;
  confidential: boolean;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  status: 'active' | 'inactive' | 'locked';
  lastLogin?: string;
  createdDate: string;
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  ip: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface NavItem {
  label: string;
  icon: string;
  page: string;
}

// --- Cross-portal shared entities ---

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'completed';
  terms: AcademicTerm[];
}

export interface AcademicTerm {
  id: string;
  name: string;
  yearId: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
}

export type CalendarCategory =
  | 'term'
  | 'examination'
  | 'holiday'
  | 'meeting'
  | 'sports'
  | 'cultural'
  | 'graduation'
  | 'deadline'
  | 'development'
  | 'other';

export interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  category: CalendarCategory;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  venue: string;
  audience: string;
  targetClasses?: string[];
  status: 'draft' | 'published' | 'cancelled';
  createdBy: string;
  createdAt: string;
}

export interface TimetableEntry {
  id: string;
  yearId: string;
  termId: string;
  classId: string;
  className?: string;
  section: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  room: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  startTime: string;
  endTime: string;
  kind: 'lesson' | 'break' | 'lunch' | 'assembly';
  status: 'draft' | 'published';
}

export interface TeacherSubstitution {
  id: string;
  originalTeacherId: string;
  originalTeacherName: string;
  substituteTeacherId: string;
  substituteTeacherName: string;
  classId: string;
  className: string;
  subjectName: string;
  date: string;
  period: string;
  reason: string;
  status: 'pending' | 'published';
}

export type IncidentStatus =
  | 'reported'
  | 'under_review'
  | 'investigation'
  | 'awaiting_decision'
  | 'action_assigned'
  | 'resolved'
  | 'closed';

export interface IncidentReport {
  id: string;
  studentId: string;
  studentName: string;
  class: string;
  date: string;
  time: string;
  location: string;
  category: string;
  description: string;
  reportedBy: string;
  witnesses: string;
  severity: 'minor' | 'moderate' | 'major';
  status: IncidentStatus;
  action?: string;
  actionAssignedBy?: string;
  parentNotified: boolean;
  history: { status: IncidentStatus; note: string; by: string; at: string }[];
}

export type DisciplineAction =
  | 'Verbal Warning'
  | 'Written Warning'
  | 'Parent Meeting'
  | 'Detention'
  | 'Suspension Recommendation'
  | 'Restorative Action'
  | 'Other';

export interface StudentActivity {
  id: string;
  name: string;
  category: 'club' | 'sports' | 'leadership' | 'cultural';
  coordinator: string;
  meetingDay: string;
  members: number;
  status: 'active' | 'inactive';
}

export type FeeCategory =
  | 'tuition'
  | 'registration'
  | 'examination'
  | 'library'
  | 'technology'
  | 'activity'
  | 'other';

export interface FeeStructure {
  id: string;
  academicYear: string;
  term: string;
  gradeLevel: string;
  category: FeeCategory;
  description: string;
  amount: number;
  dueDate: string;
}

export interface FeeItem {
  description: string;
  category: FeeCategory;
  amount: number;
}

export type InvoiceStatus =
  | 'draft'
  | 'issued'
  | 'partial'
  | 'paid'
  | 'overdue'
  | 'cancelled';

export interface DetailedInvoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  className: string;
  academicYear: string;
  term: string;
  items: FeeItem[];
  amount: number;
  amountPaid: number;
  dueDate: string;
  issueDate: string;
  status: InvoiceStatus;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  recipient: string;
  method: 'bank' | 'cash' | 'mobile_money';
  reference: string;
  approved: boolean;
}

export interface Scholarship {
  id: string;
  name: string;
  type: 'merit' | 'need' | 'sport' | 'staff';
  discountPercent: number;
  studentId: string;
  studentName: string;
  approved: boolean;
  expires: string;
}

export type PlatformSubscriptionStatus =
  | 'trial'
  | 'active'
  | 'past_due'
  | 'expired'
  | 'suspended'
  | 'cancelled';

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  studentLimit: number;
  staffLimit: number;
  storageGb: number;
}

export interface SchoolSubscription {
  schoolId: string;
  planId: string;
  status: PlatformSubscriptionStatus;
  startedAt: string;
  renewsAt: string;
  expiresAt: string;
}

export interface PlatformSchool {
  id: string;
  name: string;
  city: string;
  country: string;
  principalName: string;
  email: string;
  phone: string;
  students: number;
  staff: number;
  status: 'active' | 'suspended' | 'trial';
  subscription: SchoolSubscription;
}

export interface PlatformUserRecord {
  id: string;
  name: string;
  email: string;
  schoolId: string | null;
  role: Role;
  status: 'active' | 'inactive' | 'locked';
}

export interface AuditEntry {
  id: string;
  user: string;
  school: string;
  action: string;
  module: string;
  timestamp: string;
  status: 'success' | 'failed';
  recordRef: string;
}

export type NotificationCategory =
  | 'assessment'
  | 'gradebook'
  | 'results'
  | 'timetable'
  | 'calendar'
  | 'attendance'
  | 'finance'
  | 'library'
  | 'discipline'
  | 'counseling'
  | 'registration'
  | 'platform'
  | 'general';

export interface AppNotification {
  id: string;
  recipientRoles: Role[];
  recipientUserIds?: string[];
  title: string;
  message: string;
  category: NotificationCategory;
  relatedPage?: string;
  createdAt: string;
  readBy: string[];
}

export interface GuardianLink {
  id: string;
  guardianUserId: string;
  guardianName: string;
  studentId: string;
  studentName: string;
  relationship: string;
  status: 'pending' | 'linked' | 'revoked';
  code: string;
  codeExpires: string;
  createdAt: string;
}

export interface LessonPlan {
  id: string;
  teacherId: string;
  teacherName: string;
  subjectName: string;
  classId: string;
  className: string;
  week: string;
  topic: string;
  objectives: string;
  methods: string;
  materials: string;
  homework: string;
  completed: boolean;
  createdAt: string;
}
