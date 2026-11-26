
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

function getCurrentTimestamp() {
  return new Date().toISOString();
}

function createId() {
  const randomId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  return `support-notification-${randomId}`;
}

function readNotifications(): StudentSupportNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed as StudentSupportNotification[];
  } catch {
    return [];
  }
}

function saveNotifications(
  notifications: StudentSupportNotification[]
) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));

  window.dispatchEvent(
    new CustomEvent('innosysedu:student-support-notifications-updated')
  );
}

export function getStudentSupportNotifications() {
  return readNotifications();
}

export function getStudentSupportNotificationsForStudent(
  studentId: string
) {
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
  const title = input.title.trim();
  const message = input.message.trim();
  const nextSteps = input.nextSteps.trim();

  if (!input.studentId) {
    throw new Error('Please select a student.');
  }

  if (!title) {
    throw new Error('Please enter a notification title.');
  }

  if (!message) {
    throw new Error('Please enter a support message.');
  }

  if (title.length > 100) {
    throw new Error('The notification title cannot exceed 100 characters.');
  }

  if (message.length > 1500) {
    throw new Error('The support message cannot exceed 1,500 characters.');
  }

  if (nextSteps.length > 800) {
    throw new Error('Suggested next steps cannot exceed 800 characters.');
  }

  if (!input.createdBy) {
    throw new Error('The counselor account could not be identified.');
  }

  // A notification can only be created after a counselor has
  // reviewed and recorded the student's support status.
  const reviewedRecord = getStudentRiskRecords().find(
    (record) => record.studentId === input.studentId
  );

  if (!reviewedRecord) {
    throw new Error(
      'A counselor-reviewed support record is required before notifying a student.'
    );
  }

  if (
    !reviewedRecord.reviewedAt ||
    !reviewedRecord.reviewedBy
  ) {
    throw new Error(
      'The student support record must be reviewed by an authorized counselor first.'
    );
  }

  if (reviewedRecord.level === 'fine') {
    throw new Error(
      'A support notification cannot be created for a student currently marked as fine.'
    );
  }

  const notification: StudentSupportNotification = {
    id: createId(),
    studentId: reviewedRecord.studentId,
    studentName: reviewedRecord.studentName,
    className: reviewedRecord.className,
    title,
    message,
    nextSteps,
    status: 'sent',
    createdAt: getCurrentTimestamp(),
    createdBy: input.createdBy,
  };

  saveNotifications([
    notification,
    ...readNotifications(),
  ]);

  return notification;
}

export function updateStudentSupportNotification(
  id: string,
  changes: Partial<StudentSupportNotification>
) {
  const current = readNotifications();

  const exists = current.some(
    (notification) => notification.id === id
  );

  if (!exists) {
    throw new Error('The selected notification could not be found.');
  }

  const updated = current.map((notification) => {
    if (notification.id !== id) return notification;

    return {
      ...notification,
      ...changes,
      id: notification.id,
      studentId: notification.studentId,
      studentName: notification.studentName,
      className: notification.className,
      createdAt: notification.createdAt,
      createdBy: notification.createdBy,
    };
  });

  saveNotifications(updated);

  return updated.find(
    (notification) => notification.id === id
  );
}

export function markStudentSupportFollowUp(id: string) {
  const notification = readNotifications().find(
    (item) => item.id === id
  );

  if (!notification) {
    throw new Error('The selected notification could not be found.');
  }

  if (notification.status === 'closed') {
    throw new Error('A closed notification cannot be reopened for follow-up.');
  }

  if (notification.status === 'acknowledged') {
    throw new Error(
      'This notification has already been acknowledged by the student.'
    );
  }

  return updateStudentSupportNotification(id, {
    status: 'follow_up',
  });
}

export function acknowledgeStudentSupportNotification(id: string) {
  const notification = readNotifications().find(
    (item) => item.id === id
  );

  if (!notification) {
    throw new Error('The selected notification could not be found.');
  }

  if (notification.status === 'closed') {
    throw new Error('This notification is already closed.');
  }

  return updateStudentSupportNotification(id, {
    status: 'acknowledged',
    acknowledgedAt: getCurrentTimestamp(),
  });
}

export function closeStudentSupportNotification(id: string) {
  const notification = readNotifications().find(
    (item) => item.id === id
  );

  if (!notification) {
    throw new Error('The selected notification could not be found.');
  }

  return updateStudentSupportNotification(id, {
    status: 'closed',
    closedAt: getCurrentTimestamp(),
  });
}
