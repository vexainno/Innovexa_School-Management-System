# MASTER BUILD PROMPT FOR BOLT AI
## INNOSYSEDU | COMPLETE FRONTEND-ONLY SCHOOL MANAGEMENT SAAS

You are a senior product designer, frontend architect and senior React/TypeScript engineer. Build **InnosysEdu**, a complete, polished, production-oriented FRONTEND for a multi-school School Management SaaS operated by Innovexa TechHub. The initial target market is high schools in Liberia.

I am providing a separate document named **InnosysEdu_Frontend_SRS_v2.0**. Read it fully before coding. The SRS is the authoritative source of truth. Follow every applicable requirement. Do not omit features because the specification is long. If a requirement is unclear, list the ambiguity and ask before inventing a business rule.

## 1. CRITICAL SCOPE: FRONTEND ONLY

Build only the frontend:
- React + TypeScript + Vite + Tailwind CSS.
- Responsive web application for desktop, tablet and mobile.
- Complete pages, layouts, routing, role-aware navigation, forms, tables, dialogs, charts, validation, interaction states, demo data and mock service adapters.
- All demo workflows must be demonstrable end-to-end using synthetic data.
- Design clean typed service interfaces so a separate backend/Supabase implementation can be connected later.

Do NOT build:
- Backend servers, database schemas/migrations, Supabase SQL/RLS policies, edge functions, real authentication, real payment processing, webhook handlers, real email/SMS sending, or secrets.
- Do not claim mock operations are real.
- Do not store raw bank card numbers, CVV or expiry details.
- Do not create fake API calls or pretend data is synchronized across users/devices.

Authentication is being implemented by a teammate later. Build the login and account lifecycle UI plus an AuthService interface, and use a development-only mock session/account switcher for preview.

## 2. FIRST ACTION: INSPECT, PLAN, THEN BUILD

Before implementation:
1. Read the entire SRS.
2. Inspect the existing repository if one is supplied. If there is an existing InnosysEdu frontend, preserve useful components, routes, design and working behavior. Upgrade it rather than blindly replacing it.
3. Report the current project structure and any reusable components.
4. Produce a concise implementation plan mapped to the SRS sections.
5. Identify ambiguities, conflicts and out-of-scope items. Do not silently invent them.
6. Build in phases. Keep the app runnable after every phase.
7. After every phase run typecheck, lint and production build. Fix all errors before continuing.
8. Never say a feature is complete unless it is implemented and testable in the browser.

Do not respond with only a plan. Begin implementation after inspection and proceed in small verified increments. If Bolt has limited context/time, finish the current phase cleanly and state exactly what remains.

## 3. PRODUCT ARCHITECTURE

Create ONE application with three portals:
1. Student & Parent portal application: shared application shell, distinct student and parent experiences and permission scopes.
2. Staff Portal: shared staff shell with role-specific dashboards, menus and permissions.
3. Innovexa Platform Super Admin portal: separate internal platform-operations workspace.

School Administration is a privileged workspace inside the Staff Portal, not a fourth portal. School Super Administrator is a school-level administrative designation/permission bundle. Innovexa Platform Super Admin is a different platform-level role.

There must be one unified login screen. Do not ask users to choose a portal before login. After session identification, route to the correct authorized workspace. In development, provide a clearly labelled DEV-ONLY account/role switcher that is absent from production builds.

## 4. IDENTITY AND ACCESS MODEL

Keep these concepts separate in TypeScript models and UI:
- User identity: the person.
- Authentication: how they sign in.
- School membership: their relationship to a school tenant.
- Roles and permissions: what they may do within that membership.
- Student enrollment: the student's academic relationship to a school/year/class.

One person has one identity and one set of credentials. One identity can have multiple verified school memberships and different roles per school. Multiple roles in one school are supported only when explicitly enabled and authorized; standard demo users have one role by default. Role switching must never grant an unassigned role.

Parent/guardian access is a separately verified relationship, not an automatic staff role. A Principal who is also a parent has a staff appointment and a separate verified guardian relationship.

Teacher scope is strict: only assigned classes, subjects, students, academic periods and responsibilities. My Classes, My Subjects, My Students, attendance, gradebook, assignments, quiz creation and class notices must use the logged-in teacher's assignment scope.

Implement central mock permission evaluation, route guards and navigation filtering. UI restrictions are a frontend simulation only; do not claim they secure backend data.

## 5. ROLES TO SUPPORT

Staff:
- Principal
- Vice Principal
- Dean of Students
- Academic Officer / Vice Principal for Instruction
- Teacher
- Registrar
- Finance Officer / Accountant
- Librarian (optional appointment)
- School Counselor (optional appointment)
- School Super Administrator designation/permission bundle

Platform:
- Innovexa Platform Super Admin

External:
- Student
- Parent / Guardian

Build a dedicated dashboard and meaningful navigation for every role. Use role-specific quick actions and metrics that navigate to the correct pages.

### Approval governance
The Principal has final school approval authority. The Principal may explicitly delegate specific approval responsibilities to the Vice Principal or another authorized officer. Delegation is scoped, time-limited where appropriate and auditable. It does not automatically transfer all Principal permissions.

Principal must inspect the detailed student-level gradebook before approving or returning it. Never make gradebook approval a one-click action from a summary card.

## 6. VISUAL DESIGN AND INTERACTION QUALITY

Design a premium, trustworthy school SaaS interface:
- Keep InnosysEdu's navy/blue identity, light surfaces and restrained green success accents.
- Professional typography, spacing, information hierarchy, consistent cards, subtle borders and shadows.
- Clean charts only where useful. Avoid clutter, excessive gradients, generic admin-template appearance and oversized decorative widgets.
- Responsive sidebar/topbar on desktop, collapsed navigation on tablet, accessible mobile drawer/navigation.
- Responsive tables and forms.
- Accessible labels, keyboard navigation, visible focus, semantic structure, contrast, useful empty/loading/error/success states.
- Use consistent design tokens and reusable components.

**Non-negotiable interaction rule:** every visible button, dashboard KPI/card, link, menu item, tab, table action and quick action must work and navigate to a meaningful authorized destination. No dead buttons, fake links, placeholder actions or decorative controls that look clickable. If not implemented, show a disabled control with a clear explanation.

Dashboard metrics must be real derived values from demo data, not arbitrary hardcoded numbers. Clicking My Classes, My Subjects, My Students, Draft Assessments, pending approvals, fee balances, attendance, notifications and similar metrics must open the corresponding filtered page.

## 7. REQUIRED MODULES AND WORKFLOWS

Implement all modules below as connected frontend experiences. Refer to SRS v2.0 for detailed acceptance criteria.

### A. Login, activation and recovery
- Unified login with email/password, show/hide password, remember me, forgot password, sign in, support/legal links.
- No production demo credentials or test-account panel.
- Development-only preview identity switcher.
- Invitation/activation states, expired/revoked code, resend and completion.
- Student without email: recovery initiated and controlled by authorized school staff after identity verification; guardian may assist only under school policy and cannot bypass school approval.

### B. School setup and administration
- School profile, academic year/terms, timezone, currency, grade levels, classes, sections, subjects, departments, classrooms, school calendar, grading policy, fee categories and module settings.
- Staff directory, invitations, roles, subject/class assignments and status.
- School Admin workspace with permission controls and audit history.

### C. Student and guardian records
- Registrar manually creates accepted students after offline school admission or imports CSV/XLSX.
- Student ID, profile, enrollment, class placement, academic history, documents and activation status.
- Multiple guardians per student; one guardian may have children in multiple schools.
- Registrar-entered guardian details do not automatically grant portal access. Guardian link request requires school verification.
- Parent can switch only among verified children and sees only permitted data.

### D. Timetable and calendar
- Vice Principal creates/edits/publishes timetable.
- Configure periods, school days, breaks, lessons, teacher, subject, class, classroom and times.
- Detect teacher/class/classroom conflicts.
- Teachers see their assigned timetable; students see their enrolled class timetable; parents see verified child's timetable.
- Published changes appear consistently throughout demo data.

### E. Attendance
- Teacher records attendance only for assigned classes/sessions.
- Present, absent, late, excused; date/session, bulk marking, correction reason and history.
- Dean/VP/Registrar/Principal reports according to scope.
- Students/parents see only their own/linked child's attendance.

### F. Academic structure, assessments, exams and gradebooks
- Traditional in-person exams are primary.
- Configurable assessment categories, weights and grading policy.
- Teacher enters marks for assigned classes/subjects only.
- Validate marks, totals, missing values and duplicates.
- Save draft and submit gradebook for review.
- Principal review screen must show student names/IDs, every assessment mark, totals, calculated grade, missing marks, flags and class statistics.
- Principal can approve or return for correction with reason.
- Approved results are published by authorized role. Students/parents see only published results.
- Keep audit timeline for mark changes and approvals.

### G. Assignments and optional online quizzes
Teacher can create an assignment or optional take-home quiz for assigned class/subject:
- title, instructions, attachments, marks, open date, deadline, late policy, resubmission policy and individual/group mode.
- Timed quiz: duration, availability window, question list, multiple-choice options, correct answer, marks, attempt limit and shuffle options/questions.
- Visible countdown for students. Clearly label frontend timer as simulated; production timer must be server-enforced.
Student can:
- View upcoming/available/submitted/late/graded/released activities.
- Open assignment, save draft, type essay, upload PDF/DOCX and multiple images of handwritten pages, preview/reorder/remove/replace files, submit and see confirmation.
- Take timed quiz and submit answers.
Teacher can:
- Review submissions, preview/download attachments, grade, add rubric/feedback, return for resubmission, release marks.
Support statuses: Draft, Upcoming, Available, Submitted, Late, Under Review, Graded, Released, Returned, Closed.

### H. Teacher announcements and student concerns
- Teacher publishes announcements only to assigned classes.
- Students in the target class see them in their announcement center.
- Teacher can file factual student conduct concerns to Dean or Principal.
- Student selection is restricted to assigned students.
- Dean receives cases addressed to Dean, investigates, records findings/actions and escalates serious cases.
- Teacher can see own report status but not confidential investigation notes.
- Academic concerns may route to Academic Officer.
- No unrestricted teacher-to-parent direct messaging by default.

### I. Parent and student portal
Student:
- dashboard, classes, timetable, attendance, assignments, quizzes, results/report cards, announcements, learning resources, library, profile.
Parent:
- dashboard, verified child switcher, child overview, timetable, attendance, published results, assignment progress, announcements, fees/invoices, payments, receipts, notification center, guardian link requests.
All data must be scoped to the selected student and verified relationship.

### J. Finance and online payment experience
Finance Officer:
- fee categories, schedules, deadlines, instalments, discounts, scholarships, waivers, invoices, payments, receipts, balances, overdue, reconciliation and reports.
- Full and partial payments according to school policy.
- Payment statuses: Created, Pending, Processing, Authorized, Settled/Verified, Failed, Cancelled, Expired, Reversed, Refunded.

Build a beautiful parent checkout inspired by the supplied card-selection screenshot:
- Attractive selectable payment method/card tiles with card-network branding where appropriate.
- Add payment method entry point.
- Masked card details only when represented by provider token metadata.
- Student/child, invoice, fee category, outstanding balance, amount being paid, currency and school name.
- Clear full/partial payment choice where permitted.
- Secure checkout disclosure, terms consent and optional save-method consent.
- Polished confirmation, pending, failed and receipt screens.
- Make mobile checkout especially clear and elegant.

SECURITY: never collect/store raw PAN, CVV or expiry in application state, localStorage or app server. Use provider-hosted checkout or provider-controlled secure fields later. The frontend is a mock checkout only. Do not claim a payment is successful or settled unless the mock scenario explicitly demonstrates a simulated state. Real settlement to the school's configured bank account requires a supported payment provider and verified merchant settlement configuration; do not promise instant direct transfer.

### K. Fee deadlines and overdue alerts
- Finance Director/authorized Finance Officer sets due dates by academic year, term, fee category or invoice group.
- After deadline, daily reminder preview targets only verified guardians with positive outstanding balance.
- Fully paid invoices/children are excluded.
- Reminders stop when balance is settled, waived or closed.
- Parent with multiple children sees only children with outstanding balances; paid children are excluded.
- Message shows child, fee category, outstanding amount, due date and route to fee page.
- UI includes deadline configuration, eligible-recipient preview, reminder schedule status, template and history.
- Clearly label reminders as simulated. Real daily messages require a backend scheduler and notification provider.

### L. Student affairs and counseling
- Dean case queue, investigation, notes, findings, action, status and escalation to Principal.
- Serious cases require Principal oversight.
- Counselor appointments and confidential notes with separate access.
- Do not expose counseling notes to Dean/Principal by default.
- Platform is not an emergency service.

### M. Library
- Catalogue search, book detail, copies/availability, borrowing, return, due dates, overdue, reservations, optional fines and permitted digital resources.
- Librarian manages catalogue and circulation; student sees own loans.

### N. Reports, documents, notifications
- Reports: academic, attendance, internal registration, finance, student affairs, library, staff and leadership.
- Filters by date/year/term/grade/class/subject/status; export UI for PDF/CSV/XLSX according to role.
- Document list/upload/preview/download UI using mock service.
- Notification center with unread/read, categories, timestamps, filters and deep links.
- In-app notification is core; email is primary formal channel. Do not assume SMS.
- Simulated delivery must be clearly distinguished from provider-confirmed delivery.

### O. Innovexa Platform Super Admin
- Platform overview, schools/tenants, onboarding, activation/suspension, module governance, support, audit, platform health and controlled recovery.
- Keep platform admin separate from school admin.
- Do not expose unrestricted counseling records.

## 8. MOCK DATA AND DEMO SWITCHER

Create believable synthetic demo data for at least one school:
- school profile, academic year/terms, grades/classes/sections, subjects and teachers with different class/subject assignments.
- Principal, VP, Dean, Academic Officer, Registrar, Finance Officer, Librarian, Counselor, School Admin, Student, Parent and Platform Admin preview identities.
- Multiple students and guardians, including parent with two children and different fee statuses.
- Published timetable, attendance, assessment, submitted gradebook, pending approval, assignments, quiz, student submissions, teacher announcement, conduct concern, fee invoices (fully paid, partially paid, unpaid), mock payment attempts, overdue reminders, library inventory and reports.

Include a reset-demo-data control in development mode. Keep mock data and service logic separate from UI components. Do not hardcode the same teacher's classes for every teacher.

## 9. REQUIRED ROUTES AND NAVIGATION

Create complete route map for each portal and ensure no broken routes. Use route guards and central role navigation configuration. Use deep links from dashboard metrics and notification items. Include detail pages, not just overview tables. Keep active school and role visible in the UI when relevant.

## 10. ENGINEERING REQUIREMENTS

- Strict TypeScript; no `any` unless justified and documented.
- Feature-based folder structure.
- Reusable buttons, cards, badges, dialogs, tables, form fields, page headers, empty states, skeletons, toasts and layout primitives.
- Typed service interfaces with mock adapters.
- Central validation schemas/utilities.
- Central permission resolver.
- Avoid huge single-file page components.
- Avoid duplicated mock data and inconsistent state.
- Use local persistence only through mock repository/service layer.
- Do not store secrets or sensitive payment information.
- Include README, project setup, route map, demo mode guide, mock data guide, integration points and known limitations.

## 11. PHASED DELIVERY

Implement in this order and verify each phase:

PHASE 1 — Foundation:
- inspect repository, design tokens, app shell, routing, navigation, reusable components, typed domain models, mock services, dev-only preview switcher.
- login design and responsive layouts.

PHASE 2 — Identity and portals:
- identity, memberships, active school, role assignments, permission resolver, student/parent/staff/platform portal shells, dashboards and route guards.

PHASE 3 — School and people:
- school configuration, academic structure, staff management, student registration, guardian verification, class/subject assignments.

PHASE 4 — Timetable and attendance:
- VP timetable editor and conflict checks; teacher/student/parent timetable views; attendance workflows and reports.

PHASE 5 — Academic workflows:
- assessments, traditional exam management UI, teacher grade entry, Principal detailed gradebook preview/approval, result publication, report cards.

PHASE 6 — Assignments and communication:
- assignment/quiz creation, timed quiz student flow, essay/file submissions, marking, teacher announcements, student concerns and Dean workflow.

PHASE 7 — Finance:
- fee setup, invoices, full/partial payments, parent payment UI, payment history/receipt states, deadline management and overdue reminder preview/history.

PHASE 8 — Remaining modules:
- student affairs/counseling, library, reports, documents, notification center, school admin and Innovexa platform admin.

PHASE 9 — Quality and handoff:
- responsive and accessibility audit, test all roles and workflows, remove dead controls, lint, typecheck, production build, fix all errors, README and integration handoff.

At the end of every phase:
1. List exact files/modules changed.
2. State what is fully working in the browser.
3. State what is still mocked or incomplete.
4. Run `npm run typecheck`, `npm run lint` and `npm run build` (or the equivalent scripts that exist).
5. Fix errors before continuing.
6. Do not claim build success unless the command actually passes.

## 12. FINAL ACCEPTANCE GATE

The frontend is not complete until:
- All three portals and all required roles have usable dashboards and navigation.
- Every dashboard card and visible control works or is explicitly disabled with a reason.
- Teacher sees only assigned classes, subjects and students in all teacher workflows.
- Principal can inspect full student-level marks before approving/returning a gradebook.
- Teacher can create timed quizzes, assignments, class announcements and student concerns.
- Student can complete quizzes and submit essays/files.
- VP publishes timetable and relevant teacher/student/parent views show it.
- Parent can switch verified children and see only their permitted data.
- Payment checkout looks polished, responsive and security-conscious, while clearly remaining simulated.
- Finance can configure fee deadlines and preview daily reminder eligibility; fully paid families are excluded.
- Dean can receive and process teacher concerns.
- Library, reports, notifications, school admin and platform admin screens are present and navigable.
- No dead links/buttons, no placeholder pages masquerading as complete features, no TypeScript/build errors.
- README explains how to run the app and what requires backend integration.

Start by inspecting the supplied SRS and existing repository. Then report your implementation plan and begin Phase 1. Do not reduce scope to a generic admin dashboard.
