import { useState } from 'react';
import { FileBadge } from 'lucide-react';
import { actions, batchStage, BATCH_LABEL, className, fmtDate, studentById, studentIdForUser, useSchool } from '@/store/store';
import { Card, Dialog, Header, Notice, Pill, SearchBox, Table } from '@/components/kit';
import { BookCover } from '@/components/BookCover';
import { ReportCardView } from '@/components/ReportCard';
import { SectionTimetable } from './academic';
import { useMe } from './shared';

/** Shown to a student, or to a guardian for one linked child. Never shows another student's card. */
export function ReleasedReportCard({ studentId }: { studentId: string }) {
  const s = useSchool();
  const st = studentById(s, studentId);
  if (!st) return null;
  const stage = batchStage(s, st.grade, st.section);
  const batch = s.batches.find((b) => b.key === `${st.grade}${st.section}`);
  if (stage !== 'released' || !batch?.sheets[studentId]) {
    return (
      <Card>
        <div className="flex flex-col items-center text-center py-10">
          <FileBadge className="w-10 h-10 text-navy-300 mb-3" />
          <h3 className="font-semibold text-navy-800">Report card not yet released</h3>
          <p className="text-sm text-navy-500 mt-1 max-w-md">The {s.school.academicYear} report card for {className(st.grade, st.section)} will appear here once the Principal authorizes release and the Academic Officer releases it. Current stage: {BATCH_LABEL[stage]}.</p>
        </div>
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      <Notice tone="success">Released on {fmtDate(batch.releasedAt)}. This report card is private to {st.firstName} and their guardian(s).</Notice>
      <ReportCardView school={s} studentId={studentId} />
    </div>
  );
}

export function StudentReportCard() {
  const me = useMe();
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="My Report Card" />
      <ReleasedReportCard studentId={studentIdForUser(me)} />
    </div>
  );
}

export function StudentTimetable() {
  const me = useMe();
  const s = useSchool();
  const st = studentById(s, studentIdForUser(me));
  if (!st) return null;
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="My Timetable" subtitle={`${className(st.grade, st.section)} · published by the Vice Principal`} />
      <Card><SectionTimetable grade={st.grade} section={st.section} /></Card>
    </div>
  );
}

export function StudentLibrary() {
  const me = useMe();
  const s = useSchool();
  const id = studentIdForUser(me);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [book, setBook] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [flash, setFlash] = useState('');
  const loans = s.loans.filter((l) => l.studentId === id);
  const requests = s.bookRequests.filter((r) => r.studentId === id);
  const today = new Date().toISOString().slice(0, 10);
  const avail = (bid: string) => { const b = s.books.find((x) => x.id === bid)!; return Math.max(0, b.copies - s.loans.filter((l) => l.bookId === bid && !l.returnedAt).length); };
  const cats = [...new Set(s.books.map((b) => b.category))].sort();
  const list = s.books.filter((b) => (!cat || b.category === cat) && `${b.title} ${b.author} ${b.category}`.toLowerCase().includes(q.toLowerCase()));
  const sel = s.books.find((b) => b.id === book);
  const pending = (bid: string) => requests.some((r) => r.bookId === bid && (r.status === 'pending' || r.status === 'approved'));
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Library" subtitle="Browse the school library and book a copy. The librarian confirms when it's ready to collect." />
      {flash && <Notice tone="success">{flash}</Notice>}
      {(requests.length > 0 || loans.some((l) => !l.returnedAt)) && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card title="My book requests">
            <Table head={['Book', 'Requested', 'Status', '']} empty="No requests yet.">
              {requests.map((r) => { const b = s.books.find((x) => x.id === r.bookId); return <tr key={r.id}><td className="font-medium">{b?.title}</td><td className="text-xs">{fmtDate(r.requestedAt)}</td><td>{r.status === 'approved' ? <Pill tone="success">Ready — collect by {fmtDate(r.pickupBy)}</Pill> : r.status === 'pending' ? <Pill tone="warning">Waiting for librarian</Pill> : r.status === 'collected' ? <Pill>Collected</Pill> : <Pill tone="muted">{r.status}</Pill>}{r.status === 'declined' && r.note && <p className="text-xs text-navy-500">{r.note}</p>}</td><td>{r.status === 'pending' && <button type="button" className="text-xs text-error-600 hover:underline" onClick={() => actions.decideBookRequest(r.id, 'cancelled')}>Cancel</button>}</td></tr>; })}
            </Table>
          </Card>
          <Card title="Books I have">
            <Table head={['Book', 'Due', 'Status']} empty="You have no books on loan.">
              {loans.filter((l) => !l.returnedAt).map((l) => { const b = s.books.find((x) => x.id === l.bookId); return <tr key={l.id}><td className="font-medium">{b?.title}</td><td>{fmtDate(l.dueAt)}</td><td>{l.dueAt < today ? <Pill tone="error">Overdue</Pill> : <Pill tone="warning">On loan</Pill>}</td></tr>; })}
            </Table>
          </Card>
        </div>
      )}
      <Card title="Catalogue" action={<div className="flex flex-wrap gap-2"><div className="w-60"><SearchBox value={q} onChange={setQ} placeholder="Title, author or subject" /></div><select className="input py-2 text-sm w-40" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Subject"><option value="">All subjects</option>{cats.map((c) => <option key={c}>{c}</option>)}</select></div>}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {list.map((b) => { const a = avail(b.id); return (
            <button key={b.id} type="button" onClick={() => { setBook(b.id); setNote(''); }} className="text-left group">
              <BookCover book={b} />
              <p className="mt-2 text-sm font-semibold text-navy-900 line-clamp-2 group-hover:underline">{b.title}</p>
              <p className="text-xs text-navy-500">{b.author}</p>
              <p className={`text-xs mt-0.5 ${a ? 'text-success-700' : 'text-error-600'}`}>{a ? `${a} available` : 'All copies on loan'}</p>
            </button>
          ); })}
        </div>
        {!list.length && <p className="text-sm text-navy-500">No books match your search.</p>}
      </Card>
      <Dialog open={!!sel} onClose={() => setBook(null)} wide title={sel?.title ?? ''} footer={sel && <>
        <button type="button" className="btn-secondary" onClick={() => setBook(null)}>Close</button>
        <button type="button" className="btn-primary" disabled={pending(sel.id)} onClick={() => { actions.requestBook(sel.id, id, note.trim()); setFlash(`Request sent for "${sel.title}". You'll be notified when it's ready to collect.`); setBook(null); }}>{pending(sel.id) ? 'Already requested' : avail(sel.id) ? 'Book this' : 'Join the waiting list'}</button>
      </>}>
        {sel && (
          <div className="grid sm:grid-cols-[160px_1fr] gap-5">
            <BookCover book={sel} />
            <div className="space-y-2 text-sm">
              <p><span className="text-navy-500">Author:</span> {sel.author}</p>
              <p><span className="text-navy-500">Subject:</span> {sel.category}</p>
              <p><span className="text-navy-500">Book ID:</span> {sel.bookNo} · <span className="text-navy-500">Shelf:</span> {sel.shelf}</p>
              <p><span className="text-navy-500">Published:</span> {sel.year} · <span className="text-navy-500">ISBN:</span> {sel.isbn}</p>
              <p><span className="text-navy-500">Availability:</span> {avail(sel.id)} of {sel.copies} copies</p>
              {sel.description && <p className="text-navy-700 pt-2">{sel.description}</p>}
              <label className="block pt-2"><span className="label">Note to the librarian (optional)</span><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. I need it for my project" /></label>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
