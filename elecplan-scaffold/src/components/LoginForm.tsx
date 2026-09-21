"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertTriangle, ArrowUpRight, LockKeyhole, LogIn, ShieldCheck, Zap } from "lucide-react";
import { LOGO_MARK, LOGO_WORDMARK } from "@/lib/logo";
import { PORTAL_UI as UI } from "@/lib/carbon-theme";

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
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (!res || res.error) {
      setError("Incorrect email or password.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  const inputStyle: React.CSSProperties = {
    boxShadow: "inset 0 2px 7px rgba(0,0,0,.5),0 1px 0 rgba(255,255,255,.025)",
    background: "linear-gradient(180deg,#111922,#0d141b)",
    border: "1px solid rgba(67,210,255,.24)",
    color: UI.text,
  };

  return (
    <div
      className="relative grid w-full max-w-[1120px] overflow-hidden rounded-[28px] lg:grid-cols-[1.08fr_.92fr]"
      style={{
        background: "linear-gradient(145deg,#151b22,#0d1218)",
        border: "1px solid rgba(67,210,255,.30)",
        boxShadow: "0 34px 110px rgba(0,0,0,.58),0 0 0 1px rgba(67,210,255,.04),0 0 80px rgba(67,210,255,.07)",
      }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg,transparent,#78e5ff,#43D2FF,transparent)" }} />

      <section
        className="relative hidden min-h-[650px] overflow-hidden p-9 lg:flex lg:flex-col lg:justify-between"
        style={{
          background: "radial-gradient(circle at 20% 20%,rgba(67,210,255,.20),transparent 32%),linear-gradient(145deg,#0b2b45 0%,#071827 56%,#091019 100%)",
          borderRight: "1px solid rgba(67,210,255,.17)",
        }}
      >
        <div className="pointer-events-none absolute -bottom-36 -left-28 h-[430px] w-[430px] rounded-full border border-sky-300/10" />
        <div className="pointer-events-none absolute -bottom-20 -left-12 h-[300px] w-[300px] rounded-full border border-sky-300/10" />
        <div className="pointer-events-none absolute right-[-90px] top-[90px] h-[360px] w-[360px] rounded-full" style={{ background: "radial-gradient(circle,rgba(67,210,255,.10),transparent 68%)" }} />

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_WORDMARK} alt="elecplan" style={{ width: 190, height: "auto", objectFit: "contain" }} />
            <span className="rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[.24em]" style={{ color: UI.cyan, border: "1px solid rgba(67,210,255,.28)", background: "rgba(67,210,255,.07)" }}>
              Field Ops
            </span>
          </div>

          <div className="mt-20 max-w-[470px]">
            <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.24em]" style={{ color: UI.cyan }}>
              <Zap size={13} /> Elecplan command portal
            </p>
            <h2 className="text-[54px] font-black leading-[.94] tracking-[-.055em]" style={{ color: UI.text }}>
              CONTROL<br/>THE DAY.
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-7" style={{ color: "#a9bbc9" }}>
              Jobs, calendar, clients, field notes and day-to-day operations in one private Elecplan workspace.
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <div className="mb-5 flex items-end gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl" style={{ background: "linear-gradient(145deg,#172630,#0c151c)", border: "1px solid rgba(67,210,255,.24)", boxShadow: "0 12px 30px rgba(0,0,0,.35)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO_MARK} alt="" className="h-14 w-14 object-contain" />
            </div>
            <div className="pb-1">
              <p className="text-sm font-extrabold" style={{ color: UI.text }}>ELECPLAN</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[.16em]" style={{ color: UI.faint }}>Electrical · field · operations</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Info icon={<ShieldCheck size={16} />} title="Private portal" text="Account access and role permissions." />
            <Info icon={<LockKeyhole size={16} />} title="Protected actions" text="Sensitive changes stay permission checked." />
          </div>
        </div>
      </section>

      <section className="relative flex min-h-[620px] items-center px-5 py-8 sm:px-10 lg:min-h-[650px] lg:px-12">
        <div className="mx-auto w-full max-w-[390px]">
          <div className="mb-10 lg:hidden">
            <div className="flex items-center justify-between gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO_WORDMARK} alt="elecplan" style={{ width: 166, height: "auto", objectFit: "contain" }} />
              <span className="rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[.16em]" style={{ color: UI.cyan, border: "1px solid rgba(67,210,255,.25)" }}>Field Ops</span>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[.22em]" style={{ color: UI.cyan }}>Team portal // secure access</p>
            <h1 className="mt-3 text-[32px] font-black tracking-[-.04em]" style={{ color: UI.text }}>Sign in.</h1>
            <p className="mt-2 text-sm leading-6" style={{ color: UI.mute }}>Use your Elecplan account to enter the portal.</p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[.08em]" style={{ color: UI.faint }}>Email</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl px-3.5 text-sm outline-none transition focus:ring-2 focus:ring-cyan-400/25"
                style={inputStyle}
                placeholder="you@elecplan.com.au"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase tracking-[.08em]" style={{ color: UI.faint }}>Password</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl px-3.5 text-sm outline-none transition focus:ring-2 focus:ring-cyan-400/25"
                style={inputStyle}
                placeholder="••••••••"
              />
            </label>

            {error && <div className="flex items-center gap-2 rounded-xl px-3 py-3 text-xs" style={{ background: "rgba(255,94,114,.08)", border: "1px solid rgba(255,94,114,.24)", color: UI.red }}><AlertTriangle size={14}/>{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="group mt-2 flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-black uppercase tracking-[.08em] transition hover:-translate-y-0.5 disabled:opacity-60"
              style={{ ...UI.primary, color: UI.activeText, boxShadow: "0 14px 34px rgba(67,210,255,.20),inset 0 1px 0 rgba(255,255,255,.55)" }}
            >
              <LogIn size={16}/>{loading ? "Signing in…" : "Enter portal"}<ArrowUpRight size={15} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/>
            </button>
          </form>

          <div className="mt-6 flex items-start gap-2 rounded-xl px-3 py-3" style={{ background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.06)" }}>
            <LockKeyhole size={14} className="mt-0.5 shrink-0" style={{ color: UI.cyan }}/>
            <p className="text-[11px] leading-5" style={{ color: UI.faint }}>Forgot your password? Ask an Elecplan admin to issue a secure reset link.</p>
          </div>

          {demoLogins && demoLogins.length > 0 && (
            <div className="mt-5 rounded-xl p-3 text-xs" style={{ background: "rgba(67,210,255,.04)", border: "1px solid rgba(67,210,255,.14)", color: UI.faint }}>
              <p className="mb-2 font-semibold" style={{ color: UI.mute }}>Demo logins · password: password123</p>
              <div className="space-y-1.5">
                {demoLogins.map((demo) => <button key={demo.email} type="button" onClick={() => { setEmail(demo.email); setPassword("password123"); }} className="block text-left hover:underline" style={{ color: UI.cyan }}>{demo.role}: {demo.email}</button>)}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Info({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="rounded-xl p-3" style={{ background: "rgba(5,19,30,.62)", border: "1px solid rgba(67,210,255,.15)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.025)" }}>
    <span style={{ color: UI.cyan }}>{icon}</span>
    <p className="mt-3 text-xs font-extrabold" style={{ color: UI.text }}>{title}</p>
    <p className="mt-1 text-[10px] leading-4" style={{ color: UI.faint }}>{text}</p>
  </div>;
}
