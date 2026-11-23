
import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { SchoolDataProvider } from '@/context/SchoolDataContext';
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

// VP Calendar, Timetable & Ops
import {
  VPSchoolCalendar,
  VPTimetableBuilder,
  VPPublishedTimetables,
  VPSubstitutions,
  VPDutyRoster,
} from '@/pages/VPOperationsPages';

// Registrar Extended
import {
  RegistrarRegisterStudent,
  RegistrarBulkImport,
  RegistrarPromotion,
  RegistrarWithdrawal,
  RegistrarGuardianLinks,
} from '@/pages/RegistrarWorkflowPages';

// Academic Officer Extended
import {
  AcademicYearsTerms,
  AcademicTeacherAssignments,
  AcademicGradingConfig,
  AcademicGradebookProcessing,
} from '@/pages/AcademicOfficerPages';

// Teacher Extended
import { TeacherLessonPlans, TeacherTimetable } from '@/pages/TeacherWorkflowPages';

// Student Extended
import { StudentTimetable, StudentSchoolCalendar } from '@/pages/StudentWorkflowPages';

// Finance Extended
import {
  FinanceFeeStructures,
  FinanceScholarships,
  FinanceExpenses,
} from '@/pages/FinanceWorkflowPages';

// Dean Extended
import { DeanIncidentReports, DeanInvestigations } from '@/pages/DeanWorkflowPages';

// Super Admin Extended
import {
  SuperAdminSchools,
  SuperAdminSubscriptions,
  SuperAdminAnalytics,
} from '@/pages/SuperAdminWorkflowPages';

// Parent Extended
import { ParentSchoolCalendar } from '@/pages/ParentWorkflowPages';

import type { Role } from '@/types';

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
    'school-calendar': VPSchoolCalendar,
    'timetable-builder': VPTimetableBuilder,
    'published-timetables': VPPublishedTimetables,
    substitutions: VPSubstitutions,
    'duty-roster': VPDutyRoster,
    'class-management': VPClassManagement,
    attendance: VPAttendance,
    staff: VPStaff,
    'student-affairs': VPStudentAffairs,
    notices: VPNotices,
    reports: VPReports,
  },

  dean: {
    dashboard: DeanDashboard,
    'incident-reports': DeanIncidentReports,
    investigations: DeanInvestigations,
    discipline: DeanDiscipline,
    attendance: DeanAttendance,
    activities: DeanActivities,
    'follow-ups': DeanFollowUps,
  },

  registrar: {
    dashboard: RegistrarDashboard,
    admissions: RegistrarAdmissions,
    'register-student': RegistrarRegisterStudent,
    students: RegistrarStudents,
    'bulk-import': RegistrarBulkImport,
    classes: RegistrarClasses,
    promotion: RegistrarPromotion,
    withdrawal: RegistrarWithdrawal,
    guardians: RegistrarGuardians,
    'guardian-links': RegistrarGuardianLinks,
    transfers: RegistrarTransfers,
    documents: RegistrarDocuments,
  },

  academic_officer: {
    dashboard: AcademicDashboard,
    'academic-years': AcademicYearsTerms,
    examinations: AcademicExaminations,
    'teacher-assignments': AcademicTeacherAssignments,
    'grading-config': AcademicGradingConfig,
    'gradebook-processing': AcademicGradebookProcessing,
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
    timetable: TeacherTimetable,
    'lesson-plans': TeacherLessonPlans,

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
    'fee-structures': FinanceFeeStructures,
    fees: FinanceFees,
    invoices: FinanceInvoices,
    payments: FinancePayments,
    outstanding: FinanceOutstanding,
    scholarships: FinanceScholarships,
    expenses: FinanceExpenses,
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
    schools: SuperAdminSchools,
    subscriptions: SuperAdminSubscriptions,
    analytics: SuperAdminAnalytics,
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
    timetable: StudentTimetable,
    'school-calendar': StudentSchoolCalendar,
    assignments: StudentAssignments,
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
    'school-calendar': ParentSchoolCalendar,
    fees: ParentFees,
    library: ParentLibrary,
    announcements: ParentAnnouncements,
  },
};

function AppContent() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!user) {
    return <LoginPage />;
  }

  const roleRoutes = ROUTES[user.role] || {};

  const CurrentPage =
    roleRoutes[currentPage] ||
    roleRoutes.dashboard ||
    (() => null);

  return (
    <AppLayout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
    >
      <CurrentPage onNavigate={setCurrentPage} />
    </AppLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <SchoolDataProvider>
        <AppContent />
      </SchoolDataProvider>
    </AuthProvider>
  );
}

export default App;
