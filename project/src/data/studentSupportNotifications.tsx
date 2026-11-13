
import { getStudentRiskRecords } from '@/data/counselorWorkflow';

export type StudentSupportNotificationStatus =
  | 'sent'
  | 'acknowledged'
  | 'follow_up'
  | 'closed';

export interface StudentSupportNotification {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  title: string;
  message: string;
  nextSteps: string;
  status: StudentSupportNotificationStatus;
  createdAt: string;
  createdBy: string;
  acknowledgedAt?: string;
  closedAt?: string;
}

const STORAGE_KEY = 'innosysedu.student-support-notifications.v1';

const now = () => new Date().toISOString();

function makeId() {
  const randomId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  return `support-notification-${randomId}`;
}

function readNotifications(): StudentSupportNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StudentSupportNotification[]) : [];
  } catch {
    return [];
  }
}

function saveNotifications(records: StudentSupportNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));

  window.dispatchEvent(
    new CustomEvent('innosysedu:student-support-notifications-updated')
  );
}

export function getStudentSupportNotifications() {
  return readNotifications();
}

export function getStudentSupportNotificationsForStudent(studentId: string) {
  return readNotifications().filter(
    (notification) => notification.studentId === studentId
  );
}

export function createStudentSupportNotification(input: {
  studentId: string;
  title: string;
  message: string;
  nextSteps: string;
  createdBy: string;
}) {
  const studentRisk = getStudentRiskRecords().find(
    (record) => record.studentId === input.studentId
  );

  if (!studentRisk) {
    throw new Error(
      'A counselor-reviewed support record is required before notifying a student.'
    );
  }

  if (studentRisk.level === 'fine') {
    throw new Error(
      'A support notification cannot be created for a student marked as fine.'
    );
  }

  if (!input.title.trim() || !input.message.trim()) {
    throw new Error('Please provide a notification title and message.');
  }

  const notification: StudentSupportNotification = {
    id: makeId(),
    studentId: studentRisk.studentId,
    studentName: studentRisk.studentName,
    className: studentRisk.className,
    title: input.title.trim(),
    message: input.message.trim(),
    nextSteps: input.nextSteps.trim(),
    status: 'sent',
    createdAt: now(),
    createdBy: input.createdBy,
  };

  saveNotifications([notification, ...readNotifications()]);

  return notification;
}

export function updateStudentSupportNotification(
  id: string,
  changes: Partial<StudentSupportNotification>
) {
  const updated = readNotifications().map((notification) =>
    notification.id === id
      ? { ...notification, ...changes, id }
      : notification
  );

  saveNotifications(updated);

  return updated.find((notification) => notification.id === id);
}

export function acknowledgeStudentSupportNotification(
  id: string
) {
  return updateStudentSupportNotification(id, {
    status: 'acknowledged',
    acknowledgedAt: now(),
  });
}

export function closeStudentSupportNotification(id: string) {
  return updateStudentSupportNotification(id, {
    status: 'closed',
    closedAt: now(),
  });
}
