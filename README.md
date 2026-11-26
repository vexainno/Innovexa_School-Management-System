# InnosysEdu Frontend

Frontend-only school management SaaS prototype for Innovexa TechHub. This project follows **InnosysEdu Frontend SRS v2.0** and the supplied master frontend prompt.

## Scope and boundaries

- React 18, TypeScript, Vite and Tailwind CSS.
- One application with three experiences: Student & Parent, Staff, and Innovexa Platform Super Admin.
- Twelve seeded demo identities, each with its own role dashboard and navigation.
- Mock data and browser-local demonstration workflows only.
- No backend, database schema, Supabase SQL/RLS, real authentication, payment processing, email/SMS delivery, or secrets are included.
- The demo role switcher is compiled only in Vite development mode. Frontend role checks are a UX aid, not production security.

## Run locally

```bash
npm install
npm run dev
```

## Validate

```bash
npm run typecheck
npm run lint
npm run build
```

## Demo access

In development, open **Show test accounts (development only)** on the unified login screen. Select an identity to fill its email. The shared demo password is `test1234`. After signing in, open the profile menu in the top-right and use **Demo workspace switcher** to move between seeded identities.

| Role | Demo email | Dashboard/workspace |
|---|---|---|
| Principal | `principal@innosys.edu` | School leadership and approval oversight |
| Vice Principal | `vp@innosys.edu` | Daily operations, calendar and timetable |
| Dean of Students | `dean@innosys.edu` | Discipline, attendance concerns and activities |
| Registrar | `registrar@innosys.edu` | Student registration, records and guardians |
| Academic Officer | `academic@innosys.edu` | Examinations, gradebooks and results processing |
| Teacher | `teacher@innosys.edu` | Classes, attendance, assessments and gradebooks |
| Counselor | `counselor@innosys.edu` | Restricted student support workspace |
| Finance Officer | `finance@innosys.edu` | Fees, invoices, payments and reports |
| Librarian | `librarian@innosys.edu` | Catalogue and circulation |
| Innovexa Platform Super Admin | `admin@innosys.edu` | Platform administration preview |
| Student | `student@innosys.edu` | Student learning and progress portal |
| Parent / Guardian | `parent@innosys.edu` | Linked-child and family portal preview |

These identities and records are synthetic preview data. They are not real accounts and the shared password must never be reused in production.

## Project architecture additions

- `src/services/authService.ts`: replaceable authentication contract with development-only mock sign-in adapter.
- `src/services/authorization.ts`: central role permission map for frontend action visibility and UX checks.
- `src/services/contracts.ts`: typed contracts for student, timetable, assessment, finance, payment, notification, library, attendance and school structure services.
- `src/services/mockServices.ts`: mock adapters backed by the existing seeded fixtures. Payment checkout returns a simulated pending preview only.
- `src/context/AuthContext.tsx`: session state, login, logout and development-only demo identity switching.

Existing role-specific pages, navigation, calendar/timetable integration, assessment pages, counselor workflows and seeded data have been retained.

## Important workflow rules reflected in the UI baseline

- Registrar records students after the school's offline admission process. There is no public online admissions portal.
- Principal retains final gradebook/results approval unless a specific, scoped delegation is introduced.
- Academic Officer processes approved gradebooks; the role does not bypass Principal approval.
- Parent portal access is based on verified guardian relationships. A contact record or self-service request alone is not proof of guardianship.
- Student records can exist without an activated student login.
- Teachers' work is limited to assigned classes and subjects in the role-specific experience.
- Counselor records are restricted and must not be surfaced as general dashboard content.
- Payment, reminder, recovery, and communication actions are demonstrations only. No money moves and no messages/emails are delivered.
- Historical academic and financial information should be archived, not silently hard-deleted.

## Known limitations and next integration work

This is a frontend prototype, not a production deployment. Most seeded domain records are in-memory; a small number of existing workflows use browser-local persistence. Browser-local data does not synchronize across devices or browser profiles. The mock services are contracts and adapters for frontend integration; they do not imply a live backend.

Before production, a separate backend/authentication implementation must enforce tenant isolation, identity and membership validation, role/permission authorization, guardian verification, audit history, secure document storage, payment-provider tokenization and settlement confirmation, scheduled overdue reminders, and server-side quiz timing. Review each mock workflow and connect it to the corresponding service contract without exposing restricted student or counseling data.

## Build status

Run the three validation commands above in an environment with dependencies installed. The delivery environment used to prepare this archive could not complete `npm ci` because package installation timed out; therefore a successful production build is **not claimed** for this archive.
