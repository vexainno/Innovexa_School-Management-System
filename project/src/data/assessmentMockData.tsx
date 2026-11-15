
import type {
  StudentAssessment,
  AssessmentRecipient,
  AssessmentAttempt,
  AssignmentSubmission,
  AssessmentGrade,
} from '@/types/assessment';

import {
  STUDENTS,
  CLASSES,
  SUBJECTS,
} from '@/data/mockData';

// ======================================================
// HELPERS
// ======================================================

const today = '2026-11-14';

function createRecipient(
  assessmentId: string,
  studentId: string,
  status: AssessmentRecipient['status'],
  assignedAt = today,
  overrides: Partial<AssessmentRecipient> = {},
): AssessmentRecipient {
  const student = STUDENTS.find((item) => item.id === studentId);

  if (!student) {
    throw new Error(`Student ${studentId} was not found.`);
  }

  return {
    id: `${assessmentId}-${studentId}`,
    assessmentId,
    studentId,
    studentName: student.name,
    status,
    assignedAt,
    ...overrides,
  };
}

function getClassName(classId: string): string {
  const schoolClass = CLASSES.find((item) => item.id === classId);

  return schoolClass?.name ?? 'Unknown Class';
}

function getSection(classId: string): string {
  const schoolClass = CLASSES.find((item) => item.id === classId);

  return schoolClass?.section ?? '';
}

// ======================================================
// ASSESSMENT 1
// WHOLE CLASS TAKE-HOME ASSIGNMENT
// ======================================================

const algebraRecipients = ['s1', 's3', 's4', 's15'].map(
  (studentId) =>
    createRecipient(
      'asm1',
      studentId,
      studentId === 's1' ? 'submitted' : 'upcoming',
    ),
);

// ======================================================
// ASSESSMENT 2
// INDIVIDUAL MAKE-UP ONLINE QUIZ
// ======================================================

const makeupQuizRecipients = [
  createRecipient(
    'asm2',
    's3',
    'upcoming',
    today,
    {
      opensAt: '2026-11-16T08:00:00',
      dueAt: '2026-11-16T10:00:00',
      closesAt: '2026-11-16T10:30:00',
    },
  ),
];

// ======================================================
// ASSESSMENT 3
// ONLINE QUIZ FOR SELECTED STUDENTS
// ======================================================

const selectedQuizRecipients = ['s1', 's4'].map(
  (studentId) =>
    createRecipient(
      'asm3',
      studentId,
      'upcoming',
    ),
);

// ======================================================
// ASSESSMENT 4
// CLASSROOM TEST
// ======================================================

const classroomTestRecipients = ['s1', 's3', 's4', 's15'].map(
  (studentId) =>
    createRecipient(
      'asm4',
      studentId,
      'upcoming',
    ),
);

// ======================================================
// ASSESSMENTS
// ======================================================

export const ASSESSMENT_RECORDS: StudentAssessment[] = [
  {
    id: 'asm1',
    title: 'Algebra and Linear Equations Assignment',
    instructions:
      'Complete all questions on algebraic expressions and linear equations. Show your working clearly. Upload your completed work as a PDF or Word document.',

    type: 'take_home_assignment',
    mode: 'offline',

    subjectId: 'sub1',
    subjectName: 'Mathematics',

    classId: 'c5',
    className: getClassName('c5'),
    section: getSection('c5'),

    teacherId: 'u6',
    teacherName: 'Mr. Peter Wleh',

    recipientScope: 'entire_class',
    recipients: algebraRecipients,

    schedule: {
      opensAt: '2026-11-14T08:00:00',
      dueAt: '2026-11-20T23:59:00',
      closesAt: '2026-11-21T00:00:00',
    },

    settings: {
      attemptsAllowed: 1,
      shuffleQuestions: false,
      shuffleOptions: false,
      allowLateSubmission: true,
      allowResubmission: true,
      allowSubmissionRemoval: true,
      showCorrectAnswers: false,
      releaseResultsAutomatically: false,
      acceptedFileTypes: ['pdf', 'doc', 'docx'],
      maxFileSizeMB: 10,
    },

    questions: [],
    resources: [],

    totalMarks: 30,
    status: 'published',

    createdAt: '2026-11-13T09:00:00',
    updatedAt: '2026-11-14T08:00:00',
    publishedAt: '2026-11-14T08:00:00',
  },

  {
    id: 'asm2',
    title: 'Algebra Make-up Quiz',
    instructions:
      'This is an individual make-up quiz. Answer all questions within the allocated time.',

    type: 'online_quiz',
    mode: 'online',

    subjectId: 'sub1',
    subjectName: 'Mathematics',

    classId: 'c5',
    className: getClassName('c5'),
    section: getSection('c5'),

    teacherId: 'u6',
    teacherName: 'Mr. Peter Wleh',

    recipientScope: 'selected_students',
    recipients: makeupQuizRecipients,

    schedule: {
      opensAt: '2026-11-16T08:00:00',
      dueAt: '2026-11-16T10:00:00',
      closesAt: '2026-11-16T10:30:00',
      timeLimitMinutes: 30,
    },

    settings: {
      attemptsAllowed: 2,
      shuffleQuestions: true,
      shuffleOptions: true,
      allowLateSubmission: false,
      allowResubmission: false,
      allowSubmissionRemoval: false,
      showCorrectAnswers: false,
      releaseResultsAutomatically: false,
      acceptedFileTypes: ['pdf', 'jpg', 'jpeg', 'png'],
      maxFileSizeMB: 10,
    },

    questions: [
      {
        id: 'asm2-q1',
        type: 'multiple_choice',
        prompt: 'Solve for x: 2x + 6 = 14.',
        marks: 5,
        order: 1,
        options: [
          { id: 'a', text: '2', isCorrect: false },
          { id: 'b', text: '4', isCorrect: true },
          { id: 'c', text: '6', isCorrect: false },
          { id: 'd', text: '8', isCorrect: false },
        ],
        correctAnswer: 'b',
      },
      {
        id: 'asm2-q2',
        type: 'true_false',
        prompt: 'The value of x in x + 5 = 10 is 5.',
        marks: 5,
        order: 2,
        options: [
          { id: 'true', text: 'True', isCorrect: true },
          { id: 'false', text: 'False', isCorrect: false },
        ],
        correctAnswer: 'true',
      },
      {
        id: 'asm2-q3',
        type: 'short_answer',
        prompt: 'Define a linear equation.',
        marks: 10,
        order: 3,
      },
    ],

    resources: [],

    totalMarks: 20,
    status: 'scheduled',

    createdAt: '2026-11-14T09:00:00',
    updatedAt: '2026-11-14T09:00:00',
    publishedAt: '2026-11-14T09:00:00',
  },

  {
    id: 'asm3',
    title: 'Physics: Motion and Forces Quiz',
    instructions:
      'Answer the questions about motion, speed and forces. Read each question carefully.',

    type: 'online_quiz',
    mode: 'online',

    subjectId: 'sub2',
    subjectName: 'Physics',

    classId: 'c5',
    className: getClassName('c5'),
    section: getSection('c5'),

    teacherId: 'u6',
    teacherName: 'Mr. Peter Wleh',

    recipientScope: 'selected_students',
    recipients: selectedQuizRecipients,

    schedule: {
      opensAt: '2026-11-18T09:00:00',
      dueAt: '2026-11-18T10:00:00',
      closesAt: '2026-11-18T10:00:00',
      timeLimitMinutes: 45,
    },

    settings: {
      attemptsAllowed: 1,
      shuffleQuestions: true,
      shuffleOptions: true,
      allowLateSubmission: false,
      allowResubmission: false,
      allowSubmissionRemoval: false,
      showCorrectAnswers: false,
      releaseResultsAutomatically: false,
      acceptedFileTypes: ['pdf', 'jpg', 'png'],
      maxFileSizeMB: 10,
    },

    questions: [
      {
        id: 'asm3-q1',
        type: 'multiple_choice',
        prompt: 'What is the SI unit of force?',
        marks: 5,
        order: 1,
        options: [
          { id: 'a', text: 'Joule', isCorrect: false },
          { id: 'b', text: 'Newton', isCorrect: true },
          { id: 'c', text: 'Watt', isCorrect: false },
          { id: 'd', text: 'Pascal', isCorrect: false },
        ],
        correctAnswer: 'b',
      },
      {
        id: 'asm3-q2',
        type: 'short_answer',
        prompt: 'Explain the meaning of acceleration.',
        marks: 10,
        order: 2,
      },
      {
        id: 'asm3-q3',
        type: 'true_false',
        prompt: 'Speed is a scalar quantity.',
        marks: 5,
        order: 3,
        options: [
          { id: 'true', text: 'True', isCorrect: true },
          { id: 'false', text: 'False', isCorrect: false },
        ],
        correctAnswer: 'true',
      },
    ],

    resources: [],

    totalMarks: 20,
    status: 'scheduled',

    createdAt: '2026-11-14T10:00:00',
    updatedAt: '2026-11-14T10:00:00',
    publishedAt: '2026-11-14T10:00:00',
  },

  {
    id: 'asm4',
    title: 'Mathematics Classroom Test',
    instructions:
      'This is a classroom-based test. The teacher will record the results after the test.',

    type: 'classroom_test',
    mode: 'offline',

    subjectId: 'sub1',
    subjectName: 'Mathematics',

    classId: 'c5',
    className: getClassName('c5'),
    section: getSection('c5'),

    teacherId: 'u6',
    teacherName: 'Mr. Peter Wleh',

    recipientScope: 'entire_class',
    recipients: classroomTestRecipients,

    schedule: {
      opensAt: '2026-11-23T09:00:00',
      dueAt: '2026-11-23T11:00:00',
    },

    settings: {
      attemptsAllowed: 1,
      shuffleQuestions: false,
      shuffleOptions: false,
      allowLateSubmission: false,
      allowResubmission: false,
      allowSubmissionRemoval: false,
      showCorrectAnswers: false,
      releaseResultsAutomatically: false,
      acceptedFileTypes: [],
      maxFileSizeMB: 0,
    },

    questions: [],
    resources: [],

    totalMarks: 50,
    status: 'scheduled',

    createdAt: '2026-11-14T11:00:00',
    updatedAt: '2026-11-14T11:00:00',
  },
];

// ======================================================
// STUDENT ASSESSMENT ATTEMPTS
// ======================================================

export const ASSESSMENT_ATTEMPTS: AssessmentAttempt[] = [
  {
    id: 'attempt1',
    assessmentId: 'asm2',
    studentId: 's3',
    attemptNumber: 1,
    startedAt: '2026-11-16T08:05:00',
    submittedAt: '2026-11-16T08:25:00',

    answers: [
      {
        questionId: 'asm2-q1',
        selectedOptions: ['b'],
        awardedMarks: 5,
      },
      {
        questionId: 'asm2-q2',
        selectedOptions: ['true'],
        awardedMarks: 5,
      },
      {
        questionId: 'asm2-q3',
        textAnswer: 'A linear equation is an equation whose highest variable power is one.',
      },
    ],

    autoScore: 10,
    gradingStatus: 'needs_review',
    status: 'submitted',
  },
];

// ======================================================
// TAKE-HOME ASSIGNMENT SUBMISSIONS
// ======================================================

export const ASSIGNMENT_SUBMISSIONS: AssignmentSubmission[] = [
  {
    id: 'submission1',
    assessmentId: 'asm1',
    studentId: 's1',
    studentName: 'John K. Mensah',

    versions: [
      {
        id: 'version1',
        versionNumber: 1,
        submittedAt: '2026-11-17T14:30:00',
        textResponse: 'My completed algebra assignment.',
        files: [
          {
            id: 'file1',
            name: 'Algebra_Assignment.pdf',
            fileType: 'application/pdf',
            fileSize: 1024 * 1024,
            uploadedAt: '2026-11-17T14:30:00',
          },
        ],
        status: 'superseded',
      },
      {
        id: 'version2',
        versionNumber: 2,
        submittedAt: '2026-11-18T10:15:00',
        textResponse: 'Revised algebra assignment with corrected calculations.',
        files: [
          {
            id: 'file2',
            name: 'Algebra_Assignment_Revised.pdf',
            fileType: 'application/pdf',
            fileSize: 1200 * 1024,
            uploadedAt: '2026-11-18T10:15:00',
          },
        ],
        status: 'active',
      },
    ],

    activeVersionId: 'version2',
    status: 'submitted',
    submittedAt: '2026-11-18T10:15:00',

    totalMarks: 30,
    gradingStatus: 'not_graded',
  },
];

// ======================================================
// ASSESSMENT GRADES
// ======================================================

export const ASSESSMENT_GRADES: AssessmentGrade[] = [
  {
    id: 'grade1',
    assessmentId: 'asm1',
    studentId: 's1',
    teacherId: 'u6',
    score: 27,
    totalMarks: 30,
    feedback: 'Good work. Your calculations are clear. Review question 4.',
    gradedAt: '2026-11-19T12:00:00',
    status: 'graded',
  },
];

// ======================================================
// FILTER HELPERS
// ======================================================

// Assessments assigned to a particular student
export function getStudentAssessments(studentId: string) {
  return ASSESSMENT_RECORDS.filter((assessment) =>
    assessment.recipients.some(
      (recipient) => recipient.studentId === studentId,
    ),
  );
}

// Assessments created by a particular teacher
export function getTeacherAssessments(teacherId: string) {
  return ASSESSMENT_RECORDS.filter(
    (assessment) => assessment.teacherId === teacherId,
  );
}

// Students assigned to an assessment
export function getAssessmentRecipients(assessmentId: string) {
  const assessment = ASSESSMENT_RECORDS.find(
    (item) => item.id === assessmentId,
  );

  return assessment?.recipients ?? [];
}

// Get submissions for an assessment
export function getAssessmentSubmissions(assessmentId: string) {
  return ASSIGNMENT_SUBMISSIONS.filter(
    (submission) => submission.assessmentId === assessmentId,
  );
}

// Get attempts for an assessment
export function getAssessmentAttempts(assessmentId: string) {
  return ASSESSMENT_ATTEMPTS.filter(
    (attempt) => attempt.assessmentId === assessmentId,
  );
}

// Get grades for a student
export function getStudentAssessmentGrades(studentId: string) {
  return ASSESSMENT_GRADES.filter(
    (grade) => grade.studentId === studentId,
  );
}

// Get available students in a class
export function getStudentsInClass(classId: string) {
  const schoolClass = CLASSES.find((item) => item.id === classId);

  if (!schoolClass) return [];

  return STUDENTS.filter(
    (student) =>
      student.status === 'active' &&
      student.grade === schoolClass.grade &&
      student.class === `${schoolClass.grade.replace('Grade ', '')}${schoolClass.section}`,
  );
}

// Get subjects available in a class
export function getSubjectsInClass(classId: string) {
  return SUBJECTS.filter(
    (subject) => subject.classId === classId,
  );
}
