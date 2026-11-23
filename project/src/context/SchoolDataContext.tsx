import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import type {
  AcademicYear, SchoolEvent, TimetableEntry, TeacherSubstitution, IncidentReport,
  FeeStructure, DetailedInvoice, Expense, Scholarship, PlatformSchool, SubscriptionPlan,
  AuditEntry, AppNotification, GuardianLink, LessonPlan, Payment, Book, BookRequest,
  Student, FeeCategory, InvoiceStatus,
} from '@/types';
import {
  SEED_ACADEMIC_YEARS, SEED_EVENTS, SEED_TIMETABLE, SEED_SUBSTITUTIONS, SEED_INCIDENTS,
  SEED_FEE_STRUCTURES, SEED_DETAILED_INVOICES, SEED_EXPENSES, SEED_SCHOLARSHIPS,
  SEED_PLANS, SEED_SCHOOLS, SEED_AUDIT_ENTRIES, SEED_GUARDIAN_LINKS, SEED_LESSON_PLANS,
  SEED_NOTIFICATIONS,
} from '@/data/storeSeed';
import { STUDENTS, BOOKS, BOOK_REQUESTS, PAYMENTS } from '@/data/mockData';

const KEYS = {
  students: 'innosysedu.students.v3',
  academicYears: 'innosysedu.academicYears.v3',
  events: 'innosysedu.events.v3',
  timetable: 'innosysedu.timetable.v3',
  substitutions: 'innosysedu.substitutions.v3',
  incidents: 'innosysedu.incidents.v3',
  feeStructures: 'innosysedu.feeStructures.v3',
  invoices: 'innosysedu.invoices.v3',
  payments: 'innosysedu.payments.v3',
  expenses: 'innosysedu.expenses.v3',
  scholarships: 'innosysedu.scholarships.v3',
  plans: 'innosysedu.plans.v3',
  schools: 'innosysedu.schools.v3',
  audit: 'innosysedu.audit.v3',
  notifications: 'innosysedu.notifications.v3',
  guardianLinks: 'innosysedu.guardianLinks.v3',
  lessonPlans: 'innosysedu.lessonPlans.v3',
  books: 'innosysedu.books.v3',
  bookRequests: 'innosysedu.bookRequests.v3',
} as const;

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable — state stays in memory for this session
  }
}

export function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export interface SchoolData {
  students: Student[];
  academicYears: AcademicYear[];
  events: SchoolEvent[];
  timetable: TimetableEntry[];
  substitutions: TeacherSubstitution[];
  incidents: IncidentReport[];
  feeStructures: FeeStructure[];
  invoices: DetailedInvoice[];
  payments: Payment[];
  expenses: Expense[];
  scholarships: Scholarship[];
  plans: SubscriptionPlan[];
  schools: PlatformSchool[];
  auditEntries: AuditEntry[];
  notifications: AppNotification[];
  guardianLinks: GuardianLink[];
  lessonPlans: LessonPlan[];
  books: Book[];
  bookRequests: BookRequest[];
}

interface SchoolDataContextValue extends SchoolData {
  addStudent: (s: Omit<Student, 'id' | 'photoColor'> & { photoColor?: string }) => Student;
  updateStudent: (id: string, patch: Partial<Student>) => void;
  addEvent: (e: Omit<SchoolEvent, 'id' | 'createdAt'>) => void;
  updateEvent: (id: string, patch: Partial<SchoolEvent>) => void;
  addTimetableEntries: (entries: Omit<TimetableEntry, 'id'>[]) => { ok: true } | { ok: false; conflicts: string[] };
  publishTimetable: (classId: string) => void;
  updateTimetableEntry: (id: string, patch: Partial<TimetableEntry>) => void;
  removeTimetableEntry: (id: string) => void;
  addSubstitution: (s: Omit<TeacherSubstitution, 'id'>) => void;
  updateSubstitution: (id: string, patch: Partial<TeacherSubstitution>) => void;
  addIncident: (i: Omit<IncidentReport, 'id' | 'history' | 'parentNotified'>) => void;
  updateIncident: (id: string, patch: Partial<IncidentReport>) => void;
  addFeeStructure: (f: Omit<FeeStructure, 'id'>) => void;
  removeFeeStructure: (id: string) => void;
  addInvoice: (i: Omit<DetailedInvoice, 'id' | 'invoiceNumber' | 'status' | 'amountPaid'>) => void;
  updateInvoice: (id: string, patch: Partial<DetailedInvoice>) => void;
  addPayment: (p: Omit<Payment, 'id'>) => void;
  updatePayment: (id: string, patch: Partial<Payment>) => void;
  verifyPayment: (paymentId: string) => void;
  addExpense: (e: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, patch: Partial<Expense>) => void;
  addScholarship: (s: Omit<Scholarship, 'id'>) => void;
  updateScholarship: (id: string, patch: Partial<Scholarship>) => void;
  addPlan: (p: Omit<SubscriptionPlan, 'id'>) => void;
  updatePlan: (id: string, patch: Partial<SubscriptionPlan>) => void;
  addSchool: (s: Omit<PlatformSchool, 'id'>) => void;
  updateSchool: (id: string, patch: Partial<PlatformSchool>) => void;
  addAuditEntry: (e: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'readBy'>) => void;
  markNotificationRead: (id: string, userId: string) => void;
  markAllNotificationsRead: (userId: string) => void;
  addGuardianLink: (g: Omit<GuardianLink, 'id' | 'createdAt'>) => GuardianLink;
  updateGuardianLink: (id: string, patch: Partial<GuardianLink>) => void;
  addLessonPlan: (l: Omit<LessonPlan, 'id' | 'createdAt'>) => void;
  updateLessonPlan: (id: string, patch: Partial<LessonPlan>) => void;
  removeLessonPlan: (id: string) => void;
  addBook: (b: Omit<Book, 'id'>) => void;
  updateBook: (id: string, patch: Partial<Book>) => void;
  removeBook: (id: string) => void;
  addBookRequest: (r: Omit<BookRequest, 'id'>) => void;
  updateBookRequest: (id: string, patch: Partial<BookRequest>) => void;
}

const SchoolDataContext = createContext<SchoolDataContextValue | undefined>(undefined);

const AUDIT_ROLES = new Set(['super_admin', 'principal']);

function initials(name: string): string {
  return ['bg-navy-500', 'bg-accent-500', 'bg-success-500', 'bg-navy-600', 'bg-accent-600'][
    name.length % 5
  ];
}

export function SchoolDataProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>(() => load(KEYS.students, STUDENTS));
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>(() => load(KEYS.academicYears, SEED_ACADEMIC_YEARS));
  const [events, setEvents] = useState<SchoolEvent[]>(() => load(KEYS.events, SEED_EVENTS));
  const [timetable, setTimetable] = useState<TimetableEntry[]>(() => load(KEYS.timetable, SEED_TIMETABLE));
  const [substitutions, setSubstitutions] = useState<TeacherSubstitution[]>(() => load(KEYS.substitutions, SEED_SUBSTITUTIONS));
  const [incidents, setIncidents] = useState<IncidentReport[]>(() => load(KEYS.incidents, SEED_INCIDENTS));
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>(() => load(KEYS.feeStructures, SEED_FEE_STRUCTURES));
  const [invoices, setInvoices] = useState<DetailedInvoice[]>(() => load(KEYS.invoices, SEED_DETAILED_INVOICES));
  const [payments, setPayments] = useState<Payment[]>(() => load(KEYS.payments, PAYMENTS));
  const [expenses, setExpenses] = useState<Expense[]>(() => load(KEYS.expenses, SEED_EXPENSES));
  const [scholarships, setScholarships] = useState<Scholarship[]>(() => load(KEYS.scholarships, SEED_SCHOLARSHIPS));
  const [plans, setPlans] = useState<SubscriptionPlan[]>(() => load(KEYS.plans, SEED_PLANS));
  const [schools, setSchools] = useState<PlatformSchool[]>(() => load(KEYS.schools, SEED_SCHOOLS));
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>(() => load(KEYS.audit, SEED_AUDIT_ENTRIES));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => load(KEYS.notifications, SEED_NOTIFICATIONS));
  const [guardianLinks, setGuardianLinks] = useState<GuardianLink[]>(() => load(KEYS.guardianLinks, SEED_GUARDIAN_LINKS));
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>(() => load(KEYS.lessonPlans, SEED_LESSON_PLANS));
  const [books, setBooks] = useState<Book[]>(() => load(KEYS.books, BOOKS));
  const [bookRequests, setBookRequests] = useState<BookRequest[]>(() => load(KEYS.bookRequests, BOOK_REQUESTS));

  useEffect(() => save(KEYS.students, students), [students]);
  useEffect(() => save(KEYS.academicYears, academicYears), [academicYears]);
  useEffect(() => save(KEYS.events, events), [events]);
  useEffect(() => save(KEYS.timetable, timetable), [timetable]);
  useEffect(() => save(KEYS.substitutions, substitutions), [substitutions]);
  useEffect(() => save(KEYS.incidents, incidents), [incidents]);
  useEffect(() => save(KEYS.feeStructures, feeStructures), [feeStructures]);
  useEffect(() => save(KEYS.invoices, invoices), [invoices]);
  useEffect(() => save(KEYS.payments, payments), [payments]);
  useEffect(() => save(KEYS.expenses, expenses), [expenses]);
  useEffect(() => save(KEYS.scholarships, scholarships), [scholarships]);
  useEffect(() => save(KEYS.plans, plans), [plans]);
  useEffect(() => save(KEYS.schools, schools), [schools]);
  useEffect(() => save(KEYS.audit, auditEntries), [auditEntries]);
  useEffect(() => save(KEYS.notifications, notifications), [notifications]);
  useEffect(() => save(KEYS.guardianLinks, guardianLinks), [guardianLinks]);
  useEffect(() => save(KEYS.lessonPlans, lessonPlans), [lessonPlans]);
  useEffect(() => save(KEYS.books, books), [books]);
  useEffect(() => save(KEYS.bookRequests, bookRequests), [bookRequests]);

  const addAuditEntry = useCallback((e: Omit<AuditEntry, 'id' | 'timestamp'>) => {
    setAuditEntries((prev) => [
      { ...e, id: makeId('ae'), timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ') },
      ...prev,
    ]);
  }, []);

  const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'createdAt' | 'readBy'>) => {
    setNotifications((prev) => [
      { ...n, id: makeId('n'), createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '), readBy: [] },
      ...prev,
    ]);
  }, []);

  const value: SchoolDataContextValue = useMemo(() => ({
    students,
    academicYears,
    events,
    timetable,
    substitutions,
    incidents,
    feeStructures,
    invoices,
    payments,
    expenses,
    scholarships,
    plans,
    schools,
    auditEntries,
    notifications,
    guardianLinks,
    lessonPlans,
    books,
    bookRequests,

    addStudent: (s) => {
      const student: Student = {
        ...s,
        id: makeId('s'),
        photoColor: s.photoColor || initials(s.name),
      };
      setStudents((prev) => [...prev, student]);
      return student;
    },
    updateStudent: (id, patch) => setStudents((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x))),

    addEvent: (e) => setEvents((prev) => [{ ...e, id: makeId('ev'), createdAt: new Date().toISOString().slice(0, 10) }, ...prev]),
    updateEvent: (id, patch) => setEvents((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x))),

    addTimetableEntries: (newEntries) => {
      const conflicts: string[] = [];
      newEntries.forEach((e) => {
        if (e.kind !== 'lesson') return;
        const eClass = e.className ?? e.classId;
        timetable.forEach((existing) => {
          if (existing.day !== e.day) return;
          if (existing.classId === e.classId && existing.kind === 'lesson') {
            const overlap = e.startTime < existing.endTime && existing.startTime < e.endTime;
            if (overlap) {
              conflicts.push(`Class ${eClass} already has ${existing.subjectName} from ${existing.startTime} to ${existing.endTime} on ${e.day}.`);
            }
          }
        });
        const teacherClash = timetable.find(
          (x) => x.day === e.day && x.kind === 'lesson' && x.teacherId === e.teacherId
            && x.classId !== e.classId && e.startTime < x.endTime && x.startTime < e.endTime,
        );
        if (teacherClash) {
          conflicts.push(`${e.teacherName} is already teaching ${teacherClash.className ?? teacherClash.classId} (${teacherClash.subjectName}) at ${e.startTime}-${e.endTime} on ${e.day}.`);
        }
        const roomClash = timetable.find(
          (x) => x.day === e.day && x.kind === 'lesson' && x.room === e.room
            && x.classId !== e.classId && e.startTime < x.endTime && x.startTime < e.endTime,
        );
        if (roomClash) {
          conflicts.push(`${e.room} is already booked by ${roomClash.className ?? roomClash.classId} (${roomClash.subjectName}) at ${e.startTime}-${e.endTime} on ${e.day}.`);
        }
      });
      if (conflicts.length > 0) return { ok: false, conflicts };
      setTimetable((prev) => [...prev, ...newEntries.map((e) => ({ ...e, id: makeId('tt') }))]);
      return { ok: true };
    },
    publishTimetable: (classId) =>
      setTimetable((prev) => prev.map((x) => (x.classId === classId ? { ...x, status: 'published' } : x))),
    updateTimetableEntry: (id, patch) => setTimetable((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    removeTimetableEntry: (id) => setTimetable((prev) => prev.filter((x) => x.id !== id)),

    addSubstitution: (s) => setSubstitutions((prev) => [{ ...s, id: makeId('subx') }, ...prev]),
    updateSubstitution: (id, patch) => setSubstitutions((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x))),

    addIncident: (i) =>
      setIncidents((prev) => [
        {
          ...i,
          id: makeId('ir'),
          parentNotified: false,
          history: [{ status: 'reported', note: 'Incident reported', by: i.reportedBy, at: new Date().toISOString().slice(0, 16).replace('T', ' ') }],
        },
        ...prev,
      ]),
    updateIncident: (id, patch) => setIncidents((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x))),

    addFeeStructure: (f) => setFeeStructures((prev) => [...prev, { ...f, id: makeId('fs') }]),
    removeFeeStructure: (id) => setFeeStructures((prev) => prev.filter((x) => x.id !== id)),

    addInvoice: (i) =>
      setInvoices((prev) => [
        {
          ...i,
          id: makeId('inv'),
          invoiceNumber: `INV-2026-${String(prev.length + 1).padStart(3, '0')}`,
          status: 'issued' as InvoiceStatus,
          amountPaid: 0,
        },
        ...prev,
      ]),
    updateInvoice: (id, patch) => setInvoices((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x))),

    addPayment: (p) => setPayments((prev) => [{ ...p, id: makeId('pay') }, ...prev]),
    updatePayment: (id, patch) => setPayments((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    verifyPayment: (paymentId) => {
      setPayments((prev) => {
        const payment = prev.find((p) => p.id === paymentId);
        if (!payment || payment.status !== 'pending_verification') return prev;
        setInvoices((invs) => invs.map((inv) => {
          if (inv.id !== payment.invoiceId) return inv;
          const paid = Math.min(inv.amount, inv.amountPaid + payment.amount);
          const status: InvoiceStatus = paid >= inv.amount ? 'paid' : paid > 0 ? 'partial' : inv.status;
          return { ...inv, amountPaid: paid, status };
        }));
        return prev.map((p) => (p.id === paymentId ? { ...p, status: 'verified' } : p));
      });
    },

    addExpense: (e) => setExpenses((prev) => [{ ...e, id: makeId('ex') }, ...prev]),
    updateExpense: (id, patch) => setExpenses((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x))),

    addScholarship: (s) => setScholarships((prev) => [...prev, { ...s, id: makeId('sch') }]),
    updateScholarship: (id, patch) => setScholarships((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x))),

    addPlan: (p) => setPlans((prev) => [...prev, { ...p, id: makeId('plan') }]),
    updatePlan: (id, patch) => setPlans((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x))),

    addSchool: (s) => setSchools((prev) => [...prev, { ...s, id: makeId('ps') }]),
    updateSchool: (id, patch) => setSchools((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x))),

    addAuditEntry,
    addNotification,
    markNotificationRead: (id, userId) =>
      setNotifications((prev) =>
        prev.map((n) => (n.id === id && !n.readBy.includes(userId) ? { ...n, readBy: [...n.readBy, userId] } : n)),
      ),
    markAllNotificationsRead: (userId) =>
      setNotifications((prev) => prev.map((n) => (n.readBy.includes(userId) ? n : { ...n, readBy: [...n.readBy, userId] }))),

    addGuardianLink: (g) => {
      const link: GuardianLink = { ...g, id: makeId('gl'), createdAt: new Date().toISOString().slice(0, 10) };
      setGuardianLinks((prev) => [...prev, link]);
      return link;
    },
    updateGuardianLink: (id, patch) => setGuardianLinks((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x))),

    addLessonPlan: (l) => setLessonPlans((prev) => [{ ...l, id: makeId('lp'), createdAt: new Date().toISOString().slice(0, 10) }, ...prev]),
    updateLessonPlan: (id, patch) => setLessonPlans((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    removeLessonPlan: (id) => setLessonPlans((prev) => prev.filter((x) => x.id !== id)),

    addBook: (b) => setBooks((prev) => [...prev, { ...b, id: makeId('b') }]),
    updateBook: (id, patch) => setBooks((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    removeBook: (id) => setBooks((prev) => prev.filter((x) => x.id !== id)),

    addBookRequest: (r) => setBookRequests((prev) => [...prev, { ...r, id: makeId('br') }]),
    updateBookRequest: (id, patch) => setBookRequests((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x))),
  }), [
    students, academicYears, events, timetable, substitutions, incidents, feeStructures,
    invoices, payments, expenses, scholarships, plans, schools, auditEntries, notifications,
    guardianLinks, lessonPlans, books, bookRequests, addAuditEntry, addNotification,
  ]);

  return <SchoolDataContext.Provider value={value}>{children}</SchoolDataContext.Provider>;
}

export function useSchoolData(): SchoolDataContextValue {
  const ctx = useContext(SchoolDataContext);
  if (!ctx) throw new Error('useSchoolData must be used within SchoolDataProvider');
  return ctx;
}

export type FeeCategoryValue = FeeCategory;
export { AUDIT_ROLES };
