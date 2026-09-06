import { DEFAULT_MODULES } from "@/lib/brand";

export type PortalTemplate = {
  id: string;
  name: string;
  category: string;
  description: string;
  industry: string;
  modules: string[];
  primaryColor: string;
  accentColor: string;
  recommendedFor: string;
};

const m = (...items: (typeof DEFAULT_MODULES)[number][]) => items;

export const PORTAL_TEMPLATES: PortalTemplate[] = [
  {
    id: "trades-field-service",
    name: "Trades & Field Service",
    category: "Trades",
    description: "Jobs, scheduling, customers, crews, quoting, invoicing, documents and field workflows.",
    industry: "Trades / Field Service",
    modules: m("dashboard","jobs","calendar","clients","leads","quotes","invoices","employees","timesheets","inspections","documents","materials","reminders","analytics"),
    primaryColor: "#168dff",
    accentColor: "#25c7ff",
    recommendedFor: "Electrical, landscaping, plumbing, HVAC, building and service contractors"
  },
  {
    id: "motorsport-team",
    name: "Motorsport Team",
    category: "Sport",
    description: "Team calendar, staff, documents, reminders and reporting foundation for race-team operations.",
    industry: "Motorsport Team",
    modules: m("dashboard","calendar","clients","employees","timesheets","documents","materials","reminders","analytics"),
    primaryColor: "#168dff",
    accentColor: "#25c7ff",
    recommendedFor: "Motocross, superbike, karting, race car and other competitive teams"
  },
  {
    id: "mechanical-workshop",
    name: "Mechanical Workshop",
    category: "Automotive",
    description: "Workshop jobs, bookings, customers, inspections, staff, parts, documents and reporting.",
    industry: "Mechanical Workshop",
    modules: m("dashboard","jobs","calendar","clients","quotes","invoices","employees","timesheets","inspections","documents","materials","reminders","analytics"),
    primaryColor: "#168dff",
    accentColor: "#25c7ff",
    recommendedFor: "Mechanical, 4WD, tyre, fabrication and specialist automotive workshops"
  },
  {
    id: "sales-crm",
    name: "Sales & CRM",
    category: "Sales",
    description: "Lead pipeline, customer management, follow-ups, quoting, invoicing and sales reporting.",
    industry: "Sales / CRM",
    modules: m("dashboard","calendar","clients","leads","quotes","invoices","employees","documents","reminders","analytics"),
    primaryColor: "#168dff",
    accentColor: "#25c7ff",
    recommendedFor: "Sales teams, agencies, brokers, account managers and B2B service businesses"
  },
  {
    id: "sporting-club",
    name: "Sporting Club",
    category: "Sport",
    description: "Club calendar, people, documents, reminders and reporting with room for sport-specific workflows.",
    industry: "Sporting Club",
    modules: m("dashboard","calendar","clients","employees","timesheets","documents","reminders","analytics"),
    primaryColor: "#168dff",
    accentColor: "#25c7ff",
    recommendedFor: "Football, cricket, basketball, netball and community sporting organisations"
  },
  {
    id: "service-business",
    name: "Service Business",
    category: "Services",
    description: "Bookings, jobs, customers, staff, billing, documents, reminders and reporting.",
    industry: "Service Business",
    modules: m("dashboard","jobs","calendar","clients","leads","quotes","invoices","employees","timesheets","documents","reminders","analytics"),
    primaryColor: "#168dff",
    accentColor: "#25c7ff",
    recommendedFor: "Cleaning, maintenance, mobile services, consultants and appointment-based businesses"
  },
  {
    id: "blank-custom",
    name: "Blank / Custom",
    category: "Custom",
    description: "Start with the YourPlan core and choose every module manually.",
    industry: "Custom",
    modules: m("dashboard","calendar","clients","documents","reminders"),
    primaryColor: "#168dff",
    accentColor: "#25c7ff",
    recommendedFor: "Unique businesses that do not fit an existing template"
  }
];

export function getPortalTemplate(id: string) {
  return PORTAL_TEMPLATES.find(template => template.id === id) ?? PORTAL_TEMPLATES[0];
}
