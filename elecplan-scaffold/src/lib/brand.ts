export const BRAND = {
  name: "Your Plan",
  shortName: "Your Plan",
  domain: "your-plan.com.au",
  description: "One place to run your business.",
  primary: "#168dff",
  accent: "#25c7ff",
  background: "#03101f",
  panel: "#07192b",
} as const;

export const DEFAULT_MODULES = [
  "dashboard", "jobs", "calendar", "clients", "leads", "quotes", "invoices",
  "employees", "timesheets", "inspections", "documents", "materials",
  "reminders", "analytics"
] as const;

export type YourPlanModule = (typeof DEFAULT_MODULES)[number];
