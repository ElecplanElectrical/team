"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, KeyRound } from "lucide-react";

const UI = { panel: "#07192b", panelAlt: "#09213a", border: "rgba(77,150,221,.24)", borderSoft: "rgba(77,150,221,.12)", text: "#f5f9ff", mute: "#93a9c2", faint: "#617993", blue: "#168dff", cyan: "#25c7ff", green: "#18d3a0", red: "#ff5e72" };

export default function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setOk(false);
    if (next.length < 8) return setError("New password must be at least 8 characters.");
    if (next !== confirm) return setError("New passwords don't match.");
    setLoading(true);
    const res = await fetch("/api/account/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: current, newPassword: next }) });
    setLoading(false);
    if (!res.ok) { const body = await res.json().catch(() => null); setError(body?.error ?? "Could not change your password."); return; }
    setOk(true); setCurrent(""); setNext(""); setConfirm("");
  }

  const inputStyle: React.CSSProperties = { background: "#041323", border: `1px solid ${UI.border}`, color: UI.text };

  return <section className="rounded-xl p-5" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}>
    <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(22,141,255,.11)", color: UI.cyan }}><KeyRound size={18} /></span><div><h2 className="text-sm font-semibold" style={{ color: UI.text }}>Change password</h2><p className="mt-1 text-xs leading-5" style={{ color: UI.faint }}>Update your portal password without changing your account or permissions.</p></div></div>
    <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3">
      <Field label="Current password"><input type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} className="rounded-lg px-3 py-2.5 text-sm outline-none" style={inputStyle} /></Field>
      <Field label="New password"><input type="password" autoComplete="new-password" required value={next} onChange={(e) => setNext(e.target.value)} className="rounded-lg px-3 py-2.5 text-sm outline-none" style={inputStyle} placeholder="At least 8 characters" /></Field>
      <Field label="Confirm new password"><input type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="rounded-lg px-3 py-2.5 text-sm outline-none" style={inputStyle} /></Field>
      {error && <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs" style={{ background: "rgba(255,94,114,.08)", border: "1px solid rgba(255,94,114,.22)", color: UI.red }}><AlertTriangle size={14} />{error}</div>}
      {ok && <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs" style={{ background: "rgba(25,211,162,.08)", border: "1px solid rgba(25,211,162,.22)", color: UI.green }}><CheckCircle2 size={14} />Password updated.</div>}
      <button type="submit" disabled={loading} className="mt-1 flex items-center justify-center gap-2 self-start rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ background: UI.blue, color: "white" }}><KeyRound size={16} />{loading ? "Saving…" : "Update password"}</button>
    </form>
  </section>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="flex flex-col gap-1.5"><span className="text-xs font-medium" style={{ color: UI.mute }}>{label}</span>{children}</label>; }
