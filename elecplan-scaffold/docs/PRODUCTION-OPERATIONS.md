# Elecplan production operations runbook

Last reviewed: 17 August 2026.

This runbook covers the minimum operational controls required before Elecplan is treated as production-ready on Railway.

## 1. Preflight before launch or sensitive changes

From the application service environment, run:

```bash
pnpm deploy:check
```

The command fails if required production auth/database settings are missing or invalid, verifies PostgreSQL connectivity, and runs `prisma migrate status` after the environment check. It does not print secret values.

Also verify:

- `GET /api/health` returns `200` — web process liveness only.
- `GET /api/ready` returns `200` with database `ok` — application/database readiness.
- the production domain uses HTTPS.
- the owner/admin account works and demo credentials are not reachable.
- SMS and private storage are either fully configured or intentionally left disabled.
- Xero remains disabled until its separate security gate is explicitly approved.

## 2. Database backups

Railway currently supports manual and scheduled backups for services with volumes. Configure at least a daily backup schedule for the production PostgreSQL volume. Railway also supports weekly/monthly schedules; choose additional retention appropriate to Elecplan's recovery requirements.

For higher recovery precision, Railway's current PostgreSQL platform also offers point-in-time recovery (PITR). If enabled, test it in a non-production recovery exercise before relying on it.

### Independent logical backup before risky work

Before a destructive data operation, major schema change, or bulk import, take both:

1. a Railway-managed backup, and
2. an independent PostgreSQL logical dump when practical.

Example custom-format dump:

```bash
pg_dump "$DATABASE_URL" --format=custom --no-owner --no-acl --file=elecplan-$(date +%Y%m%d-%H%M%S).dump
```

Store logical dumps in an access-controlled location outside the application repository. Never commit database dumps to Git.

## 3. Restore drill

A backup is not considered proven until a restore has been tested.

At least quarterly, and before a major financial-data launch:

1. Create a fresh non-production PostgreSQL target.
2. Restore a recent Railway backup/PITR fork or logical dump into that target.
3. Point a non-production Elecplan instance at the restored database.
4. Run `pnpm deploy:check`.
5. Sign in with a test/admin account and verify representative Clients, Jobs, Quotes, Invoices, Documents metadata, and Audit Logs.
6. Record the restore date, backup timestamp, result, and any manual fixes required.
7. Destroy or isolate the recovery environment after the exercise so production data is not left exposed.

Do not test destructive restores against the live production database.

## 4. Migration safety

Production deploys use:

```bash
prisma migrate deploy
```

Do not use `prisma migrate dev` or `prisma migrate reset` against production.

For migrations that remove/rename columns, change required constraints, or rewrite large tables, prefer an expand-and-contract sequence:

1. Add backward-compatible schema first.
2. Deploy application code that can handle old and new forms.
3. Backfill data separately and verify counts/invariants.
4. Remove old schema only in a later release after rollback risk has passed.

Before a high-risk migration:

- capture a managed backup and preferably a logical dump;
- review the generated SQL in `prisma/migrations`;
- estimate whether locks/table rewrites are likely;
- run the migration against a recent restored copy first.

A rollback of application code does not automatically roll back a database migration. Treat database restore or a corrective forward migration as separate recovery actions.

## 5. Secret rotation

### `AUTH_SECRET`

Rotating `AUTH_SECRET` invalidates existing Auth.js JWT sessions and Elecplan upload commit tokens. Plan this as a deliberate maintenance/security action:

1. Generate a new strong random value.
2. Replace the Railway variable without putting it in source control or chat logs.
3. Redeploy.
4. Expect all users to sign in again.
5. Verify login, invite/reset flows, Documents and Past Projects uploads.

### Database credentials

When the database password/connection credential is rotated:

1. stage the new `DATABASE_URL` in the application service;
2. redeploy and verify `/api/ready`;
3. revoke the old database credential only after the new connection is healthy.

### ClickSend

Rotate server-side ClickSend credentials in Railway, redeploy, then send a single intentional test confirmation. Keep SMS manual-send only.

### Private storage

Rotate S3/R2 access credentials using overlap when the provider allows it: create the replacement credential, update Railway, verify signed upload/download, then revoke the old credential. Keep the bucket private.

### Xero

Do not rotate or stage real Xero OAuth tokens because live Xero is not enabled. Xero remains behind the separate owner/security gate.

## 6. Incident response minimums

If a credential or user account may be compromised:

- disable the affected Elecplan user immediately;
- rotate the relevant secret/credential;
- review the admin Audit Log for high-risk mutations;
- preserve relevant logs/backups before destructive cleanup;
- verify `/api/ready` and core workflows after remediation.

If data corruption is suspected, stop bulk writes before attempting repair. Prefer restoring to a separate recovery database first so the original state remains available for comparison.

## 7. Launch gate

Do not call the portal production-ready until all of these are verified against the real deployment:

- production HTTPS domain;
- `pnpm deploy:check` passes;
- `/api/health` and `/api/ready` pass;
- database backups are enabled;
- at least one restore drill has succeeded;
- production `AUTH_SECRET` is unique and strong;
- owner account and invite/reset flows tested;
- storage bucket remains private if storage is enabled;
- SMS credentials are tested only through manual-send controls if SMS is enabled;
- Xero remains disconnected until separately approved.
