"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowRight, Eye, EyeOff, Leaf, LockKeyhole, ShieldCheck } from "lucide-react";

type Props = {
  callbackUrl: string;
  businessName: string;
  shortName: string;
  logoSrc: string;
  primaryColor: string;
  accentColor: string;
};

export default function TenantLoginForm({
  callbackUrl,
  businessName,
  shortName,
  logoSrc,
  primaryColor,
  accentColor,
}: Props) {
  const router = useRouter();
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [show,setShow]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);

  async function onSubmit(event:React.FormEvent){
    event.preventDefault();
    setError(null);
    setLoading(true);
    const result=await signIn("credentials",{email,password,redirect:false});
    setLoading(false);
    if(!result||result.error){
      setError("That email or password isn’t right. Try again or request a reset.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  const glow=`${primaryColor}30`;
  const border=`${primaryColor}55`;

  return <main className="relative min-h-screen overflow-hidden bg-[#101512] text-white [font-family:Inter,Arial,sans-serif]">
    <div className="pointer-events-none absolute inset-0" style={{background:`radial-gradient(circle at 84% 10%, ${glow}, transparent 32%), radial-gradient(circle at 12% 88%, ${accentColor}18, transparent 28%), linear-gradient(135deg,#161d18 0%,#0d120f 52%,#121915 100%)`}}/>
    <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] [background-size:52px_52px]"/>
    <Leaf className="pointer-events-none absolute -right-16 top-12 h-[390px] w-[390px] rotate-[-18deg] opacity-[.055]" style={{color:accentColor}}/>

    <div className="relative z-10 mx-auto grid min-h-screen w-[92%] max-w-[1360px] lg:grid-cols-[1.05fr_.95fr]">
      <section className="flex flex-col justify-between py-7 lg:min-h-screen lg:py-10 lg:pr-16">
        <header className="flex items-center justify-between gap-5">
          <img src={logoSrc} alt={businessName} className="max-h-20 w-auto max-w-[260px] object-contain object-left sm:max-h-24 sm:max-w-[340px]"/>
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[.025] px-4 py-2 text-[11px] uppercase tracking-[.14em] text-slate-400 sm:flex">
            <ShieldCheck size={14} style={{color:accentColor}}/> Secure team portal
          </div>
        </header>

        <div className="max-w-[650px] py-14 lg:py-16">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[.16em]" style={{borderColor:border,backgroundColor:`${primaryColor}12`,color:accentColor}}>
            <Leaf size={14}/> Quality Landscape Solutions
          </div>
          <h1 className="mt-7 text-[42px] font-black leading-[.98] tracking-[-.055em] sm:text-[58px] lg:text-[72px]">
            Your work.<br/><span style={{color:accentColor}}>All in one place.</span>
          </h1>
          <p className="mt-6 max-w-[570px] text-[15px] leading-7 text-slate-300 sm:text-[17px]">Jobs, scheduling, customers, staff, documents and business operations—securely connected for the QLS team.</p>
          <div className="mt-8 grid max-w-[620px] gap-3 sm:grid-cols-3">
            {["QLS workspace","Secure access","Built for your team"].map((label,index)=><div key={label} className="rounded-xl border border-white/10 bg-black/15 p-4 backdrop-blur-sm">
              <Leaf size={18} style={{color:index===1?accentColor:primaryColor}}/>
              <strong className="mt-3 block text-[13px]">{label}</strong>
              <span className="mt-1 block text-[11px] leading-5 text-slate-500">{index===0?"Everything connected":index===1?"Protected business data":"Powered by YourPlan"}</span>
            </div>)}
          </div>
        </div>

        <footer className="hidden items-center justify-between border-t border-white/[.07] pt-5 text-[11px] text-slate-600 lg:flex">
          <span>© {new Date().getFullYear()} {businessName}</span>
          <img src="/yourplan-powered-footer.webp" alt="Powered by YourPlan" className="h-8 w-auto opacity-80"/>
        </footer>
      </section>

      <section className="flex items-center justify-center border-t border-white/[.07] py-10 lg:min-h-screen lg:border-l lg:border-t-0 lg:border-white/[.07] lg:pl-16">
        <div className="relative w-full max-w-[500px]">
          <div className="pointer-events-none absolute -inset-px rounded-[22px] opacity-75 blur-[.4px]" style={{background:`linear-gradient(135deg,${primaryColor},rgba(255,255,255,.08),${accentColor})`}}/>
          <div className="relative overflow-hidden rounded-[21px] border border-white/[.08] bg-[linear-gradient(145deg,rgba(24,31,26,.98),rgba(10,15,12,.98))] p-6 shadow-[0_35px_100px_rgba(0,0,0,.55)] sm:p-9">
            <div className="pointer-events-none absolute right-[-70px] top-[-80px] h-56 w-56 rounded-full blur-[55px]" style={{backgroundColor:glow}}/>
            <div className="relative">
              <div className="flex items-center justify-between gap-4">
                <img src={logoSrc} alt={businessName} className="max-h-16 w-auto max-w-[230px] object-contain object-left"/>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border" style={{borderColor:border,backgroundColor:`${primaryColor}16`,color:accentColor}}><LockKeyhole size={18}/></span>
              </div>
              <div className="mt-8">
                <p className="text-[11px] font-semibold uppercase tracking-[.16em]" style={{color:accentColor}}>Secure {shortName} access</p>
                <h2 className="mt-2 text-[30px] font-bold tracking-[-.04em] text-white sm:text-[34px]">Welcome back.</h2>
                <p className="mt-2 text-[14px] leading-6 text-slate-400">Sign in with your registered {shortName} work email.</p>
              </div>
              <form onSubmit={onSubmit} className="mt-7 space-y-5">
                <label className="block">
                  <span className="mb-2 block text-[13px] font-medium text-slate-300">Email address</span>
                  <input aria-label="Email address" autoComplete="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@business.com.au" className="h-12 w-full rounded-[10px] border border-white/[.11] bg-[#080d09] px-4 text-[14px] text-white outline-none placeholder:text-slate-600 focus:border-white/30"/>
                </label>
                <label className="block">
                  <span className="mb-2 block text-[13px] font-medium text-slate-300">Password</span>
                  <div className="relative">
                    <input aria-label="Password" autoComplete="current-password" type={show?"text":"password"} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" className="h-12 w-full rounded-[10px] border border-white/[.11] bg-[#080d09] px-4 pr-12 text-[14px] text-white outline-none placeholder:text-slate-600 focus:border-white/30"/>
                    <button type="button" onClick={()=>setShow(v=>!v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white" aria-label={show?"Hide password":"Show password"}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button>
                  </div>
                </label>
                <div className="flex items-center justify-between gap-3 text-[12px]">
                  <label className="flex items-center gap-2 text-slate-400"><input type="checkbox" defaultChecked className="h-4 w-4" style={{accentColor:primaryColor}}/> Keep me signed in</label>
                  <a href="/contact" className="font-medium" style={{color:accentColor}}>Reset password</a>
                </div>
                {error?<div className="rounded-[9px] border border-red-400/20 bg-red-400/[.07] px-3 py-3 text-[12px] leading-5 text-red-300">{error}</div>:null}
                <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-3 rounded-[10px] text-[14px] font-semibold text-white shadow-lg transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60" style={{background:`linear-gradient(180deg,${accentColor},${primaryColor})`,boxShadow:`0 13px 34px ${glow}`}}>{loading?"Signing in…":<>Sign in to {shortName} <ArrowRight size={17}/></>}</button>
              </form>
              <div className="mt-7 flex items-start gap-3 rounded-xl border border-white/[.07] bg-white/[.025] p-4">
                <ShieldCheck size={17} className="mt-0.5 shrink-0" style={{color:accentColor}}/>
                <p className="text-[11px] leading-5 text-slate-500">Encrypted sign-in. Access is limited to authorised {businessName} team members.</p>
              </div>
              <div className="mt-6 flex justify-center lg:hidden"><img src="/yourplan-powered-footer.webp" alt="Powered by YourPlan" className="h-8 w-auto opacity-75"/></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </main>;
}
