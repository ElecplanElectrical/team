"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, KeyRound, ShieldCheck } from "lucide-react";
import { LOGO_WORDMARK } from "@/lib/logo";

import { PORTAL_UI as UI } from "@/lib/carbon-theme";

export default function SetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not set your password. The link may have expired.");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 1400);
  }

  const inputStyle: React.CSSProperties = {
    ...{boxShadow:"var(--ep-inset-shadow)"}, background: "var(--ep-input)",
    border: `1px solid ${UI.border}`,
    color: UI.text,
  };

  return (
    <section className="w-full max-w-lg rounded-2xl p-5 shadow-[0_28px_90px_rgba(0,0,0,.35)] sm:p-8" style={{ ...UI.raised, background: UI.panel, border: `1px solid ${UI.border}` }}>
      <div className="flex items-start gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO_WORDMARK} alt="elecplan" style={{ width: 145, height: "auto", objectFit: "contain" }} />
      </div>

      <div className="mt-7 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(67,210,255,.11)", color: UI.cyan, border: "1px solid rgba(67,210,255,.20)" }}><KeyRound size={18} /></span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.16em]" style={{ color: UI.cyan }}>Secure access</p>
          <h1 className="mt-1 text-xl font-semibold" style={{ color: UI.text }}>Set your password</h1>
          <p className="mt-1 text-sm leading-6" style={{ color: UI.mute }}>Choose a password for your Elecplan team account.</p>
        </div>
      </div>

      {done ? (
        <div className="mt-7 flex items-center gap-3 rounded-xl px-4 py-4 text-sm" style={{ background: "rgba(25,211,162,.08)", border: "1px solid rgba(25,211,162,.22)", color: UI.green }}><CheckCircle2 size={18} /><div><p className="font-semibold">Password saved</p><p className="mt-0.5 text-xs opacity-80">Taking you to sign in…</p></div></div>
      ) : (
        <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: UI.mute }}>New password</span>
            <input type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-lg px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500/30" style={inputStyle} placeholder="At least 8 characters" />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: UI.mute }}>Confirm password</span>
            <input type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-11 rounded-lg px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500/30" style={inputStyle} placeholder="••••••••" />
          </label>

          <div className="flex gap-3 rounded-xl p-3" style={{ ...UI.inset, background: UI.panelAlt, border: `1px solid ${UI.borderSoft}` }}><ShieldCheck size={15} className="mt-0.5 shrink-0" style={{ color: UI.cyan }} /><p className="text-xs leading-5" style={{ color: UI.faint }}>This secure link is single-use. After the password is saved, sign in with your Elecplan email address.</p></div>

          {error && <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs" style={{ background: "rgba(255,94,114,.08)", border: "1px solid rgba(255,94,114,.22)", color: UI.red }}><AlertTriangle size={14} />{error}</div>}

          <button type="submit" disabled={loading} className="mt-1 flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold disabled:opacity-60" style={{ ...UI.primary, color: UI.activeText, boxShadow: "0 10px 28px rgba(67,210,255,.24)" }}><KeyRound size={16} />{loading ? "Saving…" : "Set password"}</button>
        </form>
      )}
    </section>
  );
}
