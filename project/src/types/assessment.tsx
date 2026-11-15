
/* =========================================================
   INNOSYSEDU - STUDENT ASSESSMENT SYSTEM
   Frontend data types
   ========================================================= */

// Assessment categories
export type AssessmentType =
  | 'take_home_assignment'
  | 'classroom_quiz'
  | 'online_quiz'
  | 'classroom_test'
  | 'online_test'
  | 'midterm'
  | 'final';

// How students complete the assessment
export type AssessmentMode =
  | 'offline'
  | 'online';

// Who receives the assessment
export type RecipientScope =
  | 'entire_class'
  | 'selected_students';

// Assessment lifecycle
export type AssessmentStatus =
  | 'draft'
  | 'scheduled'
  | 'published'
  | 'ongoing'
  | 'closed'
  | 'completed'
  | 'cancelled';

// Individual student progress
export type StudentAssessmentStatus =
  | 'upcoming'
  | 'ongoing'
  | 'submitted'
  | 'under_review'
  | 'needs_grading'
  | 'graded'
  | 'released'
  | 'missing'
  | 'late'
  | 'returned_for_correction';

// Question formats
export type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'matching'
  | 'short_answer'
  | 'essay';

// Late submission policy
export type LateSubmissionPolicy =
  | 'allowed'
  | 'not_allowed';

// Grading status
export type GradingStatus =
  | 'not_graded'
  | 'auto_graded'
  | 'needs_review'
  | 'graded'
  | 'released';

// Uploaded resource information.
// This stores metadata, not the actual file.
export interface AssessmentFile {
  id: string;
  name: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  url?: string;
}

// Question option
export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

// Matching pair
export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

// Assessment question
export interface AssessmentQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  marks: number;
  options?: QuestionOption[];
  correctAnswer?: string | string[];
  matchingPairs?: MatchingPair[];
  explanation?: string;
  media?: AssessmentFile[];
  order: number;
}

// Assessment scheduling information
export interface AssessmentSchedule {
  opensAt?: string;
  dueAt?: string;
  closesAt?: string;
  timeLimitMinutes?: number;
}

// Rules configured by the teacher
export interface AssessmentSettings {
  attemptsAllowed: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  allowLateSubmission: boolean;
  allowResubmission: boolean;
  allowSubmissionRemoval: boolean;
  showCorrectAnswers: boolean;
  releaseResultsAutomatically: boolean;
  acceptedFileTypes: string[];
  maxFileSizeMB: number;
}

// Individual recipient
export interface AssessmentRecipient {
  id: string;
  assessmentId: string;
  studentId: string;
  studentName: string;

  status: StudentAssessmentStatus;

  // Optional individual schedule override
  opensAt?: string;
  dueAt?: string;
  closesAt?: string;

  assignedAt: string;
}

// Main assessment record
export interface StudentAssessment {
  id: string;
  title: string;
  instructions: string;

  type: AssessmentType;
  mode: AssessmentMode;

  subjectId: string;
  subjectName: string;

  classId: string;
  className: string;
  section: string;

  teacherId: string;
  teacherName: string;

  recipientScope: RecipientScope;
  recipients: AssessmentRecipient[];

  schedule: AssessmentSchedule;
  settings: AssessmentSettings;

  questions: AssessmentQuestion[];
  resources: AssessmentFile[];

  totalMarks: number;

  status: AssessmentStatus;

  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

// Student response to a question
export interface AssessmentAnswer {
  questionId: string;
  textAnswer?: string;
  selectedOptions?: string[];
  matchingAnswers?: Record<string, string>;
  uploadedFiles?: AssessmentFile[];
  awardedMarks?: number;
  teacherComment?: string;
}

// Student attempt
export interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  studentId: string;
  attemptNumber: number;

  startedAt: string;
  submittedAt?: string;

  answers: AssessmentAnswer[];

  autoScore?: number;
  manualScore?: number;
  totalScore?: number;

  gradingStatus: GradingStatus;
  status: StudentAssessmentStatus;
}

// Take-home assignment submission version
export interface SubmissionVersion {
  id: string;
  versionNumber: number;

  submittedAt: string;
  textResponse?: string;
  files: AssessmentFile[];

  status: 'active' | 'superseded' | 'removed';
}

// Assignment submission record
export interface AssignmentSubmission {
  id: string;
  assessmentId: string;
  studentId: string;
  studentName: string;

  versions: SubmissionVersion[];
  activeVersionId?: string;

  status: StudentAssessmentStatus;

  submittedAt?: string;
  gradedAt?: string;

  score?: number;
  totalMarks: number;

  teacherFeedback?: string;
  gradingStatus: GradingStatus;

  // Teacher's decision on late submissions
  lateSubmissionDecision?: 'pending' | 'accepted' | 'declined';
  lateDecisionBy?: string;
  lateDecisionAt?: string;
  lateDecisionNote?: string;
}

// Teacher grading record
export interface AssessmentGrade {
  id: string;
  assessmentId: string;
  studentId: string;
  teacherId: string;

  score: number;
  totalMarks: number;
  feedback: string;

  gradedAt: string;
  releasedAt?: string;

  status: 'draft' | 'graded' | 'released';
}
