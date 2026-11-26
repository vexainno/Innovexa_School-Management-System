import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock, Send, CheckCircle2, XCircle, Info } from 'lucide-react';
import { PageHeader, SectionCard, EmptyState } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { STUDENTS } from '@/data/mockData';
import {
  getCounselorAvailability,
  getCounselingAppointments,
  requestCounselingAppointment,
  type CounselingAppointment,
} from '@/data/counselorWorkflow';

const DEMO_STUDENT_LINKS: Record<string, string> = {
  u11: 's1',
};

const REQUEST_TYPES = [
  'Academic support',
  'Behavioral counseling',
  'Social or peer concerns',
  'Family support',
  'General counseling',
  'Follow-up counseling session',
];

function formatDay(day: number) {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
}

function availableTimes(date: string) {
  if (!date) return [];
  const day = new Date(`${date}T12:00:00`).getDay();
  const slots = getCounselorAvailability().filter((slot) => slot.active && slot.dayOfWeek === day);
  const times: string[] = [];
  slots.forEach((slot) => {
    const [startHour, startMinute] = slot.startTime.split(':').map(Number);
    const [endHour, endMinute] = slot.endTime.split(':').map(Number);
    let current = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;
    while (current + 30 <= end) {
      const hour = Math.floor(current / 60).toString().padStart(2, '0');
      const minute = (current % 60).toString().padStart(2, '0');
      times.push(`${hour}:${minute}`);
      current += 30;
    }
  });
  return [...new Set(times)].sort();
}

export function StudentCounselingAppointments() {
  const { user } = useAuth();
  const studentId = user ? DEMO_STUDENT_LINKS[user.id] : undefined;
  const student = STUDENTS.find((item) => item.id === studentId);
  const [appointments, setAppointments] = useState<CounselingAppointment[]>(getCounselingAppointments());
  const [requestType, setRequestType] = useState(REQUEST_TYPES[0]);
  const [message, setMessage] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const refresh = () => setAppointments(getCounselingAppointments());
    window.addEventListener('innosysedu:counselor-appointments-updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('innosysedu:counselor-appointments-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const myAppointments = useMemo(
    () => appointments.filter((item) => item.studentId === studentId).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)),
    [appointments, studentId],
  );
  const times = availableTimes(date);

  const submitRequest = () => {
    if (!studentId || !date || !time) return;
    try {
      requestCounselingAppointment({
        studentId,
        requestType,
        studentMessage: message.trim(),
        preferredDate: date,
        preferredTime: time,
      });
      const latest = getCounselingAppointments();
      setAppointments(latest);
      setMessage('');
      setDate('');
      setTime('');
      setFeedback('Your appointment request has been sent to the Guidance Counselor. It will remain Pending until the counselor responds.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Unable to submit your request.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Counseling & Support" subtitle="Request a confidential support appointment and follow its status." />

      {!student && (
        <SectionCard title="Student account link required">
          <p className="text-sm text-navy-600">This demo account is not linked to a student record yet. A verified student-account relationship is required before appointment requests can be submitted.</p>
        </SectionCard>
      )}

      {student && <>
        <SectionCard title="Request a Counseling Appointment">
          <div className="rounded-lg bg-navy-50 border border-navy-100 p-3 flex gap-2 text-sm text-navy-600 mb-4">
            <Info className="w-5 h-5 shrink-0 text-navy-500" />
            Choose a date and time from the counselor's published availability. Your request will be marked Pending until it is reviewed.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="label">Reason for appointment</label>
              <select className="input" value={requestType} onChange={(event) => setRequestType(event.target.value)}>
                {REQUEST_TYPES.map((type) => <option key={type}>{type}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="label">Preferred date</label>
              <input
                className="input"
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={date}
                onChange={(event) => { setDate(event.target.value); setTime(''); }}
              />
            </div>
            <div className="space-y-1">
              <label className="label">Available time</label>
              <select className="input" value={time} onChange={(event) => setTime(event.target.value)} disabled={!date || times.length === 0}>
                <option value="">{!date ? 'Choose a date first' : times.length ? 'Select an available time' : 'No availability on this date'}</option>
                {times.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="label">Message (optional)</label>
              <textarea className="input min-h-20" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Share a short note to help the counselor understand your request." />
            </div>
          </div>
          {date && times.length === 0 && <p className="text-sm text-amber-700 mt-3">The counselor has not published an available time for {formatDay(new Date(`${date}T12:00:00`).getDay())}. Please choose another date.</p>}
          {feedback && <p role="status" className="text-sm text-navy-700 mt-3">{feedback}</p>}
          <div className="flex justify-end mt-4">
            <button className="btn-primary" disabled={!date || !time} onClick={submitRequest}><Send className="w-4 h-4" /> Submit Request</button>
          </div>
        </SectionCard>

        <SectionCard title={`My Appointment Requests (${myAppointments.length})`}>
          <div className="space-y-3">
            {myAppointments.map((item) => (
              <div key={item.id} className="rounded-lg border border-navy-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="p-2 rounded-lg bg-navy-100 text-navy-700"><CalendarDays className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-navy-800">{item.requestType}</p>
                  <p className="text-xs text-navy-400 mt-1">Requested {new Date(item.requestedAt).toLocaleString()}</p>
                  {item.status === 'pending' && item.preferredDate && <p className="text-sm text-navy-600 mt-1"><Clock className="w-3.5 h-3.5 inline mr-1" />Preferred: {item.preferredDate} at {item.preferredTime}</p>}{item.status === 'scheduled' && <p className="text-sm text-navy-600 mt-1"><Clock className="w-3.5 h-3.5 inline mr-1" />Confirmed appointment: {item.scheduledDate} at {item.scheduledTime}</p>}
                  {item.counselorNote && <p className="text-sm text-navy-500 mt-1">Counselor note: {item.counselorNote}</p>}
                </div>
                {item.status === 'pending' && <span className="badge-warning">Pending</span>}
                {item.status === 'scheduled' && <span className="badge-success"><CheckCircle2 className="w-3 h-3 inline mr-1" />Scheduled</span>}
                {item.status === 'denied' && <span className="badge-error"><XCircle className="w-3 h-3 inline mr-1" />Denied</span>}
              </div>
            ))}
            {myAppointments.length === 0 && <EmptyState icon={<CalendarDays className="w-6 h-6" />} title="No appointment requests yet" message="Your appointment requests and counselor responses will appear here." />}
          </div>
        </SectionCard>
      </>}
    </div>
  );
}
