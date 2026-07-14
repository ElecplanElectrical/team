# Elecplan Portal — Build Spec & Roadmap

This is the handoff document from design to build. It covers the tech stack, data model, integrations, PWA setup, hosting/DNS, and a phased build order. Take this straight into Claude Code to start building.

---

## 1. Tech stack recommendation

| Layer | Recommendation | Why |
|---|---|---|
| Frontend | React (what we've designed in) | Already built as the UI |
| Backend | Node.js + Express, or Next.js full-stack | Simple, pairs well with Railway |
| Database | PostgreSQL | Railway hosts this natively; handles relational data (jobs → clients → invoices) well |
| Auth | Auth.js (NextAuth) or Clerk | Handles login, sessions, role-based access (Admin/Lead/Crew) out of the box |
| File storage | Cloudflare R2 or AWS S3 | For job photos, certificates, documents — don't store these in Postgres |
| Hosting | Railway | Runs frontend, backend, and Postgres together; simple custom domains |
| Domain/DNS | GoDaddy (existing) → CNAME to Railway | You keep the domain where it is, just point it at Railway |

---

## 2. Data model (core entities)

This maps directly to the screens we designed. Each of these becomes a database table.

- **Users** — name, email, phone, password/auth ID, role (admin/supervisor/employee), license number + expiry (for electricians)
- **Clients** — name, contact name, phone, email, address, billing notes
- **Leads** — linked to client, job description, stage (new/quoted/won/lost), estimated value, source
- **Jobs** — linked to client, title, address, assigned employee(s), status (quoted/scheduled/in progress/complete/invoiced), scheduled start/end, notes
- **Job Events (Calendar)** — linked to job, start/end time, type (job/call/admin/materials), assigned employee
- **Quotes** — linked to job/client, amount, status (draft/sent/accepted/declined), line items
- **Invoices/Bills** — linked to job/client or supplier, amount, due date, status (unpaid/paid), Xero invoice ID (for sync)
- **Certificates** — linked to job, cert number, type (COES/Compliance), issuing electrician, issued date, status
- **Inspections** — linked to job, type, date, status (passed/scheduled/failed)
- **Materials/Stock Items** — name, unit, on-hand quantity, par level, supplier
- **Timesheets** — linked to employee, date, hours, status (pending/approved)
- **Documents** — linked to job (optional, for job-specific docs) or global, file reference, type, uploaded by
- **Past Projects (Photos)** — linked to job, photo file references, uploaded by, date
- **Reminders** — linked to user, title, due date, tag, completed flag
- **Reviews** — linked to client/job, rating, text, source
- **SMS Log** — linked to job, phone number, message sent, status (sent/confirmed/declined/failed), provider message ID

---

## 3. Pages / routes (already designed)

- `/login` — role-based login
- `/dashboard` — admin only (financial overview)
- `/calendar` — week grid (desktop) / agenda (mobile), New Event modal with SMS toggle
- `/leads`
- `/clients`
- `/jobs` (timelines)
- `/projects` (past projects archive)
- `/materials` (stock take)
- `/timesheets`
- `/quotes`
- `/bills`
- `/certificates`
- `/inspections`
- `/employees`
- `/reminders`
- `/documents`
- `/reviews`
- `/reels`
- `/analytics`
- `/settings` — team management, permissions (not yet designed — needed before launch)

---

## 4. Integrations

### Xero
- OAuth2 connection (you authorize Elecplan to access your Xero org once)
- Sync direction: Quotes/Invoices created in Elecplan → pushed to Xero. Payment status → pulled back from Xero to update "Outstanding" on the dashboard.
- Xero has an official API + Node SDK — this is a well-trodden integration, not custom-built from scratch.

### SMS (ClickSend or Twilio)
- API key stored as an environment variable (never in the frontend code)
- Backend sends the SMS when a job is created with the toggle on
- **Two-way replies (YES/NO) require a webhook**: ClickSend/Twilio calls your backend when the customer replies, and you update the SMS Log status. This is the part that makes the confirmed/pending/declined badges on the calendar actually real instead of just visual.

### File storage
- Job photos and documents upload directly to S3/R2 from the browser (signed upload URLs), not through your server, to keep it fast.

---

## 5. Make it installable (PWA)

Three things turn the web app into a home-screen app on iPhone:

1. **`manifest.json`** — app name, short name, your logo at multiple sizes (192px, 512px), theme color (your ink navy), `"display": "standalone"`.
2. **`apple-touch-icon` meta tag** — iOS-specific, points to your logo so it's crisp on the home screen.
3. **Service worker** — enables offline caching (today's jobs available with no signal) and the "Add to Home Screen" prompt.

Once live, anyone visits the site in Safari → Share → Add to Home Screen. No App Store submission needed.

---

## 6. Hosting & domain — step by step

1. **Push the codebase to Railway** (connect your GitHub repo, or deploy directly).
2. **Add a Postgres database** in the Railway project — one click, Railway provisions it and gives you a connection string.
3. **Set environment variables** in Railway: database URL, Xero API keys, ClickSend/Twilio API key, file storage keys, auth secret.
4. **Add a custom domain** in Railway's project settings (e.g. `app.elecplan.com.au`) — Railway gives you a CNAME target.
5. **In GoDaddy's DNS settings**, add a CNAME record: `app` → the Railway-provided address. (Keep your main `elecplan.com.au` marketing site wherever it lives now — the portal can live on a subdomain like `app.elecplan.com.au` so they don't conflict.)
6. **SSL is automatic** — Railway issues a certificate once the CNAME resolves, usually within minutes to a few hours.

---

## 7. Suggested build order (phased, not all-at-once)

**Phase 1 — Core operations**
Auth + roles → Calendar → Jobs → Clients → Employees

**Phase 2 — Money**
Quotes → Bills → Xero sync → Dashboard financials

**Phase 3 — Compliance & field tools**
Certificates → Inspections → Materials stock take → Timesheets

**Phase 4 — Communication & polish**
SMS confirmations (+ webhook for replies) → Documents → Past Projects → PWA installability

**Phase 5 — Nice-to-haves**
Analytics → Reviews → Reels → Settings/permissions screen

Building in this order means you have a genuinely usable tool (calendar + jobs + clients) running for your crew well before Xero or SMS are wired up — you're not blocked waiting for every integration before anyone can use it.

---

## 8. Taking this into Claude Code

Claude Code can build and deploy this directly from a codebase. When you start that session, hand it:
- This document
- The design files we've built (the `.jsx` mockups) as the visual reference
- Your Xero and ClickSend account details (once you've signed up) as they're needed, not upfront

It can scaffold the project, build the database schema from Section 2, wire up the pages from Section 3, and walk you through the Railway deployment from Section 6.
