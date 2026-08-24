# Your Plan master portal

This branch is the reusable Your Plan SaaS foundation derived from the Elecplan application without changing Elecplan production.

## Principles
- Your Plan brand is defined centrally in `src/lib/brand.ts`.
- Customer/business configuration is represented by `BusinessPortalConfig` in `src/lib/tenant.ts`.
- Modules are intended to be enabled per business rather than hard-coded per deployment.
- Roles use generic business language: Owner/Admin, Supervisor and Team Member.
- Elecplan-specific certificates/electrical functionality remains available in inherited code but is not part of the default Your Plan navigation.

## Default modules
Dashboard, Jobs, Calendar, Clients, Leads, Quotes, Invoices, Employees, Timesheets, Inspections, Documents, Materials, Reminders and Reports.

## Next platform layer
Persist tenant configuration in Postgres, associate users and records with a tenant ID, add Your Plan super-admin customer management, and enforce module access server-side.
