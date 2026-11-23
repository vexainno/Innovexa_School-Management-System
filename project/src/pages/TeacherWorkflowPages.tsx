import { useState } from 'react';
import {
  CalendarDays, Clock, MapPin, DoorOpen, Plus, CheckCircle2, Circle, BookOpen, Users2,
} from 'lucide-react';
import { PageHeader, SectionCard, EmptyState, Modal } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useSchoolData } from '@/context/SchoolDataContext';
import { CLASSES } from '@/data/mockData';
import type { LessonPlan, TimetableEntry } from '@/types';

const DAYS: TimetableEntry['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// ---------------- Teacher Timetable (My Teaching Schedule) ----------------
export function TeacherTimetable() {
  const { timetable, substitutions } = useSchoolData();
  const { user } = useAuth();
  const [day, setDay] = useState<TimetableEntry['day']>(
    DAYS[new Date().getDay() === 0 || new Date().getDay() === 6 ? 0 : new Date().getDay() - 1],
  );

  const mine = timetable.filter(
    (e) => e.status === 'published' && e.kind === 'lesson' && e.teacherId === user?.id,
  );
  const subsForMe = substitutions.filter(
    (s) => s.status === 'published' && s.originalTeacherId === user?.id && s.date === todayISO(),
  );
  const dayEntries = mine.filter((e) => e.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="My Timetable"
        subtitle="Your published weekly teaching schedule from the Vice Principal."
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
            {d}
          </button>
        ))}
      </div>
      {mine.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={<CalendarDays className="w-8 h-8" />}
            title="No published schedule yet"
            message="Once the Vice Principal publishes the timetable, your lessons appear here automatically."
          />
        </SectionCard>
      ) : dayEntries.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={<Clock className="w-8 h-8" />}
            title={`Nothing scheduled on ${day}`}
            message="Enjoy the free day — no lessons are scheduled for you."
          />
        </SectionCard>
      ) : (
        <SectionCard title={`${day} — ${dayEntries.length} lesson${dayEntries.length === 1 ? '' : 's'}`}>
          <div className="space-y-3">
            {dayEntries.map((e) => (
              <div key={e.id} className="flex items-center gap-4 p-4 rounded-xl border border-navy-100 bg-white">
                <div className="px-3 py-2 rounded-lg bg-navy-50 text-navy-700 text-sm font-semibold whitespace-nowrap">
                  {e.startTime}–{e.endTime}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-navy-800">{e.subjectName}</p>
                  <div className="flex items-center gap-4 text-xs text-navy-400 mt-1">
                    <span className="flex items-center gap-1"><Users2 />{e.className ?? e.classId}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{e.room}</span>
                    <span className="flex items-center gap-1"><DoorOpen className="w-3 h-3" />Section {e.section}</span>
                  </div>
                </div>
              </div>
            ))}
            {subsForMe.length > 0 && (
              <div className="p-3 rounded-lg bg-warning-50 border border-warning-200 text-sm text-warning-800">
                <p className="font-medium">Substitutions today</p>
                {subsForMe.map((s) => (
                  <p key={s.id} className="text-xs mt-1">
                    {s.period} — {s.className} {s.subjectName}: covered by {s.substituteTeacherName}
                  </p>
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ---------------- Teacher Lesson Plans ----------------
export function TeacherLessonPlans() {
  const { lessonPlans, addLessonPlan, updateLessonPlan, removeLessonPlan } = useSchoolData();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<LessonPlan | null>(null);
  const emptyForm = {
    subjectName: '', classId: CLASSES[0]?.id ?? '', week: '', topic: '',
    objectives: '', methods: '', materials: '', homework: '',
  };
  const [form, setForm] = useState(emptyForm);

  const mine = lessonPlans
    .filter((l) => l.teacherId === user?.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const openNew = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (l: LessonPlan) => {
    setEditing(l);
    setForm({
      subjectName: l.subjectName, classId: l.classId, week: l.week, topic: l.topic,
      objectives: l.objectives, methods: l.methods, materials: l.materials, homework: l.homework,
    });
    setShowForm(true);
  };

  const submit = () => {
    if (!user || !form.topic.trim() || !form.week.trim()) return;
    const cls = CLASSES.find((c) => c.id === form.classId);
    const payload = {
      teacherId: user.id,
      teacherName: user.name,
      subjectName: form.subjectName.trim() || 'General',
      classId: form.classId,
      className: cls ? cls.name : form.classId,
      week: form.week.trim(),
      topic: form.topic.trim(),
      objectives: form.objectives.trim(),
      methods: form.methods.trim(),
      materials: form.materials.trim(),
      homework: form.homework.trim(),
    };
    if (editing) updateLessonPlan(editing.id, payload);
    else addLessonPlan(payload);
    setShowForm(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Lesson Plans"
        subtitle="Plan your weekly topics, objectives and materials."
        action={
          <button className="btn-primary" onClick={openNew}>
            <Plus className="w-4 h-4" /> New Lesson Plan
          </button>
        }
      />
      {mine.length === 0 ? (
        <SectionCard>
          <EmptyState
            icon={<BookOpen className="w-8 h-8" />}
            title="No lesson plans yet"
            message="Create your first lesson plan to organise your weekly teaching."
          />
        </SectionCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {mine.map((l) => (
            <SectionCard key={l.id} title={l.topic} action={
              <span className={l.completed ? 'badge-success' : 'badge-warning'}>
                {l.completed ? 'Completed' : 'In progress'}
              </span>
            }>
              <p className="text-sm text-navy-500">{l.className} · {l.subjectName} · {l.week}</p>
              {l.objectives && <p className="text-sm text-navy-600 mt-2"><span className="font-medium">Objectives:</span> {l.objectives}</p>}
              {l.homework && <p className="text-sm text-navy-600 mt-1"><span className="font-medium">Homework:</span> {l.homework}</p>}
              <div className="flex gap-2 mt-4">
                <button className="btn-secondary text-sm" onClick={() => openEdit(l)}>Edit</button>
                <button
                  className={`text-sm ${l.completed ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => updateLessonPlan(l.id, { completed: !l.completed })}
                >
                  {l.completed ? <><Circle className="w-4 h-4" /> Mark in progress</> : <><CheckCircle2 className="w-4 h-4" /> Mark completed</>}
                </button>
                <button className="btn-danger text-sm" onClick={() => removeLessonPlan(l.id)}>Delete</button>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Edit Lesson Plan' : 'New Lesson Plan'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Class</label>
              <select
                className="input-base"
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value })}
              >
                {CLASSES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Subject</label>
              <input
                className="input-base" placeholder="e.g. Mathematics"
                value={form.subjectName}
                onChange={(e) => setForm({ ...form, subjectName: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="form-label">Week</label>
            <input
              className="input-base" placeholder="e.g. Week 5 (Mar 2 – Mar 6)"
              value={form.week}
              onChange={(e) => setForm({ ...form, week: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Topic *</label>
            <input
              className="input-base" placeholder="Lesson topic"
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Learning objectives</label>
            <textarea
              className="input-base" rows={2}
              value={form.objectives}
              onChange={(e) => setForm({ ...form, objectives: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Teaching methods</label>
              <input
                className="input-base"
                value={form.methods}
                onChange={(e) => setForm({ ...form, methods: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Materials</label>
              <input
                className="input-base"
                value={form.materials}
                onChange={(e) => setForm({ ...form, materials: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="form-label">Homework</label>
            <input
              className="input-base"
              value={form.homework}
              onChange={(e) => setForm({ ...form, homework: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn-primary" onClick={submit}>
              {editing ? 'Save changes' : 'Create lesson plan'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
