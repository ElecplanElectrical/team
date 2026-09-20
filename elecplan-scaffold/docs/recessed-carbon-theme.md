# Elecplan Recessed Carbon (approved design 10)

## Source of truth

This theme implements design 10 from the user's 50 coded design gallery, not an image approximation. `src/lib/carbon-theme.ts` and `src/styles/recessed-carbon.css` define its shared primitives:

- Raised shell: `linear-gradient(135deg,#272d34,#14181e)`.
- Inset tray: `linear-gradient(135deg,#181d23,#20272f)`.
- Sky-blue selection: `linear-gradient(110deg,#78e5ff 0%,#43D2FF 55%,#25b5e7 100%)`.
- Selected text AND icons: `#062531`.
- Menu row: 39px high, 9px radius, 4px lower margin; inset shadow `inset 1px 1px 3px #0008,0 1px 0 #ffffff0d`.

The desktop sidebar is 264px at wide desktop sizes and a 74px icon rail at tablet sizes. The mobile drawer uses the same CarbonNavigation component. All original role-filtered navigation, route mapping, original logo and sign-out behavior are retained. Menu search filters destinations locally, not business data.

## Portal coverage

Shared carbon surfaces replace per-view navy tokens throughout dashboard, calendar, jobs and job details, clients, finance, materials/equipment, documents, employees, timesheets, inspections, certificates, projects, sales/marketing, analytics, account/settings, AI Assistant, authentication screens and their forms/dialogs. Calendar event/status colours are preserved. Server API routes, authentication/session checks, database models/migrations, CSP and external-service configuration are unchanged. No YourPlan or QLS files/services were changed.

## Validation (2026-09-20)

- Full `pnpm lint` and `pnpm build` passed, including the product-boundary check.
- 23 actual React views rendered at 1440x960 and 390x844 (46 view/viewport combinations): no uncaught render exceptions or document-width overflow.
- 15 computed-style checks against the saved design 10 CSS passed: shell background plus normal/selected row fill, text, height, corner radius, shadow, font size and weight.
- Role navigation remained 23 ADMIN, 12 SUPERVISOR and 8 EMPLOYEE destinations.
- Local menu filtering and active calendar selection checked.
- Mobile drawer opening, body-scroll locking/restoration, Escape closing and navigation closing checked.
- Calendar-create dialog rendered and inspected; no live records were created.

Visual review used real components with synthetic data and mocked navigation/auth/fetch, not a production login or an end-to-end business-workflow test. `node scripts/carbon-preview.mjs` builds this isolated browser harness after a production build, in an untracked `.carbon-review` folder; it does not add a production route. Temporary migration transport and the write-enabled migration workflow were removed before release.
