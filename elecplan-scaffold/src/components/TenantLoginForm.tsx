"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import YourPlanLogo from "@/components/YourPlanLogo";

type Props = {
  callbackUrl: string;
  tenantSlug: string;
  businessName: string;
  shortName: string;
  logoSrc: string;
  primaryColor: string;
  accentColor: string;
};

function QlsBrand({ logoSrc, businessName }: { logoSrc: string; businessName: string }) {
  return (
    <div className="flex items-center gap-5">
      <div className="relative h-[94px] w-[94px] shrink-0 overflow-hidden" aria-hidden="true">
        <img src={logoSrc} alt="" className="absolute left-0 top-0 h-auto w-full object-contain mix-blend-screen" />
      </div>
      <div className="min-w-0 uppercase text-white">
        <div className="whitespace-nowrap text-[13px] font-medium tracking-[.23em] sm:text-[15px]">Quality Landscape</div>
        <div className="mt-2 flex items-center gap-3 text-[12px] font-semibold tracking-[.42em] text-[#69bf45] sm:text-[14px]">
          <span className="h-px w-8 bg-[#69bf45]" />Solutions<span className="h-px w-8 bg-[#69bf45]" />
        </div>
      </div>
      <span className="sr-only">{businessName}</span>
    </div>
  );
}

export default function TenantLoginForm({ callbackUrl, tenantSlug, businessName, shortName, logoSrc, primaryColor, accentColor }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signIn("credentials", { email, password, tenantSlug, redirect: false });
    setLoading(false);
    if (!result || result.error) {
      setError("That email or password isn’t right. Try again or request a reset.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#0b100d] text-white [font-family:Inter,Arial,sans-serif]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_42%,rgba(43,89,36,.13),transparent_35%),linear-gradient(135deg,#111713_0%,#090d0b_58%,#0c120e_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[.18] [background-image:linear-gradient(rgba(113,191,73,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(113,191,73,.045)_1px,transparent_1px)] [background-size:54px_54px]" />

      <div className="pointer-events-none absolute inset-y-0 right-[-7%] hidden w-[62%] items-center justify-center lg:flex">
        <img src="/qls-tree-portal.webp" alt="" className="w-full max-w-[900px] opacity-[.72] drop-shadow-[0_0_42px_rgba(105,191,69,.08)]" />
        <div className="absolute inset-x-0 bottom-0 h-[20%] bg-gradient-to-t from-[#0b100d] to-transparent" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-[92%] max-w-[1250px] flex-col items-center justify-center py-7 lg:items-start lg:py-12">
        <section className="w-full max-w-[526px] rounded-[20px] border bg-[linear-gradient(145deg,rgba(16,23,18,.97),rgba(8,13,10,.98))] p-6 shadow-[0_32px_100px_rgba(0,0,0,.48)] sm:p-10 lg:ml-1" style={{ borderColor: `${primaryColor}90` }}>
          <QlsBrand logoSrc={logoSrc} businessName={businessName} />

          <div className="mt-8">
            <h1 className="text-[31px] font-bold tracking-[-.035em] sm:text-[35px]">Sign in to {shortName}</h1>
            <p className="mt-2 text-[15px] text-slate-400">Access your account to continue.</p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 block text-[14px] font-semibold text-slate-200">Email address</span>
              <span className="relative block">
                <UserRound className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input aria-label="Email address" autoComplete="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email" className="h-[52px] w-full rounded-[8px] border border-white/[.13] bg-[#0b100d] pl-12 pr-4 text-[15px] text-white outline-none placeholder:text-slate-500 focus:border-[#69bf45]" />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-[14px] font-semibold text-slate-200">Password</span>
              <span className="relative block">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input aria-label="Password" autoComplete="current-password" type={show ? "text" : "password"} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="h-[52px] w-full rounded-[8px] border border-white/[.13] bg-[#0b100d] pl-12 pr-12 text-[15px] text-white outline-none placeholder:text-slate-500 focus:border-[#69bf45]" />
                <button type="button" onClick={() => setShow((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white" aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </span>
            </label>

            <div className="flex items-center justify-between gap-4 text-[13px]">
              <label className="flex items-center gap-2 text-slate-300"><input type="checkbox" defaultChecked className="h-4 w-4" style={{ accentColor: primaryColor }} />Remember me</label>
              <a href="mailto:hello@your-plan.com.au?subject=QLS%20password%20reset" className="font-medium text-[#79c84e] hover:text-[#91da68]">Forgot password?</a>
            </div>

            {error ? <div className="rounded-[8px] border border-red-400/20 bg-red-400/[.07] px-3 py-3 text-[13px] leading-5 text-red-300">{error}</div> : null}

            <button disabled={loading} className="flex h-[54px] w-full items-center justify-center gap-3 rounded-[8px] text-[16px] font-semibold text-white shadow-[0_14px_35px_rgba(70,154,49,.18)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60" style={{ background: `linear-gradient(90deg,${primaryColor},${accentColor})` }}>
              <ArrowRight size={18} />{loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-7 text-center text-[12px] leading-5 text-slate-500">Authorised {businessName} team members only.</p>
        </section>

        <div className="mt-6 flex w-full max-w-[526px] items-center justify-center gap-3 text-[12px] uppercase tracking-[.18em] text-slate-500 lg:ml-1">
          <span>Powered by</span><YourPlanLogo width={124} />
        </div>
      </div>
    </main>
  );
}
