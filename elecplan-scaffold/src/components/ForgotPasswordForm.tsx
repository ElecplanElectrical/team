"use client";

import { useState } from "react";
import { Mail, ShieldCheck } from "lucide-react";
import { LOGO_WORDMARK } from "@/lib/logo";
import { PORTAL_UI as UI } from "@/lib/carbon-theme";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);

    const res = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setStatus("error");
      setMessage(body?.error ?? "Could not send a reset email right now.");
      return;
    }

    setStatus("done");
    setMessage("If an active Elecplan account exists for that email, a secure reset link has been sent.");
  }

  return (
    <section
      className="w-full rounded-2xl p-6 shadow-[0_28px_90px_rgba(0,0,0,.35)] sm:p-8"
      style={{ ...UI.raised, background: UI.panel, border: `1px solid ${UI.border}` }}
    >
      <img src={LOGO_WORDMARK} alt="elecplan" style={{ width: 145, height: "auto", objectFit: "contain" }} />

      <div className="mt-7 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(67,210,255,.11)", color: UI.cyan, border: "1px solid rgba(67,210,255,.20)" }}>
          <Mail size={18} />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.16em]" style={{ color: UI.cyan }}>Secure access</p>
          <h1 className="mt-1 text-xl font-semibold" style={{ color: UI.text }}>Reset your password</h1>
          <p className="mt-1 text-sm leading-6" style={{ color: UI.mute }}>Enter your Elecplan account email and we’ll send a one-time reset link.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium" style={{ color: UI.mute }}>Email address</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 rounded-lg px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500/30"
            style={{ background: "var(--ep-input)", border: `1px solid ${UI.border}`, color: UI.text }}
            placeholder="you@elecplan.com.au"
          />
        </label>

        <div className="flex gap-3 rounded-xl p-3" style={{ ...UI.inset, background: UI.panelAlt, border: `1px solid ${UI.borderSoft}` }}>
          <ShieldCheck size={15} className="mt-0.5 shrink-0" style={{ color: UI.cyan }} />
          <p className="text-xs leading-5" style={{ color: UI.faint }}>For security, the page will show the same confirmation whether or not an account exists.</p>
        </div>

        {message && (
          <div
            className="rounded-lg px-3 py-2.5 text-xs"
            style={status === "error"
              ? { background: "rgba(255,94,114,.08)", border: "1px solid rgba(255,94,114,.22)", color: UI.red }
              : { background: "rgba(25,211,162,.08)", border: "1px solid rgba(25,211,162,.22)", color: UI.green }}
          >
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="mt-1 flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold disabled:opacity-60"
          style={{ ...UI.primary, color: UI.activeText, boxShadow: "0 10px 28px rgba(67,210,255,.24)" }}
        >
          <Mail size={16} />
          {status === "loading" ? "Sending..." : "Email reset link"}
        </button>
      </form>
    </section>
  );
}
