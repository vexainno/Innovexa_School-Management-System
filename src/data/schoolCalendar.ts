import { CLASSES } from '@/data/mockData';

export type SchoolCalendarCategory = 'academic' | 'examination' | 'holiday' | 'meeting' | 'activity' | 'deadline' | 'other';
export interface SchoolCalendarEvent {
  id: string;
  title: string;
  description: string;
  category: SchoolCalendarCategory;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  audience: 'whole_school' | 'teachers' | 'students' | 'parents' | 'selected_classes';
  classIds: string[];
  published: boolean;
  createdBy: string;
  createdAt: string;
}
const STORAGE_KEY = 'innosysedu.school-calendar.v1';
const seed: SchoolCalendarEvent[] = [
  { id: 'cal-opening-2026', title: 'First Day of Academic Year', description: 'Opening of the 2026/2027 academic year.', category: 'academic', startDate: '2026-09-07', endDate: '2026-09-07', startTime: '08:00', audience: 'whole_school', classIds: [], published: true, createdBy: 'School Administration', createdAt: '2026-08-20T09:00:00.000Z' },
  { id: 'cal-midterm-2026', title: 'Mid-term Examinations', description: 'Mid-term assessment period. Teachers should publish assessment instructions in advance.', category: 'examination', startDate: '2026-11-23', endDate: '2026-11-27', audience: 'whole_school', classIds: [], published: true, createdBy: 'School Administration', createdAt: '2026-09-01T09:00:00.000Z' },
  { id: 'cal-parents-2026', title: 'Parent-Teacher Meeting', description: 'Academic progress and student support consultations.', category: 'meeting', startDate: '2026-12-04', endDate: '2026-12-04', startTime: '09:00', endTime: '13:00', location: 'School Hall', audience: 'parents', classIds: [], published: true, createdBy: 'School Administration', createdAt: '2026-09-01T09:00:00.000Z' },
];
export function getSchoolCalendar(): SchoolCalendarEvent[] {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) as SchoolCalendarEvent[] : seed; }
  catch { return seed; }
}
export function saveSchoolCalendar(events: SchoolCalendarEvent[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  window.dispatchEvent(new CustomEvent('innosysedu:calendar-updated'));
}
export function getPublishedCalendarEvents(classId?: string, audience?: SchoolCalendarEvent['audience']): SchoolCalendarEvent[] {
  return getSchoolCalendar().filter(event => event.published && (event.audience === 'whole_school' || !audience || event.audience === audience || (event.audience === 'selected_classes' && !!classId && event.classIds.includes(classId))) && (!classId || event.audience !== 'selected_classes' || event.classIds.includes(classId))).sort((a,b) => a.startDate.localeCompare(b.startDate));
}
export function getClassIdForStudentClass(studentClass?: string): string | undefined {
  if (!studentClass) return undefined;
  const normalized = studentClass.replace(/\s/g, '').toLowerCase();
  return CLASSES.find(item => `${item.grade.replace('Grade ', '')}${item.section}`.replace(/\s/g, '').toLowerCase() === normalized || item.name.replace(/\s/g, '').toLowerCase() === normalized)?.id;
}

export interface ClassTimetableEntry {
  id: string;
  classId: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startTime: string;
  endTime: string;
  room: string;
  term: string;
  published: boolean;
}
const TIMETABLE_KEY = 'innosysedu.class-timetable.v1';
export function getClassTimetable(): ClassTimetableEntry[] {
  try { return JSON.parse(localStorage.getItem(TIMETABLE_KEY) || '[]') as ClassTimetableEntry[]; }
  catch { return []; }
}
export function saveClassTimetable(entries: ClassTimetableEntry[]): void {
  localStorage.setItem(TIMETABLE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new CustomEvent('innosysedu:timetable-updated'));
}
