import { useMemo, useState } from 'react';
import { Bell, CalendarDays, CheckCheck, HeartHandshake, Megaphone, Send } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { Role } from '@/types';
import type { Audience } from '@/store/types';
import { actions, announcementVisibleTo, fmtDate, notificationsFor, studentById, studentIdForUser, useSchool } from '@/store/store';
import { Card, Dialog, Header, Notice, Pill, Tabs } from '@/components/kit';

export type PageProps = { onNavigate: (page: string) => void; param?: string };

export function useMe() {
  const { user } = useAuth();
  if (!user) throw new Error('Not signed in');
  return user;
}

export function greeting(name: string) {
  const h = new Date().getHours();
  return `${h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'}, ${name}`;
}

function MessageThread({ id, onClose }: { id: string | null; onClose: () => void }) {
  const me = useMe();
  const school = useSchool();
  const n = school.notifications.find((x) => x.id === id);
  const [text, setText] = useState('');
  if (!n) return null;
  const canReply = me.role === 'student' && n.from === 'counselor';
  return (
    <Dialog open onClose={onClose} wide title={n.title} footer={canReply ? (
      <div className="flex w-full gap-2">
        <textarea className="input min-h-[44px] flex-1" rows={2} placeholder="Write a private reply to the counselor…" value={text} onChange={(e) => setText(e.target.value)} aria-label="Reply" />
        <button type="button" className="btn-primary self-end" disabled={!text.trim()} onClick={() => { actions.replyToNotification(n.id, { from: 'student', name: me.name, text: text.trim() }); setText(''); }}><Send className="w-4 h-4" /> Send</button>
      </div>
    ) : undefined}>
      <div className="flex items-center gap-2 text-sm text-navy-500 mb-3">{n.from === 'counselor' && <><HeartHandshake className="w-4 h-4" /> Guidance Counselor ·</>} {fmtDate(n.createdAt)} {n.studentOnly && <Pill tone="accent">Private — only you can see this</Pill>}</div>
      <div className="rounded-xl bg-navy-50 p-4 text-sm text-navy-800 whitespace-pre-line">{n.body}</div>
      {(n.replies ?? []).length > 0 && (
        <div className="space-y-3 mt-4">
          {n.replies!.map((r, i) => <div key={i} className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-line ${r.from === 'student' ? 'ml-auto bg-navy-700 text-white' : 'bg-success-50 text-navy-800'}`}>{r.text}<p className="text-[10px] opacity-70 mt-1">{r.from === 'student' ? 'You' : r.name} · {fmtDate(r.at)}</p></div>)}
        </div>
      )}
      {canReply && <p className="text-xs text-navy-400 mt-4">Your reply goes only to the Guidance Counselor. Parents and teachers cannot see this conversation. If you are in danger right now, tell a teacher or call for help immediately.</p>}
    </Dialog>
  );
}

export function NotificationsPage({ onNavigate, param }: PageProps) {
  const me = useMe();
  const school = useSchool();
  const list = notificationsFor(school, me);
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const [thread, setThread] = useState<string | null>(param && school.notifications.some((n) => n.id === param) ? param : null);
  const shown = tab === 'unread' ? list.filter((n) => !n.readBy.includes(me.id)) : list;
  return (
    <div className="animate-fade-in">
      <Header title="Notifications" subtitle="Workflow updates addressed to you. Private items are visible only to you." action={
        <button type="button" className="btn-secondary text-sm" onClick={() => actions.markAllRead(list.map((n) => n.id), me.id)}><CheckCheck className="w-4 h-4" /> Mark all as read</button>
      } />
      <Tabs tabs={[{ id: 'all', label: 'All', count: list.length }, { id: 'unread', label: 'Unread', count: list.filter((n) => !n.readBy.includes(me.id)).length }]} value={tab} onChange={setTab} />
      <div className="space-y-2">
        {shown.length === 0 && <Card><p className="text-sm text-navy-500 text-center py-6">You're all caught up.</p></Card>}
        {shown.map((n) => {
          const unread = !n.readBy.includes(me.id);
          return (
            <button key={n.id} type="button" onClick={() => { actions.markRead(n.id, me.id); if (n.from === 'counselor' || n.link?.startsWith('notifications:')) { setThread(n.link?.startsWith('notifications:') ? n.link.split(':')[1] : n.id); } else if (n.link && n.link !== 'notifications') onNavigate(n.link); }}
              className={`card w-full text-left p-4 flex gap-3 hover:border-navy-300 ${unread ? 'border-l-4 border-l-navy-600' : ''}`}>
              <Bell className={`w-5 h-5 shrink-0 mt-0.5 ${unread ? 'text-navy-700' : 'text-navy-300'}`} />
              <span className="flex-1 min-w-0">
                <span className="flex flex-wrap items-center gap-2"><span className={`text-sm ${unread ? 'font-semibold text-navy-900' : 'text-navy-700'}`}>{n.title}</span>{n.studentOnly && <Pill tone="accent">Private</Pill>}{n.from === 'counselor' && <Pill tone="success">{(n.replies ?? []).length ? `${n.replies!.length} repl${n.replies!.length === 1 ? 'y' : 'ies'}` : 'Open to reply'}</Pill>}</span>
                <span className="block text-sm text-navy-500 mt-0.5">{n.body}</span>
                <span className="block text-xs text-navy-400 mt-1">{fmtDate(n.createdAt)}</span>
              </span>
            </button>
          );
        })}
      </div>
      <MessageThread key={thread ?? ''} id={thread} onClose={() => setThread(null)} />
    </div>
  );
}

const AUDIENCES: { id: Audience; label: string }[] = [
  { id: 'all', label: 'Entire school' },
  { id: 'teachers', label: 'Teaching staff' },
  { id: 'parents', label: 'Parents / guardians' },
  { id: 'students', label: 'Students' },
  { id: 'admin_staff', label: 'Administrative staff (Registrar, Finance, etc.)' },
];

export function AnnouncementsPage({ canPost }: PageProps & { canPost?: boolean }) {
  const me = useMe();
  const school = useSchool();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [aud, setAud] = useState<Audience[]>([]);
  const [sent, setSent] = useState(false);
  const linked = me.role === 'parent' ? me.linkedStudentIds ?? [] : me.role === 'student' ? [studentIdForUser(me)] : [];
  const visible = school.announcements.filter((a) => announcementVisibleTo(a, me.role) && (
    a.grade == null || a.fromName === me.name || me.role === 'principal'
    || linked.some((id) => { const st = studentById(school, id); return st?.grade === a.grade && st?.section === a.section; })
  ));
  const post = () => {
    if (!title.trim() || !message.trim() || !aud.length) return;
    actions.postAnnouncement({ title: title.trim(), message: message.trim(), audience: aud, fromName: me.name, fromRole: me.role });
    setTitle(''); setMessage(''); setAud([]); setSent(true);
    setTimeout(() => setSent(false), 4000);
  };
  const label = (a: Audience) => AUDIENCES.find((x) => x.id === a)?.label.split(' (')[0];
  return (
    <div className="animate-fade-in space-y-6">
      <Header title="Announcements" subtitle={canPost ? 'Publish an announcement and choose exactly who receives it.' : 'School announcements addressed to you.'} />
      {canPost && (
        <Card title="New announcement">
          <div className="space-y-4">
            <label className="block"><span className="label">Title</span><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Second marking period results" /></label>
            <label className="block"><span className="label">Message</span><textarea className="input min-h-[120px]" value={message} onChange={(e) => setMessage(e.target.value)} /></label>
            <fieldset>
              <legend className="label">Send to</legend>
              <div className="grid sm:grid-cols-2 gap-2">
                {AUDIENCES.map((a) => (
                  <label key={a.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer ${aud.includes(a.id) ? 'border-navy-600 bg-navy-50' : 'border-navy-200'}`}>
                    <input type="checkbox" checked={aud.includes(a.id)} onChange={() => setAud(aud.includes(a.id) ? aud.filter((x) => x !== a.id) : [...aud, a.id])} />
                    {a.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex items-center justify-between gap-3">
              {sent ? <Notice tone="success">Announcement published. Recipients see it in their notifications.</Notice> : <span className="text-xs text-navy-400">Recipients are notified inside the platform.</span>}
              <button type="button" className="btn-primary" disabled={!title.trim() || !message.trim() || !aud.length} onClick={post}><Send className="w-4 h-4" /> Publish</button>
            </div>
          </div>
        </Card>
      )}
      <Card title={canPost ? 'Published and received announcements' : 'Announcements'}>
        <div className="divide-y divide-navy-100">
          {visible.length === 0 && <p className="text-sm text-navy-500 py-4">No announcements yet.</p>}
          {visible.map((a) => (
            <article key={a.id} className="py-4 first:pt-0">
              <div className="flex flex-wrap items-center gap-2">
                <Megaphone className="w-4 h-4 text-navy-500" />
                <h3 className="font-semibold text-navy-900">{a.title}</h3>
                {a.grade != null ? <Pill tone="accent">Grade {a.grade}{a.section}</Pill> : a.audience.map((x) => <Pill key={x}>{label(x)}</Pill>)}
              </div>
              <p className="text-sm text-navy-700 mt-1.5 whitespace-pre-line">{a.message}</p>
              <p className="text-xs text-navy-400 mt-1">{a.fromName} · {fmtDate(a.date)}</p>
            </article>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function CalendarPage({ editable }: PageProps & { editable?: boolean }) {
  const school = useSchool();
  const me = useMe();
  const staffView = !(['student', 'parent'] as Role[]).includes(me.role);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [form, setForm] = useState({ date: '', title: '', kind: 'event' as const, internal: false });
  const events = school.calendar.filter((e) => staffView || !e.internal).sort((a, b) => a.date.localeCompare(b.date));
  const days = useMemo(() => {
    const [y, m] = month.split('-').map(Number);
    const first = new Date(y, m - 1, 1);
    const start = (first.getDay() + 6) % 7;
    const count = new Date(y, m, 0).getDate();
    return { start, count, y, m };
  }, [month]);
  const shift = (n: number) => { const d = new Date(days.y, days.m - 1 + n, 1); setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); };
  const on = (day: number) => {
    const iso = `${month}-${String(day).padStart(2, '0')}`;
    return events.filter((e) => e.date === iso || (e.endDate && e.date <= iso && e.endDate >= iso));
  };
  const tone = (k: string) => (k === 'holiday' ? 'bg-success-100 text-success-800' : k === 'exam' ? 'bg-error-100 text-error-700' : k === 'deadline' ? 'bg-warning-100 text-warning-800' : k === 'release' ? 'bg-accent-100 text-accent-800' : 'bg-navy-100 text-navy-700');
  return (
    <div className="animate-fade-in space-y-6">
      <Header title="School Calendar" subtitle={`${school.school.academicYear} academic year${staffView ? ' · internal deadlines are visible to staff only' : ''}`} />
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <Card title={new Date(days.y, days.m - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} action={
          <div className="flex gap-2"><button type="button" className="btn-secondary text-sm py-1.5" onClick={() => shift(-1)}>Previous</button><button type="button" className="btn-secondary text-sm py-1.5" onClick={() => shift(1)}>Next</button></div>
        }>
          <div className="grid grid-cols-7 gap-1 text-xs">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d} className="text-center font-semibold text-navy-500 py-1">{d}</div>)}
            {Array.from({ length: days.start }).map((_, i) => <div key={`b${i}`} />)}
            {Array.from({ length: days.count }).map((_, i) => (
              <div key={i} className="min-h-[72px] border border-navy-100 rounded-md p-1">
                <div className="text-navy-500">{i + 1}</div>
                {on(i + 1).map((e) => <div key={e.id} className={`mt-0.5 rounded px-1 py-0.5 truncate ${tone(e.kind)}`} title={e.title}>{e.title}</div>)}
              </div>
            ))}
          </div>
        </Card>
        <div className="space-y-6">
          <Card title="Upcoming">
            <ul className="space-y-3">
              {events.filter((e) => (e.endDate ?? e.date) >= new Date().toISOString().slice(0, 10)).slice(0, 8).map((e) => (
                <li key={e.id} className="flex gap-3 text-sm"><CalendarDays className="w-4 h-4 text-navy-400 mt-0.5" /><span><span className="block font-medium text-navy-800">{e.title}</span><span className="text-xs text-navy-500">{fmtDate(e.date)}{e.endDate ? ` – ${fmtDate(e.endDate)}` : ''} {e.internal && '· internal'}</span></span></li>
              ))}
            </ul>
          </Card>
          {editable && (
            <Card title="Add calendar entry">
              <div className="space-y-3">
                <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} aria-label="Date" />
                <input className="input" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <select className="input" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as typeof form.kind })}>
                  {['event', 'holiday', 'exam', 'deadline', 'meeting', 'release'].map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.internal} onChange={(e) => setForm({ ...form, internal: e.target.checked })} /> Internal (staff only)</label>
                <button type="button" className="btn-primary w-full" disabled={!form.date || !form.title} onClick={() => { actions.addCalendarEvent(form); setForm({ date: '', title: '', kind: 'event', internal: false }); }}>Add</button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export function ContactLinks({ phone, email }: { phone?: string; email?: string }) {
  return (
    <span className="flex flex-col text-xs">
      {phone && <a className="text-navy-700 hover:underline" href={`tel:${phone.replace(/\s/g, '')}`}>{phone}</a>}
      {email && <a className="text-navy-500 hover:underline" href={`mailto:${email}`}>{email}</a>}
    </span>
  );
}
