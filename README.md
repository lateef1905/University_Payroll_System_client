# Ledger: University Payroll client

React 19 + Vite 8 + Tailwind CSS 4 front end for the Django payroll API in
`../University-Payroll-server`.

## Run it

```bash
# 1. API (from ../University-Payroll-server)
.venv/bin/python manage.py migrate
.venv/bin/python manage.py seed_demo_data --password 'Ledger-Demo-2026!'   # fresh DB only
.venv/bin/python manage.py runserver

# 2. Client (this folder)
npm install
npm run dev            # http://localhost:5173
```

Vite proxies `/api` to `http://127.0.0.1:8000` (override with `API_PROXY_TARGET` in `.env`), so the
browser talks to one origin and the server needs no CORS setup.

Demo logins (password = whatever you passed to `--password`):

| Username | Role | Lands on |
|---|---|---|
| `bursar.demo` | Bursary Officer | Overview: runs payroll, edits pay rules |
| `admin.demo` | Super Administrator | Everything, plus user accounts and the activity log |
| `payroll.officer` | Bursary Officer | Same as bursar |
| `staff.demo` | Staff (Senior Lecturer) | My pay: only their own payslips |

The seeder leaves the **current month unpaid**, so you can run it from the dashboard's pay calendar.

## What's where

```
src/
  lib/api.js          fetch client: in-memory access token, refresh token in localStorage,
                      one shared refresh on 401, fetchAll() for paginated reference lists
  lib/auth.jsx        session restore, login/logout, role flags (isManager, isSuper)
  lib/queries.js      shared React Query hooks (faculties, departments, stats, batches, own profile)
  lib/format.js       naira/kobo, compact (₦127.7m), periods, dates
  components/ui.jsx   design-system primitives: Button, Field/Input/Select, Stamp, Money, Drawer,
                      Modal, Toasts, Tabs, Pagination, Section, Leader rows
  components/charts.jsx  hand-built SVG charts (stacked pay trend, composition, rank bars, sparkline)
  components/brand.jsx   wordmark + PayslipPaper (the payslip as a physical slip)
  components/payroll.jsx PayCalendar + NewRunDrawer
  components/records.jsx RecordsTable + payslip drawer + PDF download
  pages/Landing.jsx, About.jsx, Support.jsx, Login.jsx, Settings.jsx, NotFound.jsx
  components/site.jsx   public header/footer, project credit (PROJECT) and support details (SUPPORT)
  pages/manager/      Overview, Runs, RunDetail, Records (payslips), Staff, Structure, PayRules, Audit, Users
  pages/staff/MyPay.jsx
```

Role gating in the router is for navigation only; the server enforces every permission.

## Design notes

* **App:** white rounded cards on a cool off-white background, Manrope throughout with tabular
  figures for money, and a deep-green hero card that holds each page's main action ("Run payroll",
  "Download payslip"). Status shows as soft pills, and view switches use segmented controls. Kobo are
  set smaller so the eye reads naira first. All tokens are in `src/index.css`.
* **Landing, sign-in and the payslip document** keep the editorial serif (Instrument Serif) and
  monospace (IBM Plex Mono).
* **Chart colours** (net, pension, PAYE, cooperative, loans) are one fixed categorical order,
  validated for colour-vision deficiency and contrast against the card surface. Don't reorder them.
* Fonts are bundled through `@fontsource`, so nothing is loaded from Google at runtime.

## Production

`npm run build` writes `dist/`. Serve it from the same origin as the API (for example nginx: `/api/` to
gunicorn, everything else to `dist/index.html`). To host it elsewhere, set `VITE_API_URL` at build time
and add CORS to the Django server (e.g. `django-cors-headers`).

The refresh token sits in `localStorage` (1-day lifetime, rotated and blacklisted on logout). If XSS
risk is a concern for your deployment, move it to an httpOnly cookie on the server side.
