import type { Role } from "@prisma/client";
import type { YourPlanModule } from "@/lib/brand";

export type Screen =
  | "dashboard" | "leads" | "clients" | "calendar" | "reminders"
  | "inspections" | "certificates" | "timelines" | "projects"
  | "materials" | "equipment" | "timesheets" | "documents"
  | "quotes" | "invoices" | "bills" | "employees" | "teamChat" | "kpis" | "reviews" | "reels" | "analytics";

const ALL: Role[] = ["ADMIN", "SUPERVISOR", "EMPLOYEE"];
const ADMIN_SUP: Role[] = ["ADMIN", "SUPERVISOR"];
const ADMIN_ONLY: Role[] = ["ADMIN"];

export const SCREEN_ACCESS: Record<Screen, Role[]> = {
  dashboard: ADMIN_ONLY, leads: ADMIN_ONLY, clients: ADMIN_SUP, calendar: ALL,
  reminders: ADMIN_ONLY, inspections: ADMIN_ONLY, certificates: ADMIN_SUP,
  timelines: ALL, projects: ALL, materials: ALL, equipment: ALL, timesheets: ALL,
  documents: ALL, quotes: ADMIN_ONLY, invoices: ADMIN_ONLY, bills: ADMIN_ONLY, employees: ADMIN_SUP,
  teamChat: ALL, kpis: ADMIN_SUP, reviews: ADMIN_ONLY, reels: ADMIN_ONLY, analytics: ADMIN_ONLY,
};

export const SCREEN_MODULE: Partial<Record<Screen, YourPlanModule>> = {
  dashboard: "dashboard",
  timelines: "jobs",
  calendar: "calendar",
  clients: "clients",
  leads: "leads",
  quotes: "quotes",
  invoices: "invoices",
  employees: "employees",
  timesheets: "timesheets",
  inspections: "inspections",
  documents: "documents",
  materials: "materials",
  reminders: "reminders",
  analytics: "analytics",
};

export const SCREEN_PATH: Record<Screen, string> = {
  dashboard:"/dashboard", leads:"/leads", clients:"/clients", calendar:"/calendar",
  reminders:"/reminders", inspections:"/inspections", certificates:"/certificates",
  timelines:"/jobs", projects:"/projects", materials:"/materials", equipment:"/equipment",
  timesheets:"/timesheets", documents:"/documents", quotes:"/quotes", invoices:"/invoices", bills:"/bills",
  employees:"/employees", teamChat:"/team-chat", kpis:"/kpis", reviews:"/reviews", reels:"/reels", analytics:"/analytics",
};
const PATH_TO_SCREEN: Record<string, Screen> = Object.fromEntries((Object.entries(SCREEN_PATH) as [Screen,string][]).map(([s,p])=>[p,s])) as Record<string,Screen>;
export function screenForPath(pathname:string):Screen|null{const seg="/"+(pathname.split("/").filter(Boolean)[0]??"");return PATH_TO_SCREEN[seg]??null;}
export function canAccess(role:Role,screen:Screen):boolean{return SCREEN_ACCESS[screen].includes(role);}
export function moduleForScreen(screen:Screen):YourPlanModule|undefined{return SCREEN_MODULE[screen];}
export function landingPath(role:Role):string{return role==="ADMIN"?"/dashboard":"/calendar";}
export function assignableRoles(actor:Role):Role[]{if(actor==="ADMIN")return["ADMIN","SUPERVISOR","EMPLOYEE"];if(actor==="SUPERVISOR")return["EMPLOYEE"];return[];}
export function canManageUser(actor:Role,target:Role):boolean{return assignableRoles(actor).includes(target);}
