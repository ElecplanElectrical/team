import type { Role } from "@prisma/client";

/**
 * Role-based access control for Elecplan.
 *
 * Derived directly from the design mockups' per-role sidebar nav groups
 * (adminNavGroups / supervisorNavGroups / employeeNavGroups). The set of
 * screens a role can see IS the access model. This is a plain data module
 * (no runtime deps) so it is safe to import in the Edge middleware, in
 * server components, and in API routes alike.
 */

export type Screen =
  | "dashboard"
  | "leads"
  | "clients"
  | "calendar"
  | "reminders"
  | "inspections"
  | "certificates"
  | "timelines"
  | "projects"
  | "materials"
  | "timesheets"
  | "documents"
  | "quotes"
  | "bills"
  | "employees"
  | "reviews"
  | "reels"
  | "analytics";

const ALL: Role[] = ["ADMIN", "SUPERVISOR", "EMPLOYEE"];
const ADMIN_SUP: Role[] = ["ADMIN", "SUPERVISOR"];
const ADMIN_ONLY: Role[] = ["ADMIN"];

/** Which roles may access each screen. */
export const SCREEN_ACCESS: Record<Screen, Role[]> = {
  dashboard: ADMIN_ONLY,
  leads: ADMIN_ONLY,
  clients: ADMIN_SUP,
  calendar: ALL,
  reminders: ADMIN_ONLY,
  inspections: ADMIN_ONLY,
  certificates: ADMIN_SUP,
  timelines: ALL,
  projects: ALL,
  materials: ALL,
  timesheets: ALL,
  documents: ALL,
  quotes: ADMIN_ONLY,
  bills: ADMIN_ONLY,
  employees: ADMIN_SUP,
  reviews: ADMIN_ONLY,
  reels: ADMIN_ONLY,
  analytics: ADMIN_ONLY,
};

/** URL path for each screen. `timelines` lives at /jobs per the build spec. */
export const SCREEN_PATH: Record<Screen, string> = {
  dashboard: "/dashboard",
  leads: "/leads",
  clients: "/clients",
  calendar: "/calendar",
  reminders: "/reminders",
  inspections: "/inspections",
  certificates: "/certificates",
  timelines: "/jobs",
  projects: "/projects",
  materials: "/materials",
  timesheets: "/timesheets",
  documents: "/documents",
  quotes: "/quotes",
  bills: "/bills",
  employees: "/employees",
  reviews: "/reviews",
  reels: "/reels",
  analytics: "/analytics",
};

const PATH_TO_SCREEN: Record<string, Screen> = Object.fromEntries(
  (Object.entries(SCREEN_PATH) as [Screen, string][]).map(([s, p]) => [p, s]),
) as Record<string, Screen>;

export function screenForPath(pathname: string): Screen | null {
  // Match the first path segment (e.g. /jobs, /calendar) ignoring sub-paths.
  const seg = "/" + (pathname.split("/").filter(Boolean)[0] ?? "");
  return PATH_TO_SCREEN[seg] ?? null;
}

export function canAccess(role: Role, screen: Screen): boolean {
  return SCREEN_ACCESS[screen].includes(role);
}

/** The landing screen for a role after login. */
export function landingPath(role: Role): string {
  return role === "ADMIN" ? "/dashboard" : "/calendar";
}

/**
 * Roles an actor may assign when inviting or editing a user. Admins manage
 * everyone; supervisors manage crew (employees) only; employees manage no one.
 * Used to prevent privilege escalation via the Employees screen.
 */
export function assignableRoles(actor: Role): Role[] {
  if (actor === "ADMIN") return ["ADMIN", "SUPERVISOR", "EMPLOYEE"];
  if (actor === "SUPERVISOR") return ["EMPLOYEE"];
  return [];
}

/** Whether `actor` may manage (reset/deactivate/edit) a user with role `target`. */
export function canManageUser(actor: Role, target: Role): boolean {
  return assignableRoles(actor).includes(target);
}
