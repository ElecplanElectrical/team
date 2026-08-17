import Link from "next/link";
import { notFound } from "next/navigation";
import { Bell, Building2, FileText, LockKeyhole, PlugZap, ShieldCheck, UsersRound, Wrench } from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { smsConfigured } from "@/lib/sms";
import { xeroConfigStatus } from "@/lib/xero";
import TopBar from "@/components/TopBar";

const UI = {
  panel: "#07192b",
  panelAlt: "#09213a",
  border: "rgba(77,150,221,.24)",
  borderSoft: "rgba(77,150,221,.12)",
  text: "#f5f9ff",
  mute: "#93a9c2",
  faint: "#617993",
  blue: "#168dff",
  cyan: "#25c7ff",
  green: "#18d3a0",
  red: "#ff5e72",
  orange: "#ff9f1c",
};

export default async function SettingsPage() {
  const user = await requireUser();
  if (user.role !== "ADMIN") notFound();

  const team = await prisma.user.findMany({
    select: { id: true, name: true, role: true, active: true, licenseNumber: true, licenseExpiry: true },
    orderBy: { name: "asc" },
  });

  const now = new Date();
  const sixtyDays = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const activeUsers = team.filter((member) => member.active);
  const missingLicence = activeUsers.filter((member) => member.role === "EMPLOYEE" && !member.licenseNumber);
  const expiringLicence = activeUsers.filter((member) => member.licenseExpiry && member.licenseExpiry <= sixtyDays);
  const xero = xeroConfigStatus();

  const checks = [
    { label: "Database configured", ready: Boolean(process.env.DATABASE_URL), detail: "Required for all portal data." },
    { label: "Authentication secret", ready: Boolean(process.env.AUTH_SECRET && process.env.AUTH_SECRET !== "replace-me"), detail: "Production Auth.js secret must be unique and strong." },
    { label: "Trusted production host", ready: process.env.AUTH_TRUST_HOST === "true", detail: "Required for the Railway/custom-domain deployment." },
    { label: "Portal URL configured", ready: Boolean(process.env.NEXTAUTH_URL?.startsWith("https://")), detail: "Production should use the HTTPS team portal URL." },
    { label: "SMS provider", ready: smsConfigured(), detail: "Manual client confirmation texts remain disabled until ClickSend credentials exist." },
    { label: "Xero credentials staged", ready: xero.configured, detail: "Credential readiness only. Live OAuth and sync remain locked by project policy." },
  ];

  const cards = [
    { href: "/account", icon: UsersRound, title: "Profile", detail: "Manage your personal account and password" },
    { href: "/employees", icon: ShieldCheck, title: "Users & permissions", detail: "Manage team access and roles" },
    { href: "/settings/audit", icon: FileText, title: "Audit log", detail: "Review sensitive portal activity" },
    { href: "/documents", icon: Building2, title: "Company documents", detail: "Open managed business documents" },
    { href: "/calendar", icon: Wrench, title: "Jobs & scheduling", detail: "Manage operational scheduling" },
    { href: "/reminders", icon: Bell, title: "Notifications", detail: "Review reminders and follow-ups" },
  ];

  return <>
    <TopBar title="Settings" subtitle="Manage your account, security and portal readiness" />
    <div className="flex-1 overflow-auto p-3 md:p-4 xl:p-5" style={{ background: "radial-gradient(circle at 55% 0%,rgba(20,91,160,.12),transparent 35%),#03101f" }}>
      <div className="mx-auto w-full max-w-[1700px] space-y-4">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Active users" value={String(activeUsers.length)} />
          <Metric label="Inactive users" value={String(team.length - activeUsers.length)} />
          <Metric label="Missing licences" value={String(missingLicence.length)} warn={missingLicence.length > 0} />
          <Metric label="Licences ≤60 days" value={String(expiringLicence.length)} warn={expiringLicence.length > 0} />
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {cards.map(({ href, icon: Icon, title, detail }) => <Link key={href} href={href} className="group rounded-xl p-4 transition hover:-translate-y-0.5" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(22,141,255,.11)", color: UI.cyan }}><Icon size={18} /></span><div className="min-w-0"><h2 className="text-sm font-semibold" style={{ color: UI.text }}>{title}</h2><p className="mt-1 text-xs leading-5" style={{ color: UI.mute }}>{detail}</p></div></div></Link>)}
        </section>

        <section className="overflow-hidden rounded-xl" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}>
          <div className="flex items-start justify-between gap-4 border-b px-5 py-4" style={{ borderColor: UI.borderSoft }}><div><h2 className="text-sm font-semibold" style={{ color: UI.text }}>Security readiness</h2><p className="mt-1 text-xs" style={{ color: UI.faint }}>Configuration presence only. Secret values are never shown.</p></div><LockKeyhole size={18} style={{ color: UI.cyan }} /></div>
          {checks.map((check) => <div key={check.label} className="flex flex-col gap-2 border-b px-5 py-4 sm:flex-row sm:items-start sm:justify-between" style={{ borderColor: UI.borderSoft }}><div><div className="text-sm font-semibold" style={{ color: UI.text }}>{check.label}</div><div className="mt-1 text-xs leading-5" style={{ color: UI.faint }}>{check.detail}</div></div><span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: check.ready ? "rgba(25,211,162,.10)" : "rgba(255,159,28,.10)", color: check.ready ? UI.green : UI.orange, border: `1px solid ${check.ready ? "rgba(25,211,162,.24)" : "rgba(255,159,28,.24)"}` }}>{check.ready ? "Ready" : "Needs setup"}</span></div>)}
        </section>

        <section className="grid gap-3 xl:grid-cols-2">
          <div className="rounded-xl p-5" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(22,141,255,.11)", color: UI.cyan }}><FileText size={18} /></span><div><h2 className="text-sm font-semibold" style={{ color: UI.text }}>Security audit trail</h2><p className="mt-2 text-xs leading-5" style={{ color: UI.mute }}>Review sensitive finance, access, SMS and approval activity. Audit metadata excludes secret values and SMS message bodies.</p><Link href="/settings/audit" className="mt-4 inline-flex rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: UI.panelAlt, border: `1px solid ${UI.borderSoft}`, color: UI.cyan }}>Open audit log</Link></div></div></div>

          <div className="rounded-xl p-5" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(255,159,28,.09)", color: UI.orange }}><PlugZap size={18} /></span><div><h2 className="text-sm font-semibold" style={{ color: UI.text }}>Xero live-link gate</h2><p className="mt-2 text-xs leading-5" style={{ color: UI.mute }}>Xero remains intentionally disconnected even if credentials are staged. OAuth, tenant binding, token persistence, sync jobs and financial write-back stay locked until the portal build is complete and the final security review is explicitly approved.</p><span className="mt-4 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: "rgba(255,159,28,.10)", color: UI.orange, border: "1px solid rgba(255,159,28,.24)" }}>Live link locked</span></div></div></div>
        </section>

        {(missingLicence.length > 0 || expiringLicence.length > 0) && <section className="rounded-xl p-5" style={{ background: UI.panel, border: "1px solid rgba(255,94,114,.24)" }}><h2 className="text-sm font-semibold" style={{ color: UI.text }}>Team compliance attention</h2><div className="mt-3 space-y-2">{missingLicence.map((member) => <div key={`missing-${member.id}`} className="text-xs" style={{ color: UI.red }}>{member.name}: licence number missing</div>)}{expiringLicence.map((member) => <div key={`expiry-${member.id}`} className="text-xs" style={{ color: UI.red }}>{member.name}: licence expires {member.licenseExpiry?.toLocaleDateString("en-AU")}</div>)}</div><Link href="/employees" className="mt-4 inline-flex text-xs font-semibold" style={{ color: UI.cyan }}>Open Employees →</Link></section>}
      </div>
    </div>
  </>;
}

function Metric({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return <div className="rounded-xl p-4" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}><div className="text-[11px]" style={{ color: UI.faint }}>{label}</div><div className="mt-1 text-xl font-semibold" style={{ color: warn ? UI.red : UI.text }}>{value}</div></div>;
}
