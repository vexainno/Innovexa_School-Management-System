import { useMemo, useState } from 'react';
import {
  Search,
  ClipboardCheck,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Save,
  Send,
  FileText,
  BookOpen,
  GraduationCap,
  LockKeyhole,
  Download,
  Filter,
  ExternalLink,
  FileImage,
  File,
  FileSpreadsheet,
} from 'lucide-react';

import { CLASSES, STUDENTS, SUBJECTS } from '@/data/mockData';
import {
  ASSESSMENT_RECORDS,
  ASSESSMENT_ATTEMPTS,
  ASSIGNMENT_SUBMISSIONS,
  ASSESSMENT_GRADES,
} from '@/data/assessmentMockData';
import type {
  AssessmentAnswer,
  AssessmentAttempt,
  AssessmentFile,
  AssignmentSubmission,
  StudentAssessment,
} from '@/types/assessment';

type FilterStatus = 'all' | 'needs_review' | 'graded' | 'not_submitted';
type ResultStatus = 'draft' | 'published';
type SubmissionStatus = 'submitted' | 'late' | 'not_submitted';
type MarkingStatus = 'needs_review' | 'graded' | 'auto_graded';

type StudentMark = {
  studentId: string;
  assessmentId: string;
  submissionStatus: SubmissionStatus;
  markingStatus: MarkingStatus;
  autoScore: number;
  autoTotal: number;
  manualScore: number | null;
  manualTotal: number;
  resultStatus: ResultStatus;
  feedback: string;
  privateNote: string;
  submittedAt?: string;
  lateDecision?: 'pending' | 'accepted' | 'declined';
};

type StudentRow = {
  id: string;
  name: string;
  rollNo: string;
  photoColor: string;
  submissionStatus: SubmissionStatus;
  markingStatus: MarkingStatus;
  autoScore: number;
  autoTotal: number;
  manualScore: number | null;
  manualTotal: number;
  totalScore: number | null;
  totalMarks: number;
  resultStatus: ResultStatus;
  submittedAt?: string;
  feedback: string;
  privateNote: string;
  lateDecision?: StudentMark['lateDecision'];
};

type QuestionTotals = {
  autoTotal: number;
  manualTotal: number;
  hasAutoQuestions: boolean;
  hasManualQuestions: boolean;
};

const FILTERS: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: 'All students' },
  { value: 'needs_review', label: 'Needs review' },
  { value: 'graded', label: 'Graded' },
  { value: 'not_submitted', label: 'Not submitted' },
];

function getTypeLabel(type: string) {
  const labels: Record<string, string> = {
    take_home_assignment: 'Assignment',
    classroom_quiz: 'Classroom Quiz',
    online_quiz: 'Online Quiz',
    classroom_test: 'Classroom Test',
    online_test: 'Online Test',
    midterm: 'Mid-Term Test',
    final: 'Final Examination',
  };
  return labels[type] ?? type.replaceAll('_', ' ');
}

function formatDate(value?: string) {
  if (!value) return 'Not submitted';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function isLateSubmission(submittedAt?: string, dueAt?: string) {
  if (!submittedAt || !dueAt) return false;
  const submitted = new Date(submittedAt).getTime();
  const due = new Date(dueAt).getTime();
  return Number.isFinite(submitted) && Number.isFinite(due) && submitted > due;
}

function getQuestionTotals(assessment: StudentAssessment): QuestionTotals {
  const autoQuestions = assessment.questions.filter(
    (question) =>
      question.type === 'multiple_choice' || question.type === 'true_false',
  );
  const manualQuestions = assessment.questions.filter(
    (question) =>
      question.type !== 'multiple_choice' && question.type !== 'true_false',
  );

  // If an assessment has no configured question records (for example, an
  // offline classroom test), treat its full mark as teacher-marked.
  if (assessment.questions.length === 0) {
    return {
      autoTotal: 0,
      manualTotal: assessment.totalMarks,
      hasAutoQuestions: false,
      hasManualQuestions: assessment.totalMarks > 0,
    };
  }

  return {
    autoTotal: autoQuestions.reduce((sum, question) => sum + question.marks, 0),
    manualTotal: manualQuestions.reduce((sum, question) => sum + question.marks, 0),
    hasAutoQuestions: autoQuestions.length > 0,
    hasManualQuestions: manualQuestions.length > 0,
  };
}

function sameStringSet(a: string[], b: string[]) {
  const left = [...new Set(a)].sort();
  const right = [...new Set(b)].sort();
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function getCorrectOptionIds(
  question: StudentAssessment['questions'][number],
): string[] {
  const fromOptions = (question.options ?? [])
    .filter((option) => option.isCorrect)
    .map((option) => option.id);

  if (fromOptions.length > 0) return fromOptions;

  if (Array.isArray(question.correctAnswer)) return question.correctAnswer;
  if (typeof question.correctAnswer === 'string' && question.correctAnswer) {
    return [question.correctAnswer];
  }
  return [];
}

function calculateAutomaticScore(
  assessment: StudentAssessment,
  answers: AssessmentAnswer[],
) {
  const objectiveQuestions = assessment.questions.filter(
    (question) =>
      question.type === 'multiple_choice' || question.type === 'true_false',
  );

  let score = 0;
  objectiveQuestions.forEach((question) => {
    const answer = answers.find((item) => item.questionId === question.id);
    if (!answer) return;

    const expected = getCorrectOptionIds(question);
    const selected = answer.selectedOptions ?? [];
    if (expected.length > 0 && sameStringSet(expected, selected)) {
      score += question.marks;
    }
  });

  return score;
}

function getAttempt(
  assessmentId: string,
  studentId: string,
): AssessmentAttempt | undefined {
  return ASSESSMENT_ATTEMPTS.find(
    (attempt) =>
      attempt.assessmentId === assessmentId && attempt.studentId === studentId,
  );
}

function getAssignmentSubmission(
  assessmentId: string,
  studentId: string,
): AssignmentSubmission | undefined {
  return ASSIGNMENT_SUBMISSIONS.find(
    (submission) =>
      submission.assessmentId === assessmentId && submission.studentId === studentId,
  );
}

function getActiveVersion(submission?: AssignmentSubmission) {
  if (!submission) return undefined;
  return (
    submission.versions.find((version) => version.id === submission.activeVersionId) ??
    submission.versions.find((version) => version.status === 'active') ??
    submission.versions[submission.versions.length - 1]
  );
}

function getSubmissionBadge(status: SubmissionStatus) {
  if (status === 'submitted') return 'bg-emerald-50 text-emerald-700';
  if (status === 'late') return 'bg-amber-50 text-amber-700';
  return 'bg-slate-100 text-slate-600';
}

function getMarkingBadge(status: MarkingStatus) {
  if (status === 'needs_review') return 'bg-amber-50 text-amber-700';
  if (status === 'auto_graded') return 'bg-emerald-50 text-emerald-700';
  return 'bg-blue-50 text-blue-700';
}

function getFileKind(file: AssessmentFile) {
  const name = file.name.toLowerCase();
  const type = file.fileType.toLowerCase();
  if (type.includes('pdf') || name.endsWith('.pdf')) return 'pdf';
  if (type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp)$/i.test(name)) return 'image';
  if (type.includes('word') || /\.(doc|docx)$/i.test(name)) return 'word';
  if (type.includes('presentation') || /\.(ppt|pptx)$/i.test(name)) return 'presentation';
  if (type.startsWith('text/') || /\.(txt|md|csv)$/i.test(name)) return 'text';
  return 'other';
}

function formatFileSize(bytes: number) {
  if (!bytes || bytes < 0) return 'Size unavailable';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(file: AssessmentFile) {
  const kind = getFileKind(file);
  if (kind === 'image') return FileImage;
  if (kind === 'presentation') return FileSpreadsheet;
  if (kind === 'pdf' || kind === 'word' || kind === 'text') return FileText;
  return File;
}

export default function TeacherAssessmentMarking() {
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [marks, setMarks] = useState<StudentMark[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [manualScore, setManualScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [privateNote, setPrivateNote] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const classes = CLASSES.filter((item) => item.teacherId === 'u6');

  const sections = useMemo(
    () =>
      Array.from(
        new Set(
          classes
            .filter((item) => item.grade === selectedClassId)
            .map((item) => item.section),
        ),
      ),
    [classes, selectedClassId],
  );

  const selectedClass = classes.find(
    (item) =>
      item.grade === selectedClassId && item.section === selectedSection,
  );

  const availableSubjects = SUBJECTS.filter(
    (subject) =>
      subject.classId === selectedClass?.id && subject.teacherId === 'u6',
  );

  const availableAssessments = (ASSESSMENT_RECORDS as StudentAssessment[]).filter(
    (assessment) =>
      assessment.classId === selectedClass?.id &&
      assessment.subjectId === selectedSubjectId &&
      ['published', 'ongoing', 'closed', 'completed'].includes(assessment.status),
  );

  const assessmentTypes = Array.from(
    new Set(availableAssessments.map((item) => item.type)),
  );

  const filteredAssessments = availableAssessments.filter(
    (item) => item.type === selectedType,
  );

  const selectedAssessment = filteredAssessments.find(
    (item) => item.id === selectedAssessmentId,
  );

  const questionTotals = selectedAssessment
    ? getQuestionTotals(selectedAssessment)
    : { autoTotal: 0, manualTotal: 0, hasAutoQuestions: false, hasManualQuestions: false };

  const classStudents = selectedClass
    ? STUDENTS.filter(
        (student) =>
          student.status === 'active' &&
          student.grade === selectedClass.grade &&
          student.class ===
            `${selectedClass.grade.replace('Grade ', '')}${selectedClass.section}`,
      )
    : [];

  const currentMarks = marks.filter(
    (item) => item.assessmentId === selectedAssessmentId,
  );

  const studentRows: StudentRow[] = classStudents.map((student) => {
    const existingMark = currentMarks.find((item) => item.studentId === student.id);
    const attempt = selectedAssessment
      ? getAttempt(selectedAssessment.id, student.id)
      : undefined;
    const submission = selectedAssessment
      ? getAssignmentSubmission(selectedAssessment.id, student.id)
      : undefined;
    const activeVersion = getActiveVersion(submission);
    const submittedAt = attempt?.submittedAt ?? activeVersion?.submittedAt ?? submission?.submittedAt;
    const hasSubmission = Boolean(attempt?.submittedAt || activeVersion || submission?.submittedAt);
    const late = isLateSubmission(submittedAt, selectedAssessment?.schedule.dueAt);
    const submissionStatus: SubmissionStatus = !hasSubmission
      ? 'not_submitted'
      : late
        ? 'late'
        : 'submitted';

    const answers = attempt?.answers ?? [];
    const autoScore = selectedAssessment
      ? calculateAutomaticScore(selectedAssessment, answers)
      : 0;
    const autoTotal = questionTotals.autoTotal;
    const manualTotal = questionTotals.manualTotal;

    const storedGrade = selectedAssessment
      ? ASSESSMENT_GRADES.find(
          (grade) =>
            grade.assessmentId === selectedAssessment.id &&
            grade.studentId === student.id,
        )
      : undefined;

    const manualScoreValue =
      existingMark?.manualScore ??
      attempt?.manualScore ??
      storedGrade?.score ??
      null;

    const totalScore =
      manualTotal === 0
        ? autoScore
        : manualScoreValue !== null
          ? autoScore + manualScoreValue
          : null;

    const hasManualWork = manualTotal > 0;
    const allObjectiveOnly = !hasManualWork;
    const isGraded = allObjectiveOnly
      ? hasSubmission
      : manualScoreValue !== null;

    return {
      id: student.id,
      name: student.name,
      rollNo: student.rollNo,
      photoColor: student.photoColor,
      submissionStatus: existingMark?.lateDecision === 'declined' ? 'not_submitted' : submissionStatus,
      markingStatus: !hasSubmission
        ? 'needs_review'
        : isGraded
          ? allObjectiveOnly
            ? 'auto_graded'
            : 'graded'
          : 'needs_review',
      autoScore,
      autoTotal,
      manualScore: manualScoreValue,
      manualTotal,
      totalScore,
      totalMarks: autoTotal + manualTotal || selectedAssessment?.totalMarks || 0,
      resultStatus: existingMark?.resultStatus === 'published' || storedGrade?.status === 'released'
        ? 'published'
        : 'draft',
      submittedAt,
      feedback: existingMark?.feedback ?? storedGrade?.feedback ?? '',
      privateNote: existingMark?.privateNote ?? '',
      lateDecision: existingMark?.lateDecision ?? (late ? 'pending' : undefined),
    };
  });

  const filteredStudents = studentRows.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.rollNo.toLowerCase().includes(search.toLowerCase());

    let matchesFilter = true;
    if (activeFilter === 'needs_review') {
      matchesFilter =
        student.submissionStatus !== 'not_submitted' &&
        student.markingStatus === 'needs_review';
    }
    if (activeFilter === 'graded') {
      matchesFilter =
        student.markingStatus === 'graded' ||
        student.markingStatus === 'auto_graded';
    }
    if (activeFilter === 'not_submitted') {
      matchesFilter = student.submissionStatus === 'not_submitted';
    }
    return matchesSearch && matchesFilter;
  });

  const totalStudents = studentRows.length;
  const submittedCount = studentRows.filter(
    (student) => student.submissionStatus !== 'not_submitted',
  ).length;
  const needsReviewCount = studentRows.filter(
    (student) =>
      student.submissionStatus !== 'not_submitted' &&
      student.markingStatus === 'needs_review',
  ).length;
  const publishedCount = studentRows.filter(
    (student) => student.resultStatus === 'published',
  ).length;

  const selectedStudent = studentRows.find((student) => student.id === selectedStudentId);
  const selectedMark = marks.find(
    (item) =>
      item.studentId === selectedStudentId &&
      item.assessmentId === selectedAssessmentId,
  );

  const selectedAttempt =
    selectedAssessment && selectedStudentId
      ? getAttempt(selectedAssessment.id, selectedStudentId)
      : undefined;
  const selectedSubmission =
    selectedAssessment && selectedStudentId
      ? getAssignmentSubmission(selectedAssessment.id, selectedStudentId)
      : undefined;
  const activeVersion = getActiveVersion(selectedSubmission);
  const attachmentFiles = activeVersion?.files ?? [];
  const selectedFile =
    attachmentFiles.find((file) => file.id === selectedFileId) ?? attachmentFiles[0];

  function resetFromClass() {
    setSelectedSection('');
    setSelectedSubjectId('');
    setSelectedType('');
    setSelectedAssessmentId('');
    setSelectedStudentId(null);
    setSelectedFileId(null);
  }

  function openStudent(student: StudentRow) {
    setSelectedStudentId(student.id);
    setManualScore(student.manualScore === null ? '' : String(student.manualScore));
    setFeedback(student.feedback);
    setPrivateNote(student.privateNote);
    setNotice('');
    setSelectedFileId(null);
  }

  function updateStudentMark(studentId: string, updates: Partial<StudentMark>) {
    setMarks((previous) => {
      const existing = previous.find(
        (item) =>
          item.studentId === studentId &&
          item.assessmentId === selectedAssessmentId,
      );
      if (existing) {
        return previous.map((item) =>
          item.studentId === studentId && item.assessmentId === selectedAssessmentId
            ? { ...item, ...updates }
            : item,
        );
      }

      const currentStudent = studentRows.find((student) => student.id === studentId);
      return [
        ...previous,
        {
          studentId,
          assessmentId: selectedAssessmentId,
          submissionStatus: currentStudent?.submissionStatus ?? 'not_submitted',
          markingStatus: currentStudent?.markingStatus ?? 'needs_review',
          autoScore: currentStudent?.autoScore ?? 0,
          autoTotal: currentStudent?.autoTotal ?? 0,
          manualScore: currentStudent?.manualScore ?? null,
          manualTotal: currentStudent?.manualTotal ?? 0,
          resultStatus: currentStudent?.resultStatus ?? 'draft',
          feedback: currentStudent?.feedback ?? '',
          privateNote: currentStudent?.privateNote ?? '',
          submittedAt: currentStudent?.submittedAt,
          lateDecision: currentStudent?.lateDecision,
          ...updates,
        },
      ];
    });
  }

  function saveDraft() {
    if (!selectedStudent || !selectedAssessment) return;

    const score = manualScore.trim() === '' ? null : Number(manualScore);
    if (
      score !== null &&
      (!Number.isFinite(score) || score < 0 || score > questionTotals.manualTotal)
    ) {
      setNotice(`Enter a valid manual mark from 0 to ${questionTotals.manualTotal}.`);
      return;
    }

    if (questionTotals.manualTotal === 0 && score !== null) {
      setNotice('This assessment has no manually marked questions.');
      return;
    }

    updateStudentMark(selectedStudent.id, {
      manualScore: score,
      markingStatus:
        questionTotals.manualTotal === 0
          ? 'auto_graded'
          : score === null
            ? 'needs_review'
            : 'graded',
      resultStatus: 'draft',
      feedback,
      privateNote,
    });
    setNotice('Draft saved in this frontend prototype.');
  }

  function publishResult() {
    if (!selectedStudent || !selectedAssessment) return;

    if (
      selectedStudent.submissionStatus === 'not_submitted' ||
      selectedStudent.lateDecision === 'declined'
    ) {
      setNotice('A result cannot be published without an accepted submission.');
      return;
    }

    const score = questionTotals.manualTotal === 0
      ? 0
      : manualScore.trim() === ''
        ? null
        : Number(manualScore);

    if (
      questionTotals.manualTotal > 0 &&
      (score === null ||
        !Number.isFinite(score) ||
        score < 0 ||
        score > questionTotals.manualTotal)
    ) {
      setNotice(`Complete manual marking with a score from 0 to ${questionTotals.manualTotal} before publishing.`);
      return;
    }

    updateStudentMark(selectedStudent.id, {
      manualScore: questionTotals.manualTotal === 0 ? null : score,
      markingStatus: questionTotals.manualTotal === 0 ? 'auto_graded' : 'graded',
      resultStatus: 'published',
      feedback,
      privateNote,
    });
    setNotice('Result published privately in this frontend prototype.');
  }

  function decideLateSubmission(decision: 'accepted' | 'declined') {
    if (!selectedStudent) return;
    updateStudentMark(selectedStudent.id, {
      lateDecision: decision,
      submissionStatus: decision === 'accepted' ? 'late' : 'not_submitted',
    });
    setNotice(
      decision === 'accepted'
        ? 'Late submission accepted for marking.'
        : 'Late submission declined.',
    );
  }

  function changeStudent(direction: -1 | 1) {
    if (!selectedStudentId) return;
    const index = filteredStudents.findIndex((student) => student.id === selectedStudentId);
    const next = filteredStudents[index + direction];
    if (next) openStudent(next);
  }

  function downloadFile(file: AssessmentFile) {
    if (!file.url) {
      setNotice('This sample attachment has no original file URL yet. Download will work when real file storage is connected.');
      return;
    }
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.target = '_blank';
    link.rel = 'noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function exportResults() {
    if (!selectedAssessment) return;
    const headings = [
      'Student Name',
      'Roll Number',
      'Submission Status',
      'Marking Status',
      'Automatic Score',
      'Automatic Total',
      'Manual Score',
      'Manual Total',
      'Total Score',
      'Total Marks',
      'Result Status',
    ];
    const rows = studentRows.map((student) => [
      student.name,
      student.rollNo,
      student.submissionStatus,
      student.markingStatus,
      student.autoScore,
      student.autoTotal,
      student.manualScore ?? '',
      student.manualTotal,
      student.totalScore ?? '',
      student.totalMarks,
      student.resultStatus,
    ]);
    const csv = [headings, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','),
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedAssessment.title.replaceAll(' ', '-')}-results.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const hasAssessment = Boolean(selectedAssessment);
  const hasManualQuestions = questionTotals.manualTotal > 0;
  const currentManualInput = manualScore.trim() === '' ? null : Number(manualScore);
  const displayedTotal =
    (selectedMark?.autoScore ?? selectedStudent?.autoScore ?? 0) +
    (hasManualQuestions ? (currentManualInput ?? selectedStudent?.manualScore ?? 0) : 0);
  const displayedMaximum = questionTotals.autoTotal + questionTotals.manualTotal;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <GraduationCap size={16} />
            Teacher Portal
            <span>/</span>
            Assessment Marking
          </div>
          <h1 className="text-2xl font-bold text-navy-800">Assessment Marking</h1>
          <p className="mt-1 text-sm text-slate-500">
            Review submissions, mark student work and publish results privately.
          </p>
        </div>
        {hasAssessment && (
          <button
            type="button"
            onClick={exportResults}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Download size={16} />
            Export Results
          </button>
        )}
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Filter size={18} className="text-navy-600" />
          <h2 className="font-semibold text-navy-800">Select Assessment</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div>
            <label className="form-label">Class</label>
            <select
              className="input-base"
              value={selectedClassId}
              onChange={(event) => {
                setSelectedClassId(event.target.value);
                resetFromClass();
              }}
            >
              <option value="">Select class</option>
              {Array.from(new Set(classes.map((item) => item.grade))).map((grade) => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Section</label>
            <select
              className="input-base"
              value={selectedSection}
              disabled={!selectedClassId}
              onChange={(event) => {
                setSelectedSection(event.target.value);
                setSelectedSubjectId('');
                setSelectedType('');
                setSelectedAssessmentId('');
                setSelectedStudentId(null);
              }}
            >
              <option value="">Select section</option>
              {sections.map((section) => (
                <option key={section} value={section}>Section {section}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Subject</label>
            <select
              className="input-base"
              value={selectedSubjectId}
              disabled={!selectedClass}
              onChange={(event) => {
                setSelectedSubjectId(event.target.value);
                setSelectedType('');
                setSelectedAssessmentId('');
                setSelectedStudentId(null);
              }}
            >
              <option value="">Select subject</option>
              {availableSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Assessment Type</label>
            <select
              className="input-base"
              value={selectedType}
              disabled={!selectedSubjectId}
              onChange={(event) => {
                setSelectedType(event.target.value);
                setSelectedAssessmentId('');
                setSelectedStudentId(null);
              }}
            >
              <option value="">Select type</option>
              {assessmentTypes.map((type) => (
                <option key={type} value={type}>{getTypeLabel(type)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Assessment Title</label>
            <select
              className="input-base"
              value={selectedAssessmentId}
              disabled={!selectedType}
              onChange={(event) => {
                setSelectedAssessmentId(event.target.value);
                setSelectedStudentId(null);
                setSelectedFileId(null);
              }}
            >
              <option value="">Select assessment</option>
              {filteredAssessments.map((assessment) => (
                <option key={assessment.id} value={assessment.id}>{assessment.title}</option>
              ))}
            </select>
          </div>
        </div>
        {selectedClass && selectedSubjectId && filteredAssessments.length === 0 && (
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            No published or active assessments of this type are available for this selection.
          </p>
        )}
      </section>

      {hasAssessment && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">Total Students</p>
                <Users className="text-blue-600" size={20} />
              </div>
              <p className="mt-3 text-3xl font-bold text-navy-800">{totalStudents}</p>
              <p className="mt-1 text-xs text-slate-500">Active students in this section</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">Submitted</p>
                <CheckCircle2 className="text-emerald-600" size={20} />
              </div>
              <p className="mt-3 text-3xl font-bold text-navy-800">
                {submittedCount}
                <span className="ml-1 text-base font-medium text-slate-400">/ {totalStudents}</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">Including late submissions</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-amber-800">Needs Manual Marking</p>
                <Clock className="text-amber-600" size={20} />
              </div>
              <p className="mt-3 text-3xl font-bold text-amber-800">{needsReviewCount}</p>
              <p className="mt-1 text-xs text-amber-700">
                Submitted work awaiting teacher marking
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">Published Results</p>
                <Send className="text-emerald-600" size={20} />
              </div>
              <p className="mt-3 text-3xl font-bold text-navy-800">
                {publishedCount}
                <span className="ml-1 text-base font-medium text-slate-400">/ {totalStudents}</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">Visible to students privately</p>
            </div>
          </div>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy-800">Student Assessment Roster</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedAssessment.title} · {selectedClass?.name} ·{' '}
                  {SUBJECTS.find((item) => item.id === selectedSubjectId)?.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Automatic: {questionTotals.autoTotal} marks · Manual: {questionTotals.manualTotal} marks
                </p>
              </div>
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  className="input-base pl-10"
                  placeholder="Search student or roll number"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              {FILTERS.map((filter) => (
                <button
                  type="button"
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    activeFilter === filter.value
                      ? 'bg-navy-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="mb-3 text-sm text-slate-500">
              Showing {filteredStudents.length} of {totalStudents} students
            </div>

            {filteredStudents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center">
                <Users className="mx-auto mb-3 text-slate-300" size={36} />
                <p className="font-semibold text-navy-800">No students found</p>
                <p className="mt-1 text-sm text-slate-500">Try changing your search or filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-base min-w-[1100px]">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Submission</th>
                      <th>Marking</th>
                      <th>Auto Score</th>
                      <th>Manual Score</th>
                      <th>Total Mark</th>
                      <th>Result</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white ${student.photoColor}`}>
                              {student.name.split(' ').slice(0, 2).map((part) => part[0]).join('')}
                            </div>
                            <div>
                              <p className="font-semibold text-navy-800">{student.name}</p>
                              <p className="text-xs text-slate-500">{student.rollNo}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${getSubmissionBadge(student.submissionStatus)}`}>
                            {student.submissionStatus === 'submitted'
                              ? 'Submitted'
                              : student.submissionStatus === 'late'
                                ? 'Late'
                                : 'Not Submitted'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getMarkingBadge(student.markingStatus)}`}>
                            {student.markingStatus === 'needs_review'
                              ? 'Needs Manual Marking'
                              : student.markingStatus === 'auto_graded'
                                ? 'Auto-Graded'
                                : 'Graded'}
                          </span>
                        </td>
                        <td className="font-medium">
                          {student.autoScore} / {student.autoTotal}
                        </td>
                        <td className="font-medium">
                          {student.manualScore === null
                            ? `— / ${student.manualTotal}`
                            : `${student.manualScore} / ${student.manualTotal}`}
                        </td>
                        <td className="font-bold text-navy-800">
                          {student.totalScore === null
                            ? '—'
                            : `${student.totalScore} / ${student.totalMarks}`}
                        </td>
                        <td>
                          {student.resultStatus === 'published' ? (
                            <span className="badge badge-success">
                              <CheckCircle2 size={12} /> Published
                            </span>
                          ) : (
                            <span className="badge badge-info">
                              <LockKeyhole size={12} /> Private Draft
                            </span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => openStudent(student)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm font-semibold text-navy-700 transition hover:bg-navy-50"
                          >
                            {student.submissionStatus === 'not_submitted'
                              ? 'View'
                              : student.markingStatus === 'needs_review'
                                ? 'Mark'
                                : student.resultStatus === 'published'
                                  ? 'Edit'
                                  : 'Review'}
                            <ChevronRight size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {!hasAssessment && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-50">
            <ClipboardCheck size={32} className="text-navy-600" />
          </div>
          <h2 className="text-lg font-bold text-navy-800">Select an assessment to begin</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Choose a class, section, subject, assessment type and assessment title.
            The student roster and marking progress will appear here.
          </p>
        </div>
      )}

      {selectedStudent && selectedAssessment && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50">
          <button
            type="button"
            aria-label="Close marking drawer"
            className="absolute inset-0 cursor-default"
            onClick={() => setSelectedStudentId(null)}
          />

          <div className="relative flex h-full w-full flex-col bg-white shadow-2xl lg:w-[90vw]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-navy-800">{selectedStudent.name}</h2>
                <p className="text-sm text-slate-500">
                  {selectedStudent.rollNo} ·{' '}
                  {selectedStudent.submittedAt
                    ? `Submitted ${formatDate(selectedStudent.submittedAt)}`
                    : 'No submission recorded'}
                  {selectedStudent.submissionStatus === 'late' && (
                    <span className="ml-2 font-semibold text-amber-700">Late submission</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => changeStudent(-1)} className="btn-secondary" title="Previous student">
                  <ChevronLeft size={17} /> Previous
                </button>
                <button type="button" onClick={() => changeStudent(1)} className="btn-secondary" title="Next student">
                  Next <ChevronRight size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStudentId(null)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X size={21} />
                </button>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1.8fr)_minmax(320px,1fr)]">
              <div className="overflow-y-auto border-r border-slate-200 p-5">
                <div className="mb-5">
                  <h3 className="font-bold text-navy-800">Student Submission</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Review the student's submitted work and assessment performance.
                  </p>
                </div>

                <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-emerald-900">Auto-Graded Questions</h4>
                      <p className="mt-1 text-sm text-emerald-700">
                        Only multiple-choice and true/false questions are automatically marked.
                      </p>
                    </div>
                    <span className="text-lg font-bold text-emerald-800">
                      {selectedStudent.autoScore} / {selectedStudent.autoTotal}
                    </span>
                  </div>
                </div>

                {selectedStudent.submissionStatus === 'not_submitted' ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                    <AlertCircle className="mx-auto mb-3 text-slate-400" size={32} />
                    <h4 className="font-semibold text-navy-800">No submission received</h4>
                    <p className="mt-1 text-sm text-slate-500">
                      This student has not submitted this assessment.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <section className="rounded-xl border border-slate-200 p-5">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-semibold text-navy-800">Submitted Work</h4>
                        <span className="badge badge-success">Submission received</span>
                      </div>

                      {activeVersion?.textResponse ? (
                        <div className="rounded-lg border border-slate-200 bg-white p-4">
                          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-navy-700">
                            <FileText size={17} /> Written response
                          </div>
                          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                            {activeVersion.textResponse}
                          </p>
                        </div>
                      ) : selectedAttempt?.answers?.length ? (
                        <div className="space-y-3">
                          {selectedAssessment.questions.map((question, index) => {
                            const answer = selectedAttempt.answers.find(
                              (item) => item.questionId === question.id,
                            );
                            const selectedLabels = (answer?.selectedOptions ?? []).map(
                              (optionId) =>
                                question.options?.find((option) => option.id === optionId)?.text ??
                                optionId,
                            );
                            return (
                              <div key={question.id} className="rounded-lg border border-slate-200 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                  Question {index + 1} · {question.marks} marks
                                </p>
                                <p className="mt-2 text-sm font-medium text-navy-800">{question.prompt}</p>
                                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                                  {answer?.textAnswer ||
                                    (selectedLabels.length ? selectedLabels.join(', ') : 'No answer recorded')}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                          No written response text is recorded in this sample submission.
                        </div>
                      )}

                      <div className="mt-5">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <h5 className="font-semibold text-navy-800">Attachments</h5>
                            <p className="text-xs text-slate-500">
                              {attachmentFiles.length} file{attachmentFiles.length === 1 ? '' : 's'} submitted
                            </p>
                          </div>
                        </div>

                        {attachmentFiles.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                            No files attached to this submission.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {attachmentFiles.map((file) => {
                              const Icon = getFileIcon(file);
                              const active = selectedFile?.id === file.id;
                              return (
                                <div
                                  key={file.id}
                                  className={`flex flex-wrap items-center gap-3 rounded-lg border p-3 ${
                                    active ? 'border-navy-300 bg-navy-50' : 'border-slate-200 bg-white'
                                  }`}
                                >
                                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-navy-600">
                                    <Icon size={20} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-navy-800">{file.name}</p>
                                    <p className="text-xs text-slate-500">
                                      {file.fileType || 'File'} · {formatFileSize(file.fileSize)}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedFileId(file.id)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-navy-200 px-3 py-2 text-sm font-semibold text-navy-700 hover:bg-white"
                                  >
                                    <Eye size={15} /> View
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => downloadFile(file)}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                                  >
                                    <Download size={15} /> Download
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {selectedFile && (
                        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 p-3">
                            <div className="flex min-w-0 items-center gap-2">
                              <FileText size={17} className="shrink-0 text-navy-600" />
                              <span className="truncate text-sm font-semibold text-navy-800">
                                {selectedFile.name}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => downloadFile(selectedFile)}
                              className="inline-flex items-center gap-1 text-sm font-semibold text-navy-700 hover:underline"
                            >
                              <Download size={15} /> Download
                            </button>
                          </div>
                          <div className="min-h-[280px] bg-slate-100">
                            {selectedFile.url && getFileKind(selectedFile) === 'image' ? (
                              <img
                                src={selectedFile.url}
                                alt={selectedFile.name}
                                className="mx-auto max-h-[620px] w-full object-contain"
                              />
                            ) : selectedFile.url && getFileKind(selectedFile) === 'pdf' ? (
                              <iframe
                                title={`Preview of ${selectedFile.name}`}
                                src={selectedFile.url}
                                className="h-[620px] w-full bg-white"
                              />
                            ) : selectedFile.url && getFileKind(selectedFile) === 'text' ? (
                              <iframe
                                title={`Preview of ${selectedFile.name}`}
                                src={selectedFile.url}
                                className="h-[420px] w-full bg-white"
                              />
                            ) : (
                              <div className="flex min-h-[280px] flex-col items-center justify-center p-8 text-center">
                                <FileText size={42} className="mb-3 text-slate-400" />
                                <p className="font-semibold text-navy-800">
                                  {getFileKind(selectedFile) === 'word'
                                    ? 'Word document'
                                    : getFileKind(selectedFile) === 'presentation'
                                      ? 'PowerPoint presentation'
                                      : getFileKind(selectedFile) === 'pdf'
                                        ? 'PDF document'
                                        : getFileKind(selectedFile) === 'image'
                                          ? 'Image attachment'
                                          : 'File preview'}
                                </p>
                                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                                  {selectedFile.url
                                    ? 'This file type needs a compatible document preview service. Use Download to open the original file.'
                                    : 'This is sample file metadata only. The original file will be viewable and downloadable once a real file URL is attached to the submission record.'}
                                </p>
                                {selectedFile.url && (
                                  <a
                                    href={selectedFile.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-navy-700 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-800"
                                  >
                                    Open original file <ExternalLink size={15} />
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </section>

                    <section className="rounded-xl border border-slate-200 p-5">
                      <div className="flex items-center gap-2 font-semibold text-navy-800">
                        <BookOpen size={17} /> Assessment information
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{selectedAssessment.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {getTypeLabel(selectedAssessment.type)} · {selectedAssessment.totalMarks} total marks
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        Submitted: {formatDate(selectedStudent.submittedAt)}
                      </p>
                      {selectedStudent.submissionStatus === 'late' && (
                        <p className="mt-1 text-xs font-semibold text-amber-700">
                          Submitted after the assessment deadline
                        </p>
                      )}
                    </section>
                  </div>
                )}

                {selectedStudent.submissionStatus === 'late' &&
                  selectedStudent.lateDecision === 'pending' && (
                    <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <h4 className="font-semibold text-amber-900">Late Submission Review</h4>
                      <p className="mt-1 text-sm text-amber-800">
                        This submission arrived after the deadline. Decide whether to accept it for marking.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => decideLateSubmission('accepted')}
                          className="btn-primary"
                        >
                          Accept Late Submission
                        </button>
                        <button
                          type="button"
                          onClick={() => decideLateSubmission('declined')}
                          className="btn-secondary"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  )}
              </div>

              <aside className="flex min-h-0 flex-col overflow-y-auto bg-slate-50">
                <div className="flex-1 space-y-5 p-5">
                  <div>
                    <h3 className="font-bold text-navy-800">Marking & Results</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {hasManualQuestions
                        ? 'Review manual questions and enter the remaining marks.'
                        : 'This assessment contains only automatically graded questions.'}
                    </p>
                  </div>

                  {hasManualQuestions && (
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      <label className="form-label">Manual Marks</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="0"
                          max={questionTotals.manualTotal}
                          step="0.5"
                          value={manualScore}
                          onChange={(event) => setManualScore(event.target.value)}
                          className="input-base"
                          placeholder="Enter marks"
                          disabled={
                            selectedStudent.submissionStatus === 'not_submitted' ||
                            selectedStudent.lateDecision === 'declined'
                          }
                        />
                        <span className="whitespace-nowrap text-sm font-semibold text-slate-500">
                          / {questionTotals.manualTotal}
                        </span>
                      </div>
                    </div>
                  )}

                  {!hasManualQuestions && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-sm font-semibold text-emerald-900">No manual marking required</p>
                      <p className="mt-1 text-sm text-emerald-700">
                        All questions are MCQ or True/False. The system calculates the score from the answer key.
                      </p>
                    </div>
                  )}

                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-medium text-slate-500">Automatic Score</p>
                    <p className="mt-1 text-xl font-bold text-navy-800">
                      {selectedStudent.autoScore} / {selectedStudent.autoTotal}
                    </p>
                    {hasManualQuestions && (
                      <>
                        <div className="mt-4 border-t border-slate-100 pt-4">
                          <p className="text-sm font-medium text-slate-500">Manual Score</p>
                          <p className="mt-1 text-xl font-bold text-navy-800">
                            {currentManualInput ?? selectedStudent.manualScore ?? '—'} / {questionTotals.manualTotal}
                          </p>
                        </div>
                      </>
                    )}
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <p className="text-sm font-medium text-slate-500">Current Total</p>
                      <p className="mt-1 text-3xl font-bold text-navy-800">
                        {hasManualQuestions && currentManualInput === null && selectedStudent.manualScore === null
                          ? '—'
                          : displayedTotal}
                        <span className="text-base font-medium text-slate-400"> / {displayedMaximum}</span>
                      </p>
                      {(!hasManualQuestions || currentManualInput !== null || selectedStudent.manualScore !== null) && (
                        <p className="mt-1 text-sm text-slate-500">
                          {displayedMaximum > 0
                            ? `${((displayedTotal / displayedMaximum) * 100).toFixed(1)}% overall`
                            : 'No marks configured'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Individual Student Feedback</label>
                    <textarea
                      rows={4}
                      value={feedback}
                      onChange={(event) => setFeedback(event.target.value)}
                      className="input-base"
                      placeholder="Write feedback that the student will see after publication..."
                    />
                  </div>

                  <div>
                    <label className="form-label">Private Teacher Note</label>
                    <textarea
                      rows={3}
                      value={privateNote}
                      onChange={(event) => setPrivateNote(event.target.value)}
                      className="input-base"
                      placeholder="Teacher-only note. Not visible to the student."
                    />
                  </div>

                  {notice && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                      {notice}
                    </div>
                  )}
                </div>

                <div className="sticky bottom-0 border-t border-slate-200 bg-white p-4">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={saveDraft}
                      className="btn-secondary inline-flex items-center justify-center gap-2"
                      disabled={
                        selectedStudent.submissionStatus === 'not_submitted' ||
                        selectedStudent.lateDecision === 'declined'
                      }
                    >
                      <Save size={16} /> Save Draft
                    </button>
                    <button
                      type="button"
                      onClick={publishResult}
                      disabled={
                        selectedStudent.submissionStatus === 'not_submitted' ||
                        selectedStudent.lateDecision === 'declined' ||
                        (hasManualQuestions &&
                          manualScore.trim() === '' &&
                          selectedStudent.manualScore === null)
                      }
                      className="btn-primary inline-flex items-center justify-center gap-2"
                    >
                      <Send size={16} /> Publish Result
                    </button>
                  </div>
                  <p className="mt-3 text-center text-xs text-slate-400">
                    Published results are intended for the student's private portal.
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
