"use client";

import { useState } from "react";
import { AlertTriangle, ShieldCheck, UserPlus, X } from "lucide-react";
import type { Role } from "@prisma/client";
import { ROLE_TITLE } from "@/lib/nav";

const UI = { panel: "#07192b", panelAlt: "#09213a", border: "rgba(77,150,221,.24)", borderSoft: "rgba(77,150,221,.12)", text: "#f5f9ff", mute: "#93a9c2", faint: "#617993", blue: "#168dff", cyan: "#25c7ff", red: "#ff5e72" };

export default function InviteUserModal({ assignableRoles, onClose, onInvited }: { assignableRoles: Role[]; onClose: () => void; onInvited: (info: { url: string; name: string }) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>(assignableRoles[0] ?? "EMPLOYEE");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim()) return setError("Name and email are required.");

    setSaving(true);
    try {
      const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim() || null, role }) });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Could not create the user. Check the details and try again.");
        return;
      }
      const body = await res.json();
      onInvited({ url: body.inviteUrl, name: name.trim() });
    } catch {
      setError("Could not reach Elecplan. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  const field = { background: "#041323", border: `1px solid ${UI.border}`, color: UI.text } as const;

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm md:items-center md:p-4" onClick={onClose} role="presentation">
    <section className="w-full max-w-xl overflow-hidden rounded-t-2xl md:rounded-2xl" style={{ background: UI.panel, border: `1px solid ${UI.border}`, boxShadow: "0 28px 90px rgba(0,0,0,.35)" }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="invite-user-title">
      <header className="flex items-start gap-3 border-b px-5 py-4" style={{ borderColor: UI.borderSoft }}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(22,141,255,.11)", color: UI.cyan }}><UserPlus size={18} /></span>
        <div className="min-w-0 flex-1"><h2 id="invite-user-title" className="text-base font-semibold" style={{ color: UI.text }}>Invite team member</h2><p className="mt-1 text-xs" style={{ color: UI.faint }}>Create their account and generate a one-time password setup link.</p></div>
        <button type="button" aria-label="Close" onClick={onClose} className="p-1" style={{ color: UI.mute }}><X size={18} /></button>
      </header>

      <form onSubmit={submit} className="max-h-[82vh] overflow-auto p-5" aria-busy={saving}>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full name" className="md:col-span-2"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jordan Fielding" className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} autoFocus /></Field>
          <Field label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@elecplan.com.au" className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} autoCapitalize="none" spellCheck={false} /></Field>
          <Field label="Phone"><input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="04xx xxx xxx" className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field>
          <Field label="Role"><select value={role} onChange={(e) => setRole(e.target.value as Role)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field}>{assignableRoles.map((assignableRole) => <option key={assignableRole} value={assignableRole}>{ROLE_TITLE[assignableRole]}</option>)}</select></Field>
        </div>

        <div className="mt-4 flex gap-3 rounded-xl p-3" style={{ background: UI.panelAlt, border: `1px solid ${UI.borderSoft}` }}><ShieldCheck size={15} className="mt-0.5 shrink-0" style={{ color: UI.cyan }} /><p className="text-xs leading-5" style={{ color: UI.faint }}>The setup link is single-use and expires. You’ll copy it after the account is created and send it to the team member yourself.</p></div>
        {error && <div role="alert" className="mt-4 flex gap-2 rounded-lg p-3 text-xs leading-5" style={{ background: "rgba(255,94,114,.08)", border: "1px solid rgba(255,94,114,.22)", color: UI.red }}><AlertTriangle size={14} className="mt-0.5 shrink-0" /><span>{error}</span></div>}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-semibold" style={{ background: UI.panelAlt, color: UI.mute, border: `1px solid ${UI.borderSoft}` }}>Cancel</button><button type="submit" disabled={saving || assignableRoles.length === 0} className="rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ background: UI.blue, color: "white" }}>{saving ? "Creating…" : "Create & get link"}</button></div>
      </form>
    </section>
  </div>;
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) { return <label className={`flex flex-col gap-1.5 ${className}`}><span className="text-xs font-medium" style={{ color: UI.mute }}>{label}</span>{children}</label>; }
