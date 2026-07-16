# Elecplan Portal — Starting Point for Claude Code

This started as the handoff from design to real build, and it's now a running
Next.js app: Auth.js login, Prisma schema, seeded demo data, and the core
screens (calendar, jobs, clients) are wired up. See "Run it locally" below to
start it, or the sections further down for the original build plan and how to
extend it.

## Run it locally

```bash
pnpm install
pnpm db:up        # start the Postgres container
pnpm db:migrate   # apply migrations
pnpm db:seed      # create demo accounts + sample data
pnpm dev          # http://localhost:3000
```

Then sign in at http://localhost:3000/login (the login screen also has
one-click demo buttons). Password for every demo account is `password123`:

- `luke@elecplan.com.au` — Admin
- `reyne@elecplan.com.au` — Supervisor
- `dean@elecplan.com.au` — Employee

## What's in here

- `prisma/schema.prisma` — the full database structure, covering every screen
  we designed (Jobs, Clients, Leads, Quotes, Invoices, Certificates, Inspections,
  Materials, Timesheets, Documents, Photos, Reminders, Reviews, SMS log)
- `.env.example` — every credential the app will need, with notes on where each
  one comes from
- `docs/elecplan-build-spec.md` — the full plan: tech stack, integrations,
  PWA setup, and Railway/GoDaddy deployment steps
- `docs/design-reference/` — the React mockups we built together, showing exactly
  how every screen should look and behave (dark theme, cyan accent, role-based
  nav, the SMS confirmation modal, etc.)

## How to start the real build with Claude Code

1. Open this folder in Claude Code (`claude` in your terminal, pointed at this directory)
2. Tell it what you're building: "Build the Elecplan job management portal using
   this Prisma schema and the design mockups in docs/design-reference as the
   visual reference. Start with Phase 1 from the build spec: auth, calendar, jobs, clients."
3. Let it scaffold the actual Next.js (or similar) project, wire up the database,
   and build out the screens to match the designs
4. When you're ready to go live, it can walk you through:
   - Creating the Railway project and Postgres database
   - Setting the environment variables from `.env.example`
   - Adding your custom domain and the GoDaddy CNAME record

## Suggested build order

Follow the phases in `docs/elecplan-build-spec.md` — auth and calendar first,
so your crew has something usable early, then money (quotes/Xero), then
compliance (certificates/inspections/materials), then SMS, then the nice-to-haves.

## A note on credentials

Don't hand over your real Xero or ClickSend API keys until you're actually
wiring up that specific integration — Claude Code will tell you exactly when
it needs them and what to paste where.
