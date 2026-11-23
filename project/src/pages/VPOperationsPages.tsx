import { useMemo, useState } from 'react';
import {
  CalendarDays, Plus, CalendarCheck, Clock, MapPin, Users, Repeat, Send,
  Search, Trash2, ListChecks, ClipboardList,
} from 'lucide-react';
import { PageHeader, StatCard, SectionCard, EmptyState, Modal } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useSchoolData, makeId } from '@/context/SchoolDataContext';
import { CLASSES, SUBJECTS, TEST_ACCOUNTS } from '@/data/mockData';
import type { SchoolEvent, CalendarCategory, TimetableEntry, TeacherSubstitution } from '@/types';

const CATEGORY_LABELS: Record<CalendarCategory, string> = {
  term: 'Term Date', examination: 'Examination', holiday: 'Holiday', meeting: 'Meeting',
  sports: 'Sports', cultural: 'Cultural', graduation: 'Graduation', deadline: 'Deadline',
  development: 'Staff Development', other: 'Other',
};

const CATEGORY_BADGES: Record<CalendarCategory, string> = {
  term: 'badge-info', examination: 'badge-warning', holiday: 'badge-success',
  meeting: 'badge-info', sports: 'badge-accent', cultural: 'badge-accent',
  graduation: 'badge-success', deadline: 'badge-error', development: 'badge-info',
  other: 'badge-info',
};

const DAYS: TimetableEntry['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// ---------------- School Calendar ----------------
export function VPSchoolCalendar() {
  const { events, academicYears, addEvent, updateEvent, addNotification } = useSchoolData();
  const { user } = useAuth();
  const [view, setView] = useState<'month' | 'week' | 'day' | 'agenda'>('month');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SchoolEvent | null>(null);
  const [notice, setNotice] = useState('');

  const [form, setForm] = useState({
    title: '', description: '', category: 'other' as CalendarCategory,
    startDate: todayISO(), endDate: todayISO(), startTime: '08:00', endTime: '09:00',
    venue: '', audience: 'Everyone', status: 'draft' as SchoolEvent['status'],
  });

  const sorted = useMemo(
    () => [...events].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [events],
  );

  const upcoming = sorted.filter((e) => e.endDate >= todayISO() && e.status !== 'cancelled');

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: '', description: '', category: 'other', startDate: todayISO(),
      endDate: todayISO(), startTime: '08:00', endTime: '09:00', venue: '',
      audience: 'Everyone', status: 'draft',
    });
    setShowForm(true);
  };

  const openEdit = (e: SchoolEvent) => {
    setEditing(e);
    setForm({
      title: e.title, description: e.description, category: e.category,
      startDate: e.startDate, endDate: e.endDate, startTime: e.startTime || '08:00',
      endTime: e.endTime || '09:00', venue: e.venue, audience: e.audience, status: e.status,
    });
    setShowForm(true);
  };

  const submit = (publish: boolean) => {
    if (!form.title.trim() || !form.venue.trim()) {
      setNotice('Title and venue are required.');
      return;
    }
    if (form.endDate < form.startDate) {
      setNotice('End date cannot be before the start date.');
      return;
    }
    const payload = { ...form, status: publish ? ('published' as const) : form.status };
    if (editing) {
      updateEvent(editing.id, payload);
      setNotice(publish ? 'Event updated and published.' : 'Event updated.');
    } else {
      addEvent({ ...payload, createdBy: user?.id || 'u2' });
      setNotice(publish ? 'Event published — it now appears in Teacher, Student, Parent and Principal portals.' : 'Event saved as draft. Publish it when ready.');
      if (publish) {
        addNotification({
          recipientRoles: ['teacher', 'student', 'parent', 'principal'],
          title: 'Calendar event published',
          message: `${payload.title} — ${payload.startDate} at ${payload.venue}.`,
          category: 'calendar',
          relatedPage: 'school-calendar',
        });
      }
    }
    setShowForm(false);
  };

  // month grid
  const monthDays = useMemo(() => {
    const base = new Date(todayISO() + 'T00:00:00');
    const year = base.getFullYear();
    const month = base.getMonth();
    const first = new Date(year, month, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: { date: string | null; events: SchoolEvent[] }[] = [];
    for (let i = 0; i < startPad; i++) cells.push({ date: null, events: [] });
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ date: iso, events: events.filter((e) => e.startDate <= iso && e.endDate >= iso && e.status !== 'cancelled') });
    }
    return cells;
  }, [events]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="School Calendar"
        subtitle="Create, publish and manage the annual school calendar. Published events appear in every portal."
        action={<button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> New Event</button>}
      />

      {notice && !showForm && <div className="rounded-lg bg-success-50 border border-success-200 text-success-700 text-sm px-4 py-3">{notice}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Events" value={events.length} icon={<CalendarDays className="w-5 h-5" />} />
        <StatCard label="Published" value={events.filter((e) => e.status === 'published').length} icon={<CalendarCheck className="w-5 h-5" />} color="success" />
        <StatCard label="Drafts" value={events.filter((e) => e.status === 'draft').length} icon={<ClipboardList className="w-5 h-5" />} color="warning" />
        <StatCard label="Upcoming" value={upcoming.length} icon={<Clock className="w-5 h-5" />} color="accent" />
      </div>

      <SectionCard
        title="Calendar"
        action={
          <div className="flex gap-1 bg-navy-50 rounded-lg p-1">
            {(['month', 'week', 'day', 'agenda'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition ${view === v ? 'bg-navy-700 text-white' : 'text-navy-600 hover:bg-navy-100'}`}
              >
                {v}
              </button>
            ))}
          </div>
        }
      >
        {view === 'month' && (
          <div>
            <p className="text-sm text-navy-500 mb-3">
              {new Date().toLocaleString('en', { month: 'long', year: 'numeric' })}
            </p>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-navy-400 mb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((cell, i) => (
                <div key={i} className={`min-h-20 rounded-lg border p-1 text-left ${cell.date ? (cell.date === todayISO() ? 'border-navy-400 bg-navy-50' : 'border-navy-100') : 'border-transparent'}`}>
                  {cell.date && (
                    <>
                      <span className="text-xs text-navy-500">{Number(cell.date.slice(-2))}</span>
                      {cell.events.slice(0, 2).map((e) => (
                        <div key={e.id} className={`mt-0.5 truncate rounded px-1 text-[10px] ${CATEGORY_BADGES[e.category]} cursor-pointer`} onClick={() => openEdit(e)}>
                          {e.title}
                        </div>
                      ))}
                      {cell.events.length > 2 && <div className="text-[10px] text-navy-400 mt-0.5">+{cell.events.length - 2} more</div>}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'week' && (
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {DAYS.map((day) => {
              const date = new Date();
              const monday = new Date(date.setDate(date.getDate() - date.getDay() + 1));
              const d = new Date(monday);
              d.setDate(monday.getDate() + DAYS.indexOf(day));
              const iso = d.toISOString().slice(0, 10);
              const dayEvents = events.filter((e) => e.startDate <= iso && e.endDate >= iso && e.status !== 'cancelled');
              return (
                <div key={day} className="rounded-lg border border-navy-100 p-3">
                  <p className="text-sm font-semibold text-navy-800">{day}</p>
                  <p className="text-xs text-navy-400 mb-2">{iso}</p>
                  {dayEvents.length === 0 ? (
                    <p className="text-xs text-navy-300">No events</p>
                  ) : (
                    dayEvents.map((e) => (
                      <button key={e.id} onClick={() => openEdit(e)} className={`block w-full text-left rounded px-2 py-1 text-xs mb-1 ${CATEGORY_BADGES[e.category]}`}>
                        {e.title}
                      </button>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        )}

        {view === 'day' && (
          <div className="space-y-2">
            {events.filter((e) => e.startDate <= todayISO() && e.endDate >= todayISO()).map((e) => (
              <button key={e.id} onClick={() => openEdit(e)} className="w-full text-left p-3 rounded-lg border border-navy-100 hover:border-navy-300 transition-colors">
                <div className="flex items-center gap-2">
                  <span className={`badge ${CATEGORY_BADGES[e.category]}`}>{CATEGORY_LABELS[e.category]}</span>
                  <span className="text-sm font-medium text-navy-800">{e.title}</span>
                </div>
                <p className="text-xs text-navy-400 mt-1">{e.startTime || ''} {e.venue}</p>
              </button>
            ))}
            {events.filter((e) => e.startDate <= todayISO() && e.endDate >= todayISO()).length === 0 && (
              <EmptyState icon={<CalendarDays className="w-8 h-8" />} title="Nothing scheduled today" message="There are no events scheduled for today." />
            )}
          </div>
        )}

        {view === 'agenda' && (
          <div className="space-y-2">
            {upcoming.map((e) => (
              <button key={e.id} onClick={() => openEdit(e)} className="w-full text-left p-3 rounded-lg border border-navy-100 hover:border-navy-300 transition-colors flex items-center gap-3">
                <span className={`badge ${CATEGORY_BADGES[e.category]}`}>{CATEGORY_LABELS[e.category]}</span>
                <span className="flex-1 text-sm font-medium text-navy-800">{e.title}</span>
                <span className="text-xs text-navy-400">{e.startDate}{e.endDate !== e.startDate ? ` → ${e.endDate}` : ''}</span>
                <span className={`badge ${e.status === 'published' ? 'badge-success' : 'badge-warning'}`}>{e.status}</span>
              </button>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title={`Academic Years (${academicYears.length})`}>
        <div className="space-y-3">
          {academicYears.map((y) => (
            <div key={y.id} className="p-3 rounded-lg border border-navy-100">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-navy-800">{y.name}</p>
                <span className={`badge ${y.status === 'active' ? 'badge-success' : y.status === 'completed' ? 'badge-info' : 'badge-warning'}`}>{y.status}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {y.terms.map((t) => (
                  <span key={t.id} className="text-xs px-2 py-1 rounded bg-navy-50 text-navy-600">
                    {t.name}: {t.startDate} → {t.endDate}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {showForm && (
        <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Edit Event' : 'New Calendar Event'}>
          <div className="space-y-4">
            <div>
              <label className="form-label">Event Title *</label>
              <input className="input-base" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Second Term Opens" />
            </div>
            <div>
              <label className="form-label">Description</label>
              <textarea className="input-base" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Category</label>
                <select className="input-base" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as CalendarCategory })}>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Audience</label>
                <select className="input-base" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
                  {['Everyone', 'Students & Staff', 'Students', 'Parents & Staff', 'Parents', 'Staff'].map((a) => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Start Date *</label>
                <input type="date" className="input-base" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div>
                <label className="form-label">End Date *</label>
                <input type="date" className="input-base" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Start Time</label>
                <input type="time" className="input-base" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              </div>
              <div>
                <label className="form-label">End Time</label>
                <input type="time" className="input-base" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="form-label">Venue *</label>
              <input className="input-base" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} placeholder="e.g. Main Hall" />
            </div>
            {notice && <p className="text-sm text-error-600">{notice}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button onClick={() => submit(false)} className="btn-secondary">Save Draft</button>
              <button onClick={() => submit(true)} className="btn-primary"><Send className="w-4 h-4" /> Publish</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ---------------- Timetable Builder ----------------
export function VPTimetableBuilder() {
  const { timetable, addTimetableEntries, publishTimetable, removeTimetableEntry, addNotification } = useSchoolData();
  const [classId, setClassId] = useState('c5');
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({
    subjectId: 'sub1', teacherId: 'u6', room: 'Room 301', day: 'Monday' as TimetableEntry['day'],
    startTime: '13:00', endTime: '13:40', kind: 'lesson' as TimetableEntry['kind'],
  });

  const cls = CLASSES.find((c) => c.id === classId);
  const classEntries = timetable.filter((t) => t.classId === classId).sort(
    (a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.startTime.localeCompare(b.startTime),
  );
  const hasDraft = classEntries.some((t) => t.status === 'draft');

  const addEntry = () => {
    const subject = SUBJECTS.find((s) => s.id === form.subjectId);
    const teacher = TEST_ACCOUNTS.find((u) => u.id === form.teacherId);
    if (form.endTime <= form.startTime) {
      setConflicts(['End time must be after start time.']);
      return;
    }
    const result = addTimetableEntries([{
      yearId: 'ay1', termId: 't1', classId, className: cls?.name, section: cls?.section || 'A',
      subjectId: form.subjectId,
      subjectName: form.kind === 'lesson' ? subject?.name || form.kind : form.kind === 'assembly' ? 'Morning Assembly' : form.kind === 'break' ? 'Break' : 'Lunch',
      teacherId: form.teacherId, teacherName: teacher?.name || '—', room: form.room,
      day: form.day, startTime: form.startTime, endTime: form.endTime, kind: form.kind,
      status: 'draft',
    }]);
    if (result.ok) {
      setConflicts([]);
      setNotice('Period added as draft. Publish the timetable to make it visible to teachers and students.');
    } else {
      setConflicts(result.conflicts);
      setNotice('');
    }
  };

  const publish = () => {
    publishTimetable(classId);
    setNotice(`Timetable for ${cls?.name} published. Teachers and students now see these lessons in their portals.`);
    addNotification({
      recipientRoles: ['teacher', 'student', 'principal'],
      title: 'Timetable published',
      message: `The weekly timetable for ${cls?.name} has been published.`,
      category: 'timetable',
      relatedPage: 'timetable',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Timetable Builder" subtitle="Build and publish weekly class timetables. Conflicts are detected before saving." />

      {conflicts.length > 0 && (
        <div className="rounded-lg bg-error-50 border border-error-200 text-error-700 text-sm px-4 py-3">
          <p className="font-semibold mb-1">Cannot save — conflicts detected:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {conflicts.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
      )}
      {notice && <div className="rounded-lg bg-success-50 border border-success-200 text-success-700 text-sm px-4 py-3">{notice}</div>}

      <SectionCard title="Select Class">
        <div className="flex flex-wrap gap-2">
          {CLASSES.map((c) => (
            <button
              key={c.id}
              onClick={() => { setClassId(c.id); setConflicts([]); setNotice(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${classId === c.id ? 'bg-navy-700 text-white' : 'bg-navy-50 text-navy-600 hover:bg-navy-100'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SectionCard title="Add Period" >
          <div className="space-y-3">
            <div>
              <label className="form-label">Type</label>
              <select className="input-base" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as TimetableEntry['kind'] })}>
                <option value="lesson">Lesson</option>
                <option value="break">Break</option>
                <option value="lunch">Lunch</option>
                <option value="assembly">Assembly</option>
              </select>
            </div>
            {form.kind === 'lesson' && (
              <>
                <div>
                  <label className="form-label">Subject</label>
                  <select className="input-base" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
                    {SUBJECTS.filter((s) => s.classId === classId).concat(SUBJECTS.filter((s) => s.classId !== classId)).map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.className})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Teacher</label>
                  <select className="input-base" value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })}>
                    {TEST_ACCOUNTS.filter((u) => ['teacher', 'vice_principal'].includes(u.role)).map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="form-label">Room</label>
              <input className="input-base" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="form-label">Day</label>
                <select className="input-base" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value as TimetableEntry['day'] })}>
                  {DAYS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Start</label>
                <input type="time" className="input-base" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              </div>
              <div>
                <label className="form-label">End</label>
                <input type="time" className="input-base" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
              </div>
            </div>
            <button onClick={addEntry} className="btn-primary w-full"><Plus className="w-4 h-4" /> Add Period</button>
          </div>
        </SectionCard>

        <div className="lg:col-span-2">
          <SectionCard
            title={`Weekly Timetable — ${cls?.name}`}
            action={
              <button onClick={publish} className="btn-primary text-sm" disabled={classEntries.length === 0}>
                <Send className="w-4 h-4" /> {hasDraft ? 'Publish Timetable' : 'Republish'}
              </button>
            }
          >
            {classEntries.length === 0 ? (
              <EmptyState icon={<Clock className="w-8 h-8" />} title="No periods yet" message="Add lesson periods using the form to build this class timetable." />
            ) : (
              <div className="overflow-x-auto">
                <table className="table-base min-w-[700px]">
                  <thead><tr><th>Day</th><th>Time</th><th>Subject</th><th>Teacher</th><th>Room</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {classEntries.map((t) => (
                      <tr key={t.id}>
                        <td className="font-medium text-navy-800">{t.day}</td>
                        <td>{t.startTime}–{t.endTime}</td>
                        <td>{t.subjectName}{t.kind !== 'lesson' && <span className="badge-info ml-1">{t.kind}</span>}</td>
                        <td>{t.kind === 'lesson' ? t.teacherName : '—'}</td>
                        <td>{t.room}</td>
                        <td><span className={`badge ${t.status === 'published' ? 'badge-success' : 'badge-warning'}`}>{t.status}</span></td>
                        <td>
                          <button onClick={() => removeTimetableEntry(t.id)} className="p-1.5 rounded-lg bg-error-50 text-error-600 hover:bg-error-100" title="Remove period">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

// ---------------- Published Timetables ----------------
export function VPPublishedTimetables() {
  const { timetable } = useSchoolData();
  const [selectedClass, setSelectedClass] = useState('c5');
  const published = timetable.filter((t) => t.classId === selectedClass && t.status === 'published');
  const cls = CLASSES.find((c) => c.id === selectedClass);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Published Timetables" subtitle="Read-only view of what teachers and students see in their portals." />
      <div className="flex flex-wrap gap-2">
        {CLASSES.map((c) => (
          <button key={c.id} onClick={() => setSelectedClass(c.id)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${selectedClass === c.id ? 'bg-navy-700 text-white' : 'bg-navy-50 text-navy-600 hover:bg-navy-100'}`}>
            {c.name}
          </button>
        ))}
      </div>
      <SectionCard title={`${cls?.name} — Published`}>
        {published.length === 0 ? (
          <EmptyState icon={<Clock className="w-8 h-8" />} title="Not published yet" message="This class timetable has not been published. Use the Timetable Builder to publish it." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base min-w-[700px]">
              <thead><tr><th>Day</th><th>Time</th><th>Subject</th><th>Teacher</th><th>Room</th></tr></thead>
              <tbody>
                {published.sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.startTime.localeCompare(b.startTime)).map((t) => (
                  <tr key={t.id}>
                    <td className="font-medium text-navy-800">{t.day}</td>
                    <td>{t.startTime}–{t.endTime}</td>
                    <td>{t.subjectName}</td>
                    <td>{t.kind === 'lesson' ? t.teacherName : '—'}</td>
                    <td>{t.room}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ---------------- Substitutions ----------------
export function VPSubstitutions() {
  const { substitutions, addSubstitution, updateSubstitution, addNotification } = useSchoolData();
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState('');
  const teachers = TEST_ACCOUNTS.filter((u) => u.role === 'teacher');
  const [form, setForm] = useState({
    originalTeacherId: 'u6', substituteTeacherId: 'u13', classId: 'c5', subjectName: 'Mathematics',
    date: todayISO(), period: '08:00 - 08:40', reason: '',
  });

  const create = () => {
    const original = teachers.find((t) => t.id === form.originalTeacherId);
    const sub = teachers.find((t) => t.id === form.substituteTeacherId);
    if (!form.reason.trim()) { setNotice('A reason is required.'); return; }
    if (form.substituteTeacherId === form.originalTeacherId) { setNotice('Substitute must be a different teacher.'); return; }
    addSubstitution({
      originalTeacherId: form.originalTeacherId, originalTeacherName: original?.name || '—',
      substituteTeacherId: form.substituteTeacherId, substituteTeacherName: sub?.name || '—',
      classId: form.classId, className: CLASSES.find((c) => c.id === form.classId)?.name || '—',
      subjectName: form.subjectName, date: form.date, period: form.period, reason: form.reason,
      status: 'pending',
    });
    setNotice('Substitution recorded. Publish it to update both teachers\' schedules.');
    setShowForm(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Teacher Substitutions"
        subtitle="Record teacher absences and assign replacement teachers."
        action={<button onClick={() => setShowForm(true)} className="btn-primary"><Plus className="w-4 h-4" /> New Substitution</button>}
      />
      {notice && <div className="rounded-lg bg-success-50 border border-success-200 text-success-700 text-sm px-4 py-3">{notice}</div>}

      <SectionCard title={`Substitutions (${substitutions.length})`}>
        {substitutions.length === 0 ? (
          <EmptyState icon={<Repeat className="w-8 h-8" />} title="No substitutions recorded" message="Substitutions created here will update the timetables of both the absent and substitute teachers." />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base min-w-[900px]">
              <thead><tr><th>Date</th><th>Period</th><th>Class</th><th>Subject</th><th>Absent Teacher</th><th>Substitute</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {substitutions.map((s) => (
                  <tr key={s.id}>
                    <td className="font-medium text-navy-800">{s.date}</td>
                    <td>{s.period}</td>
                    <td>{s.className}</td>
                    <td>{s.subjectName}</td>
                    <td>{s.originalTeacherName}</td>
                    <td>{s.substituteTeacherName}</td>
                    <td><span className={`badge ${s.status === 'published' ? 'badge-success' : 'badge-warning'}`}>{s.status}</span></td>
                    <td>
                      {s.status === 'pending' && (
                        <button
                          onClick={() => {
                            updateSubstitution(s.id, { status: 'published' });
                            addNotification({
                              recipientRoles: ['teacher'],
                              title: 'Substitution assigned',
                              message: `${s.substituteTeacherName} will cover ${s.subjectName} — ${s.className} on ${s.date} (${s.period}).`,
                              category: 'timetable',
                              relatedPage: 'timetable',
                            });
                            setNotice('Substitution published — both teachers\' schedules updated.');
                          }}
                          className="btn-primary text-xs py-1.5 px-3"
                        >
                          Publish
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {showForm && (
        <Modal open={showForm} onClose={() => setShowForm(false)} title="New Substitution">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="form-label">Absent Teacher</label>
                <select className="input-base" value={form.originalTeacherId} onChange={(e) => setForm({ ...form, originalTeacherId: e.target.value })}>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Substitute Teacher</label>
                <select className="input-base" value={form.substituteTeacherId} onChange={(e) => setForm({ ...form, substituteTeacherId: e.target.value })}>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Class</label>
                <select className="input-base" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
                  {CLASSES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Subject</label>
                <input className="input-base" value={form.subjectName} onChange={(e) => setForm({ ...form, subjectName: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Date</label>
                <input type="date" className="input-base" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className="form-label">Period</label>
                <input className="input-base" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="form-label">Reason *</label>
              <textarea className="input-base" rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Medical appointment" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button onClick={create} className="btn-primary">Save</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ---------------- Duty Roster ----------------
export function VPDutyRoster() {
  const { timetable, events } = useSchoolData();
  const dutySlots = [
    { time: '07:15 - 07:55', duty: 'Morning Assembly Supervision', area: 'Main Hall' },
    { time: '09:50 - 10:10', duty: 'Morning Break Supervision', area: 'Courtyard' },
    { time: '11:40 - 12:10', duty: 'Corridor Supervision', area: 'Block B Corridors' },
    { time: '12:50 - 13:30', duty: 'Lunch Supervision', area: 'Cafeteria' },
    { time: '15:00 - 15:30', duty: 'Dismissal Supervision', area: 'Main Gate' },
  ];
  const today = DAYS[new Date().getDay() === 0 || new Date().getDay() === 6 ? 0 : new Date().getDay() - 1];
  const onDutyToday = timetable.filter((t) => t.day === today && t.status === 'published').slice(0, 3);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Staff Duty Roster" subtitle="Daily supervision assignments for staff members." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title={`Supervision Slots — ${today}`}>
          <div className="space-y-3">
            {dutySlots.map((slot) => (
              <div key={slot.time} className="flex items-center gap-3 p-3 rounded-lg border border-navy-100">
                <div className="p-2 rounded-lg bg-navy-100 text-navy-700"><Clock className="w-4 h-4" /></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-navy-800">{slot.duty}</p>
                  <p className="text-xs text-navy-400">{slot.time} — {slot.area}</p>
                </div>
                <span className="badge badge-info">{onDutyToday.length} staff scheduled</span>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="This Week's Operational Events">
          {events.filter((e) => e.status === 'published').slice(0, 5).map((e) => (
            <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg border border-navy-100 mb-2">
              <MapPin className="w-4 h-4 text-navy-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-navy-800">{e.title}</p>
                <p className="text-xs text-navy-400">{e.startDate} — {e.venue}</p>
              </div>
            </div>
          ))}
        </SectionCard>
      </div>
    </div>
  );
}
