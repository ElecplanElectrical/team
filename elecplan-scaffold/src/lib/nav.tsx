import {
  LayoutGrid,
  Calendar as CalendarIcon,
  Users,
  FileCheck2,
  Bell,
  Clock,
  ClipboardList,
  Receipt,
  FileText,
  Star,
  Film,
  TrendingUp,
  Briefcase,
  Archive,
  FolderOpen,
  BadgeCheck,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@prisma/client";
import type { Screen } from "@/lib/access";

export type NavItem = { screen: Screen; label: string; icon: LucideIcon };
export type NavGroup = { heading?: string; items: NavItem[] };

/** Per-role sidebar nav — mirrors the mockup's *NavGroups arrays exactly. */
const NAV: Record<Role, NavGroup[]> = {
  ADMIN: [
    {
      items: [
        { screen: "dashboard", label: "Dashboard", icon: LayoutGrid },
        { screen: "leads", label: "Leads", icon: Users },
        { screen: "clients", label: "Clients", icon: Briefcase },
        { screen: "calendar", label: "Calendar", icon: CalendarIcon },
        { screen: "reminders", label: "Reminders", icon: Bell },
        { screen: "inspections", label: "Inspections", icon: FileCheck2 },
        { screen: "certificates", label: "Certificates", icon: BadgeCheck },
      ],
    },
    {
      heading: "Jobs",
      items: [
        { screen: "timelines", label: "Job timelines", icon: Clock },
        { screen: "projects", label: "Past projects", icon: Archive },
        { screen: "materials", label: "Materials", icon: ClipboardList },
        { screen: "timesheets", label: "Timesheets", icon: Receipt },
        { screen: "documents", label: "Documents", icon: FolderOpen },
      ],
    },
    {
      heading: "Finance",
      items: [
        { screen: "quotes", label: "Quotes", icon: FileText },
        { screen: "bills", label: "Bills", icon: Receipt },
      ],
    },
    {
      heading: "Employees",
      items: [{ screen: "employees", label: "Employees", icon: Users }],
    },
    {
      heading: "Sales",
      items: [
        { screen: "reviews", label: "Reviews", icon: Star },
        { screen: "reels", label: "Reels", icon: Film },
      ],
    },
    {
      heading: "Analytics",
      items: [{ screen: "analytics", label: "Analytics", icon: TrendingUp }],
    },
  ],
  SUPERVISOR: [
    {
      items: [
        { screen: "calendar", label: "Crew schedule", icon: CalendarIcon },
        { screen: "timelines", label: "Crew jobs", icon: Clock },
        { screen: "certificates", label: "Certificates", icon: BadgeCheck },
        { screen: "clients", label: "Clients", icon: Briefcase },
      ],
    },
    {
      heading: "Team",
      items: [
        { screen: "employees", label: "My crew", icon: Users },
        { screen: "timesheets", label: "Approve timesheets", icon: Receipt },
      ],
    },
    {
      heading: "Tools",
      items: [
        { screen: "projects", label: "Past projects", icon: Archive },
        { screen: "materials", label: "Materials", icon: ClipboardList },
        { screen: "documents", label: "Documents", icon: FolderOpen },
      ],
    },
  ],
  EMPLOYEE: [
    {
      items: [
        { screen: "calendar", label: "Calendar", icon: CalendarIcon },
        { screen: "timelines", label: "My jobs", icon: Clock },
      ],
    },
    {
      heading: "Tools",
      items: [
        { screen: "timesheets", label: "Timesheets", icon: Receipt },
        { screen: "projects", label: "Past projects", icon: Archive },
        { screen: "documents", label: "Documents", icon: FolderOpen },
        { screen: "materials", label: "Materials", icon: ClipboardList },
      ],
    },
  ],
};

/** Per-role bottom tab bar (mobile) — mirrors the mockup's itemsByRole. */
const MOBILE_NAV: Record<Role, NavItem[]> = {
  ADMIN: [
    { screen: "dashboard", label: "Home", icon: LayoutGrid },
    { screen: "calendar", label: "Calendar", icon: CalendarIcon },
    { screen: "timelines", label: "Jobs", icon: Clock },
    { screen: "clients", label: "Clients", icon: Briefcase },
    { screen: "employees", label: "Team", icon: Users },
  ],
  SUPERVISOR: [
    { screen: "calendar", label: "Schedule", icon: CalendarIcon },
    { screen: "timelines", label: "Jobs", icon: Clock },
    { screen: "employees", label: "Crew", icon: Users },
    { screen: "certificates", label: "Certs", icon: BadgeCheck },
    { screen: "documents", label: "Docs", icon: FolderOpen },
  ],
  EMPLOYEE: [
    { screen: "calendar", label: "Calendar", icon: CalendarIcon },
    { screen: "timelines", label: "My jobs", icon: Clock },
    { screen: "timesheets", label: "Hours", icon: Receipt },
    { screen: "documents", label: "Docs", icon: FolderOpen },
  ],
};

export function navGroupsFor(role: Role): NavGroup[] {
  return NAV[role];
}

export function mobileNavFor(role: Role): NavItem[] {
  return MOBILE_NAV[role];
}

/** Job title shown under the user's name in the sidebar identity block. */
export const ROLE_TITLE: Record<Role, string> = {
  ADMIN: "Owner / Admin",
  SUPERVISOR: "Team Lead",
  EMPLOYEE: "Licensed Electrician",
};

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
