import { useSyncExternalStore } from 'react';
import type { Role, User } from '@/types';
import { buildSeed, feeTotal, SEED_VERSION, teacherTotal, todayISO } from './seed';
import type {
  Announcement, AppNotification, Audience, BatchStatus, Book, Expense, Gradebook, GradingConfig, Incident,
  MarkRow, ReportTemplate, SchoolState, SchoolStudent, StaffAttendance, Substitution,
} from './types';

const KEY = 'innosysedu.school.v3';

function load(): SchoolState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SchoolState;
      if (parsed.version === SEED_VERSION) return parsed;
    }
  } catch {
    /* corrupted or unavailable storage: fall back to the seed */
  }
  return buildSeed();
}

let state: SchoolState = typeof window === 'undefined' ? buildSeed() : load();
const listeners = new Set<() => void>();

/** Original files uploaded in this browser session (not persisted: files never go to localStorage). */
export const uploadedFiles = new Map<string, File>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full / private mode: keep working in memory */
  }
}

function update(recipe: (draft: SchoolState) => void) {
  const draft = structuredClone(state);
  recipe(draft);
  state = draft;
  persist();
  listeners.forEach((l) => l());
}

export function resetSchoolData() {
  state = buildSeed();
  persist();
  listeners.forEach((l) => l());
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      state = load();
      listeners.forEach((l) => l());
    }
  });
}

export function useSchool(): SchoolState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );
}
export const getSchool = () => state;

/* ------------------------------ helpers ------------------------------ */

let counter = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${(counter++).toString(36)}`;
const now = () => new Date().toISOString();

export const sectionKey = (grade: number, section: string) => `${grade}${section}`;
export const className = (grade: number, section?: string) => (section ? `Grade ${grade}${section}` : `Grade ${grade}`);

export const money = (n: number, currency = 'USD') =>
  `${currency === 'USD' ? 'US$' : currency + ' '}${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const fmtDate = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export function allSections(s: SchoolState) {
  const map = new Map<string, { grade: number; section: string }>();
  for (const st of s.students) map.set(sectionKey(st.grade, st.section), { grade: st.grade, section: st.section });
  return [...map.values()].sort((a, b) => a.grade - b.grade || a.section.localeCompare(b.section));
}
export const gradesOf = (s: SchoolState) => [...new Set(allSections(s).map((x) => x.grade))];
export const sectionsOf = (s: SchoolState, grade: number) => allSections(s).filter((x) => x.grade === grade).map((x) => x.section);

export const activeStudents = (s: SchoolState) => s.students.filter((x) => x.status === 'active');
export const roster = (s: SchoolState, grade: number, section?: string) =>
  activeStudents(s).filter((x) => x.grade === grade && (!section || x.section === section)).sort((a, b) => a.lastName.localeCompare(b.lastName));

export const staffName = (s: SchoolState, id: string) => s.staff.find((x) => x.id === id)?.name ?? 'Unassigned';
export const studentById = (s: SchoolState, id: string) => s.students.find((x) => x.id === id);
export const teachers = (s: SchoolState) => s.staff.filter((x) => x.role === 'teacher');

/* ------------------------------ academics ------------------------------ */

export function letterFor(avg: number, g: GradingConfig) {
  return g.boundaries.find((b) => avg >= b.min && avg <= b.max + 0.999) ?? g.boundaries[g.boundaries.length - 1];
}

export type Category = 'at_risk' | 'moderate' | 'good';
export function categoryFor(avg: number, g: GradingConfig): Category {
  if (avg < g.atRiskBelow) return 'at_risk';
  if (avg < g.goodFrom) return 'moderate';
  return 'good';
}
export const CATEGORY_LABEL: Record<Category, string> = { at_risk: 'At-risk', moderate: 'Moderate', good: 'Good / Excellent' };

/** Teacher marks the school can use for analytics (submitted or approved; never drafts). */
export function subjectTotals(s: SchoolState, studentId: string, opts: { approvedOnly?: boolean } = {}) {
  const st = studentById(s, studentId);
  if (!st) return [] as { subject: string; total: number | null; marks: MarkRow; teacherId: string; status: Gradebook['status'] }[];
  return s.gradebooks
    .filter((g) => g.grade === st.grade && g.section === st.section && (opts.approvedOnly ? g.status === 'approved' : g.status !== 'draft'))
    .map((g) => ({ subject: g.subject, total: g.marks[studentId]?.total ?? null, marks: g.marks[studentId], teacherId: g.teacherId, status: g.status }));
}

export function studentAverage(s: SchoolState, studentId: string, opts: { approvedOnly?: boolean } = {}): number | null {
  const totals = subjectTotals(s, studentId, opts).map((x) => x.total).filter((x): x is number => x != null);
  if (!totals.length) return null;
  if (s.grading.averageMethod === 'weighted') {
    const rows = subjectTotals(s, studentId, opts).filter((x) => x.total != null);
    const w = rows.reduce((a, r) => a + (s.grading.subjectWeights[r.subject] ?? 1), 0);
    return Math.round((rows.reduce((a, r) => a + (r.total ?? 0) * (s.grading.subjectWeights[r.subject] ?? 1), 0) / w) * 10) / 10;
  }
  return Math.round((totals.reduce((a, b) => a + b, 0) / totals.length) * 10) / 10;
}

export function schoolPerformance(s: SchoolState) {
  const avgs = activeStudents(s).map((st) => ({ st, avg: studentAverage(s, st.id) })).filter((x): x is { st: SchoolStudent; avg: number } => x.avg != null);
  const overall = avgs.length ? Math.round((avgs.reduce((a, b) => a + b.avg, 0) / avgs.length) * 10) / 10 : 0;
  const byGrade = gradesOf(s).map((grade) => {
    const rows = avgs.filter((x) => x.st.grade === grade);
    const count = (c: Category) => rows.filter((x) => categoryFor(x.avg, s.grading) === c).length;
    return { grade, at_risk: count('at_risk'), moderate: count('moderate'), good: count('good'), avg: rows.length ? Math.round((rows.reduce((a, b) => a + b.avg, 0) / rows.length) * 10) / 10 : 0 };
  });
  return { overall, category: categoryFor(overall, s.grading), byGrade, rows: avgs };
}

export function batchStage(s: SchoolState, grade: number, section: string): BatchStatus {
  const b = s.batches.find((x) => x.key === sectionKey(grade, section));
  if (b) return b.status;
  const gbs = s.gradebooks.filter((g) => g.grade === grade && g.section === section);
  return gbs.length && gbs.every((g) => g.status === 'approved') ? 'awaiting_processing' : 'not_ready';
}

export const BATCH_LABEL: Record<BatchStatus, string> = {
  not_ready: 'Gradebooks outstanding',
  awaiting_processing: 'Awaiting processing',
  in_progress: 'Gradesheets in progress',
  submitted: 'Awaiting Principal review',
  returned: 'Returned for correction',
  authorized: 'Authorized for release',
  released: 'Released',
};

export const GRADEBOOK_LABEL: Record<Gradebook['status'], string> = {
  draft: 'Draft (not submitted)',
  submitted: 'Awaiting Principal approval',
  approved: 'Approved by Principal',
  returned: 'Returned for correction',
};

export function validateSection(s: SchoolState, grade: number, section: string) {
  const gbs = s.gradebooks.filter((g) => g.grade === grade && g.section === section);
  const official = s.students.filter((x) => x.grade === grade && x.section === section);
  const officialIds = new Set(official.map((x) => x.id));
  const missing: { studentId: string; subject: string; field: string }[] = [];
  const notEnrolled = new Set<string>();
  const unknown = new Set<string>();
  const ids = new Set<string>();
  for (const g of gbs) {
    for (const [sid, m] of Object.entries(g.marks)) {
      ids.add(sid);
      if (!officialIds.has(sid)) unknown.add(sid);
      const st = official.find((x) => x.id === sid);
      if (st && st.status !== 'active') notEnrolled.add(sid);
      (['classwork', 'quizzes', 'midterm', 'final'] as const).forEach((f) => {
        if (st?.status === 'active' && m[f] == null) missing.push({ studentId: sid, subject: g.subject, field: f });
      });
    }
  }
  const invalid = gbs.flatMap((g) => Object.entries(g.marks).filter(([, m]) => [m.classwork, m.quizzes, m.midterm, m.final].some((v) => v != null && (v < 0 || v > 100))).map(([sid]) => ({ studentId: sid, subject: g.subject })));
  const activeIds = official.filter((x) => x.status === 'active').map((x) => x.id);
  const unmatched = activeIds.filter((id) => !ids.has(id));
  return { identified: ids.size, matched: [...ids].filter((i) => officialIds.has(i)).length, duplicates: 0, missing, notEnrolled: [...notEnrolled], unknown: [...unknown], invalid, unmatched, subjects: gbs.length };
}

/* ------------------------------ attendance ------------------------------ */

export type AttStatus = 'present' | 'absent' | 'late' | 'excused';
const hash = (str: string) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return (h >>> 0) % 1000;
};
export function studentAttendance(studentId: string, date: string): AttStatus {
  const h = hash(`${studentId}|${date}`);
  const chronic = hash(studentId) < 60;
  if (h < (chronic ? 140 : 45)) return 'absent';
  if (h < (chronic ? 220 : 95)) return 'late';
  if (h < (chronic ? 240 : 115)) return 'excused';
  return 'present';
}
export function schoolDays(n: number, from = todayISO()): string[] {
  const out: string[] = [];
  const d = new Date(`${from}T12:00:00`);
  while (out.length < n) {
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) out.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() - 1);
  }
  return out;
}
export const lastSchoolDay = () => schoolDays(1)[0];
export function attendanceSummary(ids: string[], dates: string[]) {
  const c = { present: 0, absent: 0, late: 0, excused: 0 };
  for (const id of ids) for (const d of dates) c[studentAttendance(id, d)]++;
  const total = ids.length * dates.length || 1;
  return { ...c, rate: Math.round(((c.present + c.late) / total) * 1000) / 10 };
}

/* ------------------------------ finance ------------------------------ */

export function feeAccount(s: SchoolState, studentId: string) {
  const st = studentById(s, studentId);
  const structure = s.feeStructures.find((f) => st && st.grade >= f.gradeFrom && st.grade <= f.gradeTo);
  const charged = structure ? structure.items.reduce((a, b) => a + b.amount, 0) : st ? feeTotal(st.grade) : 0;
  const concessions = s.concessions.filter((c) => c.studentId === studentId).reduce((a, b) => a + b.amount, 0);
  const payments = s.payments.filter((p) => p.studentId === studentId);
  const paid = payments.reduce((a, b) => a + b.amount, 0);
  const balance = Math.max(0, charged - concessions - paid);
  const status: 'paid' | 'partial' | 'unpaid' = balance <= 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
  const nextDue = structure?.instalments.find((i) => i.due >= todayISO())?.due ?? structure?.dueDate;
  const net = charged - concessions;
  const missed = structure?.instalments.filter((i) => i.due < todayISO()).find((i) => {
    const cumulative = (structure.instalments.filter((x) => x.due <= i.due).reduce((p, x) => p + x.percent, 0) / 100) * net;
    return paid < cumulative - 0.5;
  });
  const overdueSince = balance > 0 ? missed?.due : undefined;
  return { charged, concessions, paid, balance, status, payments, structure, nextDue, overdueSince };
}

export function financeSummary(s: SchoolState) {
  const income = s.payments.reduce((a, b) => a + b.amount, 0);
  const paidExp = s.expenses.filter((e) => e.status === 'paid');
  const expenses = paidExp.reduce((a, b) => a + b.amount, 0);
  const cashReceipts = s.payments.filter((p) => p.method === 'Cash').reduce((a, b) => a + b.amount, 0);
  const opening = 18500;
  const cashOnHand = Math.round(cashReceipts * 0.12);
  const bank = opening + income - cashOnHand - expenses;
  const payables = s.expenses.filter((e) => e.status === 'pending');
  const receivables = activeStudents(s).reduce((a, st) => a + feeAccount(s, st.id).balance, 0);
  const months = ['2026-08', '2026-09', '2026-10', '2026-11'];
  const monthly = months.map((m) => ({
    month: m,
    revenue: s.payments.filter((p) => p.date.startsWith(m)).reduce((a, b) => a + b.amount, 0),
    expenses: s.expenses.filter((e) => e.date.startsWith(m) && e.status === 'paid').reduce((a, b) => a + b.amount, 0),
  }));
  const thisMonth = todayISO().slice(0, 7);
  return {
    income, expenses, net: income - expenses, cashOnHand, bank, cash: cashOnHand + bank,
    payables, payablesTotal: payables.reduce((a, b) => a + b.amount, 0), receivables, monthly,
    collectedThisMonth: s.payments.filter((p) => p.date.startsWith(thisMonth)).reduce((a, b) => a + b.amount, 0),
  };
}

/* ------------------------------ notifications ------------------------------ */

export function notificationsFor(s: SchoolState, user: User): AppNotification[] {
  const linked = user.role === 'parent' ? user.linkedStudentIds ?? [] : user.role === 'student' ? [studentIdForUser(user)] : [];
  return s.notifications
    .filter((n) => {
      if (n.toUserIds?.includes(user.id)) return true;
      if (n.toRoles?.includes(user.role)) return true;
      if (n.toStudentIds && (user.role === 'student' || (user.role === 'parent' && !n.studentOnly))) return n.toStudentIds.some((id) => linked.includes(id));
      return false;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export const studentIdForUser = (user: User) => (user.role === 'student' ? 's1' : user.linkedStudentIds?.[0] ?? '');

function notify(d: SchoolState, n: Omit<AppNotification, 'id' | 'createdAt' | 'readBy'>) {
  d.notifications.unshift({ ...n, id: uid('n'), createdAt: now(), readBy: [] });
}

const AUDIENCE_ROLES: Record<Audience, Role[]> = {
  all: ['principal', 'vice_principal', 'dean', 'registrar', 'academic_officer', 'teacher', 'counselor', 'finance', 'librarian', 'student', 'parent'],
  teachers: ['teacher'],
  parents: ['parent'],
  students: ['student'],
  admin_staff: ['vice_principal', 'dean', 'registrar', 'academic_officer', 'counselor', 'finance', 'librarian'],
};
export const announcementVisibleTo = (a: Announcement, role: Role) => a.audience.some((x) => AUDIENCE_ROLES[x].includes(role)) || a.fromRole === role;

/* ------------------------------ actions ------------------------------ */

export const actions = {
  markRead(id: string, userId: string) {
    update((d) => {
      const n = d.notifications.find((x) => x.id === id);
      if (n && !n.readBy.includes(userId)) n.readBy.push(userId);
    });
  },
  markAllRead(ids: string[], userId: string) {
    update((d) => d.notifications.forEach((n) => { if (ids.includes(n.id) && !n.readBy.includes(userId)) n.readBy.push(userId); }));
  },

  /* Gradebook workflow */
  submitGradebook(input: { grade: number; section: string; subject: string; teacherId: string; teacherName: string; file: File; marks?: Record<string, MarkRow> }) {
    const id = `gb-${input.grade}${input.section}-${input.subject.replace(/\s+/g, '')}`;
    uploadedFiles.set(id, input.file);
    update((d) => {
      let g = d.gradebooks.find((x) => x.id === id);
      if (!g) {
        g = { id, grade: input.grade, section: input.section, subject: input.subject, teacherId: input.teacherId, status: 'draft', fileName: '', fileSize: 0, marks: {}, history: [] };
        d.gradebooks.push(g);
      }
      g.status = 'submitted';
      g.fileName = input.file.name;
      g.fileSize = input.file.size;
      g.submittedAt = now();
      g.approvedAt = undefined;
      g.returnReason = undefined;
      if (input.marks && Object.keys(input.marks).length) g.marks = input.marks;
      g.history.push({ at: now(), by: input.teacherName, action: `Submitted ${input.file.name} to Principal` });
      notify(d, { title: `Gradebook submitted — ${className(input.grade, input.section)} ${input.subject}`, body: `${input.teacherName} submitted a gradebook for approval.`, link: 'exams-results', toRoles: ['principal'] });
      notify(d, { title: `Teacher submitted ${className(input.grade, input.section)} ${input.subject}`, body: 'Awaiting Principal approval. No processing action needed yet.', link: 'gradebook-processing', toRoles: ['academic_officer'] });
    });
  },
  approveGradebook(id: string, by: string) {
    update((d) => {
      const g = d.gradebooks.find((x) => x.id === id);
      if (!g || g.status !== 'submitted') return;
      g.status = 'approved';
      g.approvedAt = now();
      g.history.push({ at: now(), by, action: 'Approved by Principal' });
      const teacher = d.staff.find((x) => x.id === g.teacherId);
      notify(d, { title: `Gradebook Approved — ${className(g.grade, g.section)}`, body: `${g.subject} (${teacher?.name ?? 'teacher'}) approved on ${fmtDate(g.approvedAt)}. Process Gradebook when all subjects are approved.`, link: 'gradebook-processing', toRoles: ['academic_officer'] });
      notify(d, { title: `Your ${className(g.grade, g.section)} ${g.subject} gradebook was approved`, body: 'The Academic Officer will now prepare the report cards.', link: 'gradebook', toUserIds: [g.teacherId] });
      const all = d.gradebooks.filter((x) => x.grade === g.grade && x.section === g.section);
      if (all.every((x) => x.status === 'approved') && !d.batches.some((b) => b.key === sectionKey(g.grade, g.section))) {
        notify(d, { title: `All gradebooks approved — ${className(g.grade, g.section)}`, body: 'Ready to generate individual gradesheets.', link: 'gradebook-processing', toRoles: ['academic_officer'] });
      }
    });
  },
  returnGradebook(id: string, reason: string, by: string) {
    update((d) => {
      const g = d.gradebooks.find((x) => x.id === id);
      if (!g) return;
      g.status = 'returned';
      g.returnedAt = now();
      g.returnReason = reason;
      g.history.push({ at: now(), by, action: `Returned for correction: ${reason}` });
      notify(d, { title: `Gradebook returned — ${className(g.grade, g.section)} ${g.subject}`, body: reason, link: 'gradebook', toUserIds: [g.teacherId] });
      notify(d, { title: `Principal returned ${className(g.grade, g.section)} ${g.subject} gradebook`, body: reason, link: 'gradebook-processing', toRoles: ['academic_officer'] });
    });
  },

  generateGradesheets(grade: number, section: string, by: string) {
    update((d) => {
      const key = sectionKey(grade, section);
      const kids = d.students.filter((x) => x.grade === grade && x.section === section && x.status === 'active');
      const gbs = d.gradebooks.filter((g) => g.grade === grade && g.section === section);
      const sheets: Record<string, { status: 'draft' | 'requires_correction' | 'reviewed'; teacherRemark: string; academicRemark: string; principalRemark: string; correctionNote?: string }> = {};
      for (const k of kids) {
        const totals = gbs.map((g) => g.marks[k.id]?.total);
        const missing = gbs.filter((g) => g.marks[k.id]?.total == null).map((g) => g.subject);
        const vals = totals.filter((t): t is number => t != null);
        const avg = vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length);
        sheets[k.id] = {
          status: missing.length ? 'requires_correction' : 'draft',
          teacherRemark: avg >= 80 ? 'Very good performance this period.' : avg >= 70 ? 'Good effort; keep working.' : 'Needs to improve. Extra support recommended.',
          academicRemark: avg >= 70 ? 'Satisfactory academic standing.' : 'Academic support plan advised.',
          principalRemark: '',
          correctionNote: missing.length ? `Missing mark in ${missing.join(', ')} — requires correction and reapproval of the subject gradebook.` : undefined,
        };
      }
      const existing = d.batches.find((b) => b.key === key);
      const entry = { at: now(), by, action: `Generated ${kids.length} gradesheets using grading configuration v${d.grading.version}` };
      if (existing) {
        existing.sheets = sheets;
        existing.status = 'in_progress';
        existing.generatedAt = now();
        existing.history.push(entry);
      } else d.batches.push({ key, grade, section, status: 'in_progress', sheets, generatedAt: now(), history: [entry] });
    });
  },
  setSheet(key: string, studentId: string, patch: Partial<{ status: 'draft' | 'requires_correction' | 'reviewed'; teacherRemark: string; academicRemark: string; principalRemark: string }>) {
    update((d) => {
      const b = d.batches.find((x) => x.key === key);
      if (b?.sheets[studentId]) Object.assign(b.sheets[studentId], patch);
    });
  },
  reviewAll(key: string) {
    update((d) => {
      const b = d.batches.find((x) => x.key === key);
      if (!b) return;
      Object.values(b.sheets).forEach((sh) => { if (sh.status === 'draft') sh.status = 'reviewed'; });
    });
  },
  submitBatch(key: string, by: string) {
    update((d) => {
      const b = d.batches.find((x) => x.key === key);
      if (!b || Object.values(b.sheets).some((x) => x.status !== 'reviewed')) return;
      b.status = 'submitted';
      b.submittedAt = now();
      b.returnComment = undefined;
      b.history.push({ at: now(), by, action: `Submitted ${Object.keys(b.sheets).length} report cards to Principal` });
      notify(d, { title: `Report Cards Ready for Review — ${className(b.grade, b.section)}`, body: `${Object.keys(b.sheets).length} gradesheets submitted by the Academic Officer. Preview and authorize release.`, link: 'report-card-approvals', toRoles: ['principal'] });
    });
  },
  returnBatch(key: string, comment: string, by: string) {
    update((d) => {
      const b = d.batches.find((x) => x.key === key);
      if (!b) return;
      b.status = 'returned';
      b.returnComment = comment;
      b.history.push({ at: now(), by, action: `Returned for correction: ${comment}` });
      notify(d, { title: `Report Cards Returned for Correction — ${className(b.grade, b.section)}`, body: comment, link: 'report-cards:returned', toRoles: ['academic_officer'] });
    });
  },
  authorizeRelease(key: string, by: string) {
    update((d) => {
      const b = d.batches.find((x) => x.key === key);
      if (!b || b.status !== 'submitted') return;
      b.status = 'authorized';
      b.authorizedAt = now();
      b.authorizedBy = by;
      b.history.push({ at: now(), by, action: 'Authorized release' });
      notify(d, { title: `Release Authorized — ${className(b.grade, b.section)}`, body: 'You can now release the report cards privately to students and guardians.', link: 'report-cards:authorized', toRoles: ['academic_officer'] });
    });
  },
  releaseBatch(key: string, by: string) {
    update((d) => {
      const b = d.batches.find((x) => x.key === key);
      if (!b || b.status !== 'authorized') return;
      b.status = 'released';
      b.releasedAt = now();
      b.releasedBy = by;
      b.history.push({ at: now(), by, action: `Released ${Object.keys(b.sheets).length} report cards` });
      for (const sid of Object.keys(b.sheets)) {
        notify(d, { title: `Report card available — ${className(b.grade, b.section)}`, body: 'The report card is now available in the portal.', link: 'report-cards', toStudentIds: [sid] });
      }
      notify(d, { title: `${className(b.grade, b.section)} report cards released`, body: `${Object.keys(b.sheets).length} students and their guardians can now view their own report cards.`, link: 'report-card-approvals', toRoles: ['principal'] });
    });
  },

  saveGrading(next: GradingConfig) {
    update((d) => {
      d.gradingHistory.push(d.grading);
      d.grading = { ...next, version: d.grading.version + 1, effectiveFrom: todayISO() };
    });
  },
  saveTemplate(t: ReportTemplate) {
    update((d) => { d.template = t; });
  },
  addPeriod(yearId: string, period: { name: string; kind: 'semester' | 'marking_period' | 'term'; start: string; end: string }) {
    update((d) => { d.years.find((y) => y.id === yearId)?.periods.push({ ...period, id: uid('per') }); });
  },
  setCurrentPeriod(name: string | null) {
    update((d) => { d.school.currentPeriod = name; });
  },
  addCalendarEvent(ev: { date: string; title: string; kind: SchoolState['calendar'][number]['kind']; internal: boolean }) {
    update((d) => { d.calendar.push({ ...ev, id: uid('ev') }); });
  },

  /* Registrar */
  registerStudent(input: Omit<SchoolStudent, 'id' | 'studentNo' | 'name' | 'status' | 'previousClasses' | 'yearEntered' | 'parentLinked'>, by: string): string {
    let newId = '';
    update((d) => {
      const year = Number(d.school.academicYear.slice(0, 4));
      const seq = d.students.length + 1;
      newId = uid('st');
      const studentNo = `INNO-${year}-${String(seq).padStart(3, '0')}`;
      d.students.push({ ...input, id: newId, studentNo, name: `${input.firstName} ${input.lastName}`, status: 'active', previousClasses: [], yearEntered: year, parentLinked: false });
      const fee = d.feeStructures.find((f) => input.grade >= f.gradeFrom && input.grade <= f.gradeTo);
      const total = fee?.items.reduce((a, b) => a + b.amount, 0) ?? 0;
      notify(d, { title: `New student enrolled — ${input.firstName} ${input.lastName}`, body: `${studentNo}, ${className(input.grade, input.section)}. Fee account created automatically: ${money(total)}.`, link: 'student-accounts', toRoles: ['finance'] });
      notify(d, { title: `New student in your class — ${className(input.grade, input.section)}`, body: `${input.firstName} ${input.lastName} (${studentNo}) has been enrolled by ${by}.`, link: 'student-lists', toRoles: ['teacher'] });
    });
    return newId;
  },
  updateStudent(id: string, patch: Partial<SchoolStudent>) {
    update((d) => {
      const s = d.students.find((x) => x.id === id);
      if (s) Object.assign(s, patch, patch.firstName || patch.lastName ? { name: `${patch.firstName ?? s.firstName} ${patch.lastName ?? s.lastName}` } : {});
    });
  },
  promoteSection(grade: number, section: string, ids: string[]) {
    update((d) => {
      d.students.filter((s) => ids.includes(s.id)).forEach((s) => {
        s.previousClasses.push(`Grade ${grade}${section}`);
        if (grade >= 12) s.status = 'graduated';
        else s.grade = grade + 1;
      });
    });
  },
  decideApplication(id: string, decision: 'approved' | 'declined') {
    update((d) => { const a = d.applications.find((x) => x.id === id); if (a) a.status = decision; });
  },

  /* Finance */
  recordPayment(input: { studentId: string; amount: number; method: 'Cash' | 'Bank deposit' | 'Mobile money' | 'Card (demo)'; reference: string; by: string }) {
    let receiptNo = '';
    update((d) => {
      const next = 1001 + d.payments.length;
      receiptNo = `RCT-2026-${next}`;
      d.payments.push({ id: uid('pay'), receiptNo, studentId: input.studentId, amount: input.amount, method: input.method, reference: input.reference || '—', date: todayISO(), recordedBy: input.by });
      const st = d.students.find((x) => x.id === input.studentId);
      notify(d, { title: `Payment received — ${money(input.amount)}`, body: `${st?.name ?? 'Student'}: receipt ${receiptNo} is available to download.`, link: 'payment-history', toStudentIds: [input.studentId] });
      if (input.method === 'Card (demo)') notify(d, { title: `Online payment — ${st?.name ?? ''}`, body: `${money(input.amount)} demo card payment. Receipt ${receiptNo}.`, link: 'payment-history', toRoles: ['finance'] });
    });
    return receiptNo;
  },
  addConcession(c: { studentId: string; kind: 'Scholarship' | 'Discount' | 'Waiver'; amount: number; reason: string; approvedBy: string }) {
    update((d) => { d.concessions.push({ ...c, id: uid('con'), date: todayISO() }); });
  },
  addExpense(e: Omit<Expense, 'id'>) {
    update((d) => { d.expenses.push({ ...e, id: uid('exp') }); });
  },
  payExpense(id: string) {
    update((d) => { const e = d.expenses.find((x) => x.id === id); if (e) { e.status = 'paid'; e.date = todayISO(); } });
  },
  runPayroll(month: string) {
    update((d) => {
      const r = d.salaryRuns.find((x) => x.month === month);
      if (r) { r.status = 'paid'; r.paidOn = todayISO(); }
      const e = d.expenses.find((x) => x.category === 'Salaries' && x.description.endsWith(month));
      if (e) { e.status = 'paid'; e.date = todayISO(); }
    });
  },
  setFeeItems(gradeFrom: number, items: { name: string; amount: number }[]) {
    update((d) => { const f = d.feeStructures.find((x) => x.gradeFrom === gradeFrom); if (f) f.items = items; });
  },
  setBudget(category: string, budgeted: number) {
    update((d) => { const b = d.budget.find((x) => x.category === category); if (b) b.budgeted = budgeted; else d.budget.push({ category, budgeted }); });
  },
  submitFinancialReport(title: string, by: string) {
    update((d) => notify(d, { title: `Financial report submitted — ${title}`, body: `${by} submitted the report for your review.`, link: 'financial-overview', toRoles: ['principal'] }));
  },

  /* VP / staff */
  setStaffAttendance(rec: StaffAttendance) {
    update((d) => {
      const i = d.staffAttendance.findIndex((x) => x.staffId === rec.staffId && x.date === rec.date);
      if (i >= 0) d.staffAttendance[i] = rec;
      else d.staffAttendance.push(rec);
    });
  },
  addSubstitution(sub: Omit<Substitution, 'id'>) {
    update((d) => {
      d.substitutions.push({ ...sub, id: uid('sub') });
      const subName = d.staff.find((x) => x.id === sub.substituteId)?.name;
      notify(d, { title: `Substitute assignment — ${className(sub.grade, sub.section)}`, body: `${sub.subject}, ${sub.day} period ${sub.period}. You are covering for ${d.staff.find((x) => x.id === sub.absentTeacherId)?.name}.`, link: 'timetable', toUserIds: [sub.substituteId] });
      if (sub.studentsInformed) {
        notify(d, { title: `Lesson update — ${sub.subject}`, body: `${subName} will take your ${sub.subject} lesson today (period ${sub.period}).`, toRoles: ['student'], link: 'dashboard' });
      }
    });
  },
  updateSubstitution(id: string, patch: Partial<Substitution>) {
    update((d) => { const s = d.substitutions.find((x) => x.id === id); if (s) Object.assign(s, patch); });
  },
  setTimetableSlot(match: { day: string; period: number; grade: number; section: string }, patch: { subject: string; teacherId: string }) {
    update((d) => {
      const s = d.timetable.find((x) => x.day === match.day && x.period === match.period && x.grade === match.grade && x.section === match.section);
      if (s) Object.assign(s, patch);
    });
  },
  addOpsLog(entry: Omit<SchoolState['opsLog'][number], 'id' | 'at'>) {
    update((d) => { d.opsLog.unshift({ ...entry, id: uid('op'), at: now() }); });
  },
  submitStaffReport(r: Omit<SchoolState['staffReports'][number], 'id' | 'submittedAt'>) {
    update((d) => {
      d.staffReports.unshift({ ...r, id: uid('sr'), submittedAt: now() });
      notify(d, { title: `Daily report from the Vice Principal — ${fmtDate(r.date)}`, body: r.summary.slice(0, 140), link: 'administrative-reports', toRoles: ['principal'] });
    });
  },

  /* Discipline */
  reportIncident(i: Omit<Incident, 'id' | 'status' | 'investigation' | 'history' | 'parentVisible' | 'reportedAt'>) {
    update((d) => {
      const id = uid('inc');
      d.incidents.unshift({ ...i, id, reportedAt: now(), status: 'new', investigation: [], parentVisible: false, history: [{ at: now(), by: i.reportedByName, action: 'Incident report submitted to Dean' }] });
      const st = d.students.find((x) => x.id === i.studentId);
      notify(d, { title: `New incident report from ${i.reportedByName}`, body: `${i.category} (${i.severity}) — ${st?.name ?? ''}, ${st ? className(st.grade, st.section) : ''}.`, link: 'disciplinary-cases', toRoles: ['dean'] });
    });
  },
  updateIncident(id: string, patch: Partial<Incident>, by: string, action: string) {
    update((d) => {
      const inc = d.incidents.find((x) => x.id === id);
      if (!inc) return;
      Object.assign(inc, patch);
      inc.history.push({ at: now(), by, action });
      const st = d.students.find((x) => x.id === inc.studentId);
      if (patch.status === 'referred_principal') notify(d, { title: `Serious incident referred — ${st?.name}`, body: `${inc.category}. ${inc.outcome ?? ''}`, link: 'discipline-reports', toRoles: ['principal'] });
      if (patch.status === 'referred_counselor') notify(d, { title: `Student referred by the Dean — ${st?.name}`, body: `${inc.category}. Please follow up.`, link: 'cases', toRoles: ['counselor'] });
      if (patch.status) notify(d, { title: `Update on your incident report — ${st?.name}`, body: `Status: ${patch.status.replace('_', ' ')}. Investigation notes stay confidential.`, toUserIds: [inc.reportedBy] });
    });
  },
  addInvestigationNote(id: string, note: string, by: string) {
    update((d) => { const inc = d.incidents.find((x) => x.id === id); if (inc) { inc.investigation.push({ at: now(), by, action: note }); if (inc.status === 'new') inc.status = 'investigating'; } });
  },
  notifyParent(studentId: string, title: string, body: string) {
    update((d) => notify(d, { title, body, toStudentIds: [studentId], link: 'notifications' }));
  },
  recordIncidentByDean(i: { studentId: string; category: string; severity: Incident['severity']; location: string; description: string }, by: string) {
    update((d) => {
      d.incidents.unshift({ ...i, id: uid('inc'), reportedBy: 'u3', reportedByName: by, reportedAt: now(), status: 'under_review', investigation: [], parentVisible: false, history: [{ at: now(), by, action: 'Incident recorded by the Dean' }] });
    });
  },
  setComplaint(id: string, patch: Partial<SchoolState['complaints'][number]>) {
    update((d) => { const c = d.complaints.find((x) => x.id === id); if (c) Object.assign(c, patch); });
  },
  addFollowUp(f: { incidentId: string; task: string; due: string }) {
    update((d) => { d.followUps.unshift({ ...f, id: uid('fu'), done: false }); });
  },
  toggleFollowUp(id: string) {
    update((d) => { const f = d.followUps.find((x) => x.id === id); if (f) f.done = !f.done; });
  },
  setLeadership(studentId: string, title: string) {
    update((d) => { d.leadership.push({ id: uid('ld'), studentId, title, since: todayISO() }); });
  },
  removeLeadership(id: string) {
    update((d) => { d.leadership = d.leadership.filter((x) => x.id !== id); });
  },

  /* Communication */
  postAnnouncement(a: Omit<Announcement, 'id' | 'date'>) {
    update((d) => {
      d.announcements.unshift({ ...a, id: uid('an'), date: todayISO() });
      if (a.grade != null) {
        const ids = d.students.filter((x) => x.grade === a.grade && x.section === a.section && x.status === 'active').map((x) => x.id);
        notify(d, { title: `Class announcement: ${a.title}`, body: a.message.slice(0, 160), toStudentIds: ids, link: 'announcements' });
        return;
      }
      const roles = [...new Set(a.audience.flatMap((x) => AUDIENCE_ROLES[x]))].filter((r) => r !== a.fromRole);
      notify(d, { title: `Announcement: ${a.title}`, body: a.message.slice(0, 160), toRoles: roles, link: 'announcements' });
    });
  },
  notifyRoles(roles: Role[], title: string, body: string, link?: string) {
    update((d) => notify(d, { title, body, toRoles: roles, link }));
  },
  sendPrivateStudentNotification(studentId: string, title: string, body: string, from?: string) {
    update((d) => notify(d, { title, body, toStudentIds: [studentId], studentOnly: true, link: 'notifications', from }));
  },
  sendMessage(threadId: string | null, input: { parentUserId: string; staffId: string; staffName: string; studentId: string; subject: string; from: 'parent' | 'staff'; text: string }) {
    update((d) => {
      let t = threadId ? d.threads.find((x) => x.id === threadId) : undefined;
      if (!t) {
        t = { id: uid('th'), parentUserId: input.parentUserId, staffId: input.staffId, staffName: input.staffName, studentId: input.studentId, subject: input.subject, messages: [] };
        d.threads.unshift(t);
      }
      t.messages.push({ from: input.from, at: now(), text: input.text });
      if (input.from === 'parent') notify(d, { title: `Message from a parent — ${t.subject}`, body: input.text.slice(0, 140), toUserIds: [t.staffId], link: 'communication' });
      else notify(d, { title: `New message from ${t.staffName}`, body: input.text.slice(0, 140), toUserIds: [t.parentUserId], link: 'teacher-communication' });
    });
  },
  setMessaging(enabled: boolean) {
    update((d) => { d.school.parentTeacherMessaging = enabled; });
  },

  /* Library */
  addBook(b: Omit<Book, 'id' | 'bookNo'>) {
    update((d) => { const n = d.books.length + 1; d.books.push({ ...b, id: uid('bk'), bookNo: `LIB-${String(n).padStart(4, '0')}` }); });
  },
  updateBook(id: string, patch: Partial<Book>) {
    update((d) => { const b = d.books.find((x) => x.id === id); if (b) Object.assign(b, patch); });
  },
  borrowBook(bookId: string, studentId: string, days: number) {
    update((d) => {
      const due = new Date();
      due.setDate(due.getDate() + days);
      d.loans.push({ id: uid('ln'), bookId, studentId, borrowedAt: todayISO(), dueAt: due.toISOString().slice(0, 10) });
      const b = d.books.find((x) => x.id === bookId);
      notify(d, { title: `Library: you borrowed "${b?.title}"`, body: `Please return by ${fmtDate(due.toISOString())}.`, toStudentIds: [studentId], studentOnly: true, link: 'notifications' });
    });
  },
  returnBook(loanId: string, condition: 'good' | 'damaged', note: string) {
    update((d) => {
      const l = d.loans.find((x) => x.id === loanId);
      if (!l) return;
      l.returnedAt = todayISO();
      l.returnCondition = condition;
      if (condition === 'damaged') d.bookIssues.unshift({ id: uid('bi'), bookId: l.bookId, kind: 'damaged', date: todayISO(), studentId: l.studentId, note: note || 'Returned damaged', resolved: false });
    });
  },
  reportBookIssue(i: { bookId: string; kind: 'damaged' | 'missing'; studentId?: string; note: string }) {
    update((d) => { d.bookIssues.unshift({ ...i, id: uid('bi'), date: todayISO(), resolved: false }); });
  },
  resolveBookIssue(id: string) {
    update((d) => { const i = d.bookIssues.find((x) => x.id === id); if (i) i.resolved = true; });
  },

  /* Platform */
  createSchool(t: Omit<SchoolState['tenants'][number], 'id' | 'students' | 'staff' | 'storageGb'>, by: string) {
    update((d) => {
      d.tenants.push({ ...t, id: uid('sch'), students: 0, staff: 1, storageGb: 0 });
      d.platformLog.unshift({ id: uid('pl'), at: now(), actor: by, action: 'Created school deployment', target: t.name });
    });
  },
  setTenant(id: string, patch: Partial<SchoolState['tenants'][number]>, by: string, action: string) {
    update((d) => {
      const t = d.tenants.find((x) => x.id === id);
      if (t) Object.assign(t, patch);
      d.platformLog.unshift({ id: uid('pl'), at: now(), actor: by, action, target: t?.name ?? id });
    });
  },
  setTicket(id: string, status: 'open' | 'in_progress' | 'resolved') {
    update((d) => { const t = d.tickets.find((x) => x.id === id); if (t) t.status = status; });
  },
  runBackup(by: string) {
    update((d) => {
      d.backups.unshift({ id: uid('bk'), at: now(), sizeGb: d.backups[0]?.sizeGb ?? 34, kind: 'manual', status: 'completed' });
      d.platformLog.unshift({ id: uid('pl'), at: now(), actor: by, action: 'Manual backup completed', target: 'All tenants' });
    });
  },
  logPlatform(actor: string, action: string, target: string, justification?: string) {
    update((d) => { d.platformLog.unshift({ id: uid('pl'), at: now(), actor, action, target, justification }); });
  },
};

export { teacherTotal };
