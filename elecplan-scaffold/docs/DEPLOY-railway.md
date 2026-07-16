# Deploying Elecplan to Railway → `team.elecplan.com.au`

This guide takes the app from the GitHub repo to a live, logged-in portal on a
subdomain of your existing GoDaddy site. The marketing site at
`elecplan.com.au` stays exactly where it is — the portal lives on
`team.elecplan.com.au`, so nothing about the main site changes.

> **Why a subdomain, not `elecplan.com.au/team`?** A path like `/team` can't be
> pointed with DNS, and GoDaddy Website Builder can't reverse-proxy a subpath to
> another server. A subdomain is a single CNAME record and works cleanly. If you
> ever move the marketing site to a host that supports path rewrites, we can
> revisit the subpath.

## What's already wired up in the repo

- **`railway.json`** — build (`pnpm build`), a pre-deploy step that runs
  `prisma migrate deploy` (applies migrations on every release), the start
  command, and a healthcheck against `/api/health`.
- **`postinstall: prisma generate`** — Railway generates the Prisma client
  during install automatically.
- **`/api/health`** — lightweight liveness endpoint (no DB), reachable without
  login.
- **`SEED_PASSWORD`** — the seed script reads this so production accounts don't
  use the `password123` demo default.

## Prerequisites

- A [Railway](https://railway.app) account
- Access to the GoDaddy DNS settings for `elecplan.com.au`
- The repo `Elecplan/team` on GitHub

## Step 1 — Create the Railway project

1. Railway → **New Project** → **Deploy from GitHub repo** → select
   `Elecplan/team`.
2. In the service **Settings → Source**, set the **Root Directory** to
   `elecplan-scaffold` (the app is in that subfolder, not the repo root).
3. Railway auto-detects Node/pnpm and reads `railway.json`. No build config
   needed by hand.

## Step 2 — Add Postgres

1. In the project, **New → Database → Add PostgreSQL**. Railway provisions it
   and exposes a `DATABASE_URL`.
2. Reference it from the app service: in the app's **Variables**, add
   `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (Railway's variable-reference
   syntax) so the two stay linked.

## Step 3 — Set environment variables

On the **app service → Variables**, set:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (from Step 2) |
| `AUTH_SECRET` | output of `openssl rand -base64 32` — a **fresh** one, not the local dev value |
| `AUTH_TRUST_HOST` | `true` |
| `NEXTAUTH_URL` | `https://team.elecplan.com.au` |
| `SEED_PASSWORD` | a strong password, only needed while seeding (Step 5) |

## Step 4 — First deploy

Trigger a deploy (push to `main`, or **Deploy** in the dashboard). On each
release Railway runs `prisma migrate deploy` (pre-deploy) then `pnpm start`.
Watch the logs; once the healthcheck on `/api/health` passes, the service is
live on its temporary `*.up.railway.app` URL.

## Step 5 — Create the owner account (one-time)

**Recommended (owner only, no demo data).** Creates just the admin account and
prints a one-time "set your password" link. Idempotent and safe on a live DB —
it never wipes tables. Run it in the Railway service shell:

```bash
OWNER_NAME="Luke Phillips" \
OWNER_EMAIL="luke@elecplan.com.au" \
APP_ORIGIN="https://team.elecplan.com.au" \
pnpm db:seed:owner
```

Open the printed `https://team.elecplan.com.au/set-password?token=…` link,
choose a password, and sign in. Invite the rest of the crew from the Employees
screen once you're in.

> **Alternative — full demo data.** To load the demo users + Melbourne
> clients/jobs for a quick tyre-kick instead, set a strong `SEED_PASSWORD` and
> run `pnpm db:seed`. ⚠️ That seed **wipes and recreates** its tables, so only
> use it on an empty DB and delete the demo data before real use.

## Step 6 — Custom domain + GoDaddy DNS

1. Railway → app service → **Settings → Networking → Custom Domain** → enter
   `team.elecplan.com.au`. Railway shows a **CNAME target** (like
   `xxxx.up.railway.app`).
2. In **GoDaddy → Domain → DNS → Manage DNS**, add a record:
   - **Type:** CNAME
   - **Name:** `team`
   - **Value:** the Railway CNAME target
   - **TTL:** default (1 hour)
3. Save. SSL is issued automatically once DNS resolves — usually minutes, up to
   a few hours. Then `https://team.elecplan.com.au` serves the portal.

## Before real users (do not skip)

- **Rotate/replace accounts:** the seed's demo users are for a demo. For real
  crew, either set `SEED_PASSWORD` and hand out one-time passwords, or (better,
  a follow-up) add a proper invite / password-reset flow so people set their
  own. Never leave `password123` reachable on the internet.
- **Confirm `AUTH_SECRET` is unique to production** and not the committed-example
  or local value.
- **Backups:** enable Postgres backups in Railway.

## Later phases

Phases 2–5 (Xero, SMS, file storage) add more env vars — see `.env.example` and
`elecplan-build-spec.md §4`. Add each credential in Railway's Variables when you
wire up that integration.
