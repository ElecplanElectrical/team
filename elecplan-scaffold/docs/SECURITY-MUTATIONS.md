# Mutation request security

Elecplan applies a browser same-origin check to application API mutations in `src/middleware.ts`.

## Current rule

For application API requests outside `/api/auth/*`:

- `GET`, `HEAD` and `OPTIONS` are not blocked by the same-origin mutation check.
- State-changing methods such as `POST`, `PATCH`, `PUT` and `DELETE` must come from the same origin.
- When an `Origin` header is present it must exactly match the request origin.
- When `Origin` is absent, the request is accepted only when `Sec-Fetch-Site` is `same-origin`.
- Cross-site mutations receive HTTP 403 before reaching the route handler.

Route-level authentication, role checks, validation and audit logging remain required. Middleware is an additional CSRF/same-origin boundary, not a replacement for authorization.

## External webhooks

Do not broadly weaken this rule for future integrations. A future external webhook must use a deliberately scoped endpoint with provider signature verification, replay protection and its own explicit middleware exception. No inbound SMS webhook is enabled by this change.

## Xero boundary

This change does not enable Xero OAuth callbacks, token storage, tenant binding or financial sync. Live Xero remains gated separately.
