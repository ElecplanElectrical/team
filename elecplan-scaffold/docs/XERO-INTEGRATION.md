# Xero integration foundation

This document defines the safe boundary for connecting Elecplan to Xero. It deliberately stops before storing or using live OAuth tokens so credentials can be configured in Railway first.

## Intended Phase 2 flow

1. Register an Elecplan OAuth 2.0 application in Xero Developer.
2. Configure the redirect URI for the Elecplan portal.
3. Add `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, `XERO_REDIRECT_URI`, and `XERO_TOKEN_ENCRYPTION_KEY` to Railway environment variables.
4. Implement an admin-only Connect Xero action using the standard authorization-code flow.
5. Request only the scopes Elecplan needs. The initial foundation is `openid profile email offline_access accounting.transactions`.
6. After callback, exchange the authorization code for tokens, query Xero connections, and bind Elecplan to the explicitly selected Xero organisation/tenant.
7. Encrypt OAuth tokens before persistence. Never store a raw refresh token or client secret in source control, logs, browser storage, or a client component.
8. Rotate and replace the stored refresh token every time Xero issues a new one.
9. Use both the bearer access token and the selected `xero-tenant-id` on Accounting API requests.
10. Treat Xero as the accounting source of truth once synchronization is enabled; Elecplan's local Quote/Invoice records should retain `xeroId` mappings for reconciliation.

## Environment variables

See `.env.example` for the required names. Production values belong in Railway variables, not GitHub.

## Data model follow-up

Before live OAuth is enabled, add a dedicated connection model that stores:

- selected Xero tenant ID and organisation name
- encrypted access token
- encrypted refresh token
- access-token expiry
- scopes granted
- connection timestamps and last successful sync time

The connection record should be single-organisation initially unless Elecplan later needs multi-tenant accounting support.

## Sync order

Recommended implementation sequence:

1. OAuth connection + tenant selection
2. contact/client mapping
3. outgoing client invoices
4. supplier bills
5. quote sync
6. payment/status reconciliation
7. dashboard reconciliation and sync health

Avoid automatic two-way financial writes until mapping and idempotency rules are explicit.
