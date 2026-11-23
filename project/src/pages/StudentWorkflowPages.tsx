import { useMemo, useState } from 'react';
import {
  CalendarDays, Clock, MapPin, CalendarCheck, Filter,
} from 'lucide-react';
import { PageHeader, SectionCard, EmptyState } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useSchoolData } from '@/context/SchoolDataContext';
import { CLASSES } from '@/data/mockData';
import type { CalendarCategory, TimetableEntry } from '@/types';

const DAYS: TimetableEntry['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const CATEGORY_BADGES: Partial<Record<CalendarCategory, string>> = {
  term: 'badge-info', examination: 'badge-warning', holiday: 'badge-success',
  meeting: 'badge-info', sports: 'badge-accent', cultural: 'badge-accent',
  graduation: 'badge-success', deadline: 'badge-error', development: 'badge-info',
  other: 'badge-info',
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// ---------------- Student Timetable ----------------
export function StudentTimetable() {
  const { timetable } = useSchoolData();
  const { user } = useAuth();
  const today = todayISO();
  const todayDay = DAYS[(new Date(today).getDay() + 6) % 7] ?? 'Monday';
  const [day, setDay] = useState<TimetableEntry['day']>(todayDay);

  // Students see only the published timetable for their class.
  const studentClass = CLASSES.find(
    (c) => c.grade === 'Grade 11' && c.section === 'A',
  ); // demo student is Grade 11A
  const myEntries = useMemo(
    () =>
      timetable.filter(
        (e) =>
          e.status === 'published' &&
          studentClass &&
          e.classId === studentClass.id,
      ),
    [timetable, studentClass],
  );
  const dayEntries = myEntries
    .filter((e) => e.day === day)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="My Timetable"
        subtitle={studentClass ? `Weekly schedule for ${studentClass.name}` : 'Weekly class schedule'}
      />
      <div className="flex gap-2 flex-wrap">
        {DAYS.map((d) => (
          <button
            key={d}
            onClick={() => setDay(d)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              d === day ? 'bg-navy-700 text-white' : 'bg-white border border-navy-100 text-navy-600 hover:bg-navy-50'
            }`}
          >
            {d}{d === todayDay ? ' ·' : ''}
          </button>
        ))}
      </div>
      {myEntries.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={<CalendarDays className="w-8 h-8" />}
            title="No published timetable yet"
            message="Your class timetable will appear here once the school publishes it."
          />
        </SectionCard>
      ) : (
        <SectionCard title={`${day} schedule`}>
          <div className="space-y-3">
            {dayEntries.map((e) => (
              <div
                key={e.id}
                className={`flex items-center gap-4 p-4 rounded-xl border bg-white ${
                  e.kind !== 'lesson' ? 'border-navy-50 bg-navy-50/50' : 'border-navy-100'
                }`}
              >
                <div className="px-3 py-2 rounded-lg bg-navy-50 text-navy-700 text-sm font-semibold whitespace-nowrap">
                  {e.startTime}–{e.endTime}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${e.kind === 'lesson' ? 'text-navy-800' : 'text-navy-500'}`}>
                    {e.kind === 'lesson' ? e.subjectName : e.kind.charAt(0).toUpperCase() + e.kind.slice(1)}
                  </p>
                  {e.kind === 'lesson' && (
                    <div className="flex items-center gap-4 text-xs text-navy-400 mt-1">
                      <span>{e.teacherName}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{e.room}</span>
                    </div>
                  )}
                </div>
                {e.kind !== 'lesson' && <span className="badge-info">{e.kind}</span>}
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ---------------- Student School Calendar ----------------
export function StudentSchoolCalendar() {
  const { events } = useSchoolData();
  const { user } = useAuth();
  const [categoryFilter, setCategoryFilter] = useState<'all' | CalendarCategory>('all');

  const published = events
    .filter((e) => e.status === 'published')
    .filter((e) => e.audience === 'Everyone' || e.audience === 'Students' || e.audience === 'Staff & Students')
    .filter((e) => categoryFilter === 'all' || e.category === categoryFilter)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const upcoming = published.filter((e) => e.endDate >= todayISO());

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="School Calendar"
        subtitle="Term dates, exams, holidays and school events."
      />
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-navy-400" />
        <select
          className="input-base max-w-xs"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as 'all' | CalendarCategory)}
        >
          <option value="all">All categories</option>
          <option value="term">Term dates</option>
          <option value="examination">Examinations</option>
          <option value="holiday">Holidays</option>
          <option value="meeting">Meetings</option>
          <option value="sports">Sports</option>
          <option value="cultural">Cultural</option>
          <option value="graduation">Graduation</option>
          <option value="deadline">Deadlines</option>
          <option value="other">Other</option>
        </select>
      </div>
      {published.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={<CalendarCheck className="w-8 h-8" />}
            title="No published events"
            message="School events will appear here once published."
          />
        </SectionCard>
      ) : (
        <SectionCard title={`Upcoming events (${upcoming.length})`}>
          <div className="space-y-3">
            {upcoming.map((e) => (
              <div key={e.id} className="flex items-start gap-4 p-4 rounded-xl border border-navy-100 bg-white">
                <div className="p-2 rounded-lg bg-navy-50 text-navy-700">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-navy-800">{e.title}</p>
                    <span className={CATEGORY_BADGES[e.category] ?? 'badge-info'}>{e.category}</span>
                  </div>
                  <p className="text-sm text-navy-500 mt-1">{e.description}</p>
                  <div className="flex items-center gap-4 text-xs text-navy-400 mt-2">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />
                      {e.startDate === e.endDate ? e.startDate : `${e.startDate} → ${e.endDate}`}
                    </span>
                    {e.startTime && <span>{e.startTime}{e.endTime ? `–${e.endTime}` : ''}</span>}
                    {e.venue && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{e.venue}</span>}
                  </div>
                </div>
              </div>
            ))}
            {upcoming.length === 0 && (
              <p className="text-sm text-navy-400">No upcoming events — check the filter or past events below.</p>
            )}
          </div>
          {upcoming.length < published.length && (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-navy-300 mb-2">Past events</p>
              <div className="space-y-2">
                {published
                  .filter((e) => e.endDate < todayISO())
                  .map((e) => (
                    <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg bg-navy-50/60 text-sm text-navy-400">
                      <CalendarDays className="w-4 h-4" />
                      <span className="flex-1">{e.title}</span>
                      <span>{e.startDate}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </SectionCard>
      )}
      {user?.role !== 'student' && null}
    </div>
  );
}
