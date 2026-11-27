import { useState } from 'react';
import { BookCopy, BookMarked, BookX, CheckCircle2, Clock, Download, IdCard, Tags } from 'lucide-react';
import { actions, activeStudents, className, fmtDate, studentById, useSchool } from '@/store/store';
import type { Book, SchoolState } from '@/store/types';
import { downloadCsv } from '@/store/files';
import { Card, Dialog, Field, Header, Notice, Pill, SearchBox, Stat, Table } from '@/components/kit';
import { ContactLinks, greeting, useMe, type PageProps } from './shared';

const today = () => new Date().toISOString().slice(0, 10);
const onLoan = (s: SchoolState, bookId: string) => s.loans.filter((l) => l.bookId === bookId && !l.returnedAt).length;
const available = (s: SchoolState, b: Book) => Math.max(0, b.copies - onLoan(s, b.id) - s.bookIssues.filter((i) => i.bookId === b.id && !i.resolved && i.kind === 'missing').length);
const overdueLoans = (s: SchoolState) => s.loans.filter((l) => !l.returnedAt && l.dueAt < today());
const daysLate = (due: string) => Math.max(0, Math.round((Date.now() - new Date(`${due}T12:00:00`).getTime()) / 86400000));

/** Find a student by student ID (or name) — the librarian's main lookup. */
function StudentLookup({ value, onPick }: { value: string; onPick: (id: string) => void }) {
  const s = useSchool();
  const [q, setQ] = useState('');
  const exact = activeStudents(s).find((x) => x.studentNo.toLowerCase() === q.trim().toLowerCase());
  const hits = exact ? [exact] : q.length > 1 ? activeStudents(s).filter((x) => `${x.studentNo} ${x.name}`.toLowerCase().includes(q.toLowerCase())).slice(0, 6) : [];
  const st = studentById(s, value);
  return (
    <div className="space-y-2">
      <SearchBox value={q} onChange={setQ} placeholder="Student ID (e.g. INNO-2026-001) or name" />
      {hits.map((x) => <button key={x.id} type="button" onClick={() => { onPick(x.id); setQ(''); }} className="block w-full text-left text-sm p-2 rounded-lg hover:bg-navy-50"><span className="font-mono text-xs mr-2">{x.studentNo}</span>{x.name} · {className(x.grade, x.section)}</button>)}
      {st && <div className="rounded-lg bg-navy-50 p-3 text-sm"><p className="font-semibold">{st.name}</p><p className="text-navy-500">{st.studentNo} · {className(st.grade, st.section)} · {s.loans.filter((l) => l.studentId === st.id && !l.returnedAt).length} book(s) on loan</p></div>}
    </div>
  );
}

export function LibraryOverview({ onNavigate }: PageProps) {
  const s = useSchool();
  const me = useMe();
  const copies = s.books.reduce((a, b) => a + b.copies, 0);
  const out = s.loans.filter((l) => !l.returnedAt);
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title={greeting(me.name)} subtitle={`${s.school.name} Library`} action={<button type="button" className="btn-primary" onClick={() => onNavigate('borrowing')}><BookMarked className="w-4 h-4" /> Issue a book</button>} />
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <Stat label="Titles / copies" value={`${s.books.length} / ${copies}`} icon={<BookCopy className="w-5 h-5" />} onClick={() => onNavigate('inventory')} />
        <Stat label="Books on loan" value={out.length} icon={<BookMarked className="w-5 h-5" />} tone="accent" onClick={() => onNavigate('returns')} />
        <Stat label="Overdue books" value={overdueLoans(s).length} icon={<Clock className="w-5 h-5" />} tone="error" onClick={() => onNavigate('overdue')} />
        <Stat label="Damaged / missing" value={s.bookIssues.filter((i) => !i.resolved).length} icon={<BookX className="w-5 h-5" />} tone="warning" onClick={() => onNavigate('damaged-missing')} />
        <Stat label="Categories" value={new Set(s.books.map((b) => b.category)).size} icon={<Tags className="w-5 h-5" />} onClick={() => onNavigate('categories')} />
        <Stat label="Active borrowers" value={new Set(out.map((l) => l.studentId)).size} icon={<IdCard className="w-5 h-5" />} tone="success" onClick={() => onNavigate('library-accounts')} />
      </div>
      <Card title="Recent transactions">
        <Table head={['Date', 'Student', 'Book', 'Type']}>{s.loans.slice().sort((a, b) => (b.returnedAt ?? b.borrowedAt).localeCompare(a.returnedAt ?? a.borrowedAt)).slice(0, 8).map((l) => <tr key={l.id}><td className="text-xs">{fmtDate(l.returnedAt ?? l.borrowedAt)}</td><td>{studentById(s, l.studentId)?.name}</td><td>{s.books.find((b) => b.id === l.bookId)?.title}</td><td>{l.returnedAt ? <Pill tone="success">Returned</Pill> : <Pill tone="accent">Borrowed</Pill>}</td></tr>)}</Table>
      </Card>
    </div>
  );
}

export function BookInventory() {
  const s = useSchool();
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<Book | null>(null);
  const list = s.books.filter((b) => `${b.title} ${b.author} ${b.bookNo} ${b.category}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Book Inventory" subtitle={`${s.books.length} titles · availability updates automatically on borrow and return.`} />
      <Card action={<div className="w-72"><SearchBox value={q} onChange={setQ} placeholder="Title, author, book ID, subject" /></div>}>
        <Table head={['Book ID', 'Title', 'Author', 'Subject', 'Shelf', 'Copies', 'Available', '']}>
          {list.map((b) => { const av = available(s, b); return <tr key={b.id}><td className="font-mono text-xs">{b.bookNo}</td><td className="font-medium">{b.title}</td><td className="text-sm">{b.author}</td><td>{b.category}</td><td className="text-xs">{b.shelf}</td><td>{b.copies}</td><td><Pill tone={av === 0 ? 'error' : av < 2 ? 'warning' : 'success'}>{av}</Pill></td><td><button type="button" className="text-sm text-navy-700 hover:underline" onClick={() => setEdit({ ...b })}>Edit</button></td></tr>; })}
        </Table>
      </Card>
      <Dialog open={!!edit} onClose={() => setEdit(null)} title={`Update ${edit?.bookNo}`} footer={<><button type="button" className="btn-secondary" onClick={() => setEdit(null)}>Cancel</button><button type="button" className="btn-primary" onClick={() => { if (edit) actions.updateBook(edit.id, edit); setEdit(null); }}>Save</button></>}>
        {edit && <div className="grid sm:grid-cols-2 gap-3"><Field label="Title"><input className="input" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field><Field label="Author"><input className="input" value={edit.author} onChange={(e) => setEdit({ ...edit, author: e.target.value })} /></Field><Field label="Subject"><input className="input" value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })} /></Field><Field label="Shelf"><input className="input" value={edit.shelf} onChange={(e) => setEdit({ ...edit, shelf: e.target.value })} /></Field><Field label="Copies"><input type="number" min="0" className="input" value={edit.copies} onChange={(e) => setEdit({ ...edit, copies: Number(e.target.value) })} /></Field><Field label="ISBN"><input className="input" value={edit.isbn} onChange={(e) => setEdit({ ...edit, isbn: e.target.value })} /></Field></div>}
      </Dialog>
    </div>
  );
}

export function AddBook({ onNavigate }: PageProps) {
  const s = useSchool();
  const cats = [...new Set(s.books.map((b) => b.category))];
  const [f, setF] = useState({ title: '', author: '', category: cats[0] ?? 'Mathematics', isbn: '', copies: 1, shelf: '', year: new Date().getFullYear() });
  const [done, setDone] = useState('');
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Add New Books" subtitle={`A book identification number is assigned automatically (next: LIB-${String(s.books.length + 1).padStart(4, '0')}).`} />
      {done && <Notice tone="success"><CheckCircle2 className="inline w-4 h-4 mr-1" /> {done} <button type="button" className="underline ml-2" onClick={() => onNavigate('inventory')}>View inventory</button></Notice>}
      <Card>
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Title"><input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <Field label="Author"><input className="input" value={f.author} onChange={(e) => setF({ ...f, author: e.target.value })} /></Field>
          <Field label="Subject / category"><input className="input" list="cats" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /><datalist id="cats">{cats.map((c) => <option key={c} value={c} />)}</datalist></Field>
          <Field label="ISBN"><input className="input" value={f.isbn} onChange={(e) => setF({ ...f, isbn: e.target.value })} /></Field>
          <Field label="Number of copies"><input type="number" min="1" className="input" value={f.copies} onChange={(e) => setF({ ...f, copies: Number(e.target.value) })} /></Field>
          <Field label="Shelf location"><input className="input" value={f.shelf} onChange={(e) => setF({ ...f, shelf: e.target.value })} placeholder="e.g. MAT-2" /></Field>
        </div>
        <div className="flex justify-end mt-4"><button type="button" className="btn-primary" disabled={!f.title || !f.author || f.copies < 1} onClick={() => { actions.addBook(f); setDone(`"${f.title}" registered as LIB-${String(s.books.length + 1).padStart(4, '0')}.`); setF({ ...f, title: '', author: '', isbn: '', shelf: '', copies: 1 }); }}>Register book</button></div>
      </Card>
    </div>
  );
}

export function BookCategories() {
  const s = useSchool();
  const [open, setOpen] = useState<string | null>(null);
  const cats = [...new Set(s.books.map((b) => b.category))].sort();
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Book Categories" subtitle="Books organized by subject." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cats.map((c) => { const bs = s.books.filter((b) => b.category === c); return <button key={c} type="button" onClick={() => setOpen(c)} className="card p-5 text-left hover:border-navy-300"><p className="font-semibold text-navy-900">{c}</p><p className="text-sm text-navy-500">{bs.length} titles · {bs.reduce((a, b) => a + b.copies, 0)} copies</p></button>; })}
      </div>
      <Dialog open={!!open} onClose={() => setOpen(null)} title={open ?? ''} wide><Table head={['Book ID', 'Title', 'Author', 'Available']}>{s.books.filter((b) => b.category === open).map((b) => <tr key={b.id}><td className="font-mono text-xs">{b.bookNo}</td><td>{b.title}</td><td>{b.author}</td><td>{available(s, b)} / {b.copies}</td></tr>)}</Table></Dialog>
    </div>
  );
}

export function StudentBorrowing() {
  const s = useSchool();
  const [student, setStudent] = useState('');
  const [q, setQ] = useState('');
  const [book, setBook] = useState('');
  const [days, setDays] = useState(14);
  const [done, setDone] = useState('');
  const books = s.books.filter((b) => available(s, b) > 0 && `${b.title} ${b.bookNo}`.toLowerCase().includes(q.toLowerCase())).slice(0, 8);
  const overdue = overdueLoans(s).filter((l) => l.studentId === student);
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Student Borrowing" subtitle="Search the student by ID. The loan is recorded on the student's profile." />
      {done && <Notice tone="success">{done}</Notice>}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="1. Student"><StudentLookup value={student} onPick={(id) => { setStudent(id); setDone(''); }} />{overdue.length > 0 && <div className="mt-3"><Notice tone="warning">This student has {overdue.length} overdue book(s). Collect them before issuing more.</Notice></div>}</Card>
        <Card title="2. Book">
          <SearchBox value={q} onChange={setQ} placeholder="Title or book ID" />
          <div className="mt-2 space-y-1">{books.map((b) => <button key={b.id} type="button" onClick={() => setBook(b.id)} className={`block w-full text-left text-sm p-2 rounded-lg ${book === b.id ? 'bg-navy-100' : 'hover:bg-navy-50'}`}><span className="font-mono text-xs mr-2">{b.bookNo}</span>{b.title} <span className="text-navy-500">({available(s, b)} available)</span></button>)}</div>
          <div className="flex items-end gap-3 mt-4">
            <Field label="Loan period"><select className="input" value={days} onChange={(e) => setDays(Number(e.target.value))}><option value={7}>7 days</option><option value={14}>14 days</option><option value={21}>21 days</option></select></Field>
            <button type="button" className="btn-primary" disabled={!student || !book} onClick={() => { actions.borrowBook(book, student, days); setDone(`Issued "${s.books.find((b) => b.id === book)?.title}" to ${studentById(s, student)?.name}.`); setBook(''); }}>Issue book</button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function BookReturns() {
  const s = useSchool();
  const [student, setStudent] = useState('');
  const [ret, setRet] = useState<string | null>(null);
  const [cond, setCond] = useState<'good' | 'damaged'>('good');
  const [note, setNote] = useState('');
  const loans = s.loans.filter((l) => !l.returnedAt && (!student || l.studentId === student));
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Book Returns" subtitle="Returning a book updates its availability immediately." />
      <Card title="Find by student ID (optional)"><div className="max-w-md"><StudentLookup value={student} onPick={setStudent} /></div>{student && <button type="button" className="text-sm text-navy-600 mt-2" onClick={() => setStudent('')}>Show all loans</button>}</Card>
      <Card title={`Books on loan (${loans.length})`}>
        <Table head={['Book', 'Student', 'Borrowed', 'Due', '']}>{loans.slice(0, 60).map((l) => { const late = l.dueAt < today(); return <tr key={l.id}><td className="font-medium">{s.books.find((b) => b.id === l.bookId)?.title}</td><td>{studentById(s, l.studentId)?.name}</td><td className="text-xs">{fmtDate(l.borrowedAt)}</td><td>{late ? <Pill tone="error">{fmtDate(l.dueAt)}</Pill> : fmtDate(l.dueAt)}</td><td><button type="button" className="btn-primary text-xs py-1.5" onClick={() => { setRet(l.id); setCond('good'); setNote(''); }}>Return</button></td></tr>; })}</Table>
      </Card>
      <Dialog open={!!ret} onClose={() => setRet(null)} title="Record return" footer={<><button type="button" className="btn-secondary" onClick={() => setRet(null)}>Cancel</button><button type="button" className="btn-primary" onClick={() => { if (ret) actions.returnBook(ret, cond, note); setRet(null); }}>Confirm return</button></>}>
        <div className="space-y-3 text-sm"><label className="flex items-center gap-2"><input type="radio" checked={cond === 'good'} onChange={() => setCond('good')} /> Good condition</label><label className="flex items-center gap-2"><input type="radio" checked={cond === 'damaged'} onChange={() => setCond('damaged')} /> Damaged</label>{cond === 'damaged' && <input className="input" placeholder="Describe the damage" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Damage" />}</div>
      </Dialog>
    </div>
  );
}

export function OverdueBooks() {
  const s = useSchool();
  const [sent, setSent] = useState<string[]>([]);
  const list = overdueLoans(s).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Overdue Books" subtitle={`${list.length} books past their due date.`} />
      <Card>
        <Table head={['Book', 'Student', 'Class', 'Due', 'Days late', 'Guardian', '']}>{list.map((l) => { const st = studentById(s, l.studentId); const b = s.books.find((x) => x.id === l.bookId); return <tr key={l.id}><td className="font-medium">{b?.title}</td><td>{st?.name}</td><td>{st && className(st.grade, st.section)}</td><td>{fmtDate(l.dueAt)}</td><td><Pill tone="error">{daysLate(l.dueAt)}</Pill></td><td>{st && <ContactLinks phone={st.guardianPhone} />}</td><td>{sent.includes(l.id) ? <Pill tone="success">Reminded</Pill> : <button type="button" className="btn-secondary text-xs py-1.5" onClick={() => { if (st) actions.sendPrivateStudentNotification(st.id, `Library: "${b?.title}" is overdue`, `It was due on ${fmtDate(l.dueAt)}. Please return it to the library as soon as possible.`); setSent([...sent, l.id]); }}>Send reminder</button>}</td></tr>; })}</Table>
      </Card>
    </div>
  );
}

export function DamagedMissing() {
  const s = useSchool();
  const [f, setF] = useState({ bookId: '', kind: 'damaged' as 'damaged' | 'missing', note: '' });
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Damaged and Missing Books" />
      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        <Card><Table head={['Date', 'Book', 'Type', 'Student', 'Note', 'Status']}>{s.bookIssues.map((i) => <tr key={i.id}><td className="text-xs">{fmtDate(i.date)}</td><td>{s.books.find((b) => b.id === i.bookId)?.title}</td><td><Pill tone={i.kind === 'missing' ? 'error' : 'warning'}>{i.kind}</Pill></td><td className="text-sm">{i.studentId ? studentById(s, i.studentId)?.name : '—'}</td><td className="text-xs">{i.note}</td><td>{i.resolved ? <Pill tone="success">Resolved</Pill> : <button type="button" className="text-sm text-navy-700 hover:underline" onClick={() => actions.resolveBookIssue(i.id)}>Mark resolved</button>}</td></tr>)}</Table></Card>
        <Card title="Report a book">
          <div className="space-y-3">
            <select className="input" value={f.bookId} onChange={(e) => setF({ ...f, bookId: e.target.value })} aria-label="Book"><option value="">Select book</option>{s.books.map((b) => <option key={b.id} value={b.id}>{b.bookNo} — {b.title}</option>)}</select>
            <select className="input" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as typeof f.kind })} aria-label="Type"><option value="damaged">Damaged</option><option value="missing">Missing</option></select>
            <textarea className="input" placeholder="Details" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} aria-label="Details" />
            <button type="button" className="btn-primary w-full" disabled={!f.bookId || !f.note} onClick={() => { actions.reportBookIssue(f); setF({ bookId: '', kind: 'damaged', note: '' }); }}>Report</button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function LibraryAccounts() {
  const s = useSchool();
  const [student, setStudent] = useState('');
  const hist = s.loans.filter((l) => l.studentId === student).sort((a, b) => b.borrowedAt.localeCompare(a.borrowedAt));
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Student Library Accounts" subtitle="Look up a student by ID to see their full borrowing history." />
      <Card><div className="max-w-md"><StudentLookup value={student} onPick={setStudent} /></div></Card>
      {student && <Card title="Borrowing history"><Table head={['Book', 'Borrowed', 'Due', 'Returned', 'Condition']} empty="No borrowing history.">{hist.map((l) => <tr key={l.id}><td>{s.books.find((b) => b.id === l.bookId)?.title}</td><td>{fmtDate(l.borrowedAt)}</td><td>{fmtDate(l.dueAt)}</td><td>{l.returnedAt ? fmtDate(l.returnedAt) : l.dueAt < today() ? <Pill tone="error">Overdue</Pill> : <Pill tone="warning">On loan</Pill>}</td><td>{l.returnCondition ?? '—'}</td></tr>)}</Table></Card>}
    </div>
  );
}

export function LibraryReports() {
  const s = useSchool();
  const stamp = today();
  const popular = s.books.map((b) => ({ b, n: s.loans.filter((l) => l.bookId === b.id).length })).sort((a, b) => b.n - a.n).slice(0, 8);
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Library Reports" action={<>
        <button type="button" className="btn-primary text-sm" onClick={() => downloadCsv(`Library_inventory_${stamp}`, ['Book ID', 'Title', 'Author', 'Subject', 'Copies', 'On loan', 'Available'], s.books.map((b) => [b.bookNo, b.title, b.author, b.category, b.copies, onLoan(s, b.id), available(s, b)]))}><Download className="w-4 h-4" /> Inventory</button>
        <button type="button" className="btn-secondary text-sm" onClick={() => downloadCsv(`Library_loans_${stamp}`, ['Book', 'Student ID', 'Student', 'Borrowed', 'Due', 'Returned'], s.loans.map((l) => { const st = studentById(s, l.studentId); return [s.books.find((b) => b.id === l.bookId)?.title, st?.studentNo, st?.name, l.borrowedAt, l.dueAt, l.returnedAt ?? '']; }))}><Download className="w-4 h-4" /> Circulation</button>
        <button type="button" className="btn-secondary text-sm" onClick={() => downloadCsv(`Library_overdue_${stamp}`, ['Book', 'Student', 'Due', 'Days late'], overdueLoans(s).map((l) => [s.books.find((b) => b.id === l.bookId)?.title, studentById(s, l.studentId)?.name, l.dueAt, daysLate(l.dueAt)]))}><Download className="w-4 h-4" /> Overdue</button>
      </>} />
      <div className="grid sm:grid-cols-4 gap-4"><Stat label="Total loans" value={s.loans.length} /><Stat label="Returned" value={s.loans.filter((l) => l.returnedAt).length} tone="success" /><Stat label="Overdue" value={overdueLoans(s).length} tone="error" /><Stat label="Damaged / missing" value={s.bookIssues.length} tone="warning" /></div>
      <Card title="Most borrowed titles"><Table head={['Title', 'Subject', 'Times borrowed']}>{popular.map(({ b, n }) => <tr key={b.id}><td>{b.title}</td><td>{b.category}</td><td>{n}</td></tr>)}</Table></Card>
    </div>
  );
}
