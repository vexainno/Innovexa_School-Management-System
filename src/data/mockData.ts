import type {
  User, Student, ClassInfo, Subject, Assessment, GradeEntry, AttendanceRecord,
  GradebookSubmission, Book, BookRequest, Invoice, Payment, Announcement,
  DisciplineCase, CounselingCase, SystemUser, AuditLog,
} from '@/types';

export const TEST_ACCOUNTS: User[] = [
  { id: 'u1', name: 'Dr. Edward Karpeh', email: 'principal@innosys.edu', role: 'principal', title: 'Principal', avatarColor: 'bg-navy-700' },
  { id: 'u2', name: 'Mrs. Grace Browman', email: 'vp@innosys.edu', role: 'vice_principal', title: 'Vice Principal', avatarColor: 'bg-navy-600' },
  { id: 'u3', name: 'Mr. Samuel Doe', email: 'dean@innosys.edu', role: 'dean', title: 'Dean of Students', avatarColor: 'bg-navy-600' },
  { id: 'u4', name: 'Mrs. Mary Coleman', email: 'registrar@innosys.edu', role: 'registrar', title: 'Registrar', avatarColor: 'bg-navy-600' },
  { id: 'u5', name: 'Mr. James Carter', email: 'academic@innosys.edu', role: 'academic_officer', title: 'Academic Officer', avatarColor: 'bg-navy-600' },
  { id: 'u6', name: 'Mr. Peter Wleh', email: 'teacher@innosys.edu', role: 'teacher', title: 'Teacher — Mathematics & Physics', avatarColor: 'bg-navy-600' },
  { id: 'u7', name: 'Ms. Sarah Mensah', email: 'counselor@innosys.edu', role: 'counselor', title: 'Guidance Counselor', avatarColor: 'bg-navy-600' },
  { id: 'u8', name: 'Mr. Robert Tolbert', email: 'finance@innosys.edu', role: 'finance', title: 'Finance Officer', avatarColor: 'bg-navy-600' },
  { id: 'u9', name: 'Mrs. Elizabeth Kpannah', email: 'librarian@innosys.edu', role: 'librarian', title: 'Librarian', avatarColor: 'bg-navy-600' },
  { id: 'u10', name: 'Mr. Daniel Cooper', email: 'admin@innosys.edu', role: 'super_admin', title: 'Innovexa Platform Super Admin', avatarColor: 'bg-navy-800' },
  { id: 'u11', name: 'John K. Mensah', email: 'student@innosys.edu', role: 'student', title: 'Student — Grade 11', avatarColor: 'bg-accent-500' },
  { id: 'u12', name: 'Mrs. Janet Mensah', email: 'parent@innosys.edu', role: 'parent', title: 'Parent / Guardian', avatarColor: 'bg-success-600', linkedStudentIds: ['s1', 's2'] },
];

export const STUDENTS: Student[] = [
  { id: 's1', name: 'John K. Mensah', grade: 'Grade 11', class: '11A', rollNo: '11A-001', gender: 'M', age: 17, guardianName: 'Mrs. Janet Mensah', guardianPhone: '+231 77 123 4567', status: 'active', enrolledDate: '2021-09-01', photoColor: 'bg-navy-500' },
  { id: 's2', name: 'Mary K. Mensah', grade: 'Grade 8', class: '8B', rollNo: '8B-014', gender: 'F', age: 14, guardianName: 'Mrs. Janet Mensah', guardianPhone: '+231 77 123 4567', status: 'active', enrolledDate: '2023-09-01', photoColor: 'bg-accent-500' },
  { id: 's3', name: 'Emmanuel Gbarbeah', grade: 'Grade 11', class: '11A', rollNo: '11A-002', gender: 'M', age: 17, guardianName: 'Mr. Thomas Gbarbeah', guardianPhone: '+231 88 456 7890', status: 'active', enrolledDate: '2021-09-01', photoColor: 'bg-navy-400' },
  { id: 's4', name: 'Princess K. Johnson', grade: 'Grade 11', class: '11A', rollNo: '11A-003', gender: 'F', age: 16, guardianName: 'Mrs. Clara Johnson', guardianPhone: '+231 77 234 5678', status: 'active', enrolledDate: '2021-09-01', photoColor: 'bg-success-500' },
  { id: 's5', name: 'Augustine T. Kollie', grade: 'Grade 10', class: '10A', rollNo: '10A-001', gender: 'M', age: 16, guardianName: 'Mr. Peter Kollie', guardianPhone: '+231 88 567 8901', status: 'active', enrolledDate: '2022-09-01', photoColor: 'bg-navy-600' },
  { id: 's6', name: 'Grace Y. Kpannah', grade: 'Grade 10', class: '10A', rollNo: '10A-002', gender: 'F', age: 15, guardianName: 'Mrs. Lucy Kpannah', guardianPhone: '+231 77 345 6789', status: 'active', enrolledDate: '2022-09-01', photoColor: 'bg-accent-400' },
  { id: 's7', name: 'Daniel S. Tuah', grade: 'Grade 9', class: '9A', rollNo: '9A-001', gender: 'M', age: 15, guardianName: 'Mr. Stephen Tuah', guardianPhone: '+231 88 678 9012', status: 'active', enrolledDate: '2023-09-01', photoColor: 'bg-navy-500' },
  { id: 's8', name: 'Patricia G. Sirleaf', grade: 'Grade 9', class: '9A', rollNo: '9A-002', gender: 'F', age: 14, guardianName: 'Mrs. Comfort Sirleaf', guardianPhone: '+231 77 456 7890', status: 'active', enrolledDate: '2023-09-01', photoColor: 'bg-success-600' },
  { id: 's9', name: 'Joseph K. Karwah', grade: 'Grade 12', class: '12A', rollNo: '12A-001', gender: 'M', age: 18, guardianName: 'Mr. Michael Karwah', guardianPhone: '+231 88 789 0123', status: 'active', enrolledDate: '2020-09-01', photoColor: 'bg-navy-700' },
  { id: 's10', name: 'Ruth P. Konah', grade: 'Grade 12', class: '12A', rollNo: '12A-002', gender: 'F', age: 18, guardianName: 'Mrs. Pauline Konah', guardianPhone: '+231 77 567 8901', status: 'active', enrolledDate: '2020-09-01', photoColor: 'bg-accent-600' },
  { id: 's11', name: 'Mohammed S. Kromah', grade: 'Grade 8', class: '8B', rollNo: '8B-015', gender: 'M', age: 14, guardianName: 'Mr. Ali Kromah', guardianPhone: '+231 88 890 1234', status: 'active', enrolledDate: '2023-09-01', photoColor: 'bg-navy-500' },
  { id: 's12', name: 'Esther L. Barclay', grade: 'Grade 8', class: '8B', rollNo: '8B-016', gender: 'F', age: 13, guardianName: 'Mrs. Rebecca Barclay', guardianPhone: '+231 77 678 9012', status: 'active', enrolledDate: '2023-09-01', photoColor: 'bg-success-500' },
  { id: 's13', name: 'Francis G. Yekeh', grade: 'Grade 7', class: '7A', rollNo: '7A-001', gender: 'M', age: 13, guardianName: 'Mr. George Yekeh', guardianPhone: '+231 88 901 2345', status: 'transferred', enrolledDate: '2023-09-01', photoColor: 'bg-navy-400' },
  { id: 's14', name: 'Angeline M. Sumo', grade: 'Grade 7', class: '7A', rollNo: '7A-002', gender: 'F', age: 12, guardianName: 'Mrs. Martha Sumo', guardianPhone: '+231 77 789 0123', status: 'active', enrolledDate: '2023-09-01', photoColor: 'bg-accent-500' },
  { id: 's15', name: 'Solomon K. Massaquoi', grade: 'Grade 11', class: '11A', rollNo: '11A-004', gender: 'M', age: 17, guardianName: 'Mr. Henry Massaquoi', guardianPhone: '+231 88 012 3456', status: 'active', enrolledDate: '2021-09-01', photoColor: 'bg-navy-600' },
];

export const CLASSES: ClassInfo[] = [
  { id: 'c1', name: 'Grade 7 - Section A', grade: 'Grade 7', section: 'A', teacherId: 'u6', teacherName: 'Mr. Peter Wleh', studentCount: 28, room: 'Room 101' },
  { id: 'c2', name: 'Grade 8 - Section B', grade: 'Grade 8', section: 'B', teacherId: 'u6', teacherName: 'Mr. Peter Wleh', studentCount: 30, room: 'Room 102' },
  { id: 'c3', name: 'Grade 9 - Section A', grade: 'Grade 9', section: 'A', teacherId: 'u6', teacherName: 'Mr. Peter Wleh', studentCount: 32, room: 'Room 201' },
  { id: 'c4', name: 'Grade 10 - Section A', grade: 'Grade 10', section: 'A', teacherId: 'u6', teacherName: 'Mr. Peter Wleh', studentCount: 29, room: 'Room 202' },
  { id: 'c5', name: 'Grade 11 - Section A', grade: 'Grade 11', section: 'A', teacherId: 'u6', teacherName: 'Mr. Peter Wleh', studentCount: 31, room: 'Room 301' },
  { id: 'c6', name: 'Grade 12 - Section A', grade: 'Grade 12', section: 'A', teacherId: 'u6', teacherName: 'Mr. Peter Wleh', studentCount: 27, room: 'Room 302' },
];

export const SUBJECTS: Subject[] = [
  { id: 'sub1', name: 'Mathematics', code: 'MATH', classId: 'c5', className: 'Grade 11A', teacherId: 'u6', teacherName: 'Mr. Peter Wleh' },
  { id: 'sub2', name: 'Physics', code: 'PHYS', classId: 'c5', className: 'Grade 11A', teacherId: 'u6', teacherName: 'Mr. Peter Wleh' },
  { id: 'sub3', name: 'Mathematics', code: 'MATH', classId: 'c4', className: 'Grade 10A', teacherId: 'u6', teacherName: 'Mr. Peter Wleh' },
  { id: 'sub4', name: 'Mathematics', code: 'MATH', classId: 'c3', className: 'Grade 9A', teacherId: 'u6', teacherName: 'Mr. Peter Wleh' },
  { id: 'sub5', name: 'Physics', code: 'PHYS', classId: 'c6', className: 'Grade 12A', teacherId: 'u6', teacherName: 'Mr. Peter Wleh' },
  { id: 'sub6', name: 'English Language', code: 'ENG', classId: 'c5', className: 'Grade 11A', teacherId: 'u6', teacherName: 'Mr. Peter Wleh' },
  { id: 'sub7', name: 'Biology', code: 'BIO', classId: 'c5', className: 'Grade 11A', teacherId: 'u6', teacherName: 'Mr. Peter Wleh' },
  { id: 'sub8', name: 'Chemistry', code: 'CHEM', classId: 'c5', className: 'Grade 11A', teacherId: 'u6', teacherName: 'Mr. Peter Wleh' },
];

export const ASSESSMENTS: Assessment[] = [
  { id: 'a1', title: 'Algebra Quiz 1', type: 'quiz', subjectId: 'sub1', subjectName: 'Mathematics', classId: 'c5', className: 'Grade 11A', date: '2026-09-10', totalMarks: 20, status: 'graded' },
  { id: 'a2', title: 'Linear Equations Assignment', type: 'assignment', subjectId: 'sub1', subjectName: 'Mathematics', classId: 'c5', className: 'Grade 11A', date: '2026-09-12', totalMarks: 30, status: 'published' },
  { id: 'a3', title: 'Midterm Exam — Mathematics', type: 'midterm', subjectId: 'sub1', subjectName: 'Mathematics', classId: 'c5', className: 'Grade 11A', date: '2026-09-15', totalMarks: 100, status: 'draft' },
  { id: 'a4', title: 'Newton\'s Laws Quiz', type: 'quiz', subjectId: 'sub2', subjectName: 'Physics', classId: 'c5', className: 'Grade 11A', date: '2026-09-08', totalMarks: 20, status: 'graded' },
  { id: 'a5', title: 'Kinematics Test', type: 'test', subjectId: 'sub2', subjectName: 'Physics', classId: 'c5', className: 'Grade 11A', date: '2026-09-14', totalMarks: 50, status: 'published' },
  { id: 'a6', title: 'Participation — Week 3', type: 'participation', subjectId: 'sub1', subjectName: 'Mathematics', classId: 'c5', className: 'Grade 11A', date: '2026-09-18', totalMarks: 10, status: 'draft' },
  { id: 'a7', title: 'Essay Assignment', type: 'assignment', subjectId: 'sub6', subjectName: 'English Language', classId: 'c5', className: 'Grade 11A', date: '2026-09-16', totalMarks: 40, status: 'published' },
  { id: 'a8', title: 'Cell Biology Quiz', type: 'quiz', subjectId: 'sub7', subjectName: 'Biology', classId: 'c5', className: 'Grade 11A', date: '2026-09-11', totalMarks: 20, status: 'graded' },
];

export const GRADES: GradeEntry[] = [
  { id: 'g1', studentId: 's1', studentName: 'John K. Mensah', assessmentId: 'a1', assessmentTitle: 'Algebra Quiz 1', subjectName: 'Mathematics', score: 18, totalMarks: 20, grade: 'A', status: 'submitted' },
  { id: 'g2', studentId: 's1', studentName: 'John K. Mensah', assessmentId: 'a2', assessmentTitle: 'Linear Equations Assignment', subjectName: 'Mathematics', score: 27, totalMarks: 30, grade: 'A-', status: 'submitted' },
  { id: 'g3', studentId: 's1', studentName: 'John K. Mensah', assessmentId: 'a4', assessmentTitle: 'Newton\'s Laws Quiz', subjectName: 'Physics', score: 17, totalMarks: 20, grade: 'A', status: 'submitted' },
  { id: 'g4', studentId: 's1', studentName: 'John K. Mensah', assessmentId: 'a8', assessmentTitle: 'Cell Biology Quiz', subjectName: 'Biology', score: 16, totalMarks: 20, grade: 'B+', status: 'released' },
  { id: 'g5', studentId: 's3', studentName: 'Emmanuel Gbarbeah', assessmentId: 'a1', assessmentTitle: 'Algebra Quiz 1', subjectName: 'Mathematics', score: 15, totalMarks: 20, grade: 'B', status: 'submitted' },
  { id: 'g6', studentId: 's3', studentName: 'Emmanuel Gbarbeah', assessmentId: 'a2', assessmentTitle: 'Linear Equations Assignment', subjectName: 'Mathematics', score: 22, totalMarks: 30, grade: 'B-', status: 'submitted' },
  { id: 'g7', studentId: 's4', studentName: 'Princess K. Johnson', assessmentId: 'a1', assessmentTitle: 'Algebra Quiz 1', subjectName: 'Mathematics', score: 19, totalMarks: 20, grade: 'A', status: 'submitted' },
  { id: 'g8', studentId: 's4', studentName: 'Princess K. Johnson', assessmentId: 'a2', assessmentTitle: 'Linear Equations Assignment', subjectName: 'Mathematics', score: 28, totalMarks: 30, grade: 'A', status: 'submitted' },
  { id: 'g9', studentId: 's15', studentName: 'Solomon K. Massaquoi', assessmentId: 'a1', assessmentTitle: 'Algebra Quiz 1', subjectName: 'Mathematics', score: 14, totalMarks: 20, grade: 'B', status: 'submitted' },
  { id: 'g10', studentId: 's15', studentName: 'Solomon K. Massaquoi', assessmentId: 'a2', assessmentTitle: 'Linear Equations Assignment', subjectName: 'Mathematics', score: 25, totalMarks: 30, grade: 'B+', status: 'submitted' },
];

export const ATTENDANCE: AttendanceRecord[] = [
  { id: 'att1', studentId: 's1', studentName: 'John K. Mensah', classId: 'c5', className: 'Grade 11A', date: '2026-09-21', status: 'present' },
  { id: 'att2', studentId: 's3', studentName: 'Emmanuel Gbarbeah', classId: 'c5', className: 'Grade 11A', date: '2026-09-21', status: 'absent', note: 'No explanation provided' },
  { id: 'att3', studentId: 's4', studentName: 'Princess K. Johnson', classId: 'c5', className: 'Grade 11A', date: '2026-09-21', status: 'present' },
  { id: 'att4', studentId: 's15', studentName: 'Solomon K. Massaquoi', classId: 'c5', className: 'Grade 11A', date: '2026-09-21', status: 'late', note: 'Arrived 15 minutes late' },
  { id: 'att5', studentId: 's1', studentName: 'John K. Mensah', classId: 'c5', className: 'Grade 11A', date: '2026-09-20', status: 'present' },
  { id: 'att6', studentId: 's1', studentName: 'John K. Mensah', classId: 'c5', className: 'Grade 11A', date: '2026-09-19', status: 'present' },
  { id: 'att7', studentId: 's1', studentName: 'John K. Mensah', classId: 'c5', className: 'Grade 11A', date: '2026-09-18', status: 'excused', note: 'Medical appointment' },
  { id: 'att8', studentId: 's2', studentName: 'Mary K. Mensah', classId: 'c2', className: 'Grade 8B', date: '2026-09-21', status: 'present' },
  { id: 'att9', studentId: 's2', studentName: 'Mary K. Mensah', classId: 'c2', className: 'Grade 8B', date: '2026-09-20', status: 'present' },
  { id: 'att10', studentId: 's2', studentName: 'Mary K. Mensah', classId: 'c2', className: 'Grade 8B', date: '2026-09-19', status: 'absent', note: 'Sick' },
];

export const GRADEBOOK_SUBMISSIONS: GradebookSubmission[] = [
  { id: 'gs1', teacherName: 'Mr. Peter Wleh', subjectName: 'Mathematics', className: 'Grade 11A', term: 'First Term 2026/2027', submittedDate: '2026-09-18', status: 'submitted', studentCount: 31 },
  { id: 'gs2', teacherName: 'Mr. Peter Wleh', subjectName: 'Physics', className: 'Grade 11A', term: 'First Term 2026/2027', submittedDate: '2026-09-17', status: 'under_review', studentCount: 31 },
  { id: 'gs3', teacherName: 'Ms. Emily Brown', subjectName: 'English Language', className: 'Grade 11A', term: 'First Term 2026/2027', submittedDate: '2026-09-16', status: 'approved', studentCount: 31 },
  { id: 'gs4', teacherName: 'Mr. Peter Wleh', subjectName: 'Mathematics', className: 'Grade 10A', term: 'First Term 2026/2027', submittedDate: '2026-09-15', status: 'submitted', studentCount: 29 },
  { id: 'gs5', teacherName: 'Ms. Emily Brown', subjectName: 'English Language', className: 'Grade 10A', term: 'First Term 2026/2027', submittedDate: '2026-09-14', status: 'rejected', studentCount: 29 },
  { id: 'gs6', teacherName: 'Mr. Peter Wleh', subjectName: 'Physics', className: 'Grade 12A', term: 'First Term 2026/2027', submittedDate: '2026-09-13', status: 'approved', studentCount: 27 },
];

export const BOOKS: Book[] = [
  { id: 'b1', title: 'Biology for Senior High School', author: 'J.K. Mensah', isbn: '978-9988-1-001', subject: 'Biology', category: 'Science', gradeLevel: 'Grade 11', copiesTotal: 15, copiesAvailable: 8, status: 'available', coverColor: 'bg-navy-600' },
  { id: 'b2', title: 'Advanced Mathematics', author: 'D. Kpannah', isbn: '978-9988-1-002', subject: 'Mathematics', category: 'Science', gradeLevel: 'Grade 11', copiesTotal: 20, copiesAvailable: 0, status: 'unavailable', coverColor: 'bg-navy-700' },
  { id: 'b3', title: 'Fundamentals of Physics', author: 'R. Cooper', isbn: '978-9988-1-003', subject: 'Physics', category: 'Science', gradeLevel: 'Grade 12', copiesTotal: 12, copiesAvailable: 3, status: 'limited', coverColor: 'bg-navy-500' },
  { id: 'b4', title: 'English Grammar & Composition', author: 'M. Coleman', isbn: '978-9988-1-004', subject: 'English', category: 'Languages', gradeLevel: 'Grade 9', copiesTotal: 25, copiesAvailable: 18, status: 'available', coverColor: 'bg-accent-600' },
  { id: 'b5', title: 'West African History', author: 'S. Doe', isbn: '978-9988-1-005', subject: 'History', category: 'Social Studies', gradeLevel: 'Grade 10', copiesTotal: 10, copiesAvailable: 5, status: 'available', coverColor: 'bg-success-600' },
  { id: 'b6', title: 'Introduction to Chemistry', author: 'L. Sirleaf', isbn: '978-9988-1-006', subject: 'Chemistry', category: 'Science', gradeLevel: 'Grade 11', copiesTotal: 14, copiesAvailable: 6, status: 'available', coverColor: 'bg-navy-600' },
  { id: 'b7', title: 'Geography of Africa', author: 'P. Wleh', isbn: '978-9988-1-007', subject: 'Geography', category: 'Social Studies', gradeLevel: 'Grade 8', copiesTotal: 18, copiesAvailable: 12, status: 'available', coverColor: 'bg-accent-500' },
  { id: 'b8', title: 'Junior Mathematics', author: 'D. Kpannah', isbn: '978-9988-1-008', subject: 'Mathematics', category: 'Science', gradeLevel: 'Grade 8', copiesTotal: 22, copiesAvailable: 15, status: 'available', coverColor: 'bg-navy-500' },
];

export const BOOK_REQUESTS: BookRequest[] = [
  { id: 'br1', bookId: 'b1', bookTitle: 'Biology for Senior High School', studentName: 'John K. Mensah', studentId: 's1', requestDate: '2026-09-19', status: 'pending' },
  { id: 'br2', bookId: 'b3', bookTitle: 'Fundamentals of Physics', studentName: 'Joseph K. Karwah', studentId: 's9', requestDate: '2026-09-18', status: 'approved', dueDate: '2026-10-02' },
  { id: 'br3', bookId: 'b4', bookTitle: 'English Grammar & Composition', studentName: 'Daniel S. Tuah', studentId: 's7', requestDate: '2026-09-17', status: 'borrowed', dueDate: '2026-10-01' },
  { id: 'br4', bookId: 'b5', bookTitle: 'West African History', studentName: 'Mary K. Mensah', studentId: 's2', requestDate: '2026-09-16', status: 'returned', returnDate: '2026-09-20' },
  { id: 'br5', bookId: 'b2', bookTitle: 'Advanced Mathematics', studentName: 'Princess K. Johnson', studentId: 's4', requestDate: '2026-09-15', status: 'rejected' },
  { id: 'br6', bookId: 'b6', bookTitle: 'Introduction to Chemistry', studentName: 'Solomon K. Massaquoi', studentId: 's15', requestDate: '2026-09-20', status: 'pending' },
];

export const INVOICES: Invoice[] = [
  { id: 'inv1', studentName: 'John K. Mensah', studentId: 's1', description: 'First Term Tuition 2026/2027', amount: 45000, amountPaid: 45000, term: 'First Term 2026/2027', status: 'paid', dueDate: '2026-09-30', issueDate: '2026-08-15' },
  { id: 'inv2', studentName: 'John K. Mensah', studentId: 's1', description: 'Lab Fee', amount: 5000, amountPaid: 2500, term: 'First Term 2026/2027', status: 'partial', dueDate: '2026-10-15', issueDate: '2026-08-15' },
  { id: 'inv3', studentName: 'Mary K. Mensah', studentId: 's2', description: 'First Term Tuition 2026/2027', amount: 35000, amountPaid: 20000, term: 'First Term 2026/2027', status: 'partial', dueDate: '2026-09-30', issueDate: '2026-08-15' },
  { id: 'inv4', studentName: 'Emmanuel Gbarbeah', studentId: 's3', description: 'First Term Tuition 2026/2027', amount: 45000, amountPaid: 0, term: 'First Term 2026/2027', status: 'overdue', dueDate: '2026-09-15', issueDate: '2026-08-15' },
  { id: 'inv5', studentName: 'Princess K. Johnson', studentId: 's4', description: 'First Term Tuition 2026/2027', amount: 45000, amountPaid: 45000, term: 'First Term 2026/2027', status: 'paid', dueDate: '2026-09-30', issueDate: '2026-08-15' },
  { id: 'inv6', studentName: 'Solomon K. Massaquoi', studentId: 's15', description: 'First Term Tuition 2026/2027', amount: 45000, amountPaid: 30000, term: 'First Term 2026/2027', status: 'partial', dueDate: '2026-10-15', issueDate: '2026-08-15' },
];

export const PAYMENTS: Payment[] = [
  { id: 'pay1', invoiceId: 'inv1', studentName: 'John K. Mensah', amount: 45000, method: 'bank_slip', date: '2026-08-20', status: 'verified', reference: 'BK-2026-001' },
  { id: 'pay2', invoiceId: 'inv2', studentName: 'John K. Mensah', amount: 2500, method: 'online', date: '2026-09-05', status: 'verified', reference: 'ON-2026-045' },
  { id: 'pay3', invoiceId: 'inv3', studentName: 'Mary K. Mensah', amount: 20000, method: 'bank_slip', date: '2026-09-10', status: 'pending_verification', reference: 'BK-2026-078' },
  { id: 'pay4', invoiceId: 'inv5', studentName: 'Princess K. Johnson', amount: 45000, method: 'online', date: '2026-08-25', status: 'verified', reference: 'ON-2026-012' },
  { id: 'pay5', invoiceId: 'inv6', studentName: 'Solomon K. Massaquoi', amount: 30000, method: 'cash', date: '2026-09-15', status: 'pending_verification', reference: 'CA-2026-033' },
];

export const ANNOUNCEMENTS: Announcement[] = [
  { id: 'an1', title: 'First Term Midterm Examinations Begin September 25', body: 'All students in Grades 7-12 are reminded that midterm examinations begin on Monday, September 25, 2026. Please ensure all assignments are submitted before the examination period.', author: 'Dr. Edward Karpeh', authorRole: 'principal', date: '2026-09-20', audience: 'All Students & Staff', priority: 'urgent' },
  { id: 'an2', title: 'Parent-Teacher Conference — October 5', body: 'The first parent-teacher conference of the academic year will be held on October 5, 2026, from 10:00 AM to 2:00 PM. Parents are encouraged to attend.', author: 'Dr. Edward Karpeh', authorRole: 'principal', date: '2026-09-18', audience: 'Parents & Staff', priority: 'important' },
  { id: 'an3', title: 'Library Hours Extended', body: 'The school library will now remain open until 5:00 PM on weekdays to support students during the examination period.', author: 'Mrs. Elizabeth Kpannah', authorRole: 'librarian', date: '2026-09-17', audience: 'All Students', priority: 'normal' },
  { id: 'an4', title: 'Tuition Payment Deadline — September 30', body: 'This is a reminder that the first term tuition payment deadline is September 30, 2026. Please ensure all outstanding balances are cleared before this date.', author: 'Mr. Robert Tolbert', authorRole: 'finance', date: '2026-09-15', audience: 'Parents', priority: 'important' },
];

export const DISCIPLINE_CASES: DisciplineCase[] = [
  { id: 'dc1', studentName: 'Augustine T. Kollie', studentId: 's5', class: 'Grade 10A', incident: 'Disruptive behavior in class', date: '2026-09-19', severity: 'minor', status: 'open', action: 'Verbal warning issued', reportedBy: 'Mr. Peter Wleh' },
  { id: 'dc2', studentName: 'Mohammed S. Kromah', studentId: 's11', class: 'Grade 8B', incident: 'Fighting on school premises', date: '2026-09-17', severity: 'major', status: 'under_review', action: 'Pending investigation', reportedBy: 'Mrs. Grace Browman' },
  { id: 'dc3', studentName: 'Daniel S. Tuah', studentId: 's7', class: 'Grade 9A', incident: 'Repeated lateness', date: '2026-09-14', severity: 'minor', status: 'resolved', action: 'Parent notified, student counseled', reportedBy: 'Mr. Peter Wleh' },
  { id: 'dc4', studentName: 'Emmanuel Gbarbeah', studentId: 's3', class: 'Grade 11A', incident: 'Unauthorized absence for 3 days', date: '2026-09-10', severity: 'moderate', status: 'closed', action: 'Suspension — 2 days', reportedBy: 'Mr. Samuel Doe' },
];

export const COUNSELING_CASES: CounselingCase[] = [
  { id: 'cc1', studentName: 'Augustine T. Kollie', studentId: 's5', class: 'Grade 10A', category: 'behavioral', status: 'in_progress', dateOpened: '2026-09-19', lastSession: '2026-09-20', notes: 'Student showing signs of frustration. Initial session conducted. Follow-up scheduled.', confidential: true },
  { id: 'cc2', studentName: 'Daniel S. Tuah', studentId: 's7', class: 'Grade 9A', category: 'academic', status: 'follow_up', dateOpened: '2026-09-10', lastSession: '2026-09-18', notes: 'Academic performance declining. Working with teachers on support plan.', confidential: true },
  { id: 'cc3', studentName: 'Mohammed S. Kromah', studentId: 's11', class: 'Grade 8B', category: 'social', status: 'open', dateOpened: '2026-09-17', notes: 'Conflict with peer. Initial assessment scheduled.', confidential: true },
  { id: 'cc4', studentName: 'Esther L. Barclay', studentId: 's12', class: 'Grade 8B', category: 'family', status: 'in_progress', dateOpened: '2026-09-05', lastSession: '2026-09-16', notes: 'Family-related stress impacting concentration. Ongoing support sessions.', confidential: true },
];

export const SYSTEM_USERS: SystemUser[] = [
  { id: 'su1', name: 'Dr. Edward Karpeh', email: 'principal@innosys.edu', role: 'principal', title: 'Principal', status: 'active', lastLogin: '2026-09-21 08:15', createdDate: '2026-07-01' },
  { id: 'su2', name: 'Mrs. Grace Browman', email: 'vp@innosys.edu', role: 'vice_principal', title: 'Vice Principal', status: 'active', lastLogin: '2026-09-21 07:45', createdDate: '2026-07-01' },
  { id: 'su3', name: 'Mr. Samuel Doe', email: 'dean@innosys.edu', role: 'dean', title: 'Dean of Students', status: 'active', lastLogin: '2026-09-20 14:30', createdDate: '2026-07-01' },
  { id: 'su4', name: 'Mrs. Mary Coleman', email: 'registrar@innosys.edu', role: 'registrar', title: 'Registrar', status: 'active', lastLogin: '2026-09-21 09:00', createdDate: '2026-07-01' },
  { id: 'su5', name: 'Mr. James Carter', email: 'academic@innosys.edu', role: 'academic_officer', title: 'Academic Officer', status: 'active', lastLogin: '2026-09-20 16:20', createdDate: '2026-07-01' },
  { id: 'su6', name: 'Mr. Peter Wleh', email: 'teacher@innosys.edu', role: 'teacher', title: 'Teacher', status: 'active', lastLogin: '2026-09-21 07:30', createdDate: '2026-07-01' },
  { id: 'su7', name: 'Ms. Sarah Mensah', email: 'counselor@innosys.edu', role: 'counselor', title: 'Guidance Counselor', status: 'active', lastLogin: '2026-09-20 15:00', createdDate: '2026-07-01' },
  { id: 'su8', name: 'Mr. Robert Tolbert', email: 'finance@innosys.edu', role: 'finance', title: 'Finance Officer', status: 'active', lastLogin: '2026-09-21 08:00', createdDate: '2026-07-01' },
  { id: 'su9', name: 'Mrs. Elizabeth Kpannah', email: 'librarian@innosys.edu', role: 'librarian', title: 'Librarian', status: 'active', lastLogin: '2026-09-20 13:00', createdDate: '2026-07-01' },
  { id: 'su10', name: 'Mr. Daniel Cooper', email: 'admin@innosys.edu', role: 'super_admin', title: 'Innovexa Platform Super Admin', status: 'active', lastLogin: '2026-09-21 06:00', createdDate: '2026-06-15' },
  { id: 'su11', name: 'John K. Mensah', email: 'student@innosys.edu', role: 'student', title: 'Student', status: 'active', lastLogin: '2026-09-21 08:30', createdDate: '2026-07-01' },
  { id: 'su12', name: 'Mrs. Janet Mensah', email: 'parent@innosys.edu', role: 'parent', title: 'Parent', status: 'active', lastLogin: '2026-09-20 18:00', createdDate: '2026-07-01' },
  { id: 'su13', name: 'Ms. Emily Brown', email: 'ebrown@innosys.edu', role: 'teacher', title: 'Teacher — English', status: 'active', lastLogin: '2026-09-20 12:00', createdDate: '2026-07-01' },
  { id: 'su14', name: 'Mr. Thomas Gbarbeah', email: 'tgbarbeah@innosys.edu', role: 'parent', title: 'Parent', status: 'locked', createdDate: '2026-07-01' },
];

export const AUDIT_LOGS: AuditLog[] = [
  { id: 'al1', user: 'admin@innosys.edu', action: 'Reset password', target: 'tgbarbeah@innosys.edu', timestamp: '2026-09-20 14:22', ip: '192.168.1.10', severity: 'warning' },
  { id: 'al2', user: 'admin@innosys.edu', action: 'Deactivated account', target: 'sbaryogard@innosys.edu', timestamp: '2026-09-20 11:05', ip: '192.168.1.10', severity: 'critical' },
  { id: 'al3', user: 'principal@innosys.edu', action: 'Approved grades', target: 'English Language — Grade 11A', timestamp: '2026-09-19 16:30', ip: '192.168.1.25', severity: 'info' },
  { id: 'al4', user: 'registrar@innosys.edu', action: 'Enrolled new student', target: 'Angeline M. Sumo', timestamp: '2026-09-18 10:15', ip: '192.168.1.30', severity: 'info' },
  { id: 'al5', user: 'finance@innosys.edu', action: 'Verified payment', target: 'INV-2026-001', timestamp: '2026-09-17 09:00', ip: '192.168.1.40', severity: 'info' },
  { id: 'al6', user: 'admin@innosys.edu', action: 'Modified role permissions', target: 'Teacher role', timestamp: '2026-09-16 15:00', ip: '192.168.1.10', severity: 'warning' },
];

export const SCHOOL_INFO = {
  name: 'InnosysEdu',
  poweredBy: 'Innovexa TechHub',
  schoolName: 'Innosys Academy',
  address: '123 Broad Street, Monrovia, Liberia',
  phone: '+231 77 000 0000',
  email: 'info@innosysacademy.edu.lr',
  academicYear: '2026/2027',
  currentTerm: 'First Term',
  totalStudents: 177,
  totalStaff: 34,
  totalClasses: 6,
};
