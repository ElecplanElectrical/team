import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { smsConfigured } from "@/lib/sms";
import { xeroConfigStatus } from "@/lib/xero";
import TopBar from "@/components/TopBar";
import { COLORS, FONTS } from "@/lib/theme";

export default async function SettingsPage() {
  const user = await requireUser();
  if (user.role !== "ADMIN") notFound();

  const team = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      role: true,
      active: true,
      licenseNumber: true,
      licenseExpiry: true,
    },
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

  return <>
    <TopBar title="Settings & security" subtitle="Launch readiness · admin only" />
    <div className="flex-1 overflow-auto p-4 md:p-8 flex flex-col gap-6">
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric label="Active users" value={String(activeUsers.length)} />
        <Metric label="Inactive users" value={String(team.length - activeUsers.length)} />
        <Metric label="Missing licences" value={String(missingLicence.length)} warn={missingLicence.length > 0} />
        <Metric label="Licences ≤60 days" value={String(expiringLicence.length)} warn={expiringLicence.length > 0} />
      </section>

      <section className="rounded-lg overflow-hidden" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}>
          <h2 className="font-semibold" style={{ color: COLORS.text, fontFamily: FONTS.display }}>Security readiness</h2>
          <p className="text-xs mt-1" style={{ color: COLORS.textFaint }}>Only configuration presence is shown. Secret values are never rendered.</p>
        </div>
        {checks.map((check) => <div key={check.label} className="flex items-start justify-between gap-4 px-5 py-4" style={{ borderTop: `1px solid ${COLORS.borderSoft}` }}>
          <div><div className="text-sm font-semibold" style={{ color: COLORS.text }}>{check.label}</div><div className="text-xs mt-0.5" style={{ color: COLORS.textFaint }}>{check.detail}</div></div>
          <span className="rounded-full px-2.5 py-1 text-xs font-semibold shrink-0" style={{ background: check.ready ? COLORS.accentDim : "rgba(255,110,110,0.08)", color: check.ready ? COLORS.accent : COLORS.coral }}>{check.ready ? "Ready" : "Needs setup"}</span>
        </div>)}
      </section>

      <section className="rounded-lg p-5" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
        <h2 className="font-semibold" style={{ color: COLORS.text, fontFamily: FONTS.display }}>Xero live-link gate</h2>
        <p className="text-sm mt-2" style={{ color: COLORS.textMute }}>Xero remains intentionally disconnected even if credentials are staged. Do not enable OAuth, tenant binding, token persistence, sync jobs, or financial write-back until the portal build is complete and the final security review is explicitly approved.</p>
      </section>

      {(missingLicence.length > 0 || expiringLicence.length > 0) && <section className="rounded-lg p-5" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
        <h2 className="font-semibold" style={{ color: COLORS.text, fontFamily: FONTS.display }}>Team compliance attention</h2>
        <div className="mt-3 flex flex-col gap-2">
          {missingLicence.map((member) => <div key={`missing-${member.id}`} className="text-sm" style={{ color: COLORS.coral }}>{member.name}: licence number missing</div>)}
          {expiringLicence.map((member) => <div key={`expiry-${member.id}`} className="text-sm" style={{ color: COLORS.coral }}>{member.name}: licence expires {member.licenseExpiry?.toLocaleDateString("en-AU")}</div>)}
        </div>
        <Link href="/employees" className="inline-block mt-4 text-sm font-semibold" style={{ color: COLORS.accent }}>Open Employees →</Link>
      </section>}

      <section className="flex flex-wrap gap-3">
        <Link href="/account" className="rounded-md px-4 py-2 text-sm font-semibold" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.text }}>My account</Link>
        <Link href="/employees" className="rounded-md px-4 py-2 text-sm font-semibold" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.text }}>Team & permissions</Link>
      </section>
    </div>
  </>;
}

function Metric({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return <div className="rounded-lg p-4" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}><div className="text-xs" style={{ color: COLORS.textFaint }}>{label}</div><div className="text-xl font-semibold mt-1" style={{ color: warn ? COLORS.coral : COLORS.text }}>{value}</div></div>;
}
