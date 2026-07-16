"use client";

import { useState } from "react";
import { KeyRound, AlertTriangle, CheckCircle2 } from "lucide-react";
import { COLORS, FONTS, ON_ACCENT } from "@/lib/theme";

export default function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);
    if (next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setError("New passwords don't match.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not change your password.");
      return;
    }
    setOk(true);
    setCurrent("");
    setNext("");
    setConfirm("");
  }

  const inputStyle: React.CSSProperties = {
    background: COLORS.cardAlt,
    border: `1px solid ${COLORS.border}`,
    color: COLORS.text,
  };

  return (
    <section
      className="rounded-lg p-5"
      style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
    >
      <h2
        className="text-sm font-semibold mb-4"
        style={{ fontFamily: FONTS.display, color: COLORS.text }}
      >
        Change password
      </h2>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium" style={{ color: COLORS.textMute }}>
            Current password
          </span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="rounded-md px-3 py-2.5 text-sm outline-none"
            style={inputStyle}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium" style={{ color: COLORS.textMute }}>
            New password
          </span>
          <input
            type="password"
            autoComplete="new-password"
            required
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className="rounded-md px-3 py-2.5 text-sm outline-none"
            style={inputStyle}
            placeholder="At least 8 characters"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium" style={{ color: COLORS.textMute }}>
            Confirm new password
          </span>
          <input
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="rounded-md px-3 py-2.5 text-sm outline-none"
            style={inputStyle}
          />
        </label>

        {error && (
          <div
            className="flex items-center gap-2 rounded-md px-3 py-2 text-xs"
            style={{ background: COLORS.coralBg, color: COLORS.coral }}
          >
            <AlertTriangle size={14} />
            {error}
          </div>
        )}
        {ok && (
          <div
            className="flex items-center gap-2 rounded-md px-3 py-2 text-xs"
            style={{ background: COLORS.tealBg, color: COLORS.teal }}
          >
            <CheckCircle2 size={14} />
            Password updated.
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-semibold disabled:opacity-60 self-start px-5"
          style={{ background: COLORS.accent, color: ON_ACCENT }}
        >
          <KeyRound size={16} />
          {loading ? "Saving…" : "Update password"}
        </button>
      </form>
    </section>
  );
}
