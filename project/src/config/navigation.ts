
import type { Role, NavItem } from '@/types';

export const ROLE_NAV: Record<Role, NavItem[]> = {
  principal: [
    { label: 'Dashboard', icon: 'LayoutDashboard', page: 'dashboard' },
    { label: 'Enrollment Overview', icon: 'Users', page: 'enrollment' },
    { label: 'Attendance Overview', icon: 'CalendarCheck', page: 'attendance' },
    { label: 'Academic Performance', icon: 'GraduationCap', page: 'performance' },
    { label: 'Gradebook Approvals', icon: 'ClipboardCheck', page: 'gradebook-approvals' },
    { label: 'Results & Approval', icon: 'Award', page: 'results' },
    { label: 'Student Affairs', icon: 'Users2', page: 'student-affairs' },
    { label: 'Reports', icon: 'FileBarChart', page: 'reports' },
    { label: 'Announcements', icon: 'Megaphone', page: 'announcements' },
  ],

  vice_principal: [
    { label: 'Dashboard', icon: 'LayoutDashboard', page: 'dashboard' },
    { label: 'Daily Operations', icon: 'Activity', page: 'operations' },
    { label: 'Class & Student Management', icon: 'School', page: 'class-management' },
    { label: 'Attendance Monitoring', icon: 'CalendarCheck', page: 'attendance' },
    { label: 'Staff Activity', icon: 'Users', page: 'staff' },
    { label: 'Student Affairs', icon: 'Users2', page: 'student-affairs' },
    { label: 'Notices', icon: 'BellRing', page: 'notices' },
    { label: 'Reports', icon: 'FileBarChart', page: 'reports' },
  ],

  dean: [
    { label: 'Dashboard', icon: 'LayoutDashboard', page: 'dashboard' },
    { label: 'Discipline Cases', icon: 'Gavel', page: 'discipline' },
    { label: 'Attendance Concerns', icon: 'CalendarX', page: 'attendance' },
    { label: 'Student Activities', icon: 'Activity', page: 'activities' },
    { label: 'Follow-up Actions', icon: 'ListChecks', page: 'follow-ups' },
  ],

  registrar: [
    { label: 'Dashboard', icon: 'LayoutDashboard', page: 'dashboard' },
    { label: 'Admissions', icon: 'UserPlus', page: 'admissions' },
    { label: 'Student Records', icon: 'FileText', page: 'students' },
    { label: 'Class Placement', icon: 'Grid3x3', page: 'classes' },
    { label: 'Parent/Guardian Records', icon: 'Users', page: 'guardians' },
    { label: 'Transfers', icon: 'ArrowLeftRight', page: 'transfers' },
    { label: 'Documents', icon: 'FolderOpen', page: 'documents' },
  ],

  academic_officer: [
    { label: 'Dashboard', icon: 'LayoutDashboard', page: 'dashboard' },
    { label: 'Examinations', icon: 'FileCheck', page: 'examinations' },
    { label: 'Submitted Gradebooks', icon: 'ClipboardList', page: 'submitted-gradebooks' },
    { label: 'Approved Grades', icon: 'CheckCircle2', page: 'approved-grades' },
    { label: 'Results Release', icon: 'Send', page: 'results-release' },
    { label: 'Classes & Subjects', icon: 'BookOpen', page: 'classes-subjects' },
    { label: 'Reports', icon: 'FileBarChart', page: 'reports' },
  ],

  teacher: [
    { label: 'Dashboard', icon: 'LayoutDashboard', page: 'dashboard' },
    { label: 'My Classes', icon: 'Users', page: 'classes' },
    { label: 'My Subjects', icon: 'BookOpen', page: 'subjects' },
    { label: 'My Students', icon: 'Users2', page: 'students' },
    { label: 'Attendance', icon: 'CalendarCheck', page: 'attendance' },
    { label: 'Assignments', icon: 'FileText', page: 'assignments' },
    { label: 'Assessments', icon: 'ClipboardList', page: 'assessments' },
    { label: 'Submit Gradebook', icon: 'ClipboardEdit', page: 'gradebook' },
    { label: 'Learning Resources', icon: 'Library', page: 'resources' },
    { label: 'Messages', icon: 'MessageSquare', page: 'messages' },
  ],

  counselor: [
    { label: 'Dashboard', icon: 'LayoutDashboard', page: 'dashboard' },
    { label: 'Support Cases', icon: 'HeartHandshake', page: 'cases' },
    { label: 'At-Risk Students', icon: 'AlertTriangle', page: 'at-risk' },
    { label: 'Intervention Records', icon: 'FileHeart', page: 'interventions' },
    { label: 'Follow-up Activities', icon: 'ListChecks', page: 'follow-ups' },
    { label: 'My Availability', icon: 'CalendarCheck', page: 'availability' },
    { label: 'Alert Overview', icon: 'Activity', page: 'early-warning-dashboard' },
    { label: 'Early-Warning Alerts', icon: 'AlertTriangle', page: 'early-warning' },
    { label: 'Alert Rule Settings', icon: 'SlidersHorizontal', page: 'early-warning-rules' },
    { label: 'Student Support Notifications', icon: 'Bell', page: 'student-support-notifications' },
  ],

  finance: [
    { label: 'Dashboard', icon: 'LayoutDashboard', page: 'dashboard' },
    { label: 'Student Fees', icon: 'Receipt', page: 'fees' },
    { label: 'Invoices', icon: 'FileText', page: 'invoices' },
    { label: 'Payments', icon: 'CreditCard', page: 'payments' },
    { label: 'Outstanding Balances', icon: 'AlertCircle', page: 'outstanding' },
    { label: 'Receipts', icon: 'ReceiptText', page: 'receipts' },
    { label: 'Financial Reports', icon: 'BarChart3', page: 'reports' },
  ],

  librarian: [
    { label: 'Dashboard', icon: 'LayoutDashboard', page: 'dashboard' },
    { label: 'Book Catalog', icon: 'BookOpen', page: 'catalog' },
    { label: 'Add Book', icon: 'BookPlus', page: 'add-book' },
    { label: 'Booking Requests', icon: 'Inbox', page: 'requests' },
    { label: 'Borrowed Books', icon: 'BookMarked', page: 'borrowed' },
    { label: 'Borrowing History', icon: 'History', page: 'history' },
  ],

  super_admin: [
    { label: 'Dashboard', icon: 'LayoutDashboard', page: 'dashboard' },
    { label: 'User Accounts', icon: 'Users', page: 'users' },
    { label: 'Roles & Permissions', icon: 'Shield', page: 'roles' },
    { label: 'Account Recovery', icon: 'KeyRound', page: 'recovery' },
    { label: 'School Profile', icon: 'Building2', page: 'school-profile' },
    { label: 'Academic Structure', icon: 'GraduationCap', page: 'academic-structure' },
    { label: 'Integrations', icon: 'Plug', page: 'integrations' },
    { label: 'Security / Audit Logs', icon: 'ScrollText', page: 'audit' },
  ],

  student: [
    { label: 'Dashboard', icon: 'LayoutDashboard', page: 'dashboard' },
    { label: 'My Classes', icon: 'Users', page: 'classes' },
    { label: 'My Subjects', icon: 'BookOpen', page: 'subjects' },
    { label: 'My Assignments', icon: 'FileText', page: 'assignments' },
    { label: 'Learning Resources', icon: 'Library', page: 'resources' },
    { label: 'My Attendance', icon: 'CalendarCheck', page: 'attendance' },
    { label: 'My Results', icon: 'Award', page: 'results' },
    { label: 'My Report Card', icon: 'FileBadge', page: 'report-card' },
    { label: 'Library', icon: 'BookOpen', page: 'library' },
    { label: 'Counseling & Support', icon: 'HeartHandshake', page: 'counseling-appointments' },
    { label: 'Announcements', icon: 'Megaphone', page: 'announcements' },
  ],

  parent: [
    { label: 'Dashboard', icon: 'LayoutDashboard', page: 'dashboard' },
    { label: 'My Children', icon: 'Users', page: 'children' },
    { label: 'Results', icon: 'Award', page: 'results' },
    { label: 'Attendance', icon: 'CalendarCheck', page: 'attendance' },
    { label: 'Report Card', icon: 'FileBadge', page: 'report-card' },
    { label: 'Fees & Payments', icon: 'CreditCard', page: 'fees' },
    { label: 'Library', icon: 'BookOpen', page: 'library' },
    { label: 'Announcements', icon: 'Megaphone', page: 'announcements' },
  ],
};

export const ROLE_TITLES: Record<Role, string> = {
  principal: 'Principal',
  vice_principal: 'Vice Principal',
  dean: 'Dean of Students',
  registrar: 'Registrar',
  academic_officer: 'Academic Officer',
  teacher: 'Teacher',
  counselor: 'Guidance Counselor',
  finance: 'Finance Officer',
  librarian: 'Librarian',
  super_admin: 'Super Admin / ICT',
  student: 'Student',
  parent: 'Parent / Guardian',
};
