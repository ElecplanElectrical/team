"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { LogIn, AlertTriangle } from "lucide-react";
import { COLORS, FONTS, ON_ACCENT } from "@/lib/theme";
import { LOGO_WORDMARK } from "@/lib/logo";

export default function LoginForm({
  callbackUrl,
  demoLogins,
}: {
  callbackUrl: string;
  demoLogins?: { email: string; role: string }[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (!res || res.error) {
      setError("Incorrect email or password.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  const inputStyle: React.CSSProperties = {
    background: COLORS.cardAlt,
    border: `1px solid ${COLORS.border}`,
    color: COLORS.text,
  };

  return (
    <div
      className="w-full max-w-sm rounded-lg p-7"
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
      }}
    >
      <div className="flex flex-col items-center mb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_WORDMARK}
          alt="elecplan"
          style={{ width: 150, height: "auto", objectFit: "contain" }}
        />
        <p className="text-sm mt-3" style={{ color: COLORS.textMute }}>
          Sign in to the job portal
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium" style={{ color: COLORS.textMute }}>
            Email
          </span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md px-3 py-2.5 text-sm outline-none focus:border-[color:var(--accent)]"
            style={inputStyle}
            placeholder="you@elecplan.com.au"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium" style={{ color: COLORS.textMute }}>
            Password
          </span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          <LogIn size={16} />
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-xs mt-4 text-center" style={{ color: COLORS.textFaint }}>
        Forgot your password? Ask your admin to send you a reset link.
      </p>

      {demoLogins && demoLogins.length > 0 && (
        <div
          className="mt-5 pt-4 text-xs"
          style={{
            borderTop: `1px solid ${COLORS.borderSoft}`,
            color: COLORS.textFaint,
            fontFamily: FONTS.mono,
          }}
        >
          <p className="mb-1" style={{ color: COLORS.textMute }}>
            Demo logins (password: password123)
          </p>
          {demoLogins.map((d) => (
            <button
              key={d.email}
              type="button"
              onClick={() => {
                setEmail(d.email);
                setPassword("password123");
              }}
              className="block text-left hover:underline"
              style={{ color: COLORS.accent }}
            >
              {d.role}: {d.email}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
