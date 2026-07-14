# Elecplan Portal — Starting Point for Claude Code

This folder is the handoff from design to real build. It's not a running app yet —
it's the database schema and config that Claude Code should build the actual
application around.

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
