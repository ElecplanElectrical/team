# Elecplan full-width workspace

Requested layout refinement to approved Recessed Carbon design 10:

- Enlarge the existing, unmodified wordmark across the full-size sidebar header.
- Remove centred 1500px/1700px/5xl page-width caps within the authenticated workspace, including job details and team chat. Keep compact 12/16/20px responsive edge gutters.
- Align page headings and the content below them to the same left edge; retain small top spacing and wrap toolbar actions when necessary.
- Keep login, dialogs, search inputs, charts and message bubbles independently sized. These are not page gutters.

The new CSS is scoped to `ep-portal-main` for content geometry and is imported after the unchanged Recessed Carbon palette. Authentication checks, roles, database, API routes, job/calendar behaviours, logo asset and theme colours are unchanged. Only Elecplan is in scope.

`scripts/carbon-preview.mjs` produces an isolated review bundle of actual components with synthetic clients and mocked navigation/auth; it is not a public application route.
