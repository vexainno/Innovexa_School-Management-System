import type {
  AcademicYear, SchoolEvent, TimetableEntry, TeacherSubstitution, IncidentReport,
  FeeStructure, DetailedInvoice, Expense, Scholarship, PlatformSchool, SubscriptionPlan,
  AuditEntry, AppNotification, GuardianLink, LessonPlan, Payment,
} from '@/types';
import { INVOICES, PAYMENTS } from '@/data/mockData';

const ACADEMIC_YEAR = '2026/2027';

export const SEED_ACADEMIC_YEARS: AcademicYear[] = [
  {
    id: 'ay1',
    name: '2026/2027',
    startDate: '2026-09-01',
    endDate: '2027-07-15',
    status: 'active',
    terms: [
      { id: 't1', name: 'First Term', yearId: 'ay1', startDate: '2026-09-01', endDate: '2026-12-18', status: 'active' },
      { id: 't2', name: 'Second Term', yearId: 'ay1', startDate: '2027-01-05', endDate: '2027-04-02', status: 'upcoming' },
      { id: 't3', name: 'Third Term', yearId: 'ay1', startDate: '2027-04-20', endDate: '2027-07-15', status: 'upcoming' },
    ],
  },
  {
    id: 'ay0',
    name: '2025/2026',
    startDate: '2025-09-01',
    endDate: '2026-07-15',
    status: 'completed',
    terms: [
      { id: 't0', name: 'First Term', yearId: 'ay0', startDate: '2025-09-01', endDate: '2025-12-18', status: 'completed' },
    ],
  },
];

export const SEED_EVENTS: SchoolEvent[] = [
  { id: 'ev1', title: 'First Term Opens', description: 'Opening day for the 2026/2027 academic year. All students report.', category: 'term', startDate: '2026-09-01', endDate: '2026-09-01', startTime: '08:00', venue: 'Main Campus', audience: 'Everyone', status: 'published', createdBy: 'u2', createdAt: '2026-08-10' },
  { id: 'ev2', title: 'Midterm Examinations', description: 'Midterm examinations for all grades, September 25-29.', category: 'examination', startDate: '2026-09-25', endDate: '2026-09-29', startTime: '08:30', endTime: '13:00', venue: 'Exam Halls', audience: 'Students & Staff', targetClasses: ['7A', '8B', '9A', '10A', '11A', '12A'], status: 'published', createdBy: 'u2', createdAt: '2026-09-05' },
  { id: 'ev3', title: 'Parent-Teacher Conference', description: 'Meet your child\'s teachers and review first-term progress.', category: 'meeting', startDate: '2026-10-05', endDate: '2026-10-05', startTime: '10:00', endTime: '14:00', venue: 'Main Hall', audience: 'Parents & Staff', status: 'published', createdBy: 'u2', createdAt: '2026-09-18' },
  { id: 'ev4', title: 'Independence Day (Public Holiday)', description: 'National holiday — school closed.', category: 'holiday', startDate: '2026-10-09', endDate: '2026-10-09', venue: '—', audience: 'Everyone', status: 'published', createdBy: 'u2', createdAt: '2026-08-20' },
  { id: 'ev5', title: 'Inter-House Sports Day', description: 'Annual athletics competition between the four sports houses.', category: 'sports', startDate: '2026-11-06', endDate: '2026-11-06', startTime: '09:00', endTime: '16:00', venue: 'Sports Field', audience: 'Everyone', status: 'published', createdBy: 'u3', createdAt: '2026-09-20' },
  { id: 'ev6', title: 'Cultural Day', description: 'Celebration of Liberian culture — music, dance, food and dress.', category: 'cultural', startDate: '2026-11-27', endDate: '2026-11-27', startTime: '10:00', endTime: '15:00', venue: 'Main Hall', audience: 'Everyone', status: 'draft', createdBy: 'u3', createdAt: '2026-09-21' },
  { id: 'ev7', title: 'Staff Development Day', description: 'No classes. Professional development workshops for all staff.', category: 'development', startDate: '2026-10-23', endDate: '2026-10-23', startTime: '09:00', endTime: '15:00', venue: 'Library', audience: 'Staff', status: 'published', createdBy: 'u2', createdAt: '2026-09-19' },
  { id: 'ev8', title: 'Final Examinations Begin', description: 'First term final examinations for all grades.', category: 'examination', startDate: '2026-12-07', endDate: '2026-12-15', startTime: '08:30', endTime: '13:00', venue: 'Exam Halls', audience: 'Students & Staff', status: 'published', createdBy: 'u5', createdAt: '2026-09-21' },
  { id: 'ev9', title: 'Term Closing & Report Cards', description: 'First term closes. Report cards distributed to parents.', category: 'term', startDate: '2026-12-18', endDate: '2026-12-18', startTime: '09:00', endTime: '12:00', venue: 'Main Hall', audience: 'Everyone', status: 'draft', createdBy: 'u2', createdAt: '2026-09-21' },
  { id: 'ev10', title: 'Monthly Staff Meeting', description: 'October staff meeting — academic and operational review.', category: 'meeting', startDate: '2026-10-02', endDate: '2026-10-02', startTime: '15:30', endTime: '17:00', venue: 'Conference Room', audience: 'Staff', status: 'published', createdBy: 'u1', createdAt: '2026-09-22' },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;

function entry(
  classId: string, className: string, section: string,
  subjectId: string, subjectName: string, teacherId: string, teacherName: string,
  room: string, dayIdx: number, start: string, end: string,
  kind: TimetableEntry['kind'] = 'lesson',
): TimetableEntry {
  return {
    id: `tt-${classId}-${dayIdx}-${start}-${kind}`,
    yearId: 'ay1', termId: 't1', classId, section,
    subjectId, subjectName, teacherId, teacherName, room, day: DAYS[dayIdx],
    startTime: start, endTime: end, kind, status: 'published',
  };
}

const PERIODS = [
  ['08:00', '08:40'],
  ['08:45', '09:25'],
  ['09:30', '10:10'],
  ['10:40', '11:20'],
  ['11:25', '12:05'],
  ['12:10', '12:50'],
];

function classDayTimetable(
  classId: string, className: string, section: string,
  subjectIds: [string, string][], rooms: string[],
): TimetableEntry[] {
  const out: TimetableEntry[] = [];
  DAYS.forEach((_, dayIdx) => {
    out.push(entry(classId, className, section, 'sub9', 'Morning Assembly', 'u2', 'Mrs. Grace Browman', 'Main Hall', dayIdx, '07:30', '07:55', 'assembly'));
    PERIODS.forEach((period, p) => {
      if (p === 2) {
        out.push(entry(classId, className, section, 'sub10', 'Break', '—', '—', 'Courtyard', dayIdx, '10:10', '10:40', 'break'));
        return;
      }
      if (p === 5) {
        out.push(entry(classId, className, section, 'sub11', 'Lunch', '—', '—', 'Cafeteria', dayIdx, '12:10', '12:50', 'lunch'));
        return;
      }
      const [subjectId, subjectName] = subjectIds[(dayIdx + p) % subjectIds.length];
      const [teacherId, teacherName] = TEACHER_BY_SUBJECT[subjectId] || ['u6', 'Mr. Peter Wleh'];
      out.push(entry(classId, className, section, subjectId, subjectName, teacherId, teacherName, rooms[dayIdx % rooms.length], dayIdx, period[0], period[1]));
    });
  });
  return out;
}

export const TEACHER_BY_SUBJECT: Record<string, [string, string]> = {
  sub1: ['u6', 'Mr. Peter Wleh'],
  sub2: ['u6', 'Mr. Peter Wleh'],
  sub3: ['u6', 'Mr. Peter Wleh'],
  sub4: ['u6', 'Mr. Peter Wleh'],
  sub5: ['u6', 'Mr. Peter Wleh'],
  sub6: ['u13', 'Ms. Emily Brown'],
  sub7: ['u15', 'Ms. Alice Garliwo'],
  sub8: ['u16', 'Mr. Samuel Boakai'],
};

export const SEED_TIMETABLE: TimetableEntry[] = [
  ...classDayTimetable('c5', 'Grade 11A', 'A',
    [['sub1', 'Mathematics'], ['sub2', 'Physics'], ['sub6', 'English Language'], ['sub7', 'Biology'], ['sub8', 'Chemistry']],
    ['Room 301', 'Lab 1', 'Room 302', 'Lab 2', 'Room 301']),
  ...classDayTimetable('c4', 'Grade 10A', 'A',
    [['sub3', 'Mathematics'], ['sub6', 'English Language'], ['sub7', 'Biology'], ['sub2', 'Physics']],
    ['Room 202', 'Room 201', 'Lab 1', 'Room 203', 'Room 202']),
  ...classDayTimetable('c3', 'Grade 9A', 'A',
    [['sub4', 'Mathematics'], ['sub6', 'English Language'], ['sub5', 'Physics']],
    ['Room 201', 'Room 202', 'Room 201', 'Room 203', 'Room 201']),
];

export const SEED_SUBSTITUTIONS: TeacherSubstitution[] = [
  { id: 'sub-x1', originalTeacherId: 'u13', originalTeacherName: 'Ms. Emily Brown', substituteTeacherId: 'u6', substituteTeacherName: 'Mr. Peter Wleh', classId: 'c5', className: 'Grade 11A', subjectName: 'English Language', date: '2026-09-24', period: '08:45 - 09:25', reason: 'Teacher attending workshop', status: 'published' },
];

export const SEED_INCIDENTS: IncidentReport[] = [
  {
    id: 'ir1', studentId: 's11', studentName: 'Mohammed S. Kromah', class: 'Grade 8B',
    date: '2026-09-17', time: '10:20', location: 'Playground', category: 'Fighting',
    description: 'Two students engaged in a physical fight during morning break. Separated by duty teacher; no injuries requiring medical attention.',
    reportedBy: 'Mr. Peter Wleh', witnesses: 'Duty teacher, 3 students', severity: 'major',
    status: 'under_review', parentNotified: false,
    history: [{ status: 'reported', note: 'Incident reported by classroom teacher', by: 'Mr. Peter Wleh', at: '2026-09-17 10:35' }],
  },
  {
    id: 'ir2', studentId: 's5', studentName: 'Augustine T. Kollie', class: 'Grade 10A',
    date: '2026-09-19', time: '11:45', location: 'Room 202', category: 'Disruptive Behavior',
    description: 'Repeatedly talking over the teacher and disturbing classmates during the lesson.',
    reportedBy: 'Mr. Peter Wleh', witnesses: 'Class of 29 students', severity: 'minor',
    status: 'action_assigned', action: 'Verbal Warning', actionAssignedBy: 'Mr. Samuel Doe', parentNotified: true,
    history: [
      { status: 'reported', note: 'Reported by subject teacher', by: 'Mr. Peter Wleh', at: '2026-09-19 12:00' },
      { status: 'action_assigned', note: 'Verbal warning issued after discussion with student', by: 'Mr. Samuel Doe', at: '2026-09-19 14:30' },
    ],
  },
];

export const SEED_FEE_STRUCTURES: FeeStructure[] = [
  { id: 'fs1', academicYear: ACADEMIC_YEAR, term: 'First Term', gradeLevel: 'Grade 7', category: 'tuition', description: 'Tuition — Grade 7', amount: 30000, dueDate: '2026-09-30' },
  { id: 'fs2', academicYear: ACADEMIC_YEAR, term: 'First Term', gradeLevel: 'Grade 8', category: 'tuition', description: 'Tuition — Grade 8', amount: 35000, dueDate: '2026-09-30' },
  { id: 'fs3', academicYear: ACADEMIC_YEAR, term: 'First Term', gradeLevel: 'Grade 9', category: 'tuition', description: 'Tuition — Grade 9', amount: 40000, dueDate: '2026-09-30' },
  { id: 'fs4', academicYear: ACADEMIC_YEAR, term: 'First Term', gradeLevel: 'Grade 10', category: 'tuition', description: 'Tuition — Grade 10', amount: 40000, dueDate: '2026-09-30' },
  { id: 'fs5', academicYear: ACADEMIC_YEAR, term: 'First Term', gradeLevel: 'Grade 11', category: 'tuition', description: 'Tuition — Grade 11', amount: 45000, dueDate: '2026-09-30' },
  { id: 'fs6', academicYear: ACADEMIC_YEAR, term: 'First Term', gradeLevel: 'Grade 12', category: 'tuition', description: 'Tuition — Grade 12', amount: 45000, dueDate: '2026-09-30' },
  { id: 'fs7', academicYear: ACADEMIC_YEAR, term: 'First Term', gradeLevel: 'All Grades', category: 'examination', description: 'Examination Fee', amount: 5000, dueDate: '2026-11-30' },
  { id: 'fs8', academicYear: ACADEMIC_YEAR, term: 'First Term', gradeLevel: 'All Grades', category: 'library', description: 'Library Fee', amount: 2500, dueDate: '2026-10-31' },
];

export const SEED_DETAILED_INVOICES: DetailedInvoice[] = INVOICES.map((inv, i): DetailedInvoice => ({
  id: inv.id,
  invoiceNumber: `INV-2026-${String(i + 1).padStart(3, '0')}`,
  studentId: inv.studentId,
  studentName: inv.studentName,
  className: inv.studentId === 's2' ? 'Grade 8B' : 'Grade 11A',
  academicYear: ACADEMIC_YEAR,
  term: inv.term,
  items: [{ description: inv.description, category: inv.description.includes('Lab') ? 'other' : 'tuition', amount: inv.amount }],
  amount: inv.amount,
  amountPaid: inv.amountPaid,
  dueDate: inv.dueDate,
  issueDate: inv.issueDate,
  status: inv.status === 'paid' ? 'paid' : inv.status === 'partial' ? 'partial' : inv.status === 'overdue' ? 'overdue' : 'issued',
}));

export const SEED_EXPENSES: Expense[] = [
  { id: 'ex1', category: 'Utilities', description: 'Electricity bill — September', amount: 18500, date: '2026-09-10', recipient: 'Liberia Electricity Corp', method: 'bank', reference: 'BNK-90112', approved: true },
  { id: 'ex2', category: 'Supplies', description: 'Laboratory chemicals and glassware', amount: 12750, date: '2026-09-14', recipient: 'SciTech Supplies Ltd', method: 'bank', reference: 'BNK-90118', approved: true },
  { id: 'ex3', category: 'Maintenance', description: 'Classroom roof repair — Block B', amount: 24000, date: '2026-09-18', recipient: 'Kollie & Sons Construction', method: 'cash', reference: 'CSH-00442', approved: false },
  { id: 'ex4', category: 'Transport', description: 'Staff bus fuel — September', amount: 6200, date: '2026-09-20', recipient: 'Monrovia Fuel Station', method: 'mobile_money', reference: 'MM-77821', approved: true },
];

export const SEED_SCHOLARSHIPS: Scholarship[] = [
  { id: 'sch1', name: 'Merit Scholarship 2026', type: 'merit', discountPercent: 50, studentId: 's4', studentName: 'Princess K. Johnson', approved: true, expires: '2027-07-15' },
  { id: 'sch2', name: 'Need-Based Bursary', type: 'need', discountPercent: 30, studentId: 's15', studentName: 'Solomon K. Massaquoi', approved: true, expires: '2027-07-15' },
  { id: 'sch3', name: 'Sports Scholarship', type: 'sport', discountPercent: 25, studentId: 's9', studentName: 'Joseph K. Karwah', approved: false, expires: '2027-07-15' },
];

export const SEED_PLANS: SubscriptionPlan[] = [
  { id: 'plan1', name: 'Starter', priceMonthly: 99, priceYearly: 990, studentLimit: 300, staffLimit: 25, storageGb: 10 },
  { id: 'plan2', name: 'Growth', priceMonthly: 199, priceYearly: 1990, studentLimit: 800, staffLimit: 60, storageGb: 50 },
  { id: 'plan3', name: 'Premium', priceMonthly: 349, priceYearly: 3490, studentLimit: 2500, staffLimit: 200, storageGb: 200 },
];

export const SEED_SCHOOLS: PlatformSchool[] = [
  { id: 'ps1', name: 'Innosys Academy', city: 'Monrovia', country: 'Liberia', principalName: 'Dr. Edward Karpeh', email: 'info@innosysacademy.edu.lr', phone: '+231 77 000 0000', students: 177, staff: 34, status: 'active', subscription: { schoolId: 'ps1', planId: 'plan2', status: 'active', startedAt: '2026-06-15', renewsAt: '2026-12-15', expiresAt: '2027-06-15' } },
  { id: 'ps2', name: 'Buchanan High School', city: 'Buchanan', country: 'Liberia', principalName: 'Mrs. Theresa Nah', email: 'office@buchananhigh.edu.lr', phone: '+231 88 222 3344', students: 420, staff: 38, status: 'active', subscription: { schoolId: 'ps2', planId: 'plan2', status: 'active', startedAt: '2026-07-01', renewsAt: '2026-12-30', expiresAt: '2027-07-01' } },
  { id: 'ps3', name: 'Gbarnga Science Academy', city: 'Gbarnga', country: 'Liberia', principalName: 'Mr. Moses Kollar', email: 'admin@gsacademy.edu.lr', phone: '+231 77 555 8899', students: 265, staff: 30, status: 'trial', subscription: { schoolId: 'ps3', planId: 'plan3', status: 'trial', startedAt: '2026-11-01', renewsAt: '2026-12-01', expiresAt: '2026-12-01' } },
  { id: 'ps4', name: 'Harper Coastal Institute', city: 'Harper', country: 'Liberia', principalName: 'Ms. Ruth Wree', email: 'hello@harpercoastal.edu.lr', phone: '+231 88 909 1122', students: 188, staff: 24, status: 'suspended', subscription: { schoolId: 'ps4', planId: 'plan1', status: 'suspended', startedAt: '2026-02-10', renewsAt: '2026-08-10', expiresAt: '2026-08-10' } },
  { id: 'ps5', name: 'Kakata Teachers Demonstration', city: 'Kakata', country: 'Liberia', principalName: 'Mr. Isaac Zolu', email: 'ktd@kakatademo.edu.lr', phone: '+231 77 310 4455', students: 640, staff: 52, status: 'active', subscription: { schoolId: 'ps5', planId: 'plan3', status: 'active', startedAt: '2026-05-20', renewsAt: '2026-11-30', expiresAt: '2027-05-20' } },
  { id: 'ps6', name: 'Voinjama Central High', city: 'Voinjama', country: 'Liberia', principalName: 'Mrs. Esther Dolo', email: 'vch@voinjamacentral.edu.lr', phone: '+231 88 777 2211', students: 310, staff: 29, status: 'trial', subscription: { schoolId: 'ps6', planId: 'plan1', status: 'past_due', startedAt: '2026-08-05', renewsAt: '2026-11-05', expiresAt: '2026-11-20' } },
];

export const SEED_AUDIT_ENTRIES: AuditEntry[] = [
  { id: 'ae1', user: 'admin@innosys.edu', school: 'Platform', action: 'Reset password', module: 'User Management', timestamp: '2026-09-20 14:22', status: 'success', recordRef: 'tgbarbeah@innosys.edu' },
  { id: 'ae2', user: 'admin@innosys.edu', school: 'Platform', action: 'Suspended school', module: 'Schools', timestamp: '2026-09-20 11:05', status: 'success', recordRef: 'Harper Coastal Institute' },
  { id: 'ae3', user: 'principal@innosys.edu', school: 'Innosys Academy', action: 'Approved gradebook', module: 'Gradebook Approvals', timestamp: '2026-09-19 16:30', status: 'success', recordRef: 'English Language — Grade 11A' },
  { id: 'ae4', user: 'registrar@innosys.edu', school: 'Innosys Academy', action: 'Enrolled new student', module: 'Registrations', timestamp: '2026-09-18 10:15', status: 'success', recordRef: 'Angeline M. Sumo' },
  { id: 'ae5', user: 'finance@innosys.edu', school: 'Innosys Academy', action: 'Verified payment', module: 'Payments', timestamp: '2026-09-17 09:00', status: 'success', recordRef: 'INV-2026-001' },
  { id: 'ae6', user: 'admin@innosys.edu', school: 'Platform', action: 'Modified role permissions', module: 'Roles', timestamp: '2026-09-16 15:00', status: 'success', recordRef: 'Teacher role' },
];

export const SEED_GUARDIAN_LINKS: GuardianLink[] = [
  { id: 'gl1', guardianUserId: 'u12', guardianName: 'Mrs. Janet Mensah', studentId: 's1', studentName: 'John K. Mensah', relationship: 'Mother', status: 'linked', code: 'USED-GL1', codeExpires: '2026-08-01', createdAt: '2026-07-15' },
  { id: 'gl2', guardianUserId: 'u12', guardianName: 'Mrs. Janet Mensah', studentId: 's2', studentName: 'Mary K. Mensah', relationship: 'Mother', status: 'linked', code: 'USED-GL2', codeExpires: '2026-08-01', createdAt: '2026-07-15' },
];

export const SEED_LESSON_PLANS: LessonPlan[] = [
  { id: 'lp1', teacherId: 'u6', teacherName: 'Mr. Peter Wleh', subjectName: 'Mathematics', classId: 'c5', className: 'Grade 11A', week: 'Week 4 (Sep 22-26)', topic: 'Quadratic Equations — completing the square', objectives: 'Solve quadratic equations by completing the square and apply to word problems.', methods: 'Guided practice, worked examples, pair problem-solving', materials: 'Textbook Ch. 4, graphing worksheets, GeoGebra demo', homework: 'Exercise 4.3, questions 1-12', completed: false, createdAt: '2026-09-20' },
  { id: 'lp2', teacherId: 'u6', teacherName: 'Mr. Peter Wleh', subjectName: 'Physics', classId: 'c5', className: 'Grade 11A', week: 'Week 4 (Sep 22-26)', topic: "Newton's Laws — applications", objectives: 'Apply Newton\'s second law to friction and incline problems.', methods: 'Demonstration, lab experiment on force boards', materials: 'Force boards, spring scales, masses', homework: 'Lab report due Friday', completed: true, createdAt: '2026-09-19' },
];

export const SEED_NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', recipientRoles: ['principal', 'academic_officer'], title: 'Gradebook submitted for approval', message: 'Mr. Peter Wleh submitted the Mathematics — Grade 11A gradebook for First Term review.', category: 'gradebook', relatedPage: 'gradebook-approvals', createdAt: '2026-09-18 09:30', readBy: [] },
  { id: 'n2', recipientRoles: ['student', 'parent'], recipientUserIds: ['u11', 'u12'], title: 'Result released', message: 'Your Cell Biology Quiz result has been released.', category: 'results', relatedPage: 'results', createdAt: '2026-09-17 14:00', readBy: [] },
  { id: 'n3', recipientRoles: ['finance'], title: 'Payment awaiting verification', message: 'A bank slip payment of L$20,000 from Mary K. Mensah is awaiting verification.', category: 'finance', relatedPage: 'payments', createdAt: '2026-09-10 11:20', readBy: [] },
  { id: 'n4', recipientRoles: ['parent'], recipientUserIds: ['u12'], title: 'Invoice issued', message: 'Lab Fee invoice of L$5,000 was issued for John K. Mensah.', category: 'finance', relatedPage: 'fees', createdAt: '2026-08-15 08:00', readBy: ['u12'] },
  { id: 'n5', recipientRoles: ['librarian'], title: 'New book request', message: 'John K. Mensah requested "Biology for Senior High School".', category: 'library', relatedPage: 'requests', createdAt: '2026-09-19 13:45', readBy: [] },
];

export function convertLegacyPayments(): Payment[] {
  return PAYMENTS;
}

export const LEGACY_INVOICE_COUNT = INVOICES.length;

export type { InvoiceVersion2 };
