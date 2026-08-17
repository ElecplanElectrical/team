"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AlertTriangle, LockKeyhole, LogIn, ShieldCheck } from "lucide-react";
import { LOGO_WORDMARK } from "@/lib/logo";

const UI = {
  panel: "#07192b",
  panelAlt: "#09213a",
  border: "rgba(77,150,221,.24)",
  borderSoft: "rgba(77,150,221,.12)",
  text: "#f5f9ff",
  mute: "#93a9c2",
  faint: "#617993",
  blue: "#168dff",
  cyan: "#25c7ff",
  red: "#ff5e72",
};

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
    background: "#041323",
    border: `1px solid ${UI.border}`,
    color: UI.text,
  };

  return (
    <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl shadow-[0_28px_90px_rgba(0,0,0,.35)] lg:grid-cols-[1.05fr_.95fr]" style={{ border: `1px solid ${UI.border}`, background: UI.panel }}>
      <section className="hidden min-h-[590px] flex-col justify-between p-8 lg:flex" style={{ background: "linear-gradient(145deg, rgba(13,53,91,.95), rgba(5,24,43,.98))", borderRight: `1px solid ${UI.borderSoft}` }}>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_WORDMARK} alt="elecplan" style={{ width: 176, height: "auto", objectFit: "contain" }} />
          <p className="mt-6 max-w-md text-2xl font-semibold leading-tight" style={{ color: UI.text }}>Your field team, schedule and client workflow in one place.</p>
          <p className="mt-3 max-w-md text-sm leading-6" style={{ color: UI.mute }}>Secure access to Elecplan jobs, calendar, clients, documents and daily operations.</p>
        </div>

        <div className="space-y-3">
          <Info icon={<ShieldCheck size={16} />} title="Role-based access" text="Your permissions are applied automatically when you sign in." />
          <Info icon={<LockKeyhole size={16} />} title="Protected portal" text="Sensitive actions are permission checked and audited." />
        </div>
      </section>

      <section className="flex min-h-[560px] items-center p-5 sm:p-8 lg:min-h-[590px]">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-7 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_WORDMARK} alt="elecplan" style={{ width: 154, height: "auto", objectFit: "contain" }} />
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.16em]" style={{ color: UI.cyan }}>Team portal</p>
            <h1 className="mt-2 text-2xl font-semibold" style={{ color: UI.text }}>Sign in to Elecplan</h1>
            <p className="mt-2 text-sm leading-6" style={{ color: UI.mute }}>Use your Elecplan account to continue.</p>
          </div>

          <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ color: UI.mute }}>Email</span>
              <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-lg px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500/30" style={inputStyle} placeholder="you@elecplan.com.au" />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ color: UI.mute }}>Password</span>
              <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-lg px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500/30" style={inputStyle} placeholder="••••••••" />
            </label>

            {error && <div className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs" style={{ background: "rgba(255,94,114,.08)", border: "1px solid rgba(255,94,114,.22)", color: UI.red }}><AlertTriangle size={14} />{error}</div>}

            <button type="submit" disabled={loading} className="mt-1 flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold disabled:opacity-60" style={{ background: UI.blue, color: "white", boxShadow: "0 10px 28px rgba(22,141,255,.24)" }}><LogIn size={16} />{loading ? "Signing in…" : "Sign in"}</button>
          </form>

          <p className="mt-5 text-xs leading-5" style={{ color: UI.faint }}>Forgot your password? Ask an Elecplan admin to issue a secure reset link.</p>

          {demoLogins && demoLogins.length > 0 && (
            <div className="mt-6 rounded-xl p-3 text-xs" style={{ background: UI.panelAlt, border: `1px solid ${UI.borderSoft}`, color: UI.faint }}>
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
  return <div className="flex gap-3 rounded-xl p-4" style={{ background: "rgba(4,19,35,.45)", border: `1px solid ${UI.borderSoft}` }}><span className="mt-0.5" style={{ color: UI.cyan }}>{icon}</span><div><p className="text-sm font-semibold" style={{ color: UI.text }}>{title}</p><p className="mt-1 text-xs leading-5" style={{ color: UI.mute }}>{text}</p></div></div>;
}
