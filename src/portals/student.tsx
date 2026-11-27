import { BookOpen, FileBadge } from 'lucide-react';
import { batchStage, BATCH_LABEL, className, fmtDate, studentById, studentIdForUser, useSchool } from '@/store/store';
import { Card, Header, Notice, Pill, Table } from '@/components/kit';
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
  const loans = s.loans.filter((l) => l.studentId === id);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="space-y-6 animate-fade-in">
      <Header title="Library" subtitle="Books currently borrowed and your borrowing history." />
      <Card title="My loans">
        <Table head={['Book', 'Borrowed', 'Due', 'Status']} empty="You have no library loans.">
          {loans.map((l) => { const b = s.books.find((x) => x.id === l.bookId); const overdue = !l.returnedAt && l.dueAt < today; return <tr key={l.id}><td className="font-medium"><BookOpen className="inline w-4 h-4 mr-1 text-navy-400" />{b?.title}</td><td>{fmtDate(l.borrowedAt)}</td><td>{fmtDate(l.dueAt)}</td><td>{l.returnedAt ? <Pill tone="success">Returned {fmtDate(l.returnedAt)}</Pill> : overdue ? <Pill tone="error">Overdue</Pill> : <Pill tone="warning">On loan</Pill>}</td></tr>; })}
        </Table>
      </Card>
      <Card title="Catalogue">
        <Table head={['Title', 'Author', 'Subject', 'Available']}>
          {s.books.map((b) => { const out = s.loans.filter((l) => l.bookId === b.id && !l.returnedAt).length; return <tr key={b.id}><td>{b.title}</td><td>{b.author}</td><td>{b.category}</td><td>{Math.max(0, b.copies - out)} of {b.copies}</td></tr>; })}
        </Table>
      </Card>
    </div>
  );
}
