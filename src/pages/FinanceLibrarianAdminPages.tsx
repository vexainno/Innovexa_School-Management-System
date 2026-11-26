import { useState } from 'react';
import {
  Receipt, FileText, CreditCard, AlertCircle, ReceiptText, BarChart3,
  BookOpen, BookPlus, Inbox, BookMarked, History, Library, Check, X,
  Users, Shield, KeyRound, Building2, Plug, ScrollText, GraduationCap,
  Lock, Unlock, RotateCcw, Search, Plus, Settings, AlertTriangle,
  Download, CheckCircle2, Save,
} from 'lucide-react';
import { PageHeader, StatCard, SectionCard, EmptyState, Avatar, Modal } from '@/components/ui';
import {
  INVOICES, PAYMENTS, BOOKS, BOOK_REQUESTS, SYSTEM_USERS, AUDIT_LOGS,
  CLASSES, SUBJECTS, SCHOOL_INFO,
} from '@/data/mockData';
import type { Book, BookRequest, Payment, Role } from '@/types';
import { getUsers, setUsers } from '@/data/workflow';

// --- Finance Officer ---
export function FinanceDashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const totalFees = INVOICES.reduce((sum, i) => sum + i.amount, 0);
  const totalPaid = INVOICES.reduce((sum, i) => sum + i.amountPaid, 0);
  const outstanding = totalFees - totalPaid;
  const pendingPayments = PAYMENTS.filter((p) => p.status === 'pending_verification');
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Finance Dashboard" subtitle="School financial overview." />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Fees" value={`L$${totalFees.toLocaleString()}`} icon={<Receipt className="w-5 h-5" />} onClick={() => onNavigate('fees')} />
        <StatCard label="Collected" value={`L$${totalPaid.toLocaleString()}`} icon={<CreditCard className="w-5 h-5" />} color="success" onClick={() => onNavigate('payments')} />
        <StatCard label="Outstanding" value={`L$${outstanding.toLocaleString()}`} icon={<AlertCircle className="w-5 h-5" />} color="error" onClick={() => onNavigate('outstanding')} />
        <StatCard label="Pending Verification" value={pendingPayments.length} icon={<ReceiptText className="w-5 h-5" />} color="warning" onClick={() => onNavigate('payments')} />
      </div>
      <SectionCard title="Payments Awaiting Verification">
        <div className="space-y-3">
          {pendingPayments.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-navy-100">
              <div className="p-2 rounded-lg bg-warning-100 text-warning-700"><ReceiptText className="w-4 h-4" /></div>
              <div className="flex-1"><p className="text-sm font-medium text-navy-800">{p.studentName} — L${p.amount.toLocaleString()}</p><p className="text-xs text-navy-400">{p.method} — {p.reference} — {p.date}</p></div>
              <span className="badge-warning">Pending</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export function FinanceFees() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Student Fees" subtitle="Manage student fee structures." />
      <SectionCard title="Fee Summary">
        <table className="table-base">
          <thead><tr><th>Student</th><th>Description</th><th>Term</th><th>Amount</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead>
          <tbody>
            {INVOICES.map((inv) => (
              <tr key={inv.id}>
                <td className="font-medium text-navy-800">{inv.studentName}</td>
                <td>{inv.description}</td><td>{inv.term}</td>
                <td>L${inv.amount.toLocaleString()}</td><td>L${inv.amountPaid.toLocaleString()}</td>
                <td>L${(inv.amount - inv.amountPaid).toLocaleString()}</td>
                <td><span className={inv.status === 'paid' ? 'badge-success' : inv.status === 'partial' ? 'badge-warning' : inv.status === 'overdue' ? 'badge-error' : 'badge-info'}>{inv.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

export function FinanceInvoices() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Invoices" subtitle="All student invoices." action={<button className="btn-primary"><FileText className="w-4 h-4" /> New Invoice</button>} />
      <SectionCard title="All Invoices">
        <table className="table-base">
          <thead><tr><th>Invoice</th><th>Student</th><th>Amount</th><th>Paid</th><th>Due Date</th><th>Status</th></tr></thead>
          <tbody>
            {INVOICES.map((inv) => (
              <tr key={inv.id}>
                <td className="font-medium text-navy-800">{inv.id.toUpperCase()}</td>
                <td>{inv.studentName}</td>
                <td>L${inv.amount.toLocaleString()}</td><td>L${inv.amountPaid.toLocaleString()}</td>
                <td>{inv.dueDate}</td>
                <td><span className={inv.status === 'paid' ? 'badge-success' : inv.status === 'partial' ? 'badge-warning' : inv.status === 'overdue' ? 'badge-error' : 'badge-info'}>{inv.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

export function FinancePayments() {
  const [payments, setPayments] = useState<Payment[]>(PAYMENTS);
  const verify = (id: string) => setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'verified' as const } : p)));
  const reject = (id: string) => setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'rejected' as const } : p)));
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Payments" subtitle="Verify and manage student payments." />
      <SectionCard title="Payment Verification">
        <table className="table-base">
          <thead><tr><th>Reference</th><th>Student</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td className="font-medium text-navy-800">{p.reference}</td>
                <td>{p.studentName}</td>
                <td>L${p.amount.toLocaleString()}</td>
                <td><span className="badge-info">{p.method.replace('_', ' ')}</span></td>
                <td>{p.date}</td>
                <td><span className={p.status === 'verified' ? 'badge-success' : p.status === 'rejected' ? 'badge-error' : 'badge-warning'}>{p.status.replace('_', ' ')}</span></td>
                <td>
                  {p.status === 'pending_verification' && (
                    <div className="flex gap-1">
                      <button onClick={() => verify(p.id)} className="p-1.5 rounded-lg bg-success-100 text-success-700 hover:bg-success-200"><Check className="w-3.5 h-3.5" /></button>
                      <button onClick={() => reject(p.id)} className="p-1.5 rounded-lg bg-error-100 text-error-700 hover:bg-error-200"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

export function FinanceOutstanding() {
  const outstanding = INVOICES.filter((i) => i.status !== 'paid');
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Outstanding Balances" subtitle="Students with unpaid balances." />
      <SectionCard title="Outstanding Invoices">
        <table className="table-base">
          <thead><tr><th>Student</th><th>Amount</th><th>Paid</th><th>Balance</th><th>Due Date</th><th>Status</th></tr></thead>
          <tbody>
            {outstanding.map((inv) => (
              <tr key={inv.id}>
                <td className="font-medium text-navy-800">{inv.studentName}</td>
                <td>L${inv.amount.toLocaleString()}</td><td>L${inv.amountPaid.toLocaleString()}</td>
                <td className="font-semibold text-error-600">L${(inv.amount - inv.amountPaid).toLocaleString()}</td>
                <td>{inv.dueDate}</td>
                <td><span className={inv.status === 'partial' ? 'badge-warning' : inv.status === 'overdue' ? 'badge-error' : 'badge-info'}>{inv.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

export function FinanceReceipts() {
  const printReceipt = (p: Payment) => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>Receipt ${p.reference}</title></head><body style="font-family:sans-serif;padding:40px;"><h2>Innosys Academy</h2><p>Official Payment Receipt</p><hr/><table style="width:100%"><tr><td>Receipt No:</td><td>${p.reference}</td></tr><tr><td>Student:</td><td>${p.studentName}</td></tr><tr><td>Amount:</td><td>L${p.amount.toLocaleString()}</td></tr><tr><td>Method:</td><td>${p.method.replace('_', ' ')}</td></tr><tr><td>Date:</td><td>${p.date}</td></tr><tr><td>Status:</td><td>Verified</td></tr></table><hr/><p style="text-align:center;font-size:12px;color:#666">This is a computer-generated receipt from InnosysEdu.</p></body></html>`);
    w.document.close();
    w.print();
  };
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Receipts" subtitle="Generated payment receipts." />
      <SectionCard title="Issued Receipts">
        <div className="space-y-3">
          {PAYMENTS.filter((p) => p.status === 'verified').map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-navy-100">
              <div className="p-2 rounded-lg bg-success-100 text-success-700"><ReceiptText className="w-4 h-4" /></div>
              <div className="flex-1"><p className="text-sm font-medium text-navy-800">Receipt — {p.reference}</p><p className="text-xs text-navy-400">{p.studentName} — L${p.amount.toLocaleString()} — {p.date}</p></div>
              <button onClick={() => printReceipt(p)} className="btn-secondary text-xs"><Download className="w-3 h-3" /> Download</button>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export function FinanceReports() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Financial Reports" subtitle="Generate financial reports." />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { name: 'Collection Report', desc: 'Fees collected by term', icon: BarChart3 },
          { name: 'Outstanding Report', desc: 'Outstanding balances', icon: AlertCircle },
          { name: 'Payment Methods', desc: 'Payment method breakdown', icon: CreditCard },
          { name: 'Invoice Summary', desc: 'All invoices issued', icon: FileText },
          { name: 'Receipt Log', desc: 'All receipts generated', icon: ReceiptText },
          { name: 'Term Financials', desc: 'Term financial summary', icon: Receipt },
        ].map((r) => (
          <div key={r.name} className="card-hover p-5 cursor-pointer">
            <div className="p-3 rounded-xl bg-navy-100 text-navy-700 w-fit mb-3"><r.icon className="w-5 h-5" /></div>
            <h3 className="font-semibold text-navy-800">{r.name}</h3>
            <p className="text-sm text-navy-400 mt-1">{r.desc}</p>
            <button className="btn-secondary text-sm mt-4 w-full">Generate</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Librarian ---
export function LibrarianDashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const pendingRequests = BOOK_REQUESTS.filter((r) => r.status === 'pending');
  const borrowed = BOOK_REQUESTS.filter((r) => r.status === 'borrowed');
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Librarian Dashboard" subtitle="Library management overview." />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Books" value={BOOKS.length} icon={<BookOpen className="w-5 h-5" />} onClick={() => onNavigate('catalog')} />
        <StatCard label="Available" value={BOOKS.reduce((s, b) => s + b.copiesAvailable, 0)} icon={<BookOpen className="w-5 h-5" />} color="success" onClick={() => onNavigate('catalog')} />
        <StatCard label="Pending Requests" value={pendingRequests.length} icon={<Inbox className="w-5 h-5" />} color="warning" onClick={() => onNavigate('requests')} />
        <StatCard label="Borrowed" value={borrowed.length} icon={<BookMarked className="w-5 h-5" />} color="navy" onClick={() => onNavigate('borrowed')} />
      </div>
      <SectionCard title="Pending Book Requests" action={<button onClick={() => onNavigate('requests')} className="btn-ghost text-sm">View All</button>}>
        <div className="space-y-3">
          {pendingRequests.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg border border-navy-100">
              <div className="p-2 rounded-lg bg-navy-100 text-navy-700"><BookOpen className="w-4 h-4" /></div>
              <div className="flex-1"><p className="text-sm font-medium text-navy-800">{r.bookTitle}</p><p className="text-xs text-navy-400">Requested by {r.studentName} — {r.requestDate}</p></div>
              <span className="badge-warning">Pending</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export function LibrarianCatalog() {
  const [books, setBooks] = useState<Book[]>(BOOKS);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [removingBook, setRemovingBook] = useState<Book | null>(null);

  const saveEdit = (updated: Book) => {
    setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setEditingBook(null);
  };

  const removeBook = (id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    setRemovingBook(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Book Catalog" subtitle="All books in the library — edit or remove books as needed." />
      <SectionCard title={`All Books (${books.length})`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map((b) => (
            <div key={b.id} className="card-hover p-5">
              <div className={`h-24 ${b.coverColor} rounded-lg mb-3 flex items-center justify-center`}>
                <BookOpen className="w-8 h-8 text-white/80" />
              </div>
              <h3 className="font-semibold text-navy-800 text-sm">{b.title}</h3>
              <p className="text-xs text-navy-400 mt-1">{b.author} — {b.subject}</p>
              <p className="text-xs text-navy-400">{b.gradeLevel} — ISBN: {b.isbn}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-navy-500">{b.copiesAvailable} / {b.copiesTotal} copies</span>
                <span className={b.status === 'available' ? 'badge-success' : b.status === 'limited' ? 'badge-warning' : 'badge-error'}>{b.status}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => setEditingBook(b)} className="btn-secondary text-xs flex-1 py-1.5">Edit</button>
                <button onClick={() => setRemovingBook(b)} className="btn-secondary text-xs py-1.5 px-3 text-error-600 border-error-200 hover:bg-error-50">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {editingBook && (
        <Modal open={true} onClose={() => setEditingBook(null)} title="Edit Book">
          <EditBookForm book={editingBook} onSave={saveEdit} onCancel={() => setEditingBook(null)} />
        </Modal>
      )}

      {removingBook && (
        <Modal open={true} onClose={() => setRemovingBook(null)} title="Remove Book" size="sm">
          <div className="space-y-4">
            <p className="text-sm text-navy-600">Are you sure you want to remove <strong>{removingBook.title}</strong> from the catalog? This will make all copies unavailable.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRemovingBook(null)} className="btn-secondary">Cancel</button>
              <button onClick={() => removeBook(removingBook.id)} className="btn-danger">Remove Book</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function EditBookForm({ book, onSave, onCancel }: { book: Book; onSave: (b: Book) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    subject: book.subject,
    category: book.category,
    gradeLevel: book.gradeLevel,
    copiesTotal: String(book.copiesTotal),
    copiesAvailable: String(book.copiesAvailable),
  });

  return (
    <div className="space-y-4">
      <div><label className="label">Title</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Author</label><input className="input" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></div>
        <div><label className="label">ISBN</label><input className="input" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} /></div>
        <div><label className="label">Subject</label><input className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
        <div><label className="label">Category</label>
          <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {['Science', 'Languages', 'Social Studies', 'Mathematics', 'Literature'].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div><label className="label">Grade Level</label>
          <select className="input" value={form.gradeLevel} onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })}>
            {['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map((g) => <option key={g}>{g}</option>)}
          </select>
        </div>
        <div><label className="label">Total Copies</label><input type="number" className="input" value={form.copiesTotal} onChange={(e) => setForm({ ...form, copiesTotal: e.target.value })} /></div>
      </div>
      <div><label className="label">Available Copies</label><input type="number" className="input" value={form.copiesAvailable} onChange={(e) => setForm({ ...form, copiesAvailable: e.target.value })} /></div>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="btn-secondary">Cancel</button>
        <button onClick={() => onSave({
          ...book,
          title: form.title, author: form.author, isbn: form.isbn, subject: form.subject,
          category: form.category, gradeLevel: form.gradeLevel,
          copiesTotal: parseInt(form.copiesTotal) || 0,
          copiesAvailable: parseInt(form.copiesAvailable) || 0,
          status: (parseInt(form.copiesAvailable) || 0) === 0 ? 'unavailable' as const : (parseInt(form.copiesAvailable) || 0) <= 3 ? 'limited' as const : 'available' as const,
        })} className="btn-primary">Save Changes</button>
      </div>
    </div>
  );
}

export function LibrarianAddBook() {
  const [form, setForm] = useState({
    title: '', author: '', isbn: '', subject: '',
    category: 'Science', gradeLevel: 'Grade 10',
    copiesTotal: '1', coverColor: 'bg-navy-600',
  });
  const [added, setAdded] = useState(false);
  const handleSubmit = () => {
    if (!form.title.trim() || !form.author.trim()) return;
    setAdded(true);
    setForm({ title: '', author: '', isbn: '', subject: '', category: 'Science', gradeLevel: 'Grade 10', copiesTotal: '1', coverColor: 'bg-navy-600' });
    setTimeout(() => setAdded(false), 3000);
  };
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Add Book" subtitle="Add a new book to the library." />
      {added && <div className="flex items-center gap-2 px-4 py-2.5 bg-success-50 border border-success-200 rounded-lg text-sm text-success-700"><CheckCircle2 className="w-4 h-4" /> Book added to catalog successfully.</div>}
      <SectionCard title="Book Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">Title</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Book title" /></div>
          <div><label className="label">Author</label><input className="input" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Author name" /></div>
          <div><label className="label">ISBN</label><input className="input" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} placeholder="ISBN number" /></div>
          <div><label className="label">Subject</label><input className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject area" /></div>
          <div><label className="label">Category</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option>Science</option><option>Languages</option><option>Social Studies</option><option>Mathematics</option><option>Literature</option></select>
          </div>
          <div><label className="label">Grade Level</label>
            <select className="input" value={form.gradeLevel} onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })}>{['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map((g) => <option key={g}>{g}</option>)}</select>
          </div>
          <div><label className="label">Total Copies</label><input type="number" className="input" value={form.copiesTotal} onChange={(e) => setForm({ ...form, copiesTotal: e.target.value })} placeholder="Number of copies" /></div>
          <div><label className="label">Cover Color</label>
            <select className="input" value={form.coverColor} onChange={(e) => setForm({ ...form, coverColor: e.target.value })}>
              <option value="bg-navy-600">Navy</option><option value="bg-success-600">Green</option><option value="bg-error-600">Red</option><option value="bg-warning-500">Amber</option><option value="bg-accent-500">Gold</option>
            </select>
          </div>
        </div>
        <div className="mt-4"><button onClick={handleSubmit} className="btn-primary"><Plus className="w-4 h-4" /> Add Book</button></div>
      </SectionCard>
    </div>
  );
}

export function LibrarianRequests() {
  const [requests, setRequests] = useState<BookRequest[]>(BOOK_REQUESTS);
  const approve = (id: string) => setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'approved' as const, dueDate: '2026-10-05' } : r)));
  const reject = (id: string) => setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'rejected' as const } : r)));
  const pending = requests.filter((r) => r.status === 'pending');
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Booking Requests" subtitle="Approve or reject book requests." />
      <SectionCard title={`Pending Requests (${pending.length})`}>
        {pending.length === 0 ? (
          <EmptyState icon={<Inbox className="w-8 h-8" />} title="No pending requests" message="All book requests have been processed." />
        ) : (
          <div className="space-y-3">
            {pending.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg border border-navy-100">
                <div className="p-2 rounded-lg bg-navy-100 text-navy-700"><BookOpen className="w-4 h-4" /></div>
                <div className="flex-1"><p className="text-sm font-medium text-navy-800">{r.bookTitle}</p><p className="text-xs text-navy-400">{r.studentName} — {r.requestDate}</p></div>
                <button onClick={() => approve(r.id)} className="p-2 rounded-lg bg-success-100 text-success-700 hover:bg-success-200"><Check className="w-4 h-4" /></button>
                <button onClick={() => reject(r.id)} className="p-2 rounded-lg bg-error-100 text-error-700 hover:bg-error-200"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

export function LibrarianBorrowed() {
  const borrowed = BOOK_REQUESTS.filter((r) => r.status === 'borrowed' || r.status === 'approved');
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Borrowed Books" subtitle="Currently borrowed books." />
      <SectionCard title="Borrowed">
        <table className="table-base">
          <thead><tr><th>Book</th><th>Student</th><th>Request Date</th><th>Status</th><th>Due Date</th></tr></thead>
          <tbody>
            {borrowed.map((r) => (
              <tr key={r.id}>
                <td className="font-medium text-navy-800">{r.bookTitle}</td>
                <td>{r.studentName}</td><td>{r.requestDate}</td>
                <td><span className={r.status === 'borrowed' ? 'badge-info' : 'badge-success'}>{r.status}</span></td>
                <td>{r.dueDate || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

export function LibrarianHistory() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Borrowing History" subtitle="Complete borrowing and return history." />
      <SectionCard title="History">
        <table className="table-base">
          <thead><tr><th>Book</th><th>Student</th><th>Request Date</th><th>Status</th><th>Return Date</th></tr></thead>
          <tbody>
            {BOOK_REQUESTS.map((r) => (
              <tr key={r.id}>
                <td className="font-medium text-navy-800">{r.bookTitle}</td>
                <td>{r.studentName}</td><td>{r.requestDate}</td>
                <td><span className={
                  r.status === 'returned' ? 'badge-success' :
                  r.status === 'borrowed' ? 'badge-info' :
                  r.status === 'approved' ? 'badge-accent' :
                  r.status === 'rejected' ? 'badge-error' : 'badge-warning'
                }>{r.status}</span></td>
                <td>{r.returnDate || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}

// --- Super Admin ---
export function SuperAdminDashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Innovexa Platform Dashboard" subtitle="Cross-school platform operations, school onboarding and governance preview." />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={SYSTEM_USERS.length} icon={<Users className="w-5 h-5" />} onClick={() => onNavigate('users')} />
        <StatCard label="Active" value={SYSTEM_USERS.filter((u) => u.status === 'active').length} icon={<Shield className="w-5 h-5" />} color="success" onClick={() => onNavigate('users')} />
        <StatCard label="Locked" value={SYSTEM_USERS.filter((u) => u.status === 'locked').length} icon={<Lock className="w-5 h-5" />} color="error" onClick={() => onNavigate('users')} />
        <StatCard label="Audit Events" value={AUDIT_LOGS.length} icon={<ScrollText className="w-5 h-5" />} color="warning" onClick={() => onNavigate('audit')} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Account & Security" action={<button onClick={() => onNavigate('users')} className="btn-ghost text-sm">Manage</button>}>
          <div className="space-y-2">
            <button onClick={() => onNavigate('users')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-navy-50 text-left">
              <div className="p-2 rounded-lg bg-navy-100 text-navy-700"><Users className="w-4 h-4" /></div>
              <span className="text-sm font-medium text-navy-700">User Accounts</span>
            </button>
            <button onClick={() => onNavigate('roles')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-navy-50 text-left">
              <div className="p-2 rounded-lg bg-navy-100 text-navy-700"><Shield className="w-4 h-4" /></div>
              <span className="text-sm font-medium text-navy-700">Roles & Permissions</span>
            </button>
            <button onClick={() => onNavigate('recovery')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-navy-50 text-left">
              <div className="p-2 rounded-lg bg-navy-100 text-navy-700"><KeyRound className="w-4 h-4" /></div>
              <span className="text-sm font-medium text-navy-700">Account Recovery</span>
            </button>
            <button onClick={() => onNavigate('audit')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-navy-50 text-left">
              <div className="p-2 rounded-lg bg-navy-100 text-navy-700"><ScrollText className="w-4 h-4" /></div>
              <span className="text-sm font-medium text-navy-700">Security / Audit Logs</span>
            </button>
          </div>
        </SectionCard>
        <SectionCard title="School Configuration" action={<button onClick={() => onNavigate('school-profile')} className="btn-ghost text-sm">Manage</button>}>
          <div className="space-y-2">
            <button onClick={() => onNavigate('school-profile')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-navy-50 text-left">
              <div className="p-2 rounded-lg bg-navy-100 text-navy-700"><Building2 className="w-4 h-4" /></div>
              <span className="text-sm font-medium text-navy-700">School Profile</span>
            </button>
            <button onClick={() => onNavigate('academic-structure')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-navy-50 text-left">
              <div className="p-2 rounded-lg bg-navy-100 text-navy-700"><GraduationCap className="w-4 h-4" /></div>
              <span className="text-sm font-medium text-navy-700">Academic Structure</span>
            </button>
            <button onClick={() => onNavigate('integrations')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-navy-50 text-left">
              <div className="p-2 rounded-lg bg-navy-100 text-navy-700"><Plug className="w-4 h-4" /></div>
              <span className="text-sm font-medium text-navy-700">Integrations</span>
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export function SuperAdminUsers() {
  const [users,setUsersState]=useState(getUsers());
  const [search,setSearch]=useState('');
  const roles: Role[]=['principal','vice_principal','dean','registrar','academic_officer','teacher','counselor','finance','librarian','super_admin','student','parent'];
  const filtered=users.filter(u=>u.name.toLowerCase().includes(search.toLowerCase())||u.email.toLowerCase().includes(search.toLowerCase()));
  const changeRole=(id:string,role:Role)=>{const next=users.map(u=>u.id===id?{...u,role,title:role.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}:u);setUsersState(next);setUsers(next);};
  const toggleStatus=(id:string)=>{const next=users.map(u=>u.id===id?{...u,status:u.status==='active'?'inactive' as const:'active' as const}:u);setUsersState(next);setUsers(next);};
  return <div className="space-y-6 animate-fade-in"><PageHeader title="User Accounts" subtitle="Manage account status and change each user's role from one simple screen."/><SectionCard title={`Users (${filtered.length})`}><div className="relative mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400"/><input className="input pl-10" placeholder="Search users..." value={search} onChange={e=>setSearch(e.target.value)}/></div><div className="overflow-x-auto"><table className="table-base"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead><tbody>{filtered.map(u=><tr key={u.id}><td><div className="flex items-center gap-2"><Avatar name={u.name} color="bg-navy-600" size="sm"/><span className="font-medium text-navy-800">{u.name}</span></div></td><td>{u.email}</td><td><select className="input py-1.5 text-xs min-w-44" value={u.role} onChange={e=>changeRole(u.id,e.target.value as Role)}>{roles.map(r=><option key={r} value={r}>{r.replace('_',' ')}</option>)}</select></td><td><span className={u.status==='active'?'badge-success':u.status==='locked'?'badge-error':'badge-warning'}>{u.status}</span></td><td><button onClick={()=>toggleStatus(u.id)} className="btn-secondary text-xs py-1 px-2">{u.status==='active'?'Deactivate':'Activate'}</button></td></tr>)}</tbody></table></div></SectionCard></div>;
}

export function SuperAdminRoles() {
  const builtIn=[
    { name:'Principal', permissions:['Review gradebooks','Approve grades','Authorize report release','View attendance','Generate reports'] },
    { name:'Vice Principal', permissions:['Class management','Attendance monitoring','Staff activity','Operational notices','Generate reports'] },
    { name:'Dean of Students', permissions:['Record discipline cases','Resolve cases','Attendance concerns','Student activities'] },
    { name:'Registrar', permissions:['Admissions','Student records','Class placement','Upload documents'] },
    { name:'Academic Officer', permissions:['Examinations','Gradebook review','Results release'] },
    { name:'Teacher', permissions:['My classes','Attendance','Gradebook submission','My students','Assignments','Resources'] },
    { name:'Counselor', permissions:['Support cases','At-risk students','Interventions'] },
    { name:'Finance Officer', permissions:['Fees','Invoices','Payments','Receipts','Reports'] },
    { name:'Librarian', permissions:['Book catalog','Requests','Borrowing'] },
    { name:'Super Admin', permissions:['User management','Roles & permissions','Configuration','Audit logs'] },
    { name:'Student', permissions:['Own results','Attendance','Library','Announcements'] },
    { name:'Parent', permissions:['Child results','Attendance','Fees','Report card'] },
  ];
  const [roles,setRoles]=useState(()=>{try{return JSON.parse(localStorage.getItem('innosysedu.customRoles.v2')||'[]')}catch{return []}});
  const [show,setShow]=useState(false); const [name,setName]=useState(''); const [selected,setSelected]=useState<string[]>([]);
  const available=['View dashboard','Manage students','Manage classes','Record attendance','Submit gradebooks','Approve gradebooks','Authorize releases','Generate reports','Upload documents','Manage discipline','Manage users','Manage permissions'];
  const create=()=>{if(!name)return;const next=[...roles,{name,permissions:selected}];setRoles(next);localStorage.setItem('innosysedu.customRoles.v2',JSON.stringify(next));setName('');setSelected([]);setShow(false);};
  return <div className="space-y-6 animate-fade-in"><PageHeader title="Roles & Permissions" subtitle="Change user roles from User Accounts and create additional role templates with clear permissions." action={<button className="btn-primary" onClick={()=>setShow(true)}><Plus className="w-4 h-4"/> Add Role</button>}/><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...builtIn,...roles].map((r:any)=><div key={r.name} className="card p-5"><div className="flex items-center justify-between mb-3"><h3 className="font-semibold text-navy-800">{r.name}</h3><span className="badge-info">{r.permissions.length} permissions</span></div><div className="space-y-1">{r.permissions.map((p:string)=><div key={p} className="flex items-center gap-2 text-sm text-navy-600"><Check className="w-3.5 h-3.5 text-success-500"/>{p}</div>)}</div></div>)}</div><Modal open={show} onClose={()=>setShow(false)} title="Add Role"><div className="space-y-4"><div><label className="label">Role name</label><input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Department Head"/></div><div><label className="label">Permissions</label><div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">{available.map(p=><label key={p} className="flex items-center gap-2 p-2 rounded-lg border border-navy-100 text-sm"><input type="checkbox" checked={selected.includes(p)} onChange={e=>setSelected(v=>e.target.checked?[...v,p]:v.filter(x=>x!==p))}/>{p}</label>)}</div></div><div className="flex justify-end"><button className="btn-primary" onClick={create}><Save className="w-4 h-4"/> Save Role</button></div></div></Modal></div>;
}

export function SuperAdminRecovery() {
  const [showReset, setShowReset] = useState(false);
  const [resetUser, setResetUser] = useState('');
  const [resetDone, setResetDone] = useState(false);
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Account Recovery" subtitle="Securely recover user accounts. Passwords are never displayed." action={<button onClick={() => setShowReset(true)} className="btn-primary"><KeyRound className="w-4 h-4" /> Reset Password</button>} />
      <div className="p-4 rounded-lg bg-warning-50 border border-warning-200">
        <div className="flex items-center gap-2 text-warning-700">
          <AlertTriangle className="w-5 h-5" />
          <p className="text-sm font-medium">Security Notice</p>
        </div>
        <p className="text-sm text-warning-600 mt-1">The Super Admin can reset a user's password securely. Existing passwords are never displayed. A temporary password or secure reset link is generated instead.</p>
      </div>
      <SectionCard title="Locked / Inactive Accounts">
        <div className="space-y-3">
          {SYSTEM_USERS.filter((u) => u.status === 'locked' || u.status === 'inactive').map((u) => (
            <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg border border-navy-100">
              <div className="p-2 rounded-lg bg-error-100 text-error-700"><Lock className="w-4 h-4" /></div>
              <div className="flex-1"><p className="text-sm font-medium text-navy-800">{u.name}</p><p className="text-xs text-navy-400">{u.email} — {u.title}</p></div>
              <span className="badge-error">{u.status}</span>
              <button onClick={() => { setResetUser(u.name); setShowReset(true); }} className="btn-secondary text-xs">Recover</button>
            </div>
          ))}
          {SYSTEM_USERS.filter((u) => u.status === 'locked' || u.status === 'inactive').length === 0 && (
            <EmptyState icon={<Check className="w-8 h-8" />} title="No locked accounts" message="All accounts are in good standing." />
          )}
        </div>
      </SectionCard>
      {showReset && (
        <Modal open={true} onClose={() => { setShowReset(false); setResetDone(false); }} title="Secure Password Reset">
          {resetDone ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-success-50 border border-success-200">
                <div className="flex items-center gap-2 text-success-700"><Check className="w-5 h-5" /><span className="font-semibold">Password Reset Successfully</span></div>
                <p className="text-sm text-success-600 mt-1">A temporary password has been generated. The user will be required to change it on next login.</p>
              </div>
              <div className="p-3 rounded-lg bg-navy-50 font-mono text-sm text-navy-700">Temp Password: **********</div>
              <button onClick={() => { setShowReset(false); setResetDone(false); }} className="btn-primary w-full">Done</button>
            </div>
          ) : (
            <div className="space-y-4">
              <div><label className="label">Select User</label>
                <select className="input" value={resetUser} onChange={(e) => setResetUser(e.target.value)}>
                  <option value="">Select user...</option>
                  {SYSTEM_USERS.map((u) => <option key={u.id} value={u.name}>{u.name} — {u.email}</option>)}
                </select>
              </div>
              <div className="p-3 rounded-lg bg-navy-50 text-sm text-navy-600">
                <p>The user's existing password will <strong>not</strong> be displayed. A new temporary password will be generated, and the user must change it on next login.</p>
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowReset(false)} className="btn-secondary">Cancel</button>
                <button onClick={() => setResetDone(true)} className="btn-primary"><RotateCcw className="w-4 h-4" /> Reset Password</button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

export function SuperAdminSchoolProfile() {
  const [form, setForm] = useState({
    schoolName: SCHOOL_INFO.schoolName,
    academicYear: SCHOOL_INFO.academicYear,
    currentTerm: SCHOOL_INFO.currentTerm,
    phone: SCHOOL_INFO.phone,
    email: SCHOOL_INFO.email,
    address: SCHOOL_INFO.address,
  });
  const [saved, setSaved] = useState(false);
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="School Profile" subtitle="Configure school information and branding." />
      {saved && <div className="flex items-center gap-2 px-4 py-2.5 bg-success-50 border border-success-200 rounded-lg text-sm text-success-700"><CheckCircle2 className="w-4 h-4" /> School profile updated successfully.</div>}
      <SectionCard title="School Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">School Name</label><input className="input" value={form.schoolName} onChange={(e) => setForm({ ...form, schoolName: e.target.value })} /></div>
          <div><label className="label">Academic Year</label><input className="input" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} /></div>
          <div><label className="label">Current Term</label><input className="input" value={form.currentTerm} onChange={(e) => setForm({ ...form, currentTerm: e.target.value })} /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="label">Email</label><input className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">Address</label><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        </div>
        <div className="mt-4"><button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000); }} className="btn-primary">Save Changes</button></div>
      </SectionCard>
      <SectionCard title="School Logo">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-navy-800 rounded-2xl flex items-center justify-center"><Building2 className="w-10 h-10 text-white" /></div>
          <div><button className="btn-secondary">Upload New Logo</button><p className="text-xs text-navy-400 mt-2">Recommended size: 256x256px, PNG or SVG</p></div>
        </div>
      </SectionCard>
    </div>
  );
}

export function SuperAdminAcademicStructure() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Academic Structure" subtitle="Classes, subjects, and assessment configuration." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Classes">
          <table className="table-base">
            <thead><tr><th>Class</th><th>Students</th><th>Room</th></tr></thead>
            <tbody>{CLASSES.map((c) => <tr key={c.id}><td className="font-medium text-navy-800">{c.name}</td><td>{c.studentCount}</td><td>{c.room}</td></tr>)}</tbody>
          </table>
        </SectionCard>
        <SectionCard title="Subjects">
          <table className="table-base">
            <thead><tr><th>Subject</th><th>Code</th><th>Class</th></tr></thead>
            <tbody>{SUBJECTS.map((s) => <tr key={s.id}><td className="font-medium text-navy-800">{s.name}</td><td>{s.code}</td><td>{s.className}</td></tr>)}</tbody>
          </table>
        </SectionCard>
      </div>
      <SectionCard title="Assessment Categories">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {['Assignment', 'Quiz', 'Test', 'Participation', 'Midterm', 'Final'].map((a) => (
            <div key={a} className="p-3 rounded-lg border border-navy-100 text-center"><p className="text-sm font-medium text-navy-700">{a}</p></div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export function SuperAdminIntegrations() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Integrations" subtitle="External service integrations." />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { name: 'Payment Gateway', desc: 'Online fee payment integration', status: 'Connected', icon: CreditCard, iconBg: 'bg-success-100', iconText: 'text-success-700' },
          { name: 'SMS Notifications', desc: 'Parent SMS notification service', status: 'Not Connected', icon: Settings, iconBg: 'bg-navy-100', iconText: 'text-navy-700' },
          { name: 'Email Service', desc: 'Email delivery service', status: 'Connected', icon: Settings, iconBg: 'bg-success-100', iconText: 'text-success-700' },
          { name: 'Backup Service', desc: 'Automated database backups', status: 'Connected', icon: Settings, iconBg: 'bg-success-100', iconText: 'text-success-700' },
        ].map((i) => (
          <div key={i.name} className="card p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${i.iconBg} ${i.iconText}`}><i.icon className="w-5 h-5" /></div>
                <div><h3 className="font-semibold text-navy-800">{i.name}</h3><p className="text-sm text-navy-400">{i.desc}</p></div>
              </div>
              <span className={i.status === 'Connected' ? 'badge-success' : 'badge-warning'}>{i.status}</span>
            </div>
            <button className={`mt-4 w-full ${i.status === 'Connected' ? 'btn-secondary' : 'btn-primary'}`}>{i.status === 'Connected' ? 'Configure' : 'Connect'}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SuperAdminAudit() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Security / Audit Logs" subtitle="System security and audit trail." />
      <SectionCard title="Audit Logs">
        <table className="table-base">
          <thead><tr><th>User</th><th>Action</th><th>Target</th><th>Timestamp</th><th>IP</th><th>Severity</th></tr></thead>
          <tbody>
            {AUDIT_LOGS.map((log) => (
              <tr key={log.id}>
                <td className="font-medium text-navy-800">{log.user}</td>
                <td>{log.action}</td><td>{log.target}</td><td>{log.timestamp}</td><td className="font-mono text-xs">{log.ip}</td>
                <td><span className={log.severity === 'critical' ? 'badge-error' : log.severity === 'warning' ? 'badge-warning' : 'badge-info'}>{log.severity}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </div>
  );
}
