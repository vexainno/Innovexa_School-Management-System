import { COUNSELING_CASES, STUDENTS } from '@/data/mockData';

export type SupportCaseCategory = 'academic' | 'behavioral' | 'social' | 'family' | 'other';
export type SupportCaseStatus = 'open' | 'in_progress' | 'follow_up' | 'closed';
export type StudentRiskLevel = 'at_risk' | 'moderate' | 'fine';
export type InterventionStatus = 'ongoing' | 'improving' | 'done' | 'denied';
export type AppointmentStatus = 'pending' | 'scheduled' | 'denied';

export interface CounselorSupportCase {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  category: SupportCaseCategory;
  status: SupportCaseStatus;
  dateOpened: string;
  lastSession?: string;
  confidential: boolean;
  summary: string;
  createdBy: string;
  updatedAt: string;
}

export interface StudentRiskRecord {
  studentId: string;
  studentName: string;
  className: string;
  level: StudentRiskLevel;
  reason: string;
  reviewedAt: string;
  reviewedBy: string;
}

export interface CounselingIntervention {
  id: string;
  studentId: string;
  studentName: string;
  type: string;
  description: string;
  status: InterventionStatus;
  startDate: string;
  updatedAt: string;
  counselorId: string;
}

export interface CounselorAvailabilitySlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  active: boolean;
}

export interface CounselingAppointment {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  requestType: string;
  studentMessage: string;
  requestedAt: string;
  preferredDate?: string;
  preferredTime?: string;
  status: AppointmentStatus;
  scheduledDate?: string;
  scheduledTime?: string;
  counselorNote?: string;
  updatedAt: string;
}

const KEYS = {
  cases: 'innosysedu.counselor.cases.v1',
  risks: 'innosysedu.counselor.risks.v1',
  interventions: 'innosysedu.counselor.interventions.v1',
  availability: 'innosysedu.counselor.availability.v1',
  appointments: 'innosysedu.counselor.appointments.v1',
} as const;

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();

function makeId(prefix: string) {
  const randomPart = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  return `${prefix}-${randomPart}`;
}

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStored<T>(key: string, value: T, eventName: string) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(eventName));
}

function studentDetails(studentId: string) {
  const student = STUDENTS.find((item) => item.id === studentId);
  if (!student) return undefined;
  return {
    studentId: student.id,
    studentName: student.name,
    className: `Grade ${student.class}`,
  };
}

const initialCases: CounselorSupportCase[] = COUNSELING_CASES.map((item) => ({
  id: item.id,
  studentId: item.studentId,
  studentName: item.studentName,
  className: item.class,
  category: item.category,
  status: item.status,
  dateOpened: item.dateOpened,
  lastSession: item.lastSession,
  confidential: item.confidential,
  summary: item.notes,
  createdBy: 'u7',
  updatedAt: now(),
}));

const initialRisks: StudentRiskRecord[] = [
  { studentId: 's5', studentName: 'Augustine T. Kollie', className: 'Grade 10A', level: 'moderate', reason: 'Behavioral concerns', reviewedAt: '2026-09-20', reviewedBy: 'u7' },
  { studentId: 's7', studentName: 'Daniel S. Tuah', className: 'Grade 9A', level: 'moderate', reason: 'Academic decline', reviewedAt: '2026-09-18', reviewedBy: 'u7' },
  { studentId: 's11', studentName: 'Mohammed S. Kromah', className: 'Grade 8B', level: 'at_risk', reason: 'Social conflict', reviewedAt: '2026-09-17', reviewedBy: 'u7' },
];

const initialInterventions: CounselingIntervention[] = [
  { id: 'iv1', studentId: 's5', studentName: 'Augustine T. Kollie', type: 'Behavioral counseling session', description: 'Individual support and behavior check-ins.', status: 'ongoing', startDate: '2026-09-20', updatedAt: '2026-09-20', counselorId: 'u7' },
  { id: 'iv2', studentId: 's7', studentName: 'Daniel S. Tuah', type: 'Academic support plan', description: 'Study support and progress monitoring.', status: 'improving', startDate: '2026-09-18', updatedAt: '2026-09-21', counselorId: 'u7' },
  { id: 'iv3', studentId: 's12', studentName: 'Esther L. Barclay', type: 'Family support referral', description: 'Coordinated family support check-ins.', status: 'ongoing', startDate: '2026-09-16', updatedAt: '2026-09-20', counselorId: 'u7' },
];

const initialAvailability: CounselorAvailabilitySlot[] = [
  { id: 'av1', dayOfWeek: 1, startTime: '09:00', endTime: '12:00', active: true },
  { id: 'av2', dayOfWeek: 2, startTime: '13:00', endTime: '16:00', active: true },
  { id: 'av3', dayOfWeek: 3, startTime: '09:00', endTime: '12:00', active: true },
  { id: 'av4', dayOfWeek: 4, startTime: '13:00', endTime: '16:00', active: true },
  { id: 'av5', dayOfWeek: 5, startTime: '09:00', endTime: '12:00', active: true },
];

const initialAppointments: CounselingAppointment[] = [
  { id: 'ap1', studentId: 's5', studentName: 'Augustine T. Kollie', className: 'Grade 10A', requestType: 'Follow-up counseling session', studentMessage: 'I would like to continue our previous discussion.', requestedAt: '2026-09-22T08:00:00.000Z', status: 'scheduled', scheduledDate: '2026-09-24', scheduledTime: '10:00', updatedAt: now() },
  { id: 'ap2', studentId: 's12', studentName: 'Esther L. Barclay', className: 'Grade 8B', requestType: 'Family support check-in', studentMessage: 'I would like to request another meeting.', requestedAt: '2026-09-22T09:00:00.000Z', status: 'scheduled', scheduledDate: '2026-09-25', scheduledTime: '14:00', updatedAt: now() },
  { id: 'ap3', studentId: 's7', studentName: 'Daniel S. Tuah', className: 'Grade 9A', requestType: 'Academic support', studentMessage: 'I need help planning my study schedule.', requestedAt: '2026-09-22T10:00:00.000Z', status: 'pending', updatedAt: now() },
];

export function getCounselorCases() {
  return readStored(KEYS.cases, initialCases);
}

export function saveCounselorCases(value: CounselorSupportCase[]) {
  writeStored(KEYS.cases, value, 'innosysedu:counselor-cases-updated');
}

export function createCounselorCase(
  input: Omit<CounselorSupportCase, 'id' | 'updatedAt' | 'studentName' | 'className'>,
) {
  const student = studentDetails(input.studentId);
  if (!student) throw new Error('Please select a valid student.');
  const record: CounselorSupportCase = {
    ...input,
    ...student,
    id: makeId('case'),
    updatedAt: now(),
  };
  saveCounselorCases([record, ...getCounselorCases()]);
  return record;
}

export function updateCounselorCase(id: string, changes: Partial<CounselorSupportCase>) {
  const updated = getCounselorCases().map((item) =>
    item.id === id ? { ...item, ...changes, id, updatedAt: now() } : item,
  );
  saveCounselorCases(updated);
  return updated.find((item) => item.id === id);
}

export function getStudentRiskRecords() {
  return readStored(KEYS.risks, initialRisks);
}

export function saveStudentRiskRecords(value: StudentRiskRecord[]) {
  writeStored(KEYS.risks, value, 'innosysedu:counselor-risks-updated');
}

export function upsertStudentRisk(studentId: string, level: StudentRiskLevel, reason: string, counselorId: string) {
  const student = studentDetails(studentId);
  if (!student) throw new Error('Please select a valid student.');
  const record: StudentRiskRecord = {
    ...student,
    level,
    reason,
    reviewedAt: today(),
    reviewedBy: counselorId,
  };
  const current = getStudentRiskRecords().filter((item) => item.studentId !== studentId);
  saveStudentRiskRecords([record, ...current]);
  return record;
}

export function getCounselingInterventions() {
  return readStored(KEYS.interventions, initialInterventions);
}

export function saveCounselingInterventions(value: CounselingIntervention[]) {
  writeStored(KEYS.interventions, value, 'innosysedu:counselor-interventions-updated');
}

export function createCounselingIntervention(
  input: Omit<CounselingIntervention, 'id' | 'studentName' | 'updatedAt'>,
) {
  const student = studentDetails(input.studentId);
  if (!student) throw new Error('Please select a valid student.');
  const record: CounselingIntervention = {
    ...input,
    studentName: student.studentName,
    id: makeId('intervention'),
    updatedAt: today(),
  };
  saveCounselingInterventions([record, ...getCounselingInterventions()]);
  return record;
}

export function updateCounselingIntervention(id: string, changes: Partial<CounselingIntervention>) {
  const updated = getCounselingInterventions().map((item) =>
    item.id === id ? { ...item, ...changes, id, updatedAt: today() } : item,
  );
  saveCounselingInterventions(updated);
  return updated.find((item) => item.id === id);
}

export function getCounselorAvailability() {
  return readStored(KEYS.availability, initialAvailability);
}

export function saveCounselorAvailability(value: CounselorAvailabilitySlot[]) {
  writeStored(KEYS.availability, value, 'innosysedu:counselor-availability-updated');
}

export function getCounselingAppointments() {
  return readStored(KEYS.appointments, initialAppointments);
}

export function saveCounselingAppointments(value: CounselingAppointment[]) {
  writeStored(KEYS.appointments, value, 'innosysedu:counselor-appointments-updated');
}

export function requestCounselingAppointment(input: {
  studentId: string;
  requestType: string;
  studentMessage: string;
  preferredDate: string;
  preferredTime: string;
}) {
  const student = studentDetails(input.studentId);
  if (!student) throw new Error('Please select a valid student.');
  const appointment: CounselingAppointment = {
    ...student,
    ...input,
    id: makeId('appointment'),
    requestedAt: now(),
    preferredDate: input.preferredDate,
    preferredTime: input.preferredTime,
    status: 'pending',
    updatedAt: now(),
  };
  saveCounselingAppointments([appointment, ...getCounselingAppointments()]);
  return appointment;
}

export function isWithinCounselorAvailability(date: string, time: string) {
  const parsedDate = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return false;
  const day = parsedDate.getDay();
  const requestedMinutes = Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
  return getCounselorAvailability().some((slot) => {
    if (!slot.active || slot.dayOfWeek !== day) return false;
    const start = Number(slot.startTime.slice(0, 2)) * 60 + Number(slot.startTime.slice(3, 5));
    const end = Number(slot.endTime.slice(0, 2)) * 60 + Number(slot.endTime.slice(3, 5));
    return requestedMinutes >= start && requestedMinutes < end;
  });
}

export function scheduleCounselingAppointment(id: string, date: string, time: string, counselorNote = '') {
  if (!isWithinCounselorAvailability(date, time)) {
    throw new Error('That date and time is outside your published availability.');
  }
  const appointments = getCounselingAppointments();
  const alreadyBooked = appointments.some(
    (item) => item.id !== id && item.status === 'scheduled' && item.scheduledDate === date && item.scheduledTime === time,
  );
  if (alreadyBooked) {
    throw new Error('That appointment time is already booked. Please choose another available time.');
  }
  const updated = appointments.map((item) =>
    item.id === id
      ? { ...item, status: 'scheduled' as const, scheduledDate: date, scheduledTime: time, counselorNote, updatedAt: now() }
      : item,
  );
  saveCounselingAppointments(updated);
  return updated.find((item) => item.id === id);
}

export function denyCounselingAppointment(id: string, counselorNote = '') {
  const updated = getCounselingAppointments().map((item) =>
    item.id === id
      ? { ...item, status: 'denied' as const, scheduledDate: undefined, scheduledTime: undefined, counselorNote, updatedAt: now() }
      : item,
  );
  saveCounselingAppointments(updated);
  return updated.find((item) => item.id === id);
}
