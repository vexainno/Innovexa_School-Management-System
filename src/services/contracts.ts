import type {
  Announcement, Assessment, AttendanceRecord, Book, ClassInfo, GradebookSubmission,
  Invoice, Payment, Student, User,
} from '@/types';

export interface ListQuery { search?: string; page?: number; pageSize?: number; status?: string }
export interface PageResult<T> { items: T[]; total: number; page: number; pageSize: number }
export interface AuthServiceContract {
  signIn(email: string, password: string): Promise<User>;
  signOut(): Promise<void>;
}
export interface StudentServiceContract {
  list(query?: ListQuery): Promise<PageResult<Student>>;
  getById(id: string): Promise<Student | undefined>;
}
export interface TimetableServiceContract {
  listForClass(classId: string): Promise<unknown[]>;
  listForTeacher(teacherId: string): Promise<unknown[]>;
}
export interface AssessmentServiceContract {
  listForClass(classId: string): Promise<Assessment[]>;
  listGradebooks(): Promise<GradebookSubmission[]>;
}
export interface FinanceServiceContract {
  listInvoices(query?: ListQuery): Promise<PageResult<Invoice>>;
  listPayments(query?: ListQuery): Promise<PageResult<Payment>>;
}
export interface PaymentServiceContract {
  createCheckoutPreview(invoiceId: string, amount: number): Promise<{ state: 'SIMULATED_PENDING'; invoiceId: string; amount: number; reference: string }>;
}
export interface NotificationServiceContract {
  listForRole(role: string): Promise<Announcement[]>;
}
export interface LibraryServiceContract {
  listBooks(query?: ListQuery): Promise<PageResult<Book>>;
}
export interface AttendanceServiceContract {
  listForClass(classId: string): Promise<AttendanceRecord[]>;
  listForStudent(studentId: string): Promise<AttendanceRecord[]>;
}
export interface SchoolStructureServiceContract {
  listClasses(): Promise<ClassInfo[]>;
}
