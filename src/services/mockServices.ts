import {
  ANNOUNCEMENTS, ASSESSMENTS, ATTENDANCE, BOOKS, CLASSES, GRADEBOOK_SUBMISSIONS,
  INVOICES, PAYMENTS, STUDENTS,
} from '@/data/mockData';
import type { ListQuery, PageResult } from '@/services/contracts';
import { getClassTimetable } from '@/data/schoolCalendar';
import type {
  AssessmentServiceContract, AttendanceServiceContract, FinanceServiceContract,
  LibraryServiceContract, NotificationServiceContract, PaymentServiceContract,
  SchoolStructureServiceContract, StudentServiceContract, TimetableServiceContract,
} from '@/services/contracts';

function paginate<T>(source: T[], query: ListQuery = {}): PageResult<T> {
  const pageSize = Math.max(1, query.pageSize ?? 25);
  const page = Math.max(1, query.page ?? 1);
  const start = (page - 1) * pageSize;
  return { items: source.slice(start, start + pageSize), total: source.length, page, pageSize };
}

export const mockStudentService: StudentServiceContract = {
  async list(query = {}) {
    const search = query.search?.trim().toLowerCase();
    const filtered = STUDENTS.filter((student) => (!search || `${student.name} ${student.rollNo} ${student.class}`.toLowerCase().includes(search)) && (!query.status || student.status === query.status));
    return paginate(filtered, query);
  },
  async getById(id) { return STUDENTS.find((student) => student.id === id); },
};

export const mockTimetableService: TimetableServiceContract = {
  async listForClass(classId) { return getClassTimetable().filter((entry) => entry.classId === classId && entry.published); },
  async listForTeacher(teacherId) { return getClassTimetable().filter((entry) => entry.teacherId === teacherId && entry.published); },
};

export const mockAssessmentService: AssessmentServiceContract = {
  async listForClass(classId) { return ASSESSMENTS.filter((item) => item.classId === classId); },
  async listGradebooks() { return GRADEBOOK_SUBMISSIONS; },
};

export const mockFinanceService: FinanceServiceContract = {
  async listInvoices(query = {}) { return paginate(INVOICES.filter((item) => !query.status || item.status === query.status), query); },
  async listPayments(query = {}) { return paginate(PAYMENTS.filter((item) => !query.status || item.status === query.status), query); },
};

export const mockPaymentService: PaymentServiceContract = {
  async createCheckoutPreview(invoiceId, amount) {
    return { state: 'SIMULATED_PENDING', invoiceId, amount, reference: `DEMO-${invoiceId}-${Date.now()}` };
  },
};

export const mockNotificationService: NotificationServiceContract = {
  async listForRole(role) { return ANNOUNCEMENTS.filter((item) => item.audience === 'whole_school' || item.audience.toLowerCase().includes(role)); },
};

export const mockLibraryService: LibraryServiceContract = {
  async listBooks(query = {}) { const search = query.search?.trim().toLowerCase(); return paginate(BOOKS.filter((book) => !search || `${book.title} ${book.author} ${book.isbn}`.toLowerCase().includes(search)), query); },
};

export const mockAttendanceService: AttendanceServiceContract = {
  async listForClass(classId) { return ATTENDANCE.filter((record) => record.classId === classId); },
  async listForStudent(studentId) { return ATTENDANCE.filter((record) => record.studentId === studentId); },
};

export const mockSchoolStructureService: SchoolStructureServiceContract = {
  async listClasses() { return CLASSES; },
};
