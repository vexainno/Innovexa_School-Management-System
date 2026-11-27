# InnosysEdu — School Management Platform (Frontend)

Frontend for Innosys Academy's school management platform, built by Innovexa TechHub for Liberian schools.
React 18 · TypeScript · Vite · Tailwind CSS · Lucide icons.

This repository is **frontend only**. All school records are realistic sample data held in one shared
in-browser data store, so every workspace shows the same numbers and the workflows can be demonstrated end to end.
No real payments, emails or SMS are sent.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck
npm run lint
npm run build      # production build in dist/
npm run preview    # serve the production build
```

`dist/` is a static site and can be hosted anywhere (Vercel, Netlify, Cloudflare Pages, S3). Routing uses
`#/page` URLs, so no server rewrite rules are needed.

## Demonstration accounts

The demonstration accounts are **not listed on the login screen**. They work in every build (development and
production) so the platform can be shown to schools. All use the password the team already has.
Sessions persist across refreshes when "Remember me" is ticked.

## Workspaces (sidebars)

| Role | Modules |
|---|---|
| Principal | Overview · School Information · Student Management · Teacher and Staff Management · Academic Overview · Attendance Reports · Financial Overview · Discipline Reports · Examination and Results · Report Card Approvals · Announcements · Administrative Reports · Settings |
| Vice Principal | Overview · Teacher Attendance · Student Attendance · Class Monitoring · Teacher Timetables · Class Schedules · Daily Activities · Substitute Teacher Management · Student Movement and Supervision · Incident Reports · Staff Reports · Announcements (+ School Calendar from the dashboard) |
| Academic Officer | Overview · Academic Structure · Academic Calendar · Classes and Sections · Subjects and Courses · Teacher Academic Assignments · Examination Management · Gradebook Processing · Grading Configuration · Report Card Management · Student Academic Records · Academic Performance · Academic Reports · Notifications · Settings |
| Registrar | Overview · Student Registration · Admission Applications · Student Profiles · Parent and Guardian Records · Class Assignment · Student Promotion · Student Transfers · Withdrawals · Student Identification Numbers · Enrollment Reports · Academic Records Archive |
| Finance Director | Overview · School Fee Structure · Student Fee Accounts · Record Payments · Generate Receipts · Outstanding Balances · Payment History · Discounts and Scholarships · Expenditure Management · Staff Salaries · Budget Management · Financial Reports · Reconciliation |
| Dean of Students | Overview · Student Conduct · Disciplinary Cases · Incident Reports · Student Attendance Monitoring · Student Complaints · Student Leadership · Parent Notifications · Welfare Reports · Follow-up Actions |
| Teacher | Overview · My Classes · My Subjects · My Timetable · Student Lists · Attendance · Assignments · Online Assessments · Assessment Questions · Submissions · Marking and Grading · Gradebook · Learning Materials · Academic Progress · Student Performance · Notifications · Communication |
| Guidance Counselor | Existing counselor workspace; Student Support Notifications are delivered privately to the one selected student |
| Librarian | Overview · Book Inventory · Add New Books · Book Categories · Student Borrowing · Book Returns · Overdue Books · Damaged and Missing Books · Student Library Accounts · Library Reports |
| Parent / Guardian | Overview · My Children · Attendance · Academic Performance · Examination Results · Report Cards · Class Timetable · School Announcements · Teacher Communication · Fee Statement and Payment · Payment History · School Calendar · Notifications · Profile and Settings |
| Student | Dashboard · Classes · Subjects · Timetable · Assignments · Resources · Attendance · Results · Report Card · Library · Counseling · Announcements · Notifications |
| Innovexa Super Admin | Platform Overview · School Management · Create New School · School Configurations · Subscription Management · Platform Users · System Roles and Permissions · Platform Analytics · System Monitoring · Storage Management · Backup Management · Security and Audit Logs · Platform Settings · Support and Maintenance |

Every dashboard card is clickable and opens the matching sidebar page.

## The results workflow

Teacher submits gradebook (Excel) → Principal opens and approves it → Academic Officer is notified, validates it
(matching by student ID) and generates one gradesheet per student → Academic Officer reviews and submits the class
batch (blocked while any gradesheet is outstanding) → Principal previews each gradesheet and authorizes release for the
class section → Academic Officer releases → each student and their linked guardian see only their own report card.

All counters (Pending, Approved, Awaiting Release, Released, etc.) are calculated from the same workflow state,
so they always agree across workspaces.

## Other connected flows

- Registrar registers a student → unique student ID + fee account created from the fee structure → Finance and teachers notified.
- Finance records a payment → balance, payment history and receipt update → guardian notified → Principal's financial overview updates.
- Teacher files an incident → Dean notified → investigation, outcome, referral to Principal/Counselor, full case history.
- VP marks a teacher absent → arranges substitutes for that teacher's lessons → substitute and students notified → Class Monitoring updates.
- Librarian looks up students by ID; borrowing and returns update availability automatically.

## Code map

```
src/store/        shared data model (types.ts), sample school (seed.ts), state + actions (store.ts), file export (files.ts)
src/portals/      one module per workspace (principal, academic, vicePrincipal, registrar, finance, parent, dean,
                  librarian, platform, teacher, student) + shared pages (notifications, announcements, calendar)
src/components/   app shell, login, UI kit (kit.tsx), printable report card
src/pages/        retained earlier screens (teacher assessments/marking, counselor, student portal)
```

Each workspace loads on demand (code-split per role).

## Connecting a backend later

The UI reads from `useSchool()` and changes data only through `actions.*` in `src/store/store.ts`.
Replace those functions with API calls (e.g. Supabase) and keep the same shapes in `src/store/types.ts`;
screens do not need to change. Sign-in is behind `AuthService` in `src/services/authService.ts`.

Before going live with real school data, the backend must enforce: authentication, school (tenant) isolation,
role permissions, guardian verification, audit history, secure document storage, server-side report-card release,
payment-provider checkout (no card details in the app), and a real notification provider.

## Known limitations

- Data is stored in the browser (`localStorage`); it is per device and per browser.
- Uploaded gradebook files are kept for the current browser session only.
- Online card/mobile-money checkout is a clearly labelled demonstration; no money moves.
- PDF output uses the browser's "Print / Save as PDF"; spreadsheets download as `.csv` / `.xlsx`.
