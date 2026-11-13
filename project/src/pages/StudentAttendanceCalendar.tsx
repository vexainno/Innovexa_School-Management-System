
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Clock3,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';

import {
  PageHeader,
  SectionCard,
  StatCard,
  EmptyState,
} from '@/components/ui';

import { useAuth } from '@/context/AuthContext';
import { STUDENTS, ATTENDANCE } from '@/data/mockData';
import { getAttendance } from '@/data/workflow';

type AttendanceView = 'week' | 'month' | 'day';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

interface AttendanceItem {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  date: string;
  status: AttendanceStatus;
  note?: string;
  session?: string;
  sponsorName?: string;
}

const DEMO_STUDENT_LINKS: Record<string, string> = {
  u11: 's1',
};

const VIEW_OPTIONS: { value: AttendanceView; label: string }[] = [
  { value: 'week', label: 'One Week' },
  { value: 'month', label: 'One Month' },
  { value: 'day', label: 'Specific Day' },
];

function dateToISO(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseISODate(value: string) {
  return new Date(`${value}T12:00:00`);
}

function formatDate(value: string) {
  return parseISODate(value).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatShortDate(value: string) {
  return parseISODate(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
}

function getWeekRange(anchor: Date) {
  const start = new Date(anchor);
  const day = start.getDay();

  // Monday is the first day of the school week.
  const offset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + offset);
  start.setHours(12, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    start: dateToISO(start),
    end: dateToISO(end),
  };
}

function getMonthRange(anchor: Date) {
  const start = new Date(
    anchor.getFullYear(),
    anchor.getMonth(),
    1,
    12
  );

  const end = new Date(
    anchor.getFullYear(),
    anchor.getMonth() + 1,
    0,
    12
  );

  return {
    start: dateToISO(start),
    end: dateToISO(end),
  };
}

function statusLabel(status: AttendanceStatus) {
  const labels: Record<AttendanceStatus, string> = {
    present: 'Present',
    absent: 'Absent',
    late: 'Late',
    excused: 'Excused',
  };

  return labels[status];
}

function statusClass(status: AttendanceStatus) {
  const classes: Record<AttendanceStatus, string> = {
    present: 'badge-success',
    absent: 'badge-error',
    late: 'badge-warning',
    excused: 'badge-info',
  };

  return classes[status];
}

function StatusIcon({ status }: { status: AttendanceStatus }) {
  if (status === 'present') {
    return <CheckCircle2 className="w-4 h-4 text-success-600" />;
  }

  if (status === 'absent') {
    return <AlertCircle className="w-4 h-4 text-error-600" />;
  }

  if (status === 'late') {
    return <Clock3 className="w-4 h-4 text-warning-600" />;
  }

  return <Info className="w-4 h-4 text-navy-500" />;
}

export function StudentAttendanceCalendar() {
  const { user } = useAuth();
  const dateInputRef = useRef<HTMLInputElement>(null);

  const [view, setView] = useState<AttendanceView>('week');
  const [selectedDate, setSelectedDate] = useState(
    dateToISO(new Date())
  );

  const [records, setRecords] = useState<AttendanceItem[]>(() =>
    getAttendance() as AttendanceItem[]
  );

  const studentId = user
    ? DEMO_STUDENT_LINKS[user.id] ??
      STUDENTS.find((student) => student.name === user.name)?.id
    : undefined;

  const student = STUDENTS.find(
    (item) => item.id === studentId && item.status === 'active'
  );

  useEffect(() => {
    const refreshAttendance = () => {
      setRecords(getAttendance() as AttendanceItem[]);
    };

    window.addEventListener(
      'innosysedu:attendance-updated',
      refreshAttendance
    );

    window.addEventListener('storage', refreshAttendance);

    return () => {
      window.removeEventListener(
        'innosysedu:attendance-updated',
        refreshAttendance
      );

      window.removeEventListener('storage', refreshAttendance);
    };
  }, []);

  const myAttendance = useMemo(() => {
    if (!studentId) return [];

    const workflowRecords = records.filter(
      (record) => record.studentId === studentId
    );

    // Retain legacy attendance records if they are not already
    // represented in the shared teacher attendance workflow.
    const workflowIds = new Set(
      workflowRecords.map((record) => record.id)
    );

    const legacyRecords = ATTENDANCE.filter(
      (record) =>
        record.studentId === studentId &&
        !workflowIds.has(record.id)
    ) as AttendanceItem[];

    const combined = [...workflowRecords, ...legacyRecords];

    return combined.sort((a, b) =>
      b.date.localeCompare(a.date)
    );
  }, [records, studentId]);

  const selectedDateObject = parseISODate(selectedDate);

  const dateRange = useMemo(() => {
    if (view === 'week') {
      return getWeekRange(selectedDateObject);
    }

    if (view === 'month') {
      return getMonthRange(selectedDateObject);
    }

    return {
      start: selectedDate,
      end: selectedDate,
    };
  }, [view, selectedDate]);

  const visibleRecords = myAttendance.filter(
    (record) =>
      record.date >= dateRange.start &&
      record.date <= dateRange.end
  );

  const presentCount = visibleRecords.filter(
    (record) => record.status === 'present'
  ).length;

  const absentCount = visibleRecords.filter(
    (record) => record.status === 'absent'
  ).length;

  const lateCount = visibleRecords.filter(
    (record) => record.status === 'late'
  ).length;

  const excusedCount = visibleRecords.filter(
    (record) => record.status === 'excused'
  ).length;

  const attendanceRate =
    visibleRecords.length > 0
      ? Math.round(
          ((presentCount + lateCount + excusedCount) /
            visibleRecords.length) *
            100
        )
      : 0;

  const heading =
    view === 'week'
      ? `Week of ${formatDate(dateRange.start)}`
      : view === 'month'
        ? selectedDateObject.toLocaleDateString(undefined, {
            month: 'long',
            year: 'numeric',
          })
        : formatDate(selectedDate);

  const changePeriod = (direction: number) => {
    const next = new Date(selectedDateObject);

    if (view === 'week') {
      next.setDate(next.getDate() + direction * 7);
    } else if (view === 'month') {
      next.setMonth(next.getMonth() + direction);
    } else {
      next.setDate(next.getDate() + direction);
    }

    setSelectedDate(dateToISO(next));
  };

  const openCalendar = () => {
    const input = dateInputRef.current;

    if (!input) return;

    if (typeof input.showPicker === 'function') {
      input.showPicker();
    } else {
      input.focus();
      input.click();
    }
  };

  const changeView = (value: string) => {
    setView(value as AttendanceView);
  };

  if (!student) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="My Attendance"
          subtitle="View your personal attendance history."
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
        title="My Attendance"
        subtitle={`Attendance history for ${student.name}. Your teachers record and submit attendance.`}
        action={
          <button
            type="button"
            onClick={openCalendar}
            className="btn-secondary"
          >
            <CalendarDays className="w-4 h-4" />
            Choose Date
          </button>
        }
      />

      {/* View selector and calendar */}
      <SectionCard title="Attendance View">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="label" htmlFor="attendance-view">
              Select attendance period
            </label>

            <select
              id="attendance-view"
              className="input"
              value={view}
              onChange={(event) => changeView(event.target.value)}
            >
              {VIEW_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="label" htmlFor="attendance-date">
              Select reference date
            </label>

            <div className="relative">
              <input
                ref={dateInputRef}
                id="attendance-date"
                type="date"
                className="input pr-11"
                value={selectedDate}
                onChange={(event) =>
                  setSelectedDate(event.target.value)
                }
              />

              <button
                type="button"
                aria-label="Open attendance calendar"
                onClick={openCalendar}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-500 hover:text-navy-800"
              >
                <CalendarDays className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <p className="text-xs text-navy-400 mt-3">
          Choose One Week, One Month or Specific Day from the
          dropdown. The calendar date determines the period displayed.
        </p>
      </SectionCard>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard
          label="Attendance Rate"
          value={`${attendanceRate}%`}
          icon={<CalendarCheck className="w-5 h-5" />}
          color="navy"
        />

        <StatCard
          label="Present"
          value={presentCount}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="success"
        />

        <StatCard
          label="Absent"
          value={absentCount}
          icon={<AlertCircle className="w-5 h-5" />}
          color="error"
        />

        <StatCard
          label="Late"
          value={lateCount}
          icon={<Clock3 className="w-5 h-5" />}
          color="warning"
        />

        <StatCard
          label="Excused"
          value={excusedCount}
          icon={<Info className="w-5 h-5" />}
          color="accent"
        />
      </div>

      {/* Period navigation */}
      <SectionCard
        title="Attendance Records"
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-secondary p-2"
              aria-label="Previous period"
              onClick={() => changePeriod(-1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              className="btn-secondary p-2"
              aria-label="Next period"
              onClick={() => changePeriod(1)}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        }
      >
        <div className="mb-4">
          <h3 className="font-semibold text-navy-800">
            {heading}
          </h3>
          <p className="text-xs text-navy-400 mt-1">
            {visibleRecords.length} attendance record(s) found
          </p>
        </div>

        {visibleRecords.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="w-8 h-8" />}
            title="No attendance records found"
            message="There are no submitted attendance records for this period. Records will appear after your teacher saves attendance."
          />
        ) : (
          <div className="space-y-3">
            {visibleRecords.map((record) => (
              <div
                key={record.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border border-navy-100"
              >
                <div className="p-2 rounded-lg bg-navy-50">
                  <StatusIcon status={record.status} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy-800">
                    {formatDate(record.date)}
                  </p>

                  <p className="text-xs text-navy-400 mt-1">
                    {record.className}
                    {record.session
                      ? ` · ${record.session} session`
                      : ''}
                  </p>

                  {record.sponsorName && (
                    <p className="text-xs text-navy-400 mt-1">
                      Recorded by {record.sponsorName}
                    </p>
                  )}

                  {record.note && (
                    <p className="text-xs text-navy-500 mt-1">
                      Note: {record.note}
                    </p>
                  )}
                </div>

                <span className={statusClass(record.status)}>
                  {statusLabel(record.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Month-specific daily summary */}
      {view === 'month' && (
        <SectionCard title="Monthly Attendance Summary">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg bg-success-50 p-3">
              <p className="text-xs text-success-700">Present</p>
              <p className="text-xl font-bold text-success-800">
                {presentCount}
              </p>
            </div>

            <div className="rounded-lg bg-error-50 p-3">
              <p className="text-xs text-error-700">Absent</p>
              <p className="text-xl font-bold text-error-800">
                {absentCount}
              </p>
            </div>

            <div className="rounded-lg bg-warning-50 p-3">
              <p className="text-xs text-warning-700">Late</p>
              <p className="text-xl font-bold text-warning-800">
                {lateCount}
              </p>
            </div>

            <div className="rounded-lg bg-navy-50 p-3">
              <p className="text-xs text-navy-600">Excused</p>
              <p className="text-xl font-bold text-navy-800">
                {excusedCount}
              </p>
            </div>
          </div>
        </SectionCard>
      )}

      <p className="text-xs text-navy-400">
        Attendance is read-only in the Student Portal. Corrections
        must be requested through the school. The displayed records
        are based on teacher submissions.
      </p>
    </div>
  );
}
