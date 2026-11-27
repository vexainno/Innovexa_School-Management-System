import { Component, Suspense, lazy, useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AppLayout } from '@/components/AppLayout';
import { LoginPage } from '@/components/LoginPage';
import { ROLE_NAV, SHARED_PAGES } from '@/config/navigation';
import type { Role } from '@/types';
import type { PageProps } from '@/portals/shared';

type Page = ComponentType<PageProps>;
type Loader = () => Promise<Record<string, unknown>>;

/** Lazily loads one named export so each workspace ships as its own chunk. */
const lazyCache = new Map<string, Page>();
function L(loader: Loader, key: string, name: string, props?: Record<string, unknown>): Page {
  const id = `${key}:${name}:${JSON.stringify(props ?? {})}`;
  const hit = lazyCache.get(id);
  if (hit) return hit;
  const C = lazy(async () => {
    const m = await loader();
    const Inner = m[name] as ComponentType<PageProps & Record<string, unknown>>;
    const Wrapped = (p: PageProps) => <Inner {...p} {...props} />;
    return { default: Wrapped };
  });
  const page = C as unknown as Page;
  lazyCache.set(id, page);
  return page;
}

const shared: Loader = () => import('@/portals/shared');
const principal: Loader = () => import('@/portals/principal');
const academic: Loader = () => import('@/portals/academic');
const vp: Loader = () => import('@/portals/vicePrincipal');
const registrar: Loader = () => import('@/portals/registrar');
const finance: Loader = () => import('@/portals/finance');
const parent: Loader = () => import('@/portals/parent');
const dean: Loader = () => import('@/portals/dean');
const librarian: Loader = () => import('@/portals/librarian');
const platform: Loader = () => import('@/portals/platform');
const teacher: Loader = () => import('@/portals/teacher');
const student: Loader = () => import('@/portals/student');
const oldTeacher: Loader = () => import('@/pages/TeacherCounselorPages');
const oldStudent: Loader = () => import('@/pages/StudentParentPages');
const teacherAssess: Loader = () => import('@/portals/teacherAssess');
const studentAssess: Loader = () => import('@/portals/studentAssess');
const studentPortal: Loader = () => import('@/pages/StudentPortalDashboard');
const studentAtt: Loader = () => import('@/pages/StudentAttendanceCalendar');
const studentResults: Loader = () => import('@/pages/StudentResultsPage');
const studentCounsel: Loader = () => import('@/pages/StudentCounselingAppointments');
const early: Loader = () => import('@/pages/earlyWarningPages');
const counselNotes: Loader = () => import('@/pages/CounselorSupportNotification');

const NOTIFICATIONS = L(shared, 'shared', 'NotificationsPage');
const CALENDAR = L(shared, 'shared', 'CalendarPage');
const ANNOUNCE_POST = L(shared, 'shared', 'AnnouncementsPage', { canPost: true });
const ANNOUNCE_READ = L(shared, 'shared', 'AnnouncementsPage');

const ROUTES: Record<Role, Record<string, Page>> = {
  principal: {
    dashboard: L(principal, 'p', 'PrincipalOverview'),
    'school-info': L(principal, 'p', 'SchoolInformation'),
    'student-management': L(principal, 'p', 'StudentManagement'),
    'staff-management': L(principal, 'p', 'StaffManagement'),
    'academic-overview': L(principal, 'p', 'AcademicOverview'),
    'attendance-reports': L(principal, 'p', 'AttendanceReports'),
    'financial-overview': L(principal, 'p', 'FinancialOverview'),
    'discipline-reports': L(principal, 'p', 'DisciplineReports'),
    'exams-results': L(principal, 'p', 'ExamsResults'),
    'report-card-approvals': L(principal, 'p', 'ReportCardApprovals'),
    announcements: ANNOUNCE_POST,
    'administrative-reports': L(principal, 'p', 'AdministrativeReports'),
    settings: L(principal, 'p', 'PrincipalSettings'),
  },
  academic_officer: {
    dashboard: L(academic, 'a', 'AcademicDashboard'),
    'academic-structure': L(academic, 'a', 'AcademicStructure'),
    'academic-calendar': L(academic, 'a', 'AcademicCalendarPage'),
    'classes-sections': L(academic, 'a', 'ClassesSections'),
    subjects: L(academic, 'a', 'SubjectsCourses'),
    'teacher-assignments': L(academic, 'a', 'TeacherAssignments'),
    examinations: L(academic, 'a', 'ExaminationManagement'),
    'gradebook-processing': L(academic, 'a', 'GradebookProcessing'),
    'student-records': L(academic, 'a', 'StudentAcademicRecords'),
    grading: L(academic, 'a', 'GradingConfiguration'),
    'report-cards': L(academic, 'a', 'ReportCardManagement'),
    performance: L(academic, 'a', 'AcademicPerformance'),
    reports: L(academic, 'a', 'AcademicReports'),
    settings: L(academic, 'a', 'AcademicSettings'),
  },
  vice_principal: {
    dashboard: L(vp, 'vp', 'VPOverview'),
    'teacher-attendance': L(vp, 'vp', 'TeacherAttendance'),
    'student-attendance': L(vp, 'vp', 'StudentAttendance'),
    'class-monitoring': L(vp, 'vp', 'ClassMonitoring'),
    'teacher-timetables': L(vp, 'vp', 'TeacherTimetables'),
    'class-schedules': L(vp, 'vp', 'ClassSchedules'),
    'daily-activities': L(vp, 'vp', 'DailyActivities'),
    substitutes: L(vp, 'vp', 'Substitutes'),
    'student-movement': L(vp, 'vp', 'StudentMovement'),
    'incident-reports': L(vp, 'vp', 'OperationalIncidents'),
    'staff-reports': L(vp, 'vp', 'StaffReports'),
    announcements: ANNOUNCE_POST,
    calendar: L(shared, 'shared', 'CalendarPage', { editable: true }),
  },
  registrar: {
    dashboard: L(registrar, 'r', 'RegistrarOverview'),
    registration: L(registrar, 'r', 'StudentRegistration'),
    applications: L(registrar, 'r', 'AdmissionApplications'),
    profiles: L(registrar, 'r', 'StudentProfiles'),
    guardians: L(registrar, 'r', 'GuardianRecords'),
    'class-assignment': L(registrar, 'r', 'ClassAssignment'),
    promotion: L(registrar, 'r', 'StudentPromotion'),
    transfers: L(registrar, 'r', 'StudentTransfers'),
    withdrawals: L(registrar, 'r', 'Withdrawals'),
    'id-numbers': L(registrar, 'r', 'IdNumbers'),
    'enrollment-reports': L(registrar, 'r', 'EnrollmentReports'),
    archive: L(registrar, 'r', 'RecordsArchive'),
  },
  finance: {
    dashboard: L(finance, 'f', 'FinanceOverview'),
    'fee-structure': L(finance, 'f', 'FeeStructurePage'),
    'student-accounts': L(finance, 'f', 'StudentAccounts'),
    'record-payments': L(finance, 'f', 'RecordPayments'),
    receipts: L(finance, 'f', 'Receipts'),
    outstanding: L(finance, 'f', 'Outstanding'),
    'payment-history': L(finance, 'f', 'PaymentHistory'),
    concessions: L(finance, 'f', 'Concessions'),
    expenditure: L(finance, 'f', 'Expenditure'),
    salaries: L(finance, 'f', 'Salaries'),
    budget: L(finance, 'f', 'Budget'),
    'financial-reports': L(finance, 'f', 'FinancialReports'),
    reconciliation: L(finance, 'f', 'Reconciliation'),
  },
  parent: {
    dashboard: L(parent, 'pa', 'ParentOverview'),
    children: L(parent, 'pa', 'MyChildren'),
    attendance: L(parent, 'pa', 'ParentAttendance'),
    'academic-performance': L(parent, 'pa', 'ParentPerformance'),
    'exam-results': L(parent, 'pa', 'ExamResults'),
    'report-cards': L(parent, 'pa', 'ParentReportCards'),
    timetable: L(parent, 'pa', 'ChildTimetable'),
    announcements: ANNOUNCE_READ,
    'teacher-communication': L(parent, 'pa', 'TeacherCommunication'),
    fees: L(parent, 'pa', 'FeesAndPayment'),
    'payment-history': L(parent, 'pa', 'ParentPaymentHistory'),
    calendar: CALENDAR,
    notifications: NOTIFICATIONS,
    profile: L(parent, 'pa', 'ParentProfile'),
  },
  dean: {
    dashboard: L(dean, 'd', 'DeanOverview'),
    'student-conduct': L(dean, 'd', 'StudentConduct'),
    'disciplinary-cases': L(dean, 'd', 'DisciplinaryCases'),
    'incident-reports': L(dean, 'd', 'IncidentReports'),
    'attendance-monitoring': L(dean, 'd', 'AttendanceMonitoring'),
    complaints: L(dean, 'd', 'StudentComplaints'),
    leadership: L(dean, 'd', 'StudentLeadership'),
    'parent-notifications': L(dean, 'd', 'ParentNotifications'),
    'welfare-reports': L(dean, 'd', 'WelfareReports'),
    'follow-ups': L(dean, 'd', 'FollowUps'),
  },
  librarian: {
    dashboard: L(librarian, 'l', 'LibraryOverview'),
    inventory: L(librarian, 'l', 'BookInventory'),
    'add-book': L(librarian, 'l', 'AddBook'),
    categories: L(librarian, 'l', 'BookCategories'),
    borrowing: L(librarian, 'l', 'StudentBorrowing'),
    returns: L(librarian, 'l', 'BookReturns'),
    overdue: L(librarian, 'l', 'OverdueBooks'),
    'damaged-missing': L(librarian, 'l', 'DamagedMissing'),
    'library-accounts': L(librarian, 'l', 'LibraryAccounts'),
    reports: L(librarian, 'l', 'LibraryReports'),
  },
  super_admin: {
    dashboard: L(platform, 'pl', 'PlatformOverview'),
    schools: L(platform, 'pl', 'SchoolManagement'),
    'create-school': L(platform, 'pl', 'CreateSchool'),
    configurations: L(platform, 'pl', 'SchoolConfigurations'),
    subscriptions: L(platform, 'pl', 'Subscriptions'),
    'platform-users': L(platform, 'pl', 'PlatformUsers'),
    roles: L(platform, 'pl', 'SystemRoles'),
    analytics: L(platform, 'pl', 'PlatformAnalytics'),
    monitoring: L(platform, 'pl', 'SystemMonitoring'),
    storage: L(platform, 'pl', 'StorageManagement'),
    backups: L(platform, 'pl', 'BackupManagement'),
    audit: L(platform, 'pl', 'AuditLogs'),
    'platform-settings': L(platform, 'pl', 'PlatformSettings'),
    support: L(platform, 'pl', 'SupportMaintenance'),
  },
  teacher: {
    dashboard: L(oldTeacher, 'ot', 'TeacherDashboard'),
    classes: L(teacher, 't', 'TeacherClasses'),
    subjects: L(teacher, 't', 'TeacherSubjects'),
    timetable: L(teacher, 't', 'TeacherTimetable'),
    'student-lists': L(teacher, 't', 'StudentLists'),
    attendance: L(oldTeacher, 'ot', 'TeacherAttendance'),
    assignments: L(teacherAssess, 'ta', 'TeacherAssignmentsPage'),
    'online-assessments': L(teacherAssess, 'ta', 'OnlineAssessmentsPage'),
    'assessment-questions': L(teacherAssess, 'ta', 'QuestionBank'),
    submissions: L(teacherAssess, 'ta', 'SubmissionsPage'),
    marking: L(teacherAssess, 'ta', 'MarkingPage'),
    gradebook: L(teacher, 't', 'GradebookSubmission'),
    materials: L(oldTeacher, 'ot', 'TeacherResources'),
    'academic-progress': L(teacher, 't', 'AcademicProgress'),
    'student-performance': L(teacher, 't', 'StudentPerformance'),
    notifications: NOTIFICATIONS,
    communication: L(teacher, 't', 'TeacherCommunication'),
  },
  counselor: {
    dashboard: L(oldTeacher, 'ot', 'CounselorDashboard'),
    cases: L(oldTeacher, 'ot', 'CounselorCases'),
    'at-risk': L(oldTeacher, 'ot', 'CounselorAtRisk'),
    interventions: L(oldTeacher, 'ot', 'CounselorInterventions'),
    'follow-ups': L(oldTeacher, 'ot', 'CounselorFollowUps'),
    availability: L(oldTeacher, 'ot', 'CounselorAvailability'),
    'early-warning-dashboard': L(early, 'ew', 'EarlyWarningDashboard'),
    'early-warning': L(early, 'ew', 'EarlyWarningAlerts'),
    'early-warning-rules': L(early, 'ew', 'EarlyWarningRules'),
    'student-support-notifications': L(counselNotes, 'cn', 'CounselorSupportNotifications'),
  },
  student: {
    dashboard: L(studentPortal, 'sp', 'StudentPortalDashboard'),
    classes: L(oldStudent, 'os', 'StudentClasses'),
    subjects: L(oldStudent, 'os', 'StudentSubjects'),
    timetable: L(student, 'st', 'StudentTimetable'),
    assignments: L(studentAssess, 'sa2', 'StudentAssignmentsPage'),
    'online-assessments': L(studentAssess, 'sa2', 'StudentQuizzesPage'),
    resources: L(oldStudent, 'os', 'StudentResources'),
    attendance: L(studentAtt, 'sa', 'StudentAttendanceCalendar'),
    results: L(studentResults, 'sr', 'StudentResultsPage'),
    'report-cards': L(student, 'st', 'StudentReportCard'),
    library: L(student, 'st', 'StudentLibrary'),
    'counseling-appointments': L(studentCounsel, 'sc', 'StudentCounselingAppointments'),
    announcements: ANNOUNCE_READ,
    notifications: NOTIFICATIONS,
  },
};

/** Older page names still used by a few retained screens. */
const ALIASES: Partial<Record<Role, Record<string, string>>> = {
  teacher: { assessments: 'online-assessments', resources: 'materials', students: 'student-lists', messages: 'communication' },
  student: { assessments: 'online-assessments', 'report-card': 'report-cards' },
};

function readHash() {
  const h = window.location.hash.replace(/^#\/?/, '');
  return decodeURIComponent(h) || 'dashboard';
}

class ErrorBoundary extends Component<{ children: ReactNode; resetKey: string }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidUpdate(prev: { resetKey: string }) { if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null }); }
  render() {
    if (this.state.error) {
      return (
        <div className="card p-8 max-w-xl mx-auto" role="alert">
          <h1 className="text-xl font-semibold text-navy-900">Something went wrong on this page</h1>
          <p className="text-sm text-navy-600 mt-2">Please try again. If the problem continues, contact your school administrator.</p>
          <button type="button" className="btn-primary mt-5" onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function PageFallback() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-64 bg-navy-100 rounded" />
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-28 bg-white rounded-xl border border-navy-100" />)}</div>
      <div className="h-64 bg-white rounded-xl border border-navy-100" />
    </div>
  );
}

function AppContent() {
  const { user } = useAuth();
  const [route, setRoute] = useState(readHash);

  useEffect(() => {
    const onHash = () => { setRoute(readHash()); window.scrollTo({ top: 0 }); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (!user) return <LoginPage />;

  const navigate = (page: string) => { window.location.hash = `#/${page}`; };
  const [rawPage, param] = route.split(':');
  const page = ALIASES[user.role]?.[rawPage] ?? rawPage;
  const roleRoutes = ROUTES[user.role] ?? {};
  const allowed = ROLE_NAV[user.role]?.some((i) => i.page === page) || SHARED_PAGES.includes(page);
  const Current = allowed ? roleRoutes[page] ?? (page === 'notifications' ? NOTIFICATIONS : page === 'calendar' ? CALENDAR : undefined) : undefined;

  return (
    <AppLayout currentPage={page} onNavigate={navigate}>
      <ErrorBoundary resetKey={route}>
        <Suspense fallback={<PageFallback />}>
          {Current ? <Current key={route} onNavigate={navigate} param={param} /> : (
            <div className="card p-8 max-w-xl mx-auto" role="alert">
              <h1 className="text-xl font-semibold text-navy-900">Page not found</h1>
              <p className="text-sm text-navy-600 mt-2">This page doesn't exist or isn't available for your role.</p>
              <button type="button" className="btn-primary mt-5" onClick={() => navigate('dashboard')}>Go to dashboard</button>
            </div>
          )}
        </Suspense>
      </ErrorBoundary>
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
