
import { useEffect, useMemo, useState } from 'react';
import {
  Bell, CheckCircle2, Clock, HeartHandshake, MessageSquare,
  Search, Send, UserRound, XCircle,
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
  closeStudentSupportNotification,
  type StudentSupportNotification,
  type StudentSupportNotificationStatus,
} from '@/data/studentSupportNotifications';

const statusLabels: Record<StudentSupportNotificationStatus, string> = {
  sent: 'Sent to student inbox',
  acknowledged: 'Acknowledged',
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
  return new Date(value).toLocaleString();
}

const DEFAULT_MESSAGE =
  'We would like you to know that your school is here to support you. We noticed that you may benefit from some additional guidance. This is not a punishment or a judgement. We would like to understand how things are going and work with you on helpful next steps.';

const DEFAULT_NEXT_STEPS =
  'You can speak privately with the school counselor or request a support meeting through your student portal.';

export function CounselorSupportNotifications() {
  const { user } = useAuth();

  const [riskRecords, setRiskRecords] = useState<StudentRiskRecord[]>(
    getStudentRiskRecords()
  );

  const [notifications, setNotifications] = useState<
    StudentSupportNotification[]
  >(getStudentSupportNotifications());

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [title, setTitle] = useState('Your school is here to support you');
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [nextSteps, setNextSteps] = useState(DEFAULT_NEXT_STEPS);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [feedback, setFeedback] = useState('');
  const [showComposer, setShowComposer] = useState(false);

  function refreshData() {
    setRiskRecords(getStudentRiskRecords());
    setNotifications(getStudentSupportNotifications());
  }

  useEffect(() => {
    const refresh = () => refreshData();

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

  const eligibleStudents = useMemo(
    () => riskRecords.filter((record) => record.level !== 'fine'),
    [riskRecords]
  );

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const matchesSearch = `${notification.studentName} ${notification.studentId} ${notification.title}`
        .toLowerCase()
        .includes(query.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || notification.status === statusFilter;

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
    setFeedback('');
  }

  function sendNotification() {
    if (!selectedStudentId) {
      setFeedback('Please select a student from the reviewed support register.');
      return;
    }

    try {
      createStudentSupportNotification({
        studentId: selectedStudentId,
        title,
        message,
        nextSteps,
        createdBy: user?.id ?? 'u7',
      });

      refreshData();
      resetComposer();
      setShowComposer(false);
      setFeedback('Support notification saved to the student inbox successfully.');
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : 'The notification could not be created.'
      );
    }
  }

  function markFollowUp(notification: StudentSupportNotification) {
    const updated = getStudentSupportNotifications().map((item) =>
      item.id === notification.id
        ? { ...item, status: 'follow_up' as const }
        : item
    );

    localStorage.setItem(
      'innosysedu.student-support-notifications.v1',
      JSON.stringify(updated)
    );

    window.dispatchEvent(
      new CustomEvent('innosysedu:student-support-notifications-updated')
    );

    refreshData();
    setFeedback(`Follow-up recorded for ${notification.studentName}.`);
  }

  function closeNotification(notification: StudentSupportNotification) {
    closeStudentSupportNotification(notification.id);
    refreshData();
    setFeedback(`Notification closed for ${notification.studentName}.`);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Student Support Notifications"
        subtitle="Send private, supportive messages to students after counselor review and track their responses."
      />

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
        <HeartHandshake className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />

        <p className="text-sm text-amber-900">
          Notifications must be supportive and respectful. Students are never
          shown internal risk levels, confidential counselor notes or
          investigation details.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Sent"
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
          color="info"
        />
      </div>

      <SectionCard
        title="Student communication"
        action={
          <button
            className="btn-primary"
            onClick={() => {
              setFeedback('');
              setShowComposer((current) => !current);
            }}
          >
            <MessageSquare className="inline w-4 h-4 mr-2" />
            {showComposer ? 'Close composer' : 'Create notification'}
          </button>
        }
      >
        {showComposer && (
          <div className="space-y-4 mb-6 border border-navy-100 rounded-xl p-4">
            <div>
              <label className="label">Select reviewed student</label>
              <select
                className="input"
                value={selectedStudentId}
                onChange={(event) => setSelectedStudentId(event.target.value)}
              >
                <option value="">Choose a student</option>
                {eligibleStudents.map((student) => (
                  <option
                    key={student.studentId}
                    value={student.studentId}
                  >
                    {student.studentName} · {student.className} ·{' '}
                    {student.level === 'at_risk' ? 'At risk' : 'Moderate support'}
                  </option>
                ))}
              </select>

              <p className="text-xs text-navy-400 mt-1">
                Only students already reviewed and recorded in the counselor
                support register appear here.
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
                  Internal assessment is visible to authorized counselor
                  users only. It will not be included in the student message.
                </p>
              </div>
            )}

            <div>
              <label className="label">Notification title</label>
              <input
                className="input"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={100}
              />
            </div>

            <div>
              <label className="label">Support message</label>
              <textarea
                className="input min-h-36"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={5}
                maxLength={1500}
              />
              <p className="text-xs text-navy-400 mt-1">
                Keep the language kind, clear and non-judgmental.
              </p>
            </div>

            <div>
              <label className="label">Suggested next steps</label>
              <textarea
                className="input min-h-24"
                value={nextSteps}
                onChange={(event) => setNextSteps(event.target.value)}
                rows={3}
                maxLength={800}
              />
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-sm font-semibold text-emerald-900">
                Student message preview
              </p>
              <p className="text-sm text-emerald-900 mt-2">{message}</p>
              {nextSteps && (
                <p className="text-sm text-emerald-800 mt-2">
                <strong>Next steps:</strong> {nextSteps}
              </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                className="btn-primary"
                onClick={sendNotification}
                disabled={!selectedStudentId || !title.trim() || !message.trim()}
              >
                <Send className="inline w-4 h-4 mr-2" />
                Saved to student inbox
              </button>

              <button
                className="btn-secondary"
                onClick={() => {
                  resetComposer();
                  setShowComposer(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {feedback && (
          <p role="status" className="text-sm text-emerald-700 mb-4">
            {feedback}
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
            />
          </div>

          <select
            className="input sm:max-w-56"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="sent">Sent</option>
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
                      {notification.studentName} · {notification.studentId} ·{' '}
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

                <p className="text-sm text-navy-700">
                  {notification.message}
                </p>

                {notification.nextSteps && (
                  <div className="rounded-lg bg-navy-50 p-3">
                    <p className="text-xs font-semibold text-navy-500 uppercase">
                      Suggested next steps
                    </p>
                    <p className="text-sm text-navy-700 mt-1">
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
        Frontend demonstration: saving a notification adds it to the local
        student inbox data. It does not send email, SMS or a real-time push
        notification. Student acknowledgement will be connected when the
        Student Portal notification page is implemented.
      </p>
    </div>
  );
}