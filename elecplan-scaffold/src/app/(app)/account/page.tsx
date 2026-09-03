import { AtSign, ShieldCheck, UserRound } from "lucide-react";
import { requireUser } from "@/lib/session";
import TopBar from "@/components/TopBar";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import { ROLE_TITLE } from "@/lib/nav";

const UI = { panel: "var(--brand-panel, #07192b)", panelAlt: "var(--brand-panel-alt, #09213a)", border: "var(--brand-border, rgba(77,150,221,.24))", borderSoft: "var(--brand-border-soft, rgba(77,150,221,.12))", text: "#f5f9ff", mute: "var(--brand-muted, #93a9c2)", faint: "var(--brand-faint, #617993)", cyan: "var(--brand-accent, #25c7ff)" };

export default async function AccountPage() {
  const user = await requireUser();
  const initials = (user.name ?? user.email ?? "EP").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return <>
    <TopBar title="Account" subtitle="Your Elecplan profile and sign-in security" />
    <div className="flex-1 overflow-auto p-3 md:p-4 xl:p-5" style={{ background: "radial-gradient(circle at 55% 0%,var(--brand-glow, rgba(20,91,160,.12)),transparent 35%),var(--app-bg, #03101f)" }}>
      <div className="mx-auto grid w-full max-w-5xl gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section className="rounded-xl p-5" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}>
          <div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-full text-base font-semibold" style={{ background: "var(--brand-primary-soft, #0d2a48)", color: "white", border: "1px solid rgb(var(--brand-accent-rgb, 37 199 255) / .25)" }}>{initials}</div><div className="min-w-0"><h2 className="truncate text-lg font-semibold" style={{ color: UI.text }}>{user.name ?? "Elecplan user"}</h2><p className="mt-1 truncate text-xs" style={{ color: UI.mute }}>{user.email ?? "No email recorded"}</p></div></div>
          <div className="mt-6 space-y-3"><Detail icon={<UserRound size={15} />} label="Name" value={user.name ?? "—"} /><Detail icon={<AtSign size={15} />} label="Email" value={user.email ?? "—"} /><Detail icon={<ShieldCheck size={15} />} label="Role" value={ROLE_TITLE[user.role]} /></div>
          <div className="mt-5 rounded-xl p-3 text-xs leading-5" style={{ background: UI.panelAlt, border: `1px solid ${UI.borderSoft}`, color: UI.mute }}>Your access level is controlled by your Elecplan team role. Contact an administrator if your role or account details need changing.</div>
        </section>
        <div><ChangePasswordForm /></div>
      </div>
    </div>
  </>;
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="flex gap-3 rounded-lg p-3" style={{ background: UI.panelAlt, border: `1px solid ${UI.borderSoft}` }}><span className="mt-0.5" style={{ color: UI.cyan }}>{icon}</span><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[.10em]" style={{ color: UI.faint }}>{label}</p><p className="mt-1 break-words text-sm" style={{ color: UI.text }}>{value}</p></div></div>; }
