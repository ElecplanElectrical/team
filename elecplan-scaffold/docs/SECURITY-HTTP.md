# HTTP security baseline

Elecplan applies its baseline browser and response protections in `next.config.ts`.

Current controls:

- Content Security Policy limits framing, plugins, base URL changes and form submissions.
- `X-Frame-Options: DENY` provides legacy clickjacking protection alongside CSP.
- `X-Content-Type-Options: nosniff` disables MIME sniffing.
- `Referrer-Policy: strict-origin-when-cross-origin` limits referrer data sent off-site.
- `Permissions-Policy` disables camera, microphone, geolocation, payment, USB and browsing-topics browser features for the portal.
- HSTS requires HTTPS after a browser has received the production response.
- The default Next.js `X-Powered-By` response header is disabled.
- `/api/*` responses are marked `private, no-store, max-age=0` so sensitive API data is not intentionally cached by shared intermediaries or the browser cache.

## CSP scope

The current CSP is deliberately a conservative baseline. It does not yet restrict script/style/connect sources because doing so safely requires a full production asset and integration inventory. Tighten those directives only after testing authentication, PWA assets, SMS-related UI, and any future explicitly approved integrations.

## Xero boundary

These headers do not enable or prepare a live Xero session. Live OAuth, tokens, tenant binding and sync remain separately gated.
