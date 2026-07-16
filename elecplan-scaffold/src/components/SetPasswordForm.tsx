"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, AlertTriangle, CheckCircle2 } from "lucide-react";
import { COLORS, ON_ACCENT } from "@/lib/theme";
import { LOGO_WORDMARK } from "@/lib/logo";

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
    background: COLORS.cardAlt,
    border: `1px solid ${COLORS.border}`,
    color: COLORS.text,
  };

  return (
    <div
      className="w-full max-w-sm rounded-lg p-7"
      style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
    >
      <div className="flex flex-col items-center mb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_WORDMARK}
          alt="elecplan"
          style={{ width: 150, height: "auto", objectFit: "contain" }}
        />
        <p className="text-sm mt-3" style={{ color: COLORS.textMute }}>
          Set your password
        </p>
      </div>

      {done ? (
        <div
          className="flex items-center gap-2 rounded-md px-3 py-3 text-sm"
          style={{ background: COLORS.tealBg, color: COLORS.teal }}
        >
          <CheckCircle2 size={16} />
          Password set. Taking you to sign in…
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: COLORS.textMute }}>
              New password
            </span>
            <input
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md px-3 py-2.5 text-sm outline-none"
              style={inputStyle}
              placeholder="At least 8 characters"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium" style={{ color: COLORS.textMute }}>
              Confirm password
            </span>
            <input
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="rounded-md px-3 py-2.5 text-sm outline-none"
              style={inputStyle}
              placeholder="••••••••"
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

          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-semibold disabled:opacity-60"
            style={{ background: COLORS.accent, color: ON_ACCENT }}
          >
            <KeyRound size={16} />
            {loading ? "Saving…" : "Set password"}
          </button>
        </form>
      )}
    </div>
  );
}
