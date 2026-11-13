
import { useEffect, useMemo, useState } from 'react';

import {
  Bell,
  CheckCircle2,
  Clock,
  HeartHandshake,
  MessageSquare,
  Search,
  Send,
  UserRound,
  XCircle,
} from 'lucide-react';

import {
  PageHeader,
  SectionCard,
  StatCard,
  EmptyState,
} from '@/components/ui';

import { useAuth } from '@/context/AuthContext';

import {
  getStudentRiskRecords,
  type StudentRiskRecord,
} from '@/data/counselorWorkflow';

import {
  createStudentSupportNotification,
  getStudentSupportNotifications,
  markStudentSupportFollowUp,
  closeStudentSupportNotification,
  type StudentSupportNotification,
  type StudentSupportNotificationStatus,
} from '@/data/studentSupportNotifications';

const statusLabels: Record<
  StudentSupportNotificationStatus,
  string
> = {
  sent: 'Saved to student inbox',
  acknowledged: 'Acknowledged by student',
  follow_up: 'Follow-up required',
  closed: 'Closed',
};

function statusClass(status: StudentSupportNotificationStatus) {
  if (status === 'sent') return 'badge-info';

  if (status === 'acknowledged') return 'badge-success';

  if (status === 'follow_up') return 'badge-warning';

  return 'badge-neutral';
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return date.toLocaleString();
}

const DEFAULT_MESSAGE =
  'We would like you to know that your school is here to support you. We noticed that you may benefit from some additional guidance. This is not a punishment or a judgement. We would like to understand how things are going and work with you on helpful next steps.';

const DEFAULT_NEXT_STEPS =
  'You can speak privately with the school counselor or request a support meeting through your student portal.';

type Feedback = {
  type: 'success' | 'error';
  message: string;
};

export function CounselorSupportNotifications() {
  const { user } = useAuth();

  const [riskRecords, setRiskRecords] = useState<
    StudentRiskRecord[]
  >(getStudentRiskRecords());

  const [notifications, setNotifications] = useState<
    StudentSupportNotification[]
  >(getStudentSupportNotifications());

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [title, setTitle] = useState(
    'Your school is here to support you'
  );
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [nextSteps, setNextSteps] = useState(DEFAULT_NEXT_STEPS);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showComposer, setShowComposer] = useState(false);

  function refreshData() {
    setRiskRecords(getStudentRiskRecords());
    setNotifications(getStudentSupportNotifications());
  }

  useEffect(() => {
    const refresh = () => {
      refreshData();
    };

    window.addEventListener(
      'innosysedu:counselor-risks-updated',
      refresh
    );

    window.addEventListener(
      'innosysedu:student-support-notifications-updated',
      refresh
    );

    window.addEventListener('storage', refresh);

    return () => {
      window.removeEventListener(
        'innosysedu:counselor-risks-updated',
        refresh
      );

      window.removeEventListener(
        'innosysedu:student-support-notifications-updated',
        refresh
      );

      window.removeEventListener('storage', refresh);
    };
  }, []);

  // Only reviewed students who still need support are eligible.
  const eligibleStudents = useMemo(
    () =>
      riskRecords.filter(
        (record) =>
          record.level !== 'fine' &&
          Boolean(record.reviewedAt) &&
          Boolean(record.reviewedBy)
      ),
    [riskRecords]
  );

  const filteredNotifications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return notifications.filter((notification) => {
      const searchableText = [
        notification.studentName,
        notification.studentId,
        notification.title,
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        searchableText.includes(normalizedQuery);

      const matchesStatus =
        statusFilter === 'all' ||
        notification.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [notifications, query, statusFilter]);

  const sentCount = notifications.filter(
    (item) => item.status === 'sent'
  ).length;

  const acknowledgedCount = notifications.filter(
    (item) => item.status === 'acknowledged'
  ).length;

  const followUpCount = notifications.filter(
    (item) => item.status === 'follow_up'
  ).length;

  const selectedStudent = eligibleStudents.find(
    (student) => student.studentId === selectedStudentId
  );

  function resetComposer() {
    setSelectedStudentId('');
    setTitle('Your school is here to support you');
    setMessage(DEFAULT_MESSAGE);
    setNextSteps(DEFAULT_NEXT_STEPS);
  }

  function sendNotification() {
    if (!selectedStudentId) {
      setFeedback({
        type: 'error',
        message:
          'Please select a student from the reviewed support register.',
      });
      return;
    }

    if (!title.trim() || !message.trim()) {
      setFeedback({
        type: 'error',
        message: 'Please provide a notification title and support message.',
      });
      return;
    }

    try {
      createStudentSupportNotification({
        studentId: selectedStudentId,
        title,
        message,
        nextSteps,
        createdBy: user?.id ?? '',
      });

      refreshData();
      resetComposer();
      setShowComposer(false);

      setFeedback({
        type: 'success',
        message:
          'Support notification saved successfully. It will appear in the student inbox when that portal is connected.',
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'The notification could not be created.',
      });
    }
  }

  function markFollowUp(
    notification: StudentSupportNotification
  ) {
    try {
      markStudentSupportFollowUp(notification.id);

      refreshData();

      setFeedback({
        type: 'success',
        message: `Follow-up recorded for ${notification.studentName}.`,
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'The follow-up status could not be updated.',
      });
    }
  }

  function closeNotification(
    notification: StudentSupportNotification
  ) {
    const confirmed = window.confirm(
      `Are you sure you want to close the support notification for ${notification.studentName}?`
    );

    if (!confirmed) return;

    try {
      closeStudentSupportNotification(notification.id);

      refreshData();

      setFeedback({
        type: 'success',
        message: `Notification closed for ${notification.studentName}.`,
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'The notification could not be closed.',
      });
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Student Support Notifications"
        subtitle="Prepare private, supportive messages for students after counselor review and monitor their responses."
      />

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
        <HeartHandshake className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />

        <p className="text-sm text-amber-900">
          Notifications must be supportive and respectful. Students
          must never be shown internal risk levels, confidential
          counselor notes or investigation details.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Saved to Inbox"
          value={sentCount}
          icon={<Send className="w-5 h-5" />}
          color="navy"
        />

        <StatCard
          label="Acknowledged"
          value={acknowledgedCount}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="success"
        />

        <StatCard
          label="Follow-up Required"
          value={followUpCount}
          icon={<Clock className="w-5 h-5" />}
          color="warning"
        />

        <StatCard
          label="Eligible Students"
          value={eligibleStudents.length}
          icon={<UserRound className="w-5 h-5" />}
          color="accent"
        />
      </div>

      <SectionCard
        title="Student communication"
        action={
          <button
            className="btn-primary"
            onClick={() => {
              setFeedback(null);
              setShowComposer((current) => !current);
            }}
          >
            <MessageSquare className="inline w-4 h-4 mr-2" />

            {showComposer
              ? 'Close composer'
              : 'Create notification'}
          </button>
        }
      >
        {showComposer && (
          <div className="space-y-4 mb-6 border border-navy-100 rounded-xl p-4">
            <div>
              <label
                className="label"
                htmlFor="support-student"
              >
                Select reviewed student
              </label>

              <select
                id="support-student"
                className="input"
                value={selectedStudentId}
                onChange={(event) =>
                  setSelectedStudentId(event.target.value)
                }
              >
                <option value="">Choose a student</option>

                {eligibleStudents.map((student) => (
                  <option
                    key={student.studentId}
                    value={student.studentId}
                  >
                    {student.studentName} · {student.className} ·{' '}
                    {student.level === 'at_risk'
                      ? 'At risk'
                      : 'Moderate support'}
                  </option>
                ))}
              </select>

              <p className="text-xs text-navy-400 mt-1">
                Only students with a counselor-reviewed support
                record appear here.
              </p>
            </div>

            {selectedStudent && (
              <div className="rounded-lg bg-navy-50 p-3 text-sm">
                <p className="font-semibold text-navy-800">
                  {selectedStudent.studentName}
                </p>

                <p className="text-navy-500">
                  {selectedStudent.className} · Internal assessment:{' '}
                  {selectedStudent.level === 'at_risk'
                    ? 'At risk'
                    : 'Moderate support'}
                </p>

                <p className="text-xs text-navy-500 mt-2">
                  This internal assessment is visible only to
                  authorized counselor users. It will not be
                  included in the student-facing message.
                </p>
              </div>
            )}

            <div>
              <label
                className="label"
                htmlFor="support-title"
              >
                Notification title
              </label>

              <input
                id="support-title"
                className="input"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={100}
              />

              <p className="text-xs text-navy-400 mt-1">
                {title.length}/100 characters
              </p>
            </div>

            <div>
              <label
                className="label"
                htmlFor="support-message"
              >
                Support message
              </label>

              <textarea
                id="support-message"
                className="input min-h-36"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={5}
                maxLength={1500}
              />

              <p className="text-xs text-navy-400 mt-1">
                {message.length}/1500 characters. Keep the language
                kind, clear and non-judgmental.
              </p>
            </div>

            <div>
              <label
                className="label"
                htmlFor="support-next-steps"
              >
                Suggested next steps
              </label>

              <textarea
                id="support-next-steps"
                className="input min-h-24"
                value={nextSteps}
                onChange={(event) => setNextSteps(event.target.value)}
                rows={3}
                maxLength={800}
              />

              <p className="text-xs text-navy-400 mt-1">
                {nextSteps.length}/800 characters
              </p>
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-sm font-semibold text-emerald-900">
                Student message preview
              </p>

              <p className="text-sm text-emerald-900 mt-2 whitespace-pre-wrap">
                {message}
              </p>

              {nextSteps && (
                <p className="text-sm text-emerald-800 mt-3 whitespace-pre-wrap">
                  <strong>Next steps:</strong> {nextSteps}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                className="btn-primary"
                onClick={sendNotification}
                disabled={
                  !selectedStudentId ||
                  !title.trim() ||
                  !message.trim()
                }
              >
                <Send className="inline w-4 h-4 mr-2" />
                Save to student inbox
              </button>

              <button
                className="btn-secondary"
                onClick={() => {
                  resetComposer();
                  setShowComposer(false);
                  setFeedback(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {feedback && (
          <p
            role="status"
            aria-live="polite"
            className={`text-sm mb-4 ${
              feedback.type === 'success'
                ? 'text-emerald-700'
                : 'text-rose-700'
            }`}
          >
            {feedback.message}
          </p>
        )}

        {!showComposer && eligibleStudents.length === 0 && (
          <EmptyState
            icon={<UserRound className="w-6 h-6" />}
            title="No reviewed students available"
            message="Review a student and add them to the counselor support register before preparing a notification."
          />
        )}
      </SectionCard>

      <SectionCard title="Notification history">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-navy-400" />

            <input
              className="input pl-9"
              placeholder="Search student or notification..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search notification history"
            />
          </div>

          <select
            className="input sm:max-w-56"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter notifications by status"
          >
            <option value="all">All statuses</option>
            <option value="sent">Saved to inbox</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="follow_up">Follow-up required</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className="rounded-xl border border-navy-100 p-4 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-navy-900">
                      {notification.title}
                    </h3>

                    <p className="text-sm text-navy-500 mt-1">
                      {notification.studentName} ·{' '}
                      {notification.studentId} ·{' '}
                      {notification.className}
                    </p>

                    <p className="text-xs text-navy-400 mt-1">
                      Created {formatDate(notification.createdAt)}
                    </p>
                  </div>

                  <span className={statusClass(notification.status)}>
                    {statusLabels[notification.status]}
                  </span>
                </div>

                <p className="text-sm text-navy-700 whitespace-pre-wrap">
                  {notification.message}
                </p>

                {notification.nextSteps && (
                  <div className="rounded-lg bg-navy-50 p-3">
                    <p className="text-xs font-semibold text-navy-500 uppercase">
                      Suggested next steps
                    </p>

                    <p className="text-sm text-navy-700 mt-1 whitespace-pre-wrap">
                      {notification.nextSteps}
                    </p>
                  </div>
                )}

                {notification.status === 'sent' && (
                  <button
                    className="btn-secondary text-sm"
                    onClick={() => markFollowUp(notification)}
                  >
                    <Clock className="inline w-4 h-4 mr-1" />
                    Mark follow-up required
                  </button>
                )}

                {notification.status !== 'closed' && (
                  <button
                    className="btn-ghost text-sm text-rose-700"
                    onClick={() => closeNotification(notification)}
                  >
                    <XCircle className="inline w-4 h-4 mr-1" />
                    Close notification
                  </button>
                )}

                {notification.status === 'acknowledged' && (
                  <p className="text-xs text-emerald-700">
                    Acknowledged on{' '}
                    {notification.acknowledgedAt
                      ? formatDate(notification.acknowledgedAt)
                      : 'date unavailable'}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Bell className="w-6 h-6" />}
            title="No notifications found"
            message="Notifications you create will appear here."
          />
        )}
      </SectionCard>

      <p className="text-xs text-navy-400">
        Frontend demonstration: notifications are saved in browser
        storage for the future Student Portal inbox. No email, SMS
        or push notification is sent. Student acknowledgement will
        be available when the Student Portal is connected.
      </p>
    </div>
  );
}
