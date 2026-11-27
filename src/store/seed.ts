import type {
  Application, Assignment, Book, BookIssue, CalendarEvent, Concession, CounselingSummary, Exam, Expense,
  Gradebook, GradingConfig, Incident, Leadership, Loan, MarkRow, Payment, ReportBatch, SchoolState,
  SchoolStudent, StaffAttendance, StaffMember, TimetableSlot,
} from './types';

/* Deterministic generator so every browser gets the same demo school. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const SEED_VERSION = 4;
export const todayISO = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};
const daysAhead = (n: number) => daysAgo(-n);

export const GRADE_SECTIONS: { grade: number; sections: string[] }[] = [
  { grade: 7, sections: ['A', 'B', 'C'] },
  { grade: 8, sections: ['A', 'B'] },
  { grade: 9, sections: ['A', 'B', 'C'] },
  { grade: 10, sections: ['A', 'B'] },
  { grade: 11, sections: ['A', 'B'] },
  { grade: 12, sections: ['A', 'B'] },
];

export const SECTION_SIZES: Record<string, number> = {
  '7A': 18, '7B': 16, '7C': 15, '8A': 16, '8B': 17, '9A': 18, '9B': 15, '9C': 14,
  '10A': 16, '10B': 15, '11A': 16, '11B': 14, '12A': 15, '12B': 13,
};

export const JUNIOR_SUBJECTS = ['Mathematics', 'English', 'General Science', 'Social Studies', 'French', 'Literature'];
export const SENIOR_SUBJECTS = ['Mathematics', 'English', 'Biology', 'Chemistry', 'Physics', 'Economics'];
export const subjectsForGrade = (grade: number) => (grade <= 9 ? JUNIOR_SUBJECTS : SENIOR_SUBJECTS);

export const PERIODS = [
  { n: 1, time: '8:00–8:45' },
  { n: 2, time: '8:45–9:30' },
  { n: 3, time: '9:30–10:15' },
  { n: 4, time: '10:45–11:30' },
  { n: 5, time: '11:30–12:15' },
  { n: 6, time: '1:00–1:45' },
  { n: 7, time: '1:45–2:30' },
];
export const DAYS: TimetableSlot['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
export const roomFor = (grade: number, section: string) => `Room ${grade}${section === 'A' ? '01' : section === 'B' ? '02' : '03'}`;

const FIRST_M = ['Emmanuel', 'Joseph', 'Augustine', 'Daniel', 'Samuel', 'Moses', 'Prince', 'Solomon', 'Abraham', 'Varney', 'Momo', 'Alvin', 'Jerome', 'Isaac', 'Benedict', 'Francis', 'Christopher', 'Amos', 'Henry', 'Kollie', 'Boakai', 'Musa', 'Fayia', 'Togba', 'Jallah', 'Harris', 'Lawrence', 'Gabriel'];
const FIRST_F = ['Grace', 'Princess', 'Patricia', 'Ruth', 'Esther', 'Angeline', 'Comfort', 'Hawa', 'Martha', 'Victoria', 'Musu', 'Bendu', 'Fatu', 'Josephine', 'Mercy', 'Sarah', 'Deborah', 'Satta', 'Kebeh', 'Precious', 'Lorpu', 'Gbessay', 'Christiana', 'Florence', 'Rebecca', 'Naomi', 'Yassah', 'Hannah'];
const LAST = ['Gbarbeah', 'Johnson', 'Kollie', 'Kpannah', 'Tuah', 'Sirleaf', 'Karwah', 'Konah', 'Kromah', 'Barclay', 'Yekeh', 'Sumo', 'Massaquoi', 'Flomo', 'Toe', 'Sackor', 'Weah', 'Dennis', 'Cooper', 'Freeman', 'Kamara', 'Sheriff', 'Doe', 'Taylor', 'Pewee', 'Zinnah', 'Gweh', 'Saydee', 'Nyumah', 'Wesseh', 'Togbah', 'Jackson', 'Morris', 'Davies', 'Tarr', 'Dolo'];
const INITIALS = 'ABDEGJKLMPST';

function makeStudents(): SchoolStudent[] {
  const r = rng(7);
  const out: SchoolStudent[] = [];
  let seq = 1;
  const special: Record<string, { id: string; first: string; last: string; gender: 'M' | 'F' }[]> = {
    '11A': [{ id: 's1', first: 'John K.', last: 'Mensah', gender: 'M' }],
    '8B': [{ id: 's2', first: 'Mary K.', last: 'Mensah', gender: 'F' }],
    '7A': [{ id: 's16', first: 'David K.', last: 'Mensah', gender: 'M' }, { id: 'g7A-jj', first: 'John', last: 'Jackson', gender: 'M' }],
  };
  for (const { grade, sections } of GRADE_SECTIONS) {
    for (const section of sections) {
      const key = `${grade}${section}`;
      const size = SECTION_SIZES[key];
      const specials = special[key] ?? [];
      for (let i = 0; i < size; i++) {
        const sp = specials[i];
        const gender: 'M' | 'F' = sp ? sp.gender : r() < 0.5 ? 'M' : 'F';
        const first = sp ? sp.first : `${(gender === 'M' ? FIRST_M : FIRST_F)[Math.floor(r() * 28)]} ${INITIALS[Math.floor(r() * INITIALS.length)]}.`;
        const last = sp ? sp.last : LAST[Math.floor(r() * LAST.length)];
        const lateEntry = r() < 0.12 && grade > 7;
        const yearEntered = lateEntry ? 2026 - Math.floor(r() * (grade - 7)) : 2026 - (grade - 7);
        const prev: string[] = [];
        for (let g = grade - (2026 - yearEntered); g < grade; g++) prev.push(`Grade ${g}${['A', 'B'][Math.floor(r() * 2)]}`);
        const birthYear = 2026 - (grade + 5) - (r() < 0.3 ? 1 : 0);
        const guardianFirst = (r() < 0.5 ? ['Mr.', 'Mrs.'] : ['Mr.', 'Ms.'])[Math.floor(r() * 2)];
        const isMensah = last === 'Mensah' && sp;
        const id = sp ? sp.id : `g${key}-${String(i + 1).padStart(2, '0')}`;
        out.push({
          id,
          studentNo: `INNO-${yearEntered}-${String(seq++).padStart(3, '0')}`,
          firstName: first,
          lastName: last,
          name: `${first} ${last}`,
          gender,
          dob: `${birthYear}-${String(1 + Math.floor(r() * 12)).padStart(2, '0')}-${String(1 + Math.floor(r() * 27)).padStart(2, '0')}`,
          grade,
          section,
          yearEntered,
          status: 'active',
          guardianName: isMensah ? 'Mrs. Janet Mensah' : `${guardianFirst} ${FIRST_M[Math.floor(r() * 28)]} ${last}`,
          guardianRelation: isMensah ? 'Mother' : ['Father', 'Mother', 'Uncle', 'Aunt', 'Guardian'][Math.floor(r() * 5)],
          guardianPhone: isMensah ? '+231 77 123 4567' : `+231 ${r() < 0.5 ? '77' : '88'} ${String(100 + Math.floor(r() * 899))} ${String(1000 + Math.floor(r() * 8999))}`,
          guardianEmail: isMensah ? 'parent@innosys.edu' : `${last.toLowerCase()}.family${Math.floor(r() * 90 + 10)}@mail.lr`,
          address: `${['Sinkor', 'Paynesville', 'Congo Town', 'Old Road', 'Duport Road', 'Red Light', 'Mamba Point', 'Gardnersville'][Math.floor(r() * 8)]}, Monrovia`,
          parentLinked: isMensah ? true : r() < 0.7,
          previousClasses: prev,
        });
      }
    }
  }
  // One student transferred out of 7B mid-period (used by gradebook validation)
  const t = out.find((s) => s.grade === 7 && s.section === 'B' && s.id.endsWith('-05'));
  if (t) { t.status = 'transferred'; t.statusNote = 'Transferred to St. Teresa Convent School on 2026-10-30'; }
  return out;
}

const T = (id: string, name: string, subjects: string[], phone: string, salary: number, joined: string, sponsorOf?: string): StaffMember => ({
  id, staffNo: `STF-${id.toUpperCase()}`, name, role: 'teacher', position: 'Teacher', phone,
  email: `${name.split(' ').slice(-1)[0].toLowerCase()}@innosys.edu`, subjects, sponsorOf, monthlySalary: salary, joined,
});

function makeStaff(): StaffMember[] {
  const teachers: StaffMember[] = [
    T('u6', 'Mr. Peter Wleh', ['Mathematics', 'Physics'], '+231 77 610 2201', 520, '2019-09-02', '11A'),
    T('t2', 'Mr. James Cole', ['Mathematics'], '+231 88 220 1902', 480, '2020-09-01', '7A'),
    T('t3', 'Mrs. Mary Johnson', ['English'], '+231 77 331 4410', 480, '2018-09-03', '7B'),
    T('t4', 'Mr. Peter Williams', ['General Science'], '+231 88 445 0912', 470, '2021-09-06', '8B'),
    T('t5', 'Ms. Comfort Davies', ['Social Studies'], '+231 77 510 3321', 450, '2022-09-05', '9A'),
    T('t6', 'Mr. Alphonso Toe', ['French'], '+231 88 612 7781', 450, '2017-09-04', '8A'),
    T('t7', 'Mrs. Hawa Kamara', ['Literature'], '+231 77 702 4456', 450, '2020-09-01', '7C'),
    T('t8', 'Mr. Moses Flomo', ['English'], '+231 88 819 2290', 500, '2016-09-05', '10A'),
    T('t9', 'Dr. Rita Sackor', ['Biology'], '+231 77 905 6670', 560, '2015-09-07', '12A'),
    T('t10', 'Mr. Abraham Kollie', ['Chemistry'], '+231 88 104 5523', 520, '2019-09-02', '10B'),
    T('t11', 'Mr. Joseph Barclay', ['Economics'], '+231 77 213 8890', 500, '2021-09-06', '12B'),
    T('t12', 'Mr. Varney Sheriff', ['Mathematics', 'Physics'], '+231 88 327 1143', 500, '2018-09-03', '11B'),
    T('t13', 'Mrs. Lorpu Gweh', ['Social Studies', 'Literature'], '+231 77 441 9087', 450, '2023-09-04', '9B'),
    T('t14', 'Mr. Jerome Pewee', ['General Science'], '+231 88 553 2210', 460, '2023-09-04', '9C'),
  ];
  const admin = (id: string, name: string, position: string, phone: string, email: string, salary: number): StaffMember => ({
    id, staffNo: `STF-${id.toUpperCase()}`, name, role: 'administration', position, phone, email, subjects: [], monthlySalary: salary, joined: '2018-08-20',
  });
  return [
    ...teachers,
    admin('u1', 'Dr. Edward Karpeh', 'Principal', '+231 77 000 1001', 'principal@innosys.edu', 1200),
    admin('u2', 'Mrs. Grace Browman', 'Vice Principal', '+231 77 000 1002', 'vp@innosys.edu', 900),
    admin('u3', 'Mr. Samuel Doe', 'Dean of Students', '+231 77 000 1003', 'dean@innosys.edu', 750),
    admin('u4', 'Mrs. Mary Coleman', 'Registrar', '+231 77 000 1004', 'registrar@innosys.edu', 650),
    admin('u5', 'Mr. James Carter', 'Academic Officer', '+231 77 000 1005', 'academic@innosys.edu', 800),
    admin('u7', 'Ms. Sarah Mensah', 'Guidance Counselor', '+231 77 000 1007', 'counselor@innosys.edu', 650),
    admin('u8', 'Mr. Robert Tolbert', 'Finance Director', '+231 77 000 1008', 'finance@innosys.edu', 850),
    admin('u9', 'Mrs. Elizabeth Kpannah', 'Librarian', '+231 77 000 1009', 'librarian@innosys.edu', 550),
    { ...admin('sp1', 'Mr. Mulbah Tarr', 'Security Supervisor', '+231 88 000 2001', 'security@innosys.edu', 300), role: 'support' },
    { ...admin('sp2', 'Mrs. Kebeh Dolo', 'Office Assistant', '+231 88 000 2002', 'office@innosys.edu', 280), role: 'support' },
  ];
}

function makeAssignments(): Assignment[] {
  const out: Assignment[] = [];
  for (const { grade, sections } of GRADE_SECTIONS) {
    for (const section of sections) {
      const key = `${grade}${section}`;
      const pick = (subject: string): string => {
        if (grade <= 9) {
          switch (subject) {
            case 'Mathematics': return 't2';
            case 'English': return 't3';
            case 'General Science': return grade === 9 && section !== 'A' ? 't14' : 't4';
            case 'Social Studies': return grade === 9 && section !== 'A' ? 't13' : 't5';
            case 'French': return 't6';
            default: return grade === 9 ? 't13' : 't7';
          }
        }
        switch (subject) {
          case 'Mathematics': return ['10A', '10B', '11A', '12A'].includes(key) ? 'u6' : 't12';
          case 'Physics': return key.startsWith('11') ? 'u6' : 't12';
          case 'English': return 't8';
          case 'Biology': return 't9';
          case 'Chemistry': return 't10';
          default: return 't11';
        }
      };
      for (const subject of subjectsForGrade(grade)) out.push({ grade, section, subject, teacherId: pick(subject) });
    }
  }
  // One deliberately unfilled assignment so the VP/AO can see "class without assigned teacher"
  const gap = out.find((a) => a.grade === 9 && a.section === 'C' && a.subject === 'French');
  if (gap) gap.teacherId = '';
  return out;
}

function makeTimetable(assignments: Assignment[]): TimetableSlot[] {
  const out: TimetableSlot[] = [];
  const busy = new Set<string>();
  const sectionKeys = GRADE_SECTIONS.flatMap((g) => g.sections.map((s) => ({ grade: g.grade, section: s })));
  for (const { grade, section } of sectionKeys) {
    const subs = subjectsForGrade(grade);
    const quota: Record<string, number> = Object.fromEntries(subs.map((s) => [s, s === 'Mathematics' || s === 'English' ? 7 : 5]));
    let rot = (grade * 3 + section.charCodeAt(0)) % subs.length;
    for (const day of DAYS) {
      for (const p of PERIODS) {
        let placed = false;
        for (let k = 0; k < subs.length && !placed; k++) {
          const subject = subs[(rot + k) % subs.length];
          if (quota[subject] <= 0) continue;
          const teacherId = assignments.find((a) => a.grade === grade && a.section === section && a.subject === subject)?.teacherId ?? '';
          const tk = `${teacherId}-${day}-${p.n}`;
          if (teacherId && busy.has(tk)) continue;
          if (teacherId) busy.add(tk);
          quota[subject]--;
          out.push({ day, period: p.n, grade, section, subject, teacherId, room: roomFor(grade, section) });
          placed = true;
          rot = (rot + k + 1) % subs.length;
        }
        if (!placed) out.push({ day, period: p.n, grade, section, subject: 'Study Hall', teacherId: '', room: roomFor(grade, section) });
      }
    }
  }
  return out;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(n)));

export function teacherTotal(m: Omit<MarkRow, 'total'>): number | null {
  if (m.classwork == null || m.quizzes == null || m.midterm == null || m.final == null) return null;
  return Math.round(m.classwork * 0.1 + m.quizzes * 0.1 + m.midterm * 0.2 + m.final * 0.6);
}

function makeGradebooks(students: SchoolStudent[], assignments: Assignment[]): Gradebook[] {
  const r = rng(42);
  const ability = new Map(students.map((s) => [s.id, 0]));
  for (const s of students) {
    const base = s.id === 's1' ? 86 : s.id === 's2' ? 74 : s.id === 's16' ? 68 : 58 + r() * 38;
    ability.set(s.id, base);
  }
  const submitted = (g: number, sec: string, sub: string) =>
    (g === 7 && sec === 'A' && (sub === 'Mathematics' || sub === 'English')) || (g === 8 && sec === 'B' && sub === 'General Science');
  const draft = (g: number, sec: string) => g === 9 && (sec === 'B' || sec === 'C');
  return assignments.map((a, idx) => {
    const roster = students.filter((s) => s.grade === a.grade && s.section === a.section);
    const marks: Record<string, MarkRow> = {};
    for (const s of roster) {
      const ab = ability.get(s.id) ?? 70;
      const subjOffset = ((a.subject.length * 7 + idx) % 11) - 5;
      const comp = () => clamp(ab + subjOffset + (r() - 0.5) * 16, 35, 100);
      const row = { classwork: comp(), quizzes: comp(), midterm: comp(), final: comp() };
      marks[s.id] = { ...row, total: teacherTotal(row) };
    }
    // Validation demo: a missing mark in 7B Literature
    if (a.grade === 7 && a.section === 'B' && a.subject === 'Literature') {
      const victim = roster[2];
      if (victim) marks[victim.id] = { ...marks[victim.id], final: null, total: null };
    }
    const status = draft(a.grade, a.section) ? 'draft' : submitted(a.grade, a.section, a.subject) ? 'submitted' : 'approved';
    const submittedAt = status === 'draft' ? undefined : status === 'submitted' ? daysAgo(1 + (idx % 2)) : daysAgo(14 + (idx % 9));
    const approvedAt = status === 'approved' ? daysAgo(10 + (idx % 6)) : undefined;
    const fileName = `Gradebook_${a.grade}${a.section}_${a.subject.replace(/\s+/g, '')}_MP2.xlsx`;
    return {
      id: `gb-${a.grade}${a.section}-${a.subject.replace(/\s+/g, '')}`,
      grade: a.grade,
      section: a.section,
      subject: a.subject,
      teacherId: a.teacherId || 't13',
      status,
      fileName,
      fileSize: 18000 + Math.floor(r() * 9000),
      submittedAt,
      approvedAt,
      marks,
      history: [
        ...(submittedAt ? [{ at: submittedAt, by: 'Subject teacher', action: 'Gradebook submitted to Principal' }] : []),
        ...(approvedAt ? [{ at: approvedAt, by: 'Dr. Edward Karpeh', action: 'Approved by Principal' }] : []),
      ],
    } satisfies Gradebook;
  });
}

function remarkFor(avg: number) {
  if (avg >= 90) return 'Outstanding work. Keep it up.';
  if (avg >= 80) return 'Very good performance this period.';
  if (avg >= 70) return 'Good effort; aim higher in weaker subjects.';
  return 'Needs to improve. Extra support recommended.';
}

function makeBatches(students: SchoolStudent[], gradebooks: Gradebook[]): ReportBatch[] {
  const plan: { key: string; status: ReportBatch['status']; days: number }[] = [
    { key: '9A', status: 'in_progress', days: 2 },
    { key: '10A', status: 'submitted', days: 3 },
    { key: '10B', status: 'authorized', days: 4 },
    { key: '11A', status: 'released', days: 6 },
    { key: '12A', status: 'released', days: 7 },
  ];
  return plan.map(({ key, status, days }) => {
    const grade = Number(key.slice(0, -1));
    const section = key.slice(-1);
    const roster = students.filter((s) => s.grade === grade && s.section === section && s.status === 'active');
    const sheets: ReportBatch['sheets'] = {};
    roster.forEach((s, i) => {
      const totals = gradebooks.filter((g) => g.grade === grade && g.section === section).map((g) => g.marks[s.id]?.total ?? 0);
      const avg = totals.reduce((a, b) => a + b, 0) / Math.max(1, totals.length);
      sheets[s.id] = {
        status: status === 'in_progress' && i % 3 === 0 ? 'draft' : 'reviewed',
        teacherRemark: remarkFor(avg),
        academicRemark: avg >= 70 ? 'Promoted on trial basis pending final.' : 'Academic support plan advised.',
        principalRemark: '',
      };
      if (avg >= 70) sheets[s.id].academicRemark = 'Satisfactory academic standing.';
    });
    const at = daysAgo(days);
    const b: ReportBatch = {
      key, grade, section, status, sheets, generatedAt: at,
      history: [{ at, by: 'Mr. James Carter', action: `Generated ${roster.length} gradesheets` }],
    };
    if (['submitted', 'authorized', 'released'].includes(status)) {
      b.submittedAt = daysAgo(days - 1);
      b.history.push({ at: b.submittedAt, by: 'Mr. James Carter', action: 'Submitted class report cards to Principal' });
    }
    if (['authorized', 'released'].includes(status)) {
      b.authorizedAt = daysAgo(Math.max(0, days - 2));
      b.authorizedBy = 'Dr. Edward Karpeh';
      b.history.push({ at: b.authorizedAt, by: 'Dr. Edward Karpeh', action: 'Authorized release' });
    }
    if (status === 'released') {
      b.releasedAt = daysAgo(Math.max(0, days - 3));
      b.releasedBy = 'Mr. James Carter';
      b.history.push({ at: b.releasedAt, by: 'Mr. James Carter', action: `Released ${roster.length} report cards privately to students and guardians` });
    }
    return b;
  });
}

export const DEFAULT_GRADING: GradingConfig = {
  version: 2,
  effectiveFrom: '2026-09-01',
  components: [
    { key: 'classwork', name: 'Classwork', weight: 10, maxMarks: 100 },
    { key: 'quizzes', name: 'Quizzes', weight: 10, maxMarks: 100 },
    { key: 'midterm', name: 'Midterm / Test', weight: 20, maxMarks: 100 },
    { key: 'final', name: 'Final examination', weight: 60, maxMarks: 100 },
  ],
  boundaries: [
    { min: 90, max: 100, letter: 'A', point: 4.0, remark: 'Excellent' },
    { min: 80, max: 89, letter: 'B', point: 3.0, remark: 'Very Good' },
    { min: 70, max: 79, letter: 'C', point: 2.0, remark: 'Good' },
    { min: 60, max: 69, letter: 'D', point: 1.0, remark: 'Below passing' },
    { min: 0, max: 59, letter: 'F', point: 0, remark: 'Fail' },
  ],
  averageMethod: 'simple',
  subjectWeights: {},
  atRiskBelow: 70,
  goodFrom: 80,
  passMark: 70,
};

function makeStaffAttendance(staff: StaffMember[]): StaffAttendance[] {
  const today = todayISO();
  const out: StaffAttendance[] = [];
  const special: Record<string, StaffAttendance['status']> = { t5: 'absent', t10: 'on_leave', t7: 'late', t12: 'not_recorded' };
  for (const s of staff.filter((x) => x.role !== 'support')) {
    const status = special[s.id] ?? 'present';
    out.push({ staffId: s.id, date: today, status, arrival: status === 'present' ? `7:${30 + (s.id.length * 7) % 25}` : status === 'late' ? '8:24' : undefined, note: status === 'on_leave' ? 'Approved annual leave (5 days)' : undefined, recordedBy: status === 'not_recorded' ? undefined : 'Mrs. Grace Browman' });
    for (let d = 1; d <= 20; d++) {
      const date = daysAgo(d);
      const wd = new Date(date).getDay();
      if (wd === 0 || wd === 6) continue;
      const h = (s.id.charCodeAt(s.id.length - 1) * 31 + d * 17) % 100;
      out.push({ staffId: s.id, date, status: h < 4 ? 'absent' : h < 10 ? 'late' : 'present', arrival: h < 4 ? undefined : h < 10 ? '8:15' : '7:40', recordedBy: 'Mrs. Grace Browman' });
    }
  }
  return out;
}

function makeIncidents(students: SchoolStudent[]): Incident[] {
  const pick = (k: string, i: number) => students.filter((s) => `${s.grade}${s.section}` === k)[i];
  const mk = (id: string, st: SchoolStudent | undefined, by: string, byName: string, d: number, category: string, severity: Incident['severity'], location: string, description: string, status: Incident['status'], extra: Partial<Incident> = {}): Incident => ({
    id, studentId: st?.id ?? 's1', reportedBy: by, reportedByName: byName, reportedAt: daysAgo(d), category, severity, location, description, status,
    investigation: [], parentVisible: false, history: [{ at: daysAgo(d), by: byName, action: 'Incident report submitted to Dean' }], ...extra,
  });
  return [
    mk('inc-1', pick('9A', 3), 'u6', 'Mr. Peter Wleh', 1, 'Disruptive behaviour', 'minor', 'Room 901', 'Repeatedly talked over classmates during the mathematics test review and refused to change seats when asked.', 'new'),
    mk('inc-2', pick('10B', 2), 't10', 'Mr. Abraham Kollie', 2, 'Fighting', 'serious', 'Chemistry lab corridor', 'Physical altercation with another student after lab session. Lab equipment was knocked over; no injuries reported.', 'investigating', {
      investigation: [{ at: daysAgo(1), by: 'Mr. Samuel Doe', action: 'Interviewed both students and the lab assistant.' }],
      studentResponse: 'Student says the other student pushed him first.',
    }),
    mk('inc-3', pick('8A', 6), 't6', 'Mr. Alphonso Toe', 5, 'Truancy', 'moderate', 'Campus', 'Left campus after second period without permission on two occasions this week.', 'under_review'),
    mk('inc-4', pick('11B', 1), 't12', 'Mr. Varney Sheriff', 9, 'Academic dishonesty', 'serious', 'Room 1102', 'Found with written notes during physics midterm.', 'referred_principal', {
      investigation: [{ at: daysAgo(8), by: 'Mr. Samuel Doe', action: 'Collected notes as evidence; statement taken from invigilator.' }],
      studentResponse: 'Admitted to bringing the notes.', outcome: 'Midterm voided; referred to Principal for final decision.', parentVisible: true,
    }),
    mk('inc-5', pick('7C', 4), 't7', 'Mrs. Hawa Kamara', 12, 'Bullying', 'moderate', 'Playground', 'Reported by classmates for name-calling and taking lunch from a younger student.', 'referred_counselor', {
      outcome: 'Warning issued; referred to Guidance Counselor for support sessions.', action: 'Written warning', parentVisible: true,
    }),
    mk('inc-6', pick('9A', 3), 't5', 'Ms. Comfort Davies', 20, 'Disruptive behaviour', 'minor', 'Room 901', 'Using phone during social studies class.', 'resolved', { outcome: 'Phone confiscated and returned to parent.', action: 'Verbal warning', parentVisible: true }),
    mk('inc-7', pick('12B', 5), 't11', 'Mr. Joseph Barclay', 15, 'Uniform violation', 'minor', 'Assembly', 'Not in proper school uniform for third time this month.', 'resolved', { outcome: 'Parent informed.', action: 'Detention', parentVisible: true }),
  ];
}

function makeCounseling(students: SchoolStudent[]): CounselingSummary[] {
  const at = (k: string, i: number) => students.filter((s) => `${s.grade}${s.section}` === k)[i]?.id ?? 's1';
  return [
    { id: 'cs-1', studentId: at('7C', 4), category: 'Peer relationships', intensity: 'medium', openedAt: daysAgo(11), status: 'open' },
    { id: 'cs-2', studentId: at('10A', 7), category: 'Academic stress', intensity: 'low', openedAt: daysAgo(30), status: 'monitoring' },
    { id: 'cs-3', studentId: at('8B', 3), category: 'Family circumstances', intensity: 'high', openedAt: daysAgo(6), status: 'open' },
    { id: 'cs-4', studentId: at('12A', 2), category: 'Career guidance', intensity: 'low', openedAt: daysAgo(18), status: 'closed' },
    { id: 'cs-5', studentId: at('9C', 1), category: 'Attendance and motivation', intensity: 'medium', openedAt: daysAgo(9), status: 'open' },
  ];
}

const JUNIOR_FEES = [
  { name: 'Tuition', amount: 350 }, { name: 'Registration', amount: 25 }, { name: 'Development fee', amount: 40 },
  { name: 'Examination fee', amount: 20 }, { name: 'ICT / Computer lab', amount: 15 },
];
const SENIOR_FEES = [
  { name: 'Tuition', amount: 430 }, { name: 'Registration', amount: 25 }, { name: 'Development fee', amount: 45 },
  { name: 'Examination fee', amount: 30 }, { name: 'ICT / Science lab', amount: 20 },
];
export const feeTotal = (grade: number) => (grade <= 9 ? JUNIOR_FEES : SENIOR_FEES).reduce((a, b) => a + b.amount, 0);

function makePayments(students: SchoolStudent[]): { payments: Payment[]; concessions: Concession[] } {
  const r = rng(99);
  const payments: Payment[] = [];
  const concessions: Concession[] = [];
  let rec = 1001;
  const months = ['2026-08', '2026-09', '2026-10', '2026-11'];
  for (const s of students) {
    const total = feeTotal(s.grade);
    const roll = r();
    let target = roll < 0.45 ? total : roll < 0.85 ? Math.round(total * (0.3 + r() * 0.5)) : 0;
    if (s.id === 's1') target = total;
    if (s.id === 's2') target = 250;
    if (s.id === 's16') target = 120;
    if (r() < 0.06 && s.id !== 's1') {
      const amt = Math.round(total * 0.25);
      concessions.push({ id: `con-${s.id}`, studentId: s.id, kind: r() < 0.5 ? 'Scholarship' : 'Discount', amount: amt, reason: r() < 0.5 ? 'Academic merit scholarship' : 'Sibling discount (25%)', approvedBy: 'Dr. Edward Karpeh', date: '2026-09-01' });
      target = Math.min(target, total - amt);
    }
    let left = target;
    let n = 0;
    while (left > 0 && n < 3) {
      const amount = n === 2 || left < 120 ? left : Math.round(left * (0.4 + r() * 0.4));
      const month = months[Math.min(3, n + Math.floor(r() * 2))];
      const day = String(1 + Math.floor(r() * (month === '2026-11' ? 20 : 27))).padStart(2, '0');
      const method = (['Cash', 'Bank deposit', 'Mobile money', 'Bank deposit'] as const)[Math.floor(r() * 4)];
      payments.push({ id: `pay-${rec}`, receiptNo: `RCT-2026-${rec}`, studentId: s.id, amount, method, reference: method === 'Cash' ? '—' : `${method === 'Mobile money' ? 'MM' : 'EBL'}${Math.floor(100000 + r() * 899999)}`, date: `${month}-${day}`, recordedBy: 'Mr. Robert Tolbert' });
      rec++;
      left -= amount;
      n++;
    }
  }
  payments.sort((a, b) => a.date.localeCompare(b.date));
  return { payments, concessions };
}

function makeExpenses(staffPayroll: number): Expense[] {
  const r = rng(5);
  const out: Expense[] = [];
  const cats: [string, string, string, number][] = [
    ['Utilities', 'Liberia Electricity Corporation', 'Electricity bill', 900],
    ['Utilities', 'Liberia Water & Sewer Corp.', 'Water bill', 260],
    ['Supplies', 'Monrovia Office Supplies', 'Stationery and exam paper', 1200],
    ['Maintenance', 'Kpelle Builders Inc.', 'Classroom repairs', 1500],
    ['Transport', 'Total Energies Sinkor', 'Generator fuel', 1100],
    ['ICT', 'LoneStar Cell MTN', 'Internet subscription', 450],
    ['Library', 'Book Centre Liberia', 'Textbooks', 700],
  ];
  let id = 1;
  for (const month of ['2026-08', '2026-09', '2026-10', '2026-11']) {
    for (const [category, vendor, description, base] of cats) {
      if (category === 'Library' && month !== '2026-09') continue;
      if (category === 'Maintenance' && month === '2026-10') continue;
      const amount = Math.round(base * (0.8 + r() * 0.4));
      const day = String(5 + Math.floor(r() * 20)).padStart(2, '0');
      const pending = month === '2026-11' && r() < 0.5;
      out.push({ id: `exp-${id++}`, date: `${month}-${day}`, category, vendor, description, amount, status: pending ? 'pending' : 'paid', dueDate: pending ? daysAhead(5 + Math.floor(r() * 20)) : `${month}-${day}` });
    }
    if (month !== '2026-11') out.push({ id: `exp-${id++}`, date: `${month}-28`, category: 'Salaries', vendor: 'Staff payroll', description: `Staff salaries — ${month}`, amount: staffPayroll, status: 'paid', dueDate: `${month}-28` });
  }
  out.push({ id: `exp-${id++}`, date: daysAgo(2), category: 'Supplies', vendor: 'West Africa Exam Printers', description: 'Final examination printing', amount: 1850, status: 'pending', dueDate: daysAhead(8) });
  out.push({ id: `exp-${id++}`, date: daysAgo(1), category: 'Salaries', vendor: 'Staff payroll', description: 'Staff salaries — 2026-11', amount: staffPayroll, status: 'pending', dueDate: daysAhead(3) });
  return out;
}

const BOOK_SEED: [string, string, string][] = [
  ['New General Mathematics for West Africa 1', 'M. F. Macrae', 'Mathematics'], ['New General Mathematics for West Africa 3', 'M. F. Macrae', 'Mathematics'],
  ['Further Mathematics Project', 'Tuttuh Adegun', 'Mathematics'], ['Essential Physics for Senior Secondary', 'A. F. Abbott', 'Physics'],
  ['New School Physics', 'M. W. Anyakoha', 'Physics'], ['Modern Biology for Senior Secondary', 'S. T. Ramalingam', 'Biology'],
  ['Essential Chemistry', 'I. A. Ababio', 'Chemistry'], ['New School Chemistry', 'Osei Yaw Ababio', 'Chemistry'],
  ['Basic Economics for West Africa', 'J. Harvey', 'Economics'], ['Oxford English Grammar', 'Sidney Greenbaum', 'English'],
  ['Effective English for Schools', 'B. Adewole', 'English'], ['Things Fall Apart', 'Chinua Achebe', 'Literature'],
  ['Murder in the Cassava Patch', 'Bai T. Moore', 'Literature'], ['The Old Man and the Sea', 'Ernest Hemingway', 'Literature'],
  ['Weep Not, Child', 'Ngũgĩ wa Thiong\'o', 'Literature'], ['History of Liberia', 'Joseph S. Guannu', 'Social Studies'],
  ['Geography of Liberia', 'Abdul Kamara', 'Social Studies'], ['Civics for Liberian Schools', 'Ministry of Education', 'Social Studies'],
  ['Integrated Science 7', 'Ministry of Education', 'General Science'], ['Integrated Science 8', 'Ministry of Education', 'General Science'],
  ['Integrated Science 9', 'Ministry of Education', 'General Science'], ['Le Français en Afrique 1', 'J. Diallo', 'French'],
  ['Le Français en Afrique 2', 'J. Diallo', 'French'], ['Oxford Advanced Learner\'s Dictionary', 'A. S. Hornby', 'Reference'],
  ['Atlas of West Africa', 'Collins', 'Reference'], ['Computer Studies for Schools', 'K. Owusu', 'ICT'],
];

function makeLibrary(students: SchoolStudent[]): { books: Book[]; loans: Loan[]; bookIssues: BookIssue[] } {
  const r = rng(11);
  const books: Book[] = BOOK_SEED.map(([title, author, category], i) => ({
    id: `bk-${i + 1}`, bookNo: `LIB-${String(i + 1).padStart(4, '0')}`, title, author, category,
    isbn: `978-${Math.floor(100000000 + r() * 899999999)}-${i % 10}`, copies: 2 + Math.floor(r() * 6),
    shelf: `${category.slice(0, 3).toUpperCase()}-${1 + (i % 4)}`, year: 1998 + Math.floor(r() * 26),
  }));
  const loans: Loan[] = [];
  const active = students.filter((s) => s.status === 'active');
  for (let i = 0; i < 46; i++) {
    const st = i === 0 ? active.find((s) => s.id === 's1')! : i === 1 ? active.find((s) => s.id === 's2')! : active[Math.floor(r() * active.length)];
    const bk = books[Math.floor(r() * books.length)];
    const ago = Math.floor(r() * 40);
    const returned = i > 22 && i % 2 === 0;
    loans.push({ id: `ln-${i + 1}`, bookId: bk.id, studentId: st.id, borrowedAt: daysAgo(ago), dueAt: daysAgo(ago - 14), returnedAt: returned ? daysAgo(Math.max(0, ago - 10)) : undefined, returnCondition: returned ? 'good' : undefined });
  }
  return {
    books, loans,
    bookIssues: [
      { id: 'bi-1', bookId: 'bk-12', kind: 'damaged', date: daysAgo(6), studentId: active[30]?.id, note: 'Water damage to cover and first 20 pages.', resolved: false },
      { id: 'bi-2', bookId: 'bk-4', kind: 'missing', date: daysAgo(25), studentId: active[51]?.id, note: 'Borrower reports book lost; replacement requested.', resolved: false },
      { id: 'bi-3', bookId: 'bk-22', kind: 'damaged', date: daysAgo(40), note: 'Spine broken — rebound.', resolved: true },
    ],
  };
}

function makeExams(gradebooks: Gradebook[]): Exam[] {
  const out: Exam[] = [];
  let i = 1;
  for (const g of gradebooks) {
    out.push({ id: `ex-${i++}`, name: `Midterm — ${g.subject}`, kind: 'Midterm', grade: g.grade, section: g.section, subject: g.subject, date: '2026-10-20', maxMarks: 100, status: g.status === 'draft' ? 'missing_records' : 'marks_submitted' });
    out.push({ id: `ex-${i++}`, name: `Semester Exam — ${g.subject}`, kind: 'Final', grade: g.grade, section: g.section, subject: g.subject, date: '2027-01-19', maxMarks: 100, status: 'scheduled' });
  }
  out.push({ id: `ex-${i++}`, name: 'LJHSCE (WAEC) — Grade 9 candidates', kind: 'National', grade: 9, section: 'A', subject: 'All subjects', date: '2027-05-11', maxMarks: 100, status: 'scheduled' });
  out.push({ id: `ex-${i++}`, name: 'WASSCE (WAEC) — Grade 12 candidates', kind: 'National', grade: 12, section: 'A', subject: 'All subjects', date: '2027-05-04', maxMarks: 100, status: 'scheduled' });
  return out;
}

function makeCalendar(): CalendarEvent[] {
  return [
    { id: 'ev1', date: '2026-09-07', title: 'First day of school', kind: 'event', internal: false },
    { id: 'ev2', date: '2026-11-05', title: 'Thanksgiving Day (national holiday)', kind: 'holiday', internal: false },
    { id: 'ev3', date: '2026-11-29', title: 'President Tubman\'s Birthday (holiday)', kind: 'holiday', internal: false },
    { id: 'ev4', date: daysAhead(3), title: 'Gradebook submission deadline — Marking Period 2', kind: 'deadline', internal: true },
    { id: 'ev5', date: daysAhead(7), title: 'Result processing deadline', kind: 'deadline', internal: true },
    { id: 'ev6', date: daysAhead(10), title: 'Report card release date', kind: 'release', internal: true },
    { id: 'ev7', date: daysAhead(2), title: 'Staff meeting — academic review', kind: 'meeting', internal: true },
    { id: 'ev8', date: daysAhead(5), title: 'PTA general meeting', kind: 'meeting', internal: false },
    { id: 'ev9', date: daysAhead(9), title: 'Department heads meeting', kind: 'meeting', internal: true },
    { id: 'ev10', date: '2026-12-18', endDate: '2027-01-04', title: 'Christmas and New Year break', kind: 'holiday', internal: false },
    { id: 'ev11', date: '2027-01-07', title: 'Pioneers\' Day (holiday)', kind: 'holiday', internal: false },
    { id: 'ev12', date: '2027-01-19', endDate: '2027-01-23', title: 'First Semester examinations', kind: 'exam', internal: false },
    { id: 'ev13', date: '2027-02-11', title: 'Armed Forces Day (holiday)', kind: 'holiday', internal: false },
    { id: 'ev14', date: '2026-10-20', endDate: '2026-10-23', title: 'Midterm tests', kind: 'exam', internal: false },
    { id: 'ev15', date: daysAhead(1), title: 'Inter-house sports practice', kind: 'event', internal: false },
  ];
}

export function buildSeed(): SchoolState {
  const students = makeStudents();
  const staff = makeStaff();
  const assignments = makeAssignments();
  const timetable = makeTimetable(assignments);
  const gradebooks = makeGradebooks(students, assignments);
  const batches = makeBatches(students, gradebooks);
  const { payments, concessions } = makePayments(students);
  const payroll = staff.reduce((a, s) => a + s.monthlySalary, 0);
  const lib = makeLibrary(students);
  const by = (k: string, i: number) => students.filter((s) => `${s.grade}${s.section}` === k)[i]?.id ?? 's1';
  const leadership: Leadership[] = [
    { id: 'ld1', studentId: by('12A', 0), title: 'Head Prefect', since: '2026-09-15' },
    { id: 'ld2', studentId: by('12B', 1), title: 'Deputy Head Prefect', since: '2026-09-15' },
    { id: 'ld3', studentId: 's1', title: 'Class Monitor — 11A', since: '2026-09-15' },
    { id: 'ld4', studentId: by('11B', 2), title: 'Sports Prefect', since: '2026-09-15' },
    { id: 'ld5', studentId: by('10A', 3), title: 'Library Prefect', since: '2026-09-15' },
    { id: 'ld6', studentId: by('12A', 4), title: 'Student Council President', since: '2026-10-01' },
  ];
  const applications: Application[] = [
    { id: 'app1', firstName: 'Blessing T.', lastName: 'Kamara', gender: 'F', dob: '2014-03-11', applyingFor: 7, previousSchool: 'J. J. Roberts Elementary', guardianName: 'Mr. Ansu Kamara', guardianPhone: '+231 77 812 3341', submittedAt: daysAgo(3), status: 'pending' },
    { id: 'app2', firstName: 'Mohammed A.', lastName: 'Sheriff', gender: 'M', dob: '2012-07-02', applyingFor: 9, previousSchool: 'Monrovia Central High (transfer)', guardianName: 'Mrs. Fanta Sheriff', guardianPhone: '+231 88 220 9910', submittedAt: daysAgo(5), status: 'pending' },
    { id: 'app3', firstName: 'Lovetta K.', lastName: 'Weah', gender: 'F', dob: '2011-12-19', applyingFor: 10, previousSchool: 'Sinkor Junior High', guardianName: 'Mr. Christopher Weah', guardianPhone: '+231 77 619 4432', submittedAt: daysAgo(8), status: 'pending' },
    { id: 'app4', firstName: 'Archie B.', lastName: 'Freeman', gender: 'M', dob: '2014-01-25', applyingFor: 7, previousSchool: 'Paynesville Community School', guardianName: 'Mrs. Ellen Freeman', guardianPhone: '+231 88 331 7719', submittedAt: daysAgo(21), status: 'approved' },
  ];
  const incidents = makeIncidents(students);
  return {
    version: SEED_VERSION,
    school: {
      name: 'Innosys Academy', address: '123 Broad Street, Monrovia, Liberia', phone: '+231 77 000 0000',
      email: 'info@innosysacademy.edu.lr', motto: 'Knowledge · Integrity · Service', currency: 'USD', timezone: 'Africa/Monrovia',
      academicYear: '2026/2027', currentPeriod: null,
      bank: { bank: 'Ecobank Liberia Ltd.', accountName: 'Innosys Academy — School Fees', accountNo: '0011-2045-7783-01', branch: 'Broad Street Branch, Monrovia', swift: 'ECOCLRLM' },
      parentTeacherMessaging: true,
    },
    students, staff, assignments, timetable, gradebooks, batches,
    grading: DEFAULT_GRADING,
    gradingHistory: [{ ...DEFAULT_GRADING, version: 1, effectiveFrom: '2025-09-01', components: DEFAULT_GRADING.components.map((c) => (c.key === 'midterm' ? { ...c, weight: 30 } : c.key === 'final' ? { ...c, weight: 50 } : c)) }],
    template: {
      title: 'Student Grade Sheet', schoolAddress: '123 Broad Street, Monrovia, Liberia', motto: 'Knowledge · Integrity · Service',
      showLetterGrade: true, showGradePoint: false, showPosition: true, showAttendance: true, showConduct: true,
      showTeacherRemark: true, showAcademicRemark: true, showPrincipalRemark: true, showSignatures: true, accent: '#1a2d54',
    },
    years: [
      {
        id: 'ay-2026', name: '2026/2027', start: '2026-09-07', end: '2027-07-16', status: 'current', periods: [
          { id: 'sem1', name: 'First Semester', kind: 'semester', start: '2026-09-07', end: '2027-01-29' },
          { id: 'mp1', name: '1st Marking Period', kind: 'marking_period', start: '2026-09-07', end: '2026-10-16', parent: 'sem1' },
          { id: 'mp2', name: '2nd Marking Period', kind: 'marking_period', start: '2026-10-19', end: '2026-11-27', parent: 'sem1' },
          { id: 'mp3', name: '3rd Marking Period', kind: 'marking_period', start: '2026-11-30', end: '2027-01-15', parent: 'sem1' },
          { id: 'sem2', name: 'Second Semester', kind: 'semester', start: '2027-02-01', end: '2027-07-16' },
          { id: 'mp4', name: '4th Marking Period', kind: 'marking_period', start: '2027-02-01', end: '2027-03-19', parent: 'sem2' },
          { id: 'mp5', name: '5th Marking Period', kind: 'marking_period', start: '2027-03-22', end: '2027-05-07', parent: 'sem2' },
          { id: 'mp6', name: '6th Marking Period', kind: 'marking_period', start: '2027-05-10', end: '2027-06-25', parent: 'sem2' },
        ],
      },
      { id: 'ay-2025', name: '2025/2026', start: '2025-09-08', end: '2026-07-17', status: 'closed', periods: [] },
      { id: 'ay-2024', name: '2024/2025', start: '2024-09-02', end: '2025-07-18', status: 'closed', periods: [] },
    ],
    calendar: makeCalendar(),
    exams: makeExams(gradebooks),
    staffAttendance: makeStaffAttendance(staff),
    substitutions: [],
    incidents,
    counseling: makeCounseling(students),
    feeStructures: [
      { gradeFrom: 7, gradeTo: 9, items: JUNIOR_FEES, dueDate: '2027-02-15', instalments: [{ label: '1st instalment', due: '2026-09-15', percent: 50 }, { label: '2nd instalment', due: '2026-11-15', percent: 30 }, { label: '3rd instalment', due: '2027-02-15', percent: 20 }] },
      { gradeFrom: 10, gradeTo: 12, items: SENIOR_FEES, dueDate: '2027-02-15', instalments: [{ label: '1st instalment', due: '2026-09-15', percent: 50 }, { label: '2nd instalment', due: '2026-11-15', percent: 30 }, { label: '3rd instalment', due: '2027-02-15', percent: 20 }] },
    ],
    payments, concessions,
    expenses: makeExpenses(payroll),
    budget: [
      { category: 'Salaries', budgeted: payroll * 11 }, { category: 'Utilities', budgeted: 14000 }, { category: 'Supplies', budgeted: 16000 },
      { category: 'Maintenance', budgeted: 12000 }, { category: 'Transport', budgeted: 13000 }, { category: 'ICT', budgeted: 6000 }, { category: 'Library', budgeted: 4000 },
    ],
    salaryRuns: [
      { month: '2026-08', status: 'paid', paidOn: '2026-08-28' }, { month: '2026-09', status: 'paid', paidOn: '2026-09-28' },
      { month: '2026-10', status: 'paid', paidOn: '2026-10-28' }, { month: '2026-11', status: 'pending' },
    ],
    ...lib,
    announcements: [
      { id: 'an1', title: 'PTA General Meeting', message: 'All parents and guardians are invited to the PTA general meeting in the main hall. Agenda: second marking period results, fee schedule and the Christmas programme.', audience: ['parents', 'teachers'], fromName: 'Dr. Edward Karpeh', fromRole: 'principal', date: daysAgo(2) },
      { id: 'an2', title: 'Gradebook deadline reminder', message: 'Teachers are reminded that all Marking Period 2 gradebooks must be submitted to the Principal by the end of this week.', audience: ['teachers'], fromName: 'Dr. Edward Karpeh', fromRole: 'principal', date: daysAgo(4) },
      { id: 'an3', title: 'Thanksgiving holiday', message: 'School was closed on Thanksgiving Day. Classes resumed the following day as normal.', audience: ['all'], fromName: 'Mrs. Grace Browman', fromRole: 'vice_principal', date: '2026-11-03' },
      { id: 'an4', title: 'Second instalment due', message: 'The second fee instalment (30%) was due on November 15. Parents with outstanding balances should pay at the Finance Office, by bank deposit or online.', audience: ['parents'], fromName: 'Mr. Robert Tolbert', fromRole: 'finance', date: '2026-11-10' },
    ],
    notifications: [
      { id: 'n1', createdAt: daysAgo(1), title: 'Gradebooks awaiting your approval', body: 'Grade 7A Mathematics, Grade 7A English and Grade 8B General Science were submitted for approval.', link: 'exams-results', toRoles: ['principal'], readBy: [] },
      { id: 'n2', createdAt: daysAgo(3), title: 'Report Cards Ready for Review — Grade 10A', body: 'The Academic Officer submitted 16 gradesheets for Grade 10A. Preview them and authorize release.', link: 'report-card-approvals', toRoles: ['principal'], readBy: [] },
      { id: 'n3', createdAt: daysAgo(4), title: 'Release Authorized — Grade 10B', body: 'The Principal authorized release of Grade 10B report cards. You can now release them to students and guardians.', link: 'report-cards:authorized', toRoles: ['academic_officer'], readBy: [] },
      { id: 'n4', createdAt: daysAgo(10), title: 'Gradebook Approved — Grade 7B', body: 'All Grade 7B subject gradebooks are approved and ready for processing.', link: 'gradebook-processing', toRoles: ['academic_officer'], readBy: [] },
      { id: 'n5', createdAt: daysAgo(3), title: 'Report card released — Grade 11A', body: 'Your Marking Period 2 report card is now available.', link: 'report-cards', toStudentIds: ['s1'], readBy: [] },
      { id: 'n6', createdAt: daysAgo(1), title: 'New incident report from Mr. Peter Wleh', body: 'Disruptive behaviour — Grade 9A. Please review.', link: 'disciplinary-cases', toRoles: ['dean'], readBy: [] },
      { id: 'n7', createdAt: daysAgo(2), title: 'Serious incident: Fighting — Grade 10B', body: 'Reported by Mr. Abraham Kollie. Under investigation by the Dean.', link: 'disciplinary-cases', toRoles: ['dean'], readBy: [] },
    ],
    threads: [
      { id: 'th1', parentUserId: 'u12', staffId: 'u6', staffName: 'Mr. Peter Wleh', studentId: 's1', subject: 'John — physics project', messages: [
        { from: 'staff', at: daysAgo(6), text: 'Good afternoon Mrs. Mensah. John did very well on his kinematics project. Please encourage him to keep revising for the semester exam.' },
        { from: 'parent', at: daysAgo(5), text: 'Thank you Mr. Wleh, we will keep encouraging him at home.' },
      ] },
    ],
    staffReports: [
      { id: 'sr1', date: daysAgo(1), author: 'Mrs. Grace Browman', summary: 'All classes held except Grade 9A Social Studies (period 3) — substitute arranged. One lateness case among staff. Midday supervision completed.', teachersAbsent: 1, incidents: 1, submittedAt: daysAgo(1) },
    ],
    opsLog: [
      { id: 'op1', at: daysAgo(0), kind: 'activity', title: 'Morning assembly', detail: 'Held at 7:45. Head Prefect led devotion.', by: 'Mrs. Grace Browman', status: 'completed' },
      { id: 'op2', at: daysAgo(0), kind: 'movement', title: 'Grade 12A to science lab', detail: 'Chemistry practical, periods 4–5.', by: 'Mrs. Grace Browman', status: 'in progress' },
      { id: 'op3', at: daysAgo(1), kind: 'incident', title: 'Generator failure', detail: 'Power out 10:00–10:40; fuel delivered.', by: 'Mr. Mulbah Tarr', status: 'resolved' },
      { id: 'op4', at: daysAgo(0), kind: 'meeting', title: 'Staff meeting — academic review', detail: 'Main hall, all teaching staff.', by: 'Mrs. Grace Browman', status: 'scheduled', date: daysAhead(2) },
      { id: 'op5', at: daysAgo(0), kind: 'meeting', title: 'Department heads meeting', detail: 'Conference room.', by: 'Mrs. Grace Browman', status: 'scheduled', date: daysAhead(9) },
      { id: 'op6', at: daysAgo(0), kind: 'meeting', title: 'PTA executive meeting', detail: 'Principal\'s office.', by: 'Mrs. Grace Browman', status: 'scheduled', date: daysAhead(5) },
    ],
    applications,
    leadership,
    complaints: [
      { id: 'cp1', studentId: by('10A', 4), subject: 'Bullying in the canteen line', detail: 'Older students push us out of the line and take our places every day at lunch.', date: daysAgo(2), status: 'open' },
      { id: 'cp2', studentId: by('8A', 2), subject: 'Broken toilet facilities', detail: 'The girls\' toilets on the first floor have been locked for a week.', date: daysAgo(5), status: 'in_review', response: 'Reported to the Vice Principal for maintenance.' },
      { id: 'cp3', studentId: by('12B', 3), subject: 'Unfair seating in exams', detail: 'Some students were allowed to sit together during the midterm.', date: daysAgo(14), status: 'resolved', response: 'Invigilators briefed; seating plan now posted before each exam.' },
    ],
    followUps: [
      { id: 'fu1', incidentId: 'inc-5', task: 'Check in with the class teacher on behaviour after counseling sessions', due: daysAhead(3), done: false },
      { id: 'fu2', incidentId: 'inc-2', task: 'Meet both students\' parents to agree on corrective action', due: daysAhead(1), done: false },
      { id: 'fu3', incidentId: 'inc-6', task: 'Return confiscated phone to parent', due: daysAgo(18), done: true },
    ],
    tenants: [
      { id: 'sch-1', name: 'Innosys Academy', county: 'Montserrado', plan: 'Premium', status: 'active', students: students.length, staff: staff.length, storageGb: 18.4, renewal: '2027-08-31', modules: ['Academics', 'Finance', 'Library', 'Counseling', 'Parent portal'], admin: 'Dr. Edward Karpeh' },
      { id: 'sch-2', name: 'St. Mary\'s High School', county: 'Margibi', plan: 'Standard', status: 'active', students: 640, staff: 41, storageGb: 9.1, renewal: '2027-01-31', modules: ['Academics', 'Finance', 'Parent portal'], admin: 'Rev. Sr. Agnes Tokpah' },
      { id: 'sch-3', name: 'Gbarnga Central Academy', county: 'Bong', plan: 'Starter', status: 'onboarding', students: 0, staff: 6, storageGb: 0.3, renewal: '2027-11-30', modules: ['Academics'], admin: 'Mr. Kpadeh Flomo' },
      { id: 'sch-4', name: 'Buchanan Model School', county: 'Grand Bassa', plan: 'Standard', status: 'suspended', students: 412, staff: 28, storageGb: 6.7, renewal: '2026-10-31', modules: ['Academics', 'Finance'], admin: 'Mrs. Musu Paye' },
    ],
    tickets: [
      { id: 'tk-101', schoolId: 'sch-2', subject: 'Parent cannot see second child after linking', priority: 'medium', status: 'open', openedAt: daysAgo(1) },
      { id: 'tk-102', schoolId: 'sch-1', subject: 'Request: add Grade 7C to timetable template', priority: 'low', status: 'in_progress', openedAt: daysAgo(3) },
      { id: 'tk-103', schoolId: 'sch-4', subject: 'Subscription renewal invoice', priority: 'high', status: 'open', openedAt: daysAgo(6) },
      { id: 'tk-104', schoolId: 'sch-3', subject: 'Onboarding: bulk import of student CSV', priority: 'medium', status: 'resolved', openedAt: daysAgo(12) },
    ],
    platformLog: [
      { id: 'pl1', at: daysAgo(0), actor: 'System', action: 'Nightly backup completed', target: 'All tenants' },
      { id: 'pl2', at: daysAgo(2), actor: 'Mr. Daniel Cooper', action: 'Suspended deployment (contract expired)', target: 'Buchanan Model School' },
      { id: 'pl3', at: daysAgo(4), actor: 'Mr. Daniel Cooper', action: 'Support access granted (2h, read-only timetable)', target: 'Innosys Academy', justification: 'Ticket tk-102: timetable template issue' },
    ],
    backups: [
      { id: 'bk1', at: daysAgo(0), sizeGb: 34.2, kind: 'scheduled', status: 'completed' },
      { id: 'bk2', at: daysAgo(1), sizeGb: 34.0, kind: 'scheduled', status: 'completed' },
      { id: 'bk3', at: daysAgo(2), sizeGb: 33.9, kind: 'scheduled', status: 'completed' },
      { id: 'bk4', at: daysAgo(5), sizeGb: 33.5, kind: 'manual', status: 'completed' },
    ],
  };
}
