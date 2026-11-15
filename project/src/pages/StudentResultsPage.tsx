
import { useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  ClipboardList,
  LockKeyhole,
  CheckCircle2,
  Clock3,
} from 'lucide-react';

import {
  PageHeader,
  SectionCard,
  StatCard,
  EmptyState,
} from '@/components/ui';

import { useAuth } from '@/context/AuthContext';
import { GRADES, STUDENTS } from '@/data/mockData';
import type { GradeEntry } from '@/types';

const DEMO_STUDENT_LINKS: Record<string, string> = {
  u11: 's1',
};

type ResultFilter = 'all' | 'released' | 'pending';

function getStudentId(user?: { id: string; name: string } | null) {
  if (!user) return undefined;

  return (
    DEMO_STUDENT_LINKS[user.id] ??
    STUDENTS.find((student) => student.name === user.name)?.id
  );
}

function getStatusLabel(status: GradeEntry['status']) {
  switch (status) {
    case 'released':
      return 'Released';
    case 'approved':
      return 'Approved';
    case 'submitted':
      return 'Under Review';
    default:
      return 'Processing';
  }
}

function getStatusClass(status: GradeEntry['status']) {
  if (status === 'released') return 'badge-success';
  if (status === 'approved') return 'badge-info';
  return 'badge-warning';
}

export function StudentResultsPage() {
  const { user } = useAuth();

  const studentId = getStudentId(user);
  const student = STUDENTS.find(
    (item) => item.id === studentId && item.status === 'active'
  );

  const [subjectFilter, setSubjectFilter] = useState('all');
  const [assessmentFilter, setAssessmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<ResultFilter>('all');

  const myResults = useMemo(() => {
    if (!studentId) return [];

    return GRADES
      .filter((grade) => grade.studentId === studentId)
      .sort((a, b) => a.assessmentTitle.localeCompare(b.assessmentTitle));
  }, [studentId]);

  const subjects = useMemo(
    () => [...new Set(myResults.map((result) => result.subjectName))].sort(),
    [myResults]
  );

  const assessments = useMemo(() => {
    const filtered = subjectFilter === 'all'
      ? myResults
      : myResults.filter((result) => result.subjectName === subjectFilter);

    return [...new Set(filtered.map((result) => result.assessmentTitle))].sort();
  }, [myResults, subjectFilter]);

  const filteredResults = myResults.filter((result) => {
    const matchesSubject =
      subjectFilter === 'all' || result.subjectName === subjectFilter;

    const matchesAssessment =
      assessmentFilter === 'all' ||
      result.assessmentTitle === assessmentFilter;

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'released' && result.status === 'released') ||
      (statusFilter === 'pending' && result.status !== 'released');

    return matchesSubject && matchesAssessment && matchesStatus;
  });

  const releasedResults = myResults.filter(
    (result) => result.status === 'released'
  );

  const pendingCount = myResults.length - releasedResults.length;

  const average = releasedResults.length > 0
    ? (
        releasedResults.reduce(
          (sum, result) => sum + (result.score / result.totalMarks) * 100,
          0
        ) / releasedResults.length
      ).toFixed(1)
    : '—';

  const handleSubjectChange = (value: string) => {
    setSubjectFilter(value);
    setAssessmentFilter('all');
  };

  if (!student) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="My Results"
          subtitle="View your officially released academic results."
        />

        <SectionCard title="Student account link required">
          <p className="text-sm text-navy-600">
            Your account is not linked to an active student record.
            Please contact your school Registrar.
          </p>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="My Results"
        subtitle={`Academic results for ${student.name}. Only officially released marks are displayed.`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Released Results"
          value={releasedResults.length}
          icon={<Award className="w-5 h-5" />}
          color="success"
        />

        <StatCard
          label="Processing Results"
          value={pendingCount}
          icon={<Clock3 className="w-5 h-5" />}
          color="warning"
        />

        <StatCard
          label="Released Average"
          value={average === '—' ? average : `${average}%`}
          icon={<BookOpen className="w-5 h-5" />}
          color="navy"
        />
      </div>

      <SectionCard title="Filter My Results">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="label" htmlFor="result-subject">
              Subject
            </label>
            <select
              id="result-subject"
              className="input"
              value={subjectFilter}
              onChange={(event) => handleSubjectChange(event.target.value)}
            >
              <option value="all">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="label" htmlFor="result-assessment">
              Assessment
            </label>
            <select
              id="result-assessment"
              className="input"
              value={assessmentFilter}
              onChange={(event) => setAssessmentFilter(event.target.value)}
            >
              <option value="all">All Assessments</option>
              {assessments.map((assessment) => (
                <option key={assessment} value={assessment}>
                  {assessment}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="label" htmlFor="result-status">
              Result Status
            </label>
            <select
              id="result-status"
              className="input"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as ResultFilter)
              }
            >
              <option value="all">All Statuses</option>
              <option value="released">Released</option>
              <option value="pending">Not Yet Released</option>
            </select>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Assessment Results">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-navy-500">
            {filteredResults.length} result(s) found
          </p>

          <button
            type="button"
            className="text-sm font-medium text-primary-600 hover:underline"
            onClick={() => {
              setSubjectFilter('all');
              setAssessmentFilter('all');
              setStatusFilter('all');
            }}
          >
            Clear filters
          </button>
        </div>

        {filteredResults.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="w-8 h-8" />}
            title="No results found"
            message="There are no results matching your selected filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Assessment</th>
                  <th>Subject</th>
                  <th>Score</th>
                  <th>Total Marks</th>
                  <th>Grade</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredResults.map((result) => {
                  const isReleased = result.status === 'released';

                  return (
                    <tr key={result.id}>
                      <td className="font-medium text-navy-800">
                        {result.assessmentTitle}
                      </td>

                      <td>{result.subjectName}</td>

                      <td className="font-semibold">
                        {isReleased ? result.score : '—'}
                      </td>

                      <td>
                        {isReleased ? result.totalMarks : '—'}
                      </td>

                      <td>
                        {isReleased ? (
                          <span
                            className={
                              result.grade.startsWith('A')
                                ? 'badge-success'
                                : result.grade.startsWith('B')
                                  ? 'badge-info'
                                  : 'badge-warning'
                            }
                          >
                            {result.grade}
                          </span>
                        ) : (
                          <span className="text-navy-300">—</span>
                        )}
                      </td>

                      <td>
                        <span className={getStatusClass(result.status)}>
                          {isReleased ? (
                            <CheckCircle2 className="inline w-3 h-3 mr-1" />
                          ) : (
                            <LockKeyhole className="inline w-3 h-3 mr-1" />
                          )}
                          {getStatusLabel(result.status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <div className="flex items-start gap-3 rounded-lg border border-navy-100 bg-navy-50 p-4">
        <LockKeyhole className="w-5 h-5 text-navy-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-navy-800">
            Your results are protected
          </p>
          <p className="text-xs text-navy-500 mt-1">
            Marks and grades remain hidden until the school officially
            releases them. Contact your teacher if you have a question
            about an assessment result.
          </p>
        </div>
      </div>
    </div>
  );
}
