
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AppLayout } from '@/components/AppLayout';
import { LoginPage } from '@/components/LoginPage';

// Principal
import {
  PrincipalDashboard,
  PrincipalGradebookApprovals,
  PrincipalResults,
  PrincipalEnrollment,
  PrincipalAttendance,
  PrincipalPerformance,
  PrincipalStudentAffairs,
  PrincipalReports,
  PrincipalAnnouncements,
} from '@/pages/PrincipalPages';

// Vice Principal & Dean
import {
  VicePrincipalDashboard,
  VPOperations,
  VPAttendance,
  VPStaff,
  VPClassManagement,
  VPStudentAffairs,
  VPNotices,
  VPReports,
  DeanDashboard,
  DeanDiscipline,
  DeanAttendance,
  DeanActivities,
  DeanFollowUps,
} from '@/pages/VicePrincipalDeanPages';

// Registrar & Academic Officer
import {
  RegistrarDashboard,
  RegistrarAdmissions,
  RegistrarStudents,
  RegistrarClasses,
  RegistrarGuardians,
  RegistrarTransfers,
  RegistrarDocuments,
  AcademicDashboard,
  AcademicExaminations,
  AcademicSubmittedGradebooks,
  AcademicApprovedGrades,
  AcademicResultsRelease,
  AcademicClassesSubjects,
  AcademicReports,
} from '@/pages/RegistrarAcademicPages';

// Teacher & Counselor
import {
  TeacherDashboard,
  TeacherClasses,
  TeacherSubjects,
  TeacherStudents,
  TeacherAttendance,
  TeacherGradebook,
  TeacherResources,
  TeacherMessages,
  CounselorDashboard,
  CounselorCases,
  CounselorAtRisk,
  CounselorInterventions,
  CounselorFollowUps,
  CounselorAvailability,
} from '@/pages/TeacherCounselorPages';

// Teacher Assessment Pages
import TeacherAssessmentMarking from '@/pages/TeacherAssessmentMarking';
import TeacherAssessmentBuilder from '@/pages/TeacherAssessmentBuilder';

// Finance, Librarian & Super Admin
import {
  FinanceDashboard,
  FinanceFees,
  FinanceInvoices,
  FinancePayments,
  FinanceOutstanding,
  FinanceReceipts,
  FinanceReports,
  LibrarianDashboard,
  LibrarianCatalog,
  LibrarianAddBook,
  LibrarianRequests,
  LibrarianBorrowed,
  LibrarianHistory,
  SuperAdminDashboard,
  SuperAdminUsers,
  SuperAdminRoles,
  SuperAdminRecovery,
  SuperAdminSchoolProfile,
  SuperAdminAcademicStructure,
  SuperAdminIntegrations,
  SuperAdminAudit,
} from '@/pages/FinanceLibrarianAdminPages';

// Student & Parent
import {
  StudentDashboard,
  StudentClasses,
  StudentSubjects,
  StudentAssignments,
  StudentResources,
  StudentAttendance,
  StudentReportCard,
  StudentLibrary,
  StudentAnnouncements,
  ParentDashboard,
  ParentChildren,
  ParentResults,
  ParentAttendance,
  ParentReportCard,
  ParentFees,
  ParentLibrary,
  ParentAnnouncements,
} from '@/pages/StudentParentPages';

// New Student Pages
import { StudentPortalDashboard } from '@/pages/StudentPortalDashboard';
import { StudentAttendanceCalendar } from '@/pages/StudentAttendanceCalendar';
import { StudentResultsPage } from '@/pages/StudentResultsPage';
import { StudentCounselingAppointments } from '@/pages/StudentCounselingAppointments';

// Early-Warning Alerts
import {
  EarlyWarningDashboard,
  EarlyWarningAlerts,
  EarlyWarningRules,
} from '@/pages/earlyWarningPages';

// Counselor Support Notifications
import { CounselorSupportNotifications } from '@/pages/CounselorSupportNotification';
import { VicePrincipalSchoolCalendar } from '@/pages/SchoolCalendar';

import type { Role } from '@/types';
import { ROLE_NAV } from '@/config/navigation';

type PageComponent = (props: {
  onNavigate: (page: string) => void;
}) => React.ReactNode;

const ROUTES: Record<Role, Record<string, PageComponent>> = {
  principal: {
    dashboard: PrincipalDashboard,
    enrollment: PrincipalEnrollment,
    attendance: PrincipalAttendance,
    performance: PrincipalPerformance,
    'gradebook-approvals': PrincipalGradebookApprovals,
    results: PrincipalResults,
    'student-affairs': PrincipalStudentAffairs,
    reports: PrincipalReports,
    announcements: PrincipalAnnouncements,
  },

  vice_principal: {
    dashboard: VicePrincipalDashboard,
    operations: VPOperations,
    'school-calendar': VicePrincipalSchoolCalendar,
    'class-management': VPClassManagement,
    attendance: VPAttendance,
    staff: VPStaff,
    'student-affairs': VPStudentAffairs,
    notices: VPNotices,
    reports: VPReports,
  },

  dean: {
    dashboard: DeanDashboard,
    discipline: DeanDiscipline,
    attendance: DeanAttendance,
    activities: DeanActivities,
    'follow-ups': DeanFollowUps,
  },

  registrar: {
    dashboard: RegistrarDashboard,
    admissions: RegistrarAdmissions,
    students: RegistrarStudents,
    classes: RegistrarClasses,
    guardians: RegistrarGuardians,
    transfers: RegistrarTransfers,
    documents: RegistrarDocuments,
  },

  academic_officer: {
    dashboard: AcademicDashboard,
    examinations: AcademicExaminations,
    'submitted-gradebooks': AcademicSubmittedGradebooks,
    'approved-grades': AcademicApprovedGrades,
    'results-release': AcademicResultsRelease,
    'classes-subjects': AcademicClassesSubjects,
    reports: AcademicReports,
  },

  teacher: {
    dashboard: TeacherDashboard,
    classes: TeacherClasses,
    subjects: TeacherSubjects,
    students: TeacherStudents,
    attendance: TeacherAttendance,

    // Teacher assessment workflows
    assignments: TeacherAssessmentMarking,
    assessments: TeacherAssessmentBuilder,

    gradebook: TeacherGradebook,
    resources: TeacherResources,
    messages: TeacherMessages,
  },

  counselor: {
    dashboard: CounselorDashboard,
    cases: CounselorCases,
    'at-risk': CounselorAtRisk,
    interventions: CounselorInterventions,
    'follow-ups': CounselorFollowUps,
    availability: CounselorAvailability,
    'early-warning-dashboard': EarlyWarningDashboard,
    'early-warning': EarlyWarningAlerts,
    'early-warning-rules': EarlyWarningRules,
    'student-support-notifications': CounselorSupportNotifications,
  },

  finance: {
    dashboard: FinanceDashboard,
    fees: FinanceFees,
    invoices: FinanceInvoices,
    payments: FinancePayments,
    outstanding: FinanceOutstanding,
    receipts: FinanceReceipts,
    reports: FinanceReports,
  },

  librarian: {
    dashboard: LibrarianDashboard,
    catalog: LibrarianCatalog,
    'add-book': LibrarianAddBook,
    requests: LibrarianRequests,
    borrowed: LibrarianBorrowed,
    history: LibrarianHistory,
  },

  super_admin: {
    dashboard: SuperAdminDashboard,
    users: SuperAdminUsers,
    roles: SuperAdminRoles,
    recovery: SuperAdminRecovery,
    'school-profile': SuperAdminSchoolProfile,
    'academic-structure': SuperAdminAcademicStructure,
    integrations: SuperAdminIntegrations,
    audit: SuperAdminAudit,
  },

  student: {
    dashboard: StudentPortalDashboard,
    classes: StudentClasses,
    subjects: StudentSubjects,
    assignments: StudentAssignments,
    assessments: StudentAssignments,
    resources: StudentResources,
    attendance: StudentAttendanceCalendar,
    results: StudentResultsPage,
    'report-card': StudentReportCard,
    library: StudentLibrary,
    announcements: StudentAnnouncements,
    'counseling-appointments': StudentCounselingAppointments,
  },

  parent: {
    dashboard: ParentDashboard,
    children: ParentChildren,
    results: ParentResults,
    attendance: ParentAttendance,
    'report-card': ParentReportCard,
    fees: ParentFees,
    library: ParentLibrary,
    announcements: ParentAnnouncements,
  },
};

function AppContent() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    setCurrentPage('dashboard');
  }, [user?.id]);

  if (!user) {
    return <LoginPage />;
  }

  const roleRoutes = ROUTES[user.role] || {};
  const hasNavigationAccess = ROLE_NAV[user.role]?.some((item) => item.page === currentPage) ?? false;
  const CurrentPage = hasNavigationAccess ? roleRoutes[currentPage] : undefined;

  return (
    <AppLayout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
    >
      {CurrentPage ? (
        <CurrentPage onNavigate={setCurrentPage} />
      ) : (
        <div className="card p-8 max-w-xl mx-auto" role="alert">
          <h1 className="text-xl font-semibold text-navy-900">Page unavailable</h1>
          <p className="text-sm text-navy-600 mt-2">This page is not available for the current role. Choose an item from the navigation to continue.</p>
          <button type="button" className="btn-primary mt-5" onClick={() => setCurrentPage('dashboard')}>Return to dashboard</button>
        </div>
      )}
    </AppLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
