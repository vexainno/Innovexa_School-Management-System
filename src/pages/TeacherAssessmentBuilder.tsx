
import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  GraduationCap,
  Plus,
  Save,
  Send,
  Trash2,
  Users,
  X,
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';

import {
  CLASSES,
  STUDENTS,
  SUBJECTS,
} from '@/data/mockData';

import { ASSESSMENT_RECORDS } from '@/data/assessmentMockData';

import type {
  AssessmentQuestion,
  AssessmentType,
  AssessmentMode,
  RecipientScope,
  StudentAssessment,
} from '@/types/assessment';

type QuestionDraft = {
  id: string;
  type: AssessmentQuestion['type'];
  prompt: string;
  marks: number;
  options: string[];
  correctAnswer: string;
};

type FormState = {
  title: string;
  instructions: string;
  type: AssessmentType;
  mode: AssessmentMode;
  classId: string;
  subjectId: string;
  recipientScope: RecipientScope;
  selectedStudentIds: string[];
  opensAt: string;
  dueAt: string;
  closesAt: string;
  timeLimitMinutes: number;
  attemptsAllowed: number;
  allowLateSubmission: boolean;
  allowResubmission: boolean;
  acceptedFileTypes: string[];
  maxFileSizeMB: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
};

const initialForm: FormState = {
  title: '',
  instructions: '',
  type: 'take_home_assignment',
  mode: 'offline',
  classId: '',
  subjectId: '',
  recipientScope: 'entire_class',
  selectedStudentIds: [],
  opensAt: '',
  dueAt: '',
  closesAt: '',
  timeLimitMinutes: 60,
  attemptsAllowed: 1,
  allowLateSubmission: false,
  allowResubmission: true,
  acceptedFileTypes: ['pdf', 'doc', 'docx'],
  maxFileSizeMB: 10,
  shuffleQuestions: false,
  shuffleOptions: false,
};

const assessmentTypeOptions: {
  value: AssessmentType;
  label: string;
  description: string;
  defaultMode: AssessmentMode;
}[] = [
  {
    value: 'take_home_assignment',
    label: 'Take-home assignment',
    description: 'Students complete work outside the classroom.',
    defaultMode: 'offline',
  },
  {
    value: 'classroom_quiz',
    label: 'Classroom quiz',
    description: 'A quiz conducted in the physical classroom.',
    defaultMode: 'offline',
  },
  {
    value: 'online_quiz',
    label: 'Online quiz',
    description: 'Students answer questions on the platform.',
    defaultMode: 'online',
  },
  {
    value: 'classroom_test',
    label: 'Classroom test',
    description: 'A test conducted in the physical classroom.',
    defaultMode: 'offline',
  },
  {
    value: 'online_test',
    label: 'Online test',
    description: 'A timed test completed on the platform.',
    defaultMode: 'online',
  },
  {
    value: 'midterm',
    label: 'Midterm examination',
    description: 'A midterm assessment. Online delivery is optional.',
    defaultMode: 'offline',
  },
  {
    value: 'final',
    label: 'Final examination',
    description: 'A final examination. Online delivery is optional.',
    defaultMode: 'offline',
  },
];

const questionTypes: {
  value: AssessmentQuestion['type'];
  label: string;
}[] = [
  { value: 'multiple_choice', label: 'Multiple choice' },
  { value: 'true_false', label: 'True or false' },
  { value: 'short_answer', label: 'Short answer' },
  { value: 'essay', label: 'Essay' },
  { value: 'matching', label: 'Matching' },
];

const fileTypeOptions = [
  'pdf',
  'doc',
  'docx',
  'jpg',
  'jpeg',
  'png',
  'ppt',
  'pptx',
  'xls',
  'xlsx',
];

function createQuestion(type: AssessmentQuestion['type']): QuestionDraft {
  const options =
    type === 'true_false'
      ? ['True', 'False']
      : type === 'multiple_choice'
        ? ['', '', '', '']
        : [];

  return {
    id: `question-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    prompt: '',
    marks: 5,
    options,
    correctAnswer: '',
  };
}

function formatType(type: AssessmentType) {
  return assessmentTypeOptions.find((item) => item.value === type)?.label ?? type;
}


function hasTimeOverlap(
  firstStart: string,
  firstEnd: string,
  secondStart: string,
  secondEnd: string,
) {
  if (!firstStart || !firstEnd || !secondStart || !secondEnd) return false;

  const aStart = new Date(firstStart).getTime();
  const aEnd = new Date(firstEnd).getTime();
  const bStart = new Date(secondStart).getTime();
  const bEnd = new Date(secondEnd).getTime();

  if ([aStart, aEnd, bStart, bEnd].some(Number.isNaN)) return false;

  return aStart < bEnd && bStart < aEnd;
}

export default function TeacherAssessmentBuilder() {
  const { user } = useAuth();

  const [form, setForm] = useState<FormState>(initialForm);
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [localAssessments, setLocalAssessments] =
    useState<StudentAssessment[]>(ASSESSMENT_RECORDS);
  const [formError, setFormError] = useState('');

  const selectedClass = CLASSES.find(
    (item) => item.id === form.classId,
  );

  const availableSubjects = useMemo(
    () => SUBJECTS.filter((subject) => subject.classId === form.classId),
    [form.classId],
  );

  const availableStudents = useMemo(() => {
    if (!selectedClass) return [];

    return STUDENTS.filter(
      (student) =>
        student.status === 'active' &&
        student.grade === selectedClass.grade &&
        student.class ===
          `${selectedClass.grade.replace('Grade ', '')}${selectedClass.section}`,
    );
  }, [selectedClass]);

  const totalMarks = questions.reduce(
    (total, question) => total + Math.max(0, Number(question.marks) || 0),
    0,
  );

  const isOnline = form.mode === 'online';

  const selectedStudentCount =
    form.recipientScope === 'entire_class'
      ? availableStudents.length
      : form.selectedStudentIds.length;

  const conflicts = useMemo(() => {
    if (
      !isOnline ||
      !form.classId ||
      !form.opensAt ||
      !form.closesAt
    ) {
      return [];
    }

    const recipients =
      form.recipientScope === 'entire_class'
        ? availableStudents.map((student) => student.id)
        : form.selectedStudentIds;

    return localAssessments.filter((assessment) => {
      if (
        assessment.mode !== 'online' ||
        assessment.classId !== form.classId ||
        assessment.status === 'cancelled' ||
        assessment.status === 'closed' ||
        assessment.status === 'completed'
      ) {
        return false;
      }

      const overlaps = hasTimeOverlap(
        form.opensAt,
        form.closesAt,
        assessment.schedule.opensAt ?? '',
        assessment.schedule.closesAt ??
          assessment.schedule.dueAt ??
          '',
      );

      if (!overlaps) return false;

      if (assessment.recipientScope === 'entire_class') {
        return true;
      }

      return assessment.recipients.some((recipient) =>
        recipients.includes(recipient.studentId),
      );
    });
  }, [
    isOnline,
    form.classId,
    form.opensAt,
    form.closesAt,
    form.recipientScope,
    form.selectedStudentIds,
    availableStudents,
    localAssessments,
  ]);

  function updateForm<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
    setFormError('');
  }

  function handleTypeChange(type: AssessmentType) {
    const selected = assessmentTypeOptions.find(
      (item) => item.value === type,
    );

    setForm((previous) => ({
      ...previous,
      type,
      mode: selected?.defaultMode ?? 'offline',
    }));

    setQuestions([]);
    setFormError('');
  }

  function handleClassChange(classId: string) {
    setForm((previous) => ({
      ...previous,
      classId,
      subjectId: '',
      selectedStudentIds: [],
    }));
    setFormError('');
  }

  function toggleStudent(studentId: string) {
    setForm((previous) => {
      const alreadySelected =
        previous.selectedStudentIds.includes(studentId);

      return {
        ...previous,
        selectedStudentIds: alreadySelected
          ? previous.selectedStudentIds.filter((id) => id !== studentId)
          : [...previous.selectedStudentIds, studentId],
      };
    });
  }

  function toggleAllStudents() {
    const allSelected =
      availableStudents.length > 0 &&
      form.selectedStudentIds.length === availableStudents.length;

    updateForm(
      'selectedStudentIds',
      allSelected ? [] : availableStudents.map((student) => student.id),
    );
  }

  function addQuestion(type: AssessmentQuestion['type']) {
    setQuestions((previous) => [
      ...previous,
      createQuestion(type),
    ]);
  }

  function updateQuestion(
    questionId: string,
    updates: Partial<QuestionDraft>,
  ) {
    setQuestions((previous) =>
      previous.map((question) =>
        question.id === questionId
          ? { ...question, ...updates }
          : question,
      ),
    );
  }

  function removeQuestion(questionId: string) {
    setQuestions((previous) =>
      previous.filter((question) => question.id !== questionId),
    );
  }

  function toggleFileType(fileType: string) {
    setForm((previous) => ({
      ...previous,
      acceptedFileTypes: previous.acceptedFileTypes.includes(fileType)
        ? previous.acceptedFileTypes.filter((item) => item !== fileType)
        : [...previous.acceptedFileTypes, fileType],
    }));
  }

  function validateStep(step: number) {
    if (step === 1) {
      if (!form.title.trim()) {
        setFormError('Please enter an assessment title.');
        return false;
      }

      if (!form.classId) {
        setFormError('Please select a class and section.');
        return false;
      }

      if (!form.subjectId) {
        setFormError('Please select a subject.');
        return false;
      }
    }

    if (step === 2) {
      if (
        form.recipientScope === 'selected_students' &&
        form.selectedStudentIds.length === 0
      ) {
        setFormError('Please select at least one student.');
        return false;
      }
    }

    if (step === 3) {
      if (!form.opensAt || !form.dueAt) {
        setFormError('Please enter the opening date and deadline.');
        return false;
      }

      if (new Date(form.dueAt) <= new Date(form.opensAt)) {
        setFormError('The deadline must be after the opening date.');
        return false;
      }

      if (
        form.closesAt &&
        new Date(form.closesAt) < new Date(form.dueAt)
      ) {
        setFormError('The closing time cannot be before the deadline.');
        return false;
      }

      if (isOnline && form.timeLimitMinutes < 1) {
        setFormError('The time limit must be at least one minute.');
        return false;
      }

      if (conflicts.length > 0) {
        setFormError(
          'Scheduling conflict detected. Another online assessment overlaps this schedule for the selected class or students.',
        );
        return false;
      }
    }

    if (step === 4) {
      if (isOnline && questions.length === 0) {
        setFormError('Add at least one question for an online assessment.');
        return false;
      }

      if (
        questions.some((question) => !question.prompt.trim())
      ) {
        setFormError('Every question needs a question prompt.');
        return false;
      }

      if (
        questions.some((question) => question.marks < 1)
      ) {
        setFormError('Every question must have at least one mark.');
        return false;
      }

      if (
        questions.some(
          (question) =>
            question.type === 'multiple_choice' &&
            (question.options.length < 2 ||
              question.options.some((option) => !option.trim()) ||
              !question.correctAnswer),
        )
      ) {
        setFormError(
          'Complete all multiple-choice options and select a correct answer.',
        );
        return false;
      }
    }

    setFormError('');
    return true;
  }

  function goNext() {
    if (!validateStep(currentStep)) return;
    setCurrentStep((step) => Math.min(5, step + 1));
  }

  function goBack() {
    setFormError('');
    setCurrentStep((step) => Math.max(1, step - 1));
  }

  function buildAssessment(
    status: StudentAssessment['status'],
  ): StudentAssessment {
    const assessmentId = `asm-${Date.now()}`;
    const selectedRecipients =
      form.recipientScope === 'entire_class'
        ? availableStudents
        : availableStudents.filter((student) =>
            form.selectedStudentIds.includes(student.id),
          );

    const recipients = selectedRecipients.map((student) => ({
      id: `${assessmentId}-${student.id}`,
      assessmentId,
      studentId: student.id,
      studentName: student.name,
      status: 'upcoming' as const,
      assignedAt: new Date().toISOString(),
    }));

    const questionRecords: AssessmentQuestion[] = questions.map(
      (question, index) => ({
        id: question.id,
        type: question.type,
        prompt: question.prompt,
        marks: Number(question.marks),
        order: index + 1,
        options:
          question.type === 'multiple_choice' ||
          question.type === 'true_false'
            ? question.options.map((option, optionIndex) => ({
                id: `option-${optionIndex + 1}`,
                text: option,
                isCorrect:
                  option === question.correctAnswer,
              }))
            : undefined,
        correctAnswer: question.correctAnswer || undefined,
      }),
    );

    const subject = SUBJECTS.find(
      (item) => item.id === form.subjectId,
    );

    const now = new Date().toISOString();

    return {
      id: assessmentId,
      title: form.title.trim(),
      instructions: form.instructions.trim(),
      type: form.type,
      mode: form.mode,
      subjectId: form.subjectId,
      subjectName: subject?.name ?? '',
      classId: form.classId,
      className: selectedClass?.name ?? '',
      section: selectedClass?.section ?? '',
      teacherId: user?.id ?? 'u6',
      teacherName: user?.name ?? 'Teacher',
      recipientScope: form.recipientScope,
      recipients,
      schedule: {
        opensAt: form.opensAt,
        dueAt: form.dueAt,
        closesAt: form.closesAt || form.dueAt,
        timeLimitMinutes: isOnline
          ? form.timeLimitMinutes
          : undefined,
      },
      settings: {
        attemptsAllowed: form.attemptsAllowed,
        shuffleQuestions: form.shuffleQuestions,
        shuffleOptions: form.shuffleOptions,
        allowLateSubmission: form.allowLateSubmission,
        allowResubmission: form.allowResubmission,
        allowSubmissionRemoval: true,
        showCorrectAnswers: false,
        releaseResultsAutomatically: false,
        acceptedFileTypes: form.acceptedFileTypes,
        maxFileSizeMB: form.maxFileSizeMB,
      },
      questions: questionRecords,
      resources: [],
      totalMarks,
      status,
      createdAt: now,
      updatedAt: now,
      publishedAt: status === 'published' ? now : undefined,
    };
  }

  function saveAssessment(publish: boolean) {
    if (!validateStep(1)) {
      setCurrentStep(1);
      return;
    }

    if (!validateStep(2)) {
      setCurrentStep(2);
      return;
    }

    if (!validateStep(3)) {
      setCurrentStep(3);
      return;
    }

    if (!validateStep(4)) {
      setCurrentStep(4);
      return;
    }

    const assessment = buildAssessment(
      publish ? 'published' : 'draft',
    );

    setLocalAssessments((previous) => [
      assessment,
      ...previous,
    ]);

    setSuccessMessage(
      publish
        ? 'Your assessment has been published in this frontend prototype.'
        : 'Your assessment has been saved as a draft in this frontend prototype.',
    );

    setShowSuccess(true);
    setShowPreview(false);
    setForm(initialForm);
    setQuestions([]);
    setCurrentStep(1);
  }

  const steps = [
    { number: 1, label: 'Details', icon: FileText },
    { number: 2, label: 'Recipients', icon: Users },
    { number: 3, label: 'Schedule', icon: Calendar },
    { number: 4, label: 'Questions', icon: BookOpen },
    { number: 5, label: 'Review', icon: Eye },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <GraduationCap size={16} />
            Teacher Portal
            <span>/</span>
            Assessments
          </div>
          <h1 className="text-2xl font-bold text-navy-800">
            Assessment Builder
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create assignments, quizzes and examinations for your students.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Eye size={16} />
            Preview
          </button>
          <button
            type="button"
            onClick={() => saveAssessment(false)}
            className="btn-secondary inline-flex items-center gap-2"
          >
            <Save size={16} />
            Save draft
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-5 gap-2">
          {steps.map((step) => {
            const Icon = step.icon;
            const active = currentStep === step.number;
            const completed = currentStep > step.number;

            return (
              <button
                type="button"
                key={step.number}
                onClick={() => {
                  if (step.number < currentStep) {
                    setCurrentStep(step.number);
                    setFormError('');
                  }
                }}
                className={`flex flex-col items-center gap-2 rounded-lg p-2 text-center transition ${
                  active
                    ? 'bg-navy-50 text-navy-800'
                    : completed
                      ? 'text-emerald-700'
                      : 'text-slate-400'
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    active
                      ? 'bg-navy-800 text-white'
                      : completed
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100'
                  }`}
                >
                  {completed ? <Check size={17} /> : <Icon size={17} />}
                </span>
                <span className="text-xs font-semibold sm:text-sm">
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-navy-700 transition-all"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>
      </div>

      {formError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <X size={17} className="mt-0.5 shrink-0" />
          {formError}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-navy-800">
                Assessment details
              </h2>
              <p className="text-sm text-slate-500">
                Start by describing what students will be assessed on.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="form-label">Assessment title *</label>
                <input
                  value={form.title}
                  onChange={(event) =>
                    updateForm('title', event.target.value)
                  }
                  placeholder="e.g. Algebra and Linear Equations Assignment"
                  className="input-base"
                />
              </div>

              <div className="md:col-span-2">
                <label className="form-label">Instructions</label>
                <textarea
                  value={form.instructions}
                  onChange={(event) =>
                    updateForm('instructions', event.target.value)
                  }
                  rows={4}
                  placeholder="Explain what students need to do..."
                  className="input-base"
                />
              </div>

              <div>
                <label className="form-label">Assessment type *</label>
                <select
                  value={form.type}
                  onChange={(event) =>
                    handleTypeChange(event.target.value as AssessmentType)
                  }
                  className="input-base"
                >
                  {assessmentTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  {
                    assessmentTypeOptions.find(
                      (option) => option.value === form.type,
                    )?.description
                  }
                </p>
              </div>

              <div>
                <label className="form-label">Delivery method *</label>
                <select
                  value={form.mode}
                  onChange={(event) =>
                    updateForm('mode', event.target.value as AssessmentMode)
                  }
                  className="input-base"
                >
                  <option value="offline">Offline / Classroom</option>
                  <option value="online">Online / Platform</option>
                </select>
              </div>

              <div>
                <label className="form-label">Class and section *</label>
                <select
                  value={form.classId}
                  onChange={(event) => handleClassChange(event.target.value)}
                  className="input-base"
                >
                  <option value="">Select class and section</option>
                  {CLASSES.map((schoolClass) => (
                    <option key={schoolClass.id} value={schoolClass.id}>
                      {schoolClass.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Subject *</label>
                <select
                  value={form.subjectId}
                  onChange={(event) =>
                    updateForm('subjectId', event.target.value)
                  }
                  disabled={!form.classId}
                  className="input-base disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">Select subject</option>
                  {availableSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
              <strong>Delivery flexibility:</strong> Online examinations are
              optional. You can create classroom-based assessments without
              requiring students to use the online assessment interface.
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-navy-800">
                Choose assessment recipients
              </h2>
              <p className="text-sm text-slate-500">
                Decide which students should receive this assessment.
              </p>
            </div>

            {!form.classId ? (
              <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                Select a class in the Details step first.
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      updateForm('recipientScope', 'entire_class');
                      updateForm('selectedStudentIds', []);
                    }}
                    className={`rounded-xl border p-4 text-left transition ${
                      form.recipientScope === 'entire_class'
                        ? 'border-navy-700 bg-navy-50 ring-1 ring-navy-700'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <Users className="mb-3 text-navy-700" size={23} />
                    <div className="font-semibold text-navy-800">
                      Entire class
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Assign this assessment to every active student in the
                      selected class.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateForm('recipientScope', 'selected_students')
                    }
                    className={`rounded-xl border p-4 text-left transition ${
                      form.recipientScope === 'selected_students'
                        ? 'border-navy-700 bg-navy-50 ring-1 ring-navy-700'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <GraduationCap className="mb-3 text-navy-700" size={23} />
                    <div className="font-semibold text-navy-800">
                      Selected students
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Assign to one student or a selected group.
                    </p>
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-3">
                  <div>
                    <p className="font-semibold text-navy-800">
                      {selectedClass?.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {availableStudents.length} active students in this demo
                      class
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-navy-700">
                    {selectedStudentCount} recipient(s)
                  </span>
                </div>

                {form.recipientScope === 'selected_students' && (
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 p-3">
                      <div>
                        <h3 className="font-semibold text-navy-800">
                          Select students
                        </h3>
                        <p className="text-xs text-slate-500">
                          Only selected students will receive this assessment.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={toggleAllStudents}
                        className="text-sm font-semibold text-navy-700 hover:underline"
                      >
                        {form.selectedStudentIds.length ===
                        availableStudents.length
                          ? 'Clear selection'
                          : 'Select all'}
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {availableStudents.map((student) => {
                        const checked = form.selectedStudentIds.includes(
                          student.id,
                        );

                        return (
                          <label
                            key={student.id}
                            className="flex cursor-pointer items-center gap-3 p-3 hover:bg-slate-50"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleStudent(student.id)}
                              className="h-4 w-4 rounded border-slate-300 accent-navy-700"
                            />
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-100 text-sm font-bold text-navy-700">
                              {student.name
                                .split(' ')
                                .map((part) => part[0])
                                .slice(0, 2)
                                .join('')}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block font-medium text-navy-800">
                                {student.name}
                              </span>
                              <span className="text-xs text-slate-500">
                                {student.rollNo} · {student.class}
                              </span>
                            </span>
                            {checked && (
                              <CheckCircle2
                                size={18}
                                className="text-emerald-600"
                              />
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-navy-800">
                Schedule and submission rules
              </h2>
              <p className="text-sm text-slate-500">
                Configure when students can access and complete the assessment.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="form-label">Available from *</label>
                <input
                  type="datetime-local"
                  value={form.opensAt}
                  onChange={(event) =>
                    updateForm('opensAt', event.target.value)
                  }
                  className="input-base"
                />
              </div>

              <div>
                <label className="form-label">Deadline *</label>
                <input
                  type="datetime-local"
                  value={form.dueAt}
                  onChange={(event) =>
                    updateForm('dueAt', event.target.value)
                  }
                  min={form.opensAt || undefined}
                  className="input-base"
                />
              </div>

              <div>
                <label className="form-label">
                  Closing time
                  <span className="ml-1 font-normal text-slate-400">
                    (optional)
                  </span>
                </label>
                <input
                  type="datetime-local"
                  value={form.closesAt}
                  onChange={(event) =>
                    updateForm('closesAt', event.target.value)
                  }
                  min={form.dueAt || form.opensAt || undefined}
                  className="input-base"
                />
              </div>

              {isOnline && (
                <div>
                  <label className="form-label">Time limit (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.timeLimitMinutes}
                    onChange={(event) =>
                      updateForm(
                        'timeLimitMinutes',
                        Number(event.target.value),
                      )
                    }
                    className="input-base"
                  />
                </div>
              )}

              <div>
                <label className="form-label">Attempts allowed</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={form.attemptsAllowed}
                  onChange={(event) =>
                    updateForm(
                      'attemptsAllowed',
                      Math.max(1, Number(event.target.value)),
                    )
                  }
                  className="input-base"
                />
                <p className="mt-1 text-xs text-slate-500">
                  You decide how many attempts students may make.
                </p>
              </div>

              {!isOnline && (
                <div>
                  <label className="form-label">Maximum upload size (MB)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.maxFileSizeMB}
                    onChange={(event) =>
                      updateForm(
                        'maxFileSizeMB',
                        Math.max(1, Number(event.target.value)),
                      )
                    }
                    className="input-base"
                  />
                </div>
              )}
            </div>

            <div className="space-y-4 rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-navy-800">
                Submission settings
              </h3>

              {[
                {
                  key: 'allowLateSubmission' as const,
                  label: 'Allow late submissions',
                  description:
                    'Students may submit after the deadline and their work will be marked late.',
                },
                {
                  key: 'allowResubmission' as const,
                  label: 'Allow resubmissions',
                  description:
                    'Students may submit a revised version before the permitted closing time.',
                },
              ].map((setting) => (
                <label
                  key={setting.key}
                  className="flex cursor-pointer items-start gap-3"
                >
                  <input
                    type="checkbox"
                    checked={form[setting.key]}
                    onChange={(event) =>
                      updateForm(setting.key, event.target.checked)
                    }
                    className="mt-1 h-4 w-4 accent-navy-700"
                  />
                  <span>
                    <span className="block font-medium text-navy-800">
                      {setting.label}
                    </span>
                    <span className="text-sm text-slate-500">
                      {setting.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>

            {!isOnline && (
              <div className="rounded-xl border border-slate-200 p-4">
                <h3 className="mb-3 font-semibold text-navy-800">
                  Accepted file formats
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {fileTypeOptions.map((fileType) => (
                    <label
                      key={fileType}
                      className="flex items-center gap-2 text-sm text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={form.acceptedFileTypes.includes(fileType)}
                        onChange={() => toggleFileType(fileType)}
                        className="h-4 w-4 accent-navy-700"
                      />
                      .{fileType.toUpperCase()}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {isOnline && (
              <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                <h3 className="font-semibold text-navy-800">
                  Online quiz settings
                </h3>

                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={form.shuffleQuestions}
                    onChange={(event) =>
                      updateForm('shuffleQuestions', event.target.checked)
                    }
                    className="h-4 w-4 accent-navy-700"
                  />
                  Randomize question order
                </label>

                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={form.shuffleOptions}
                    onChange={(event) =>
                      updateForm('shuffleOptions', event.target.checked)
                    }
                    className="h-4 w-4 accent-navy-700"
                  />
                  Randomize answer options
                </label>
              </div>
            )}

            {isOnline && conflicts.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <strong>Scheduling conflict detected.</strong>
                <p className="mt-1">
                  Another online assessment overlaps this schedule for the
                  selected class or one or more selected students. Change the
                  schedule or recipients before continuing.
                </p>
                <ul className="mt-2 list-inside list-disc">
                  {conflicts.map((assessment) => (
                    <li key={assessment.id}>{assessment.title}</li>
                  ))}
                </ul>
              </div>
            )}

            {isOnline && conflicts.length === 0 && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                No overlapping online assessment was found in the current
                prototype records.
              </div>
            )}
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-navy-800">
                  Assessment questions
                </h2>
                <p className="text-sm text-slate-500">
                  {isOnline
                    ? 'Build the questions students will answer online.'
                    : 'Classroom assessments can be recorded without online questions.'}
                </p>
              </div>
              <div className="rounded-lg bg-navy-50 px-4 py-2 text-sm font-semibold text-navy-800">
                Total marks: {totalMarks}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <h3 className="mb-3 font-semibold text-navy-800">
                Add a question
              </h3>
              <div className="flex flex-wrap gap-2">
                {questionTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => addQuestion(type.value)}
                    className="btn-secondary inline-flex items-center gap-2 text-sm"
                  >
                    <Plus size={15} />
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {questions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                <BookOpen className="mx-auto mb-3 text-slate-400" size={30} />
                <h3 className="font-semibold text-navy-800">
                  No questions added yet
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Add questions using the buttons above.
                </p>
                {!isOnline && (
                  <p className="mt-2 text-xs text-slate-400">
                    Questions are optional for classroom and take-home
                    assessment records in this prototype.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Question {index + 1}
                        </span>
                        <p className="font-semibold text-navy-800">
                          {questionTypes.find(
                            (item) => item.value === question.type,
                          )?.label}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeQuestion(question.id)}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                        aria-label={`Remove question ${index + 1}`}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-[1fr_130px]">
                      <div>
                        <label className="form-label">Question prompt</label>
                        <textarea
                          rows={2}
                          value={question.prompt}
                          onChange={(event) =>
                            updateQuestion(question.id, {
                              prompt: event.target.value,
                            })
                          }
                          className="input-base"
                          placeholder="Enter your question..."
                        />
                      </div>
                      <div>
                        <label className="form-label">Marks</label>
                        <input
                          type="number"
                          min="1"
                          value={question.marks}
                          onChange={(event) =>
                            updateQuestion(question.id, {
                              marks: Number(event.target.value),
                            })
                          }
                          className="input-base"
                        />
                      </div>
                    </div>

                    {(question.type === 'multiple_choice' ||
                      question.type === 'true_false') && (
                      <div className="mt-4 space-y-3">
                        <label className="form-label">
                          Answer options
                        </label>
                        {question.options.map((option, optionIndex) => (
                          <div
                            key={`${question.id}-option-${optionIndex}`}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              checked={
                                question.correctAnswer === option &&
                                option.trim() !== ''
                              }
                              onChange={() =>
                                updateQuestion(question.id, {
                                  correctAnswer: option,
                                })
                              }
                              className="h-4 w-4 accent-emerald-600"
                              aria-label={`Mark option ${optionIndex + 1} correct`}
                            />
                            <input
                              value={option}
                              disabled={question.type === 'true_false'}
                              onChange={(event) => {
                                const nextOptions = [...question.options];
                                const previousValue = nextOptions[optionIndex];
                                nextOptions[optionIndex] = event.target.value;

                                updateQuestion(question.id, {
                                  options: nextOptions,
                                  correctAnswer:
                                    question.correctAnswer === previousValue
                                      ? event.target.value
                                      : question.correctAnswer,
                                });
                              }}
                              placeholder={`Option ${optionIndex + 1}`}
                              className="input-base"
                            />
                          </div>
                        ))}
                        <p className="text-xs text-slate-500">
                          Select the circle beside the correct answer.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-navy-800">
                Review your assessment
              </h2>
              <p className="text-sm text-slate-500">
                Check the details before saving or publishing.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="rounded-full bg-navy-50 px-3 py-1 text-xs font-semibold text-navy-700">
                    {formatType(form.type)}
                  </span>
                  <h3 className="mt-3 text-xl font-bold text-navy-800">
                    {form.title || 'Untitled assessment'}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {SUBJECTS.find((item) => item.id === form.subjectId)?.name}
                    {' · '}
                    {selectedClass?.name}
                  </p>
                </div>
                <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                  {totalMarks} marks
                </span>
              </div>

              {form.instructions && (
                <p className="mt-4 whitespace-pre-wrap text-sm text-slate-600">
                  {form.instructions}
                </p>
              )}

              <div className="my-5 grid gap-4 border-y border-slate-100 py-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-400">Delivery method</p>
                  <p className="font-medium text-navy-800">
                    {form.mode === 'online' ? 'Online' : 'Offline / Classroom'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Recipients</p>
                  <p className="font-medium text-navy-800">
                    {form.recipientScope === 'entire_class'
                      ? 'Entire class'
                      : 'Selected students'}
                    {' · '}
                    {selectedStudentCount} student(s)
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Available from</p>
                  <p className="font-medium text-navy-800">
                    {form.opensAt
                      ? new Date(form.opensAt).toLocaleString()
                      : 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Deadline</p>
                  <p className="font-medium text-navy-800">
                    {form.dueAt
                      ? new Date(form.dueAt).toLocaleString()
                      : 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Attempts allowed</p>
                  <p className="font-medium text-navy-800">
                    {form.attemptsAllowed}
                  </p>
                </div>
                {isOnline && (
                  <div>
                    <p className="text-xs text-slate-400">Time limit</p>
                    <p className="font-medium text-navy-800">
                      {form.timeLimitMinutes} minutes
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-navy-800">
                  Questions ({questions.length})
                </h4>
                {questions.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">
                    No online questions have been added.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {questions.map((question, index) => (
                      <div
                        key={question.id}
                        className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 p-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-navy-800">
                            {index + 1}. {question.prompt}
                          </p>
                          <p className="text-xs text-slate-500">
                            {questionTypes.find(
                              (item) => item.value === question.type,
                            )?.label}
                          </p>
                        </div>
                        <span className="whitespace-nowrap text-sm font-semibold text-navy-700">
                          {question.marks} marks
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {conflicts.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                An online assessment scheduling conflict must be resolved
                before publishing.
              </div>
            )}
          </div>
        )}

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={goBack}
            disabled={currentStep === 1}
            className="btn-secondary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={goNext}
              className="btn-primary inline-flex items-center gap-2"
            >
              Continue
              <ArrowRight size={16} />
            </button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => saveAssessment(false)}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <Save size={16} />
                Save draft
              </button>
              <button
                type="button"
                onClick={() => saveAssessment(true)}
                disabled={conflicts.length > 0}
                className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send size={16} />
                Publish assessment
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-navy-800">
              Assessment records
            </h2>
            <p className="text-sm text-slate-500">
              Assessments currently available in this frontend session.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
            {localAssessments.length}
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {localAssessments.map((assessment) => (
            <div
              key={assessment.id}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-navy-800">
                  {assessment.title}
                </p>
                <p className="text-xs text-slate-500">
                  {assessment.subjectName} · {assessment.className} ·{' '}
                  {assessment.recipients.length} recipient(s)
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {assessment.mode === 'online' ? 'Online' : 'Offline'}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    assessment.status === 'published'
                      ? 'bg-emerald-50 text-emerald-700'
                      : assessment.status === 'draft'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-blue-50 text-blue-700'
                  }`}
                >
                  {assessment.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white p-4">
              <div>
                <h2 className="font-bold text-navy-800">
                  Student preview
                </h2>
                <p className="text-xs text-slate-500">
                  Preview of the assessment information.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close preview"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <span className="text-xs font-semibold uppercase text-slate-400">
                  {formatType(form.type)}
                </span>
                <h3 className="mt-2 text-2xl font-bold text-navy-800">
                  {form.title || 'Untitled assessment'}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {SUBJECTS.find((item) => item.id === form.subjectId)?.name ||
                    'Subject not selected'}
                  {' · '}
                  {selectedClass?.name || 'Class not selected'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 p-3">
                  <Clock size={17} className="mb-2 text-slate-500" />
                  <p className="text-xs text-slate-500">Deadline</p>
                  <p className="text-sm font-semibold text-navy-800">
                    {form.dueAt
                      ? new Date(form.dueAt).toLocaleString()
                      : 'Not set'}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <BookOpen size={17} className="mb-2 text-slate-500" />
                  <p className="text-xs text-slate-500">Total marks</p>
                  <p className="text-sm font-semibold text-navy-800">
                    {totalMarks}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-navy-800">Instructions</h4>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                  {form.instructions || 'No instructions provided.'}
                </p>
              </div>

              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex justify-between gap-3">
                      <p className="font-medium text-navy-800">
                        {index + 1}. {question.prompt || 'Question prompt'}
                      </p>
                      <span className="text-xs text-slate-500">
                        {question.marks} marks
                      </span>
                    </div>

                    {(question.type === 'multiple_choice' ||
                      question.type === 'true_false') && (
                      <div className="mt-3 space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <div
                            key={`${question.id}-preview-${optionIndex}`}
                            className="flex items-center gap-2 text-sm text-slate-600"
                          >
                            <span className="h-4 w-4 rounded-full border border-slate-300" />
                            {option || `Option ${optionIndex + 1}`}
                          </div>
                        ))}
                      </div>
                    )}

                    {(question.type === 'short_answer' ||
                      question.type === 'essay') && (
                      <div className="mt-3 min-h-20 rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-400">
                        Student response area
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {questions.length === 0 && (
                <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                  No questions have been added yet.
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 p-4 text-right">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="btn-primary"
              >
                Close preview
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl">
            <CheckCircle2
              size={42}
              className="mx-auto mb-3 text-emerald-600"
            />
            <h2 className="text-xl font-bold text-navy-800">
              Assessment saved
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {successMessage}
            </p>
            <button
              type="button"
              onClick={() => setShowSuccess(false)}
              className="btn-primary mt-5 w-full"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
