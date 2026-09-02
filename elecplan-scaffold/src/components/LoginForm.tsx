"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";

export default function LoginForm({callbackUrl}:{callbackUrl:string}){
  const router=useRouter();
  const[email,setEmail]=useState("");
  const[password,setPassword]=useState("");
  const[show,setShow]=useState(false);
  const[error,setError]=useState<string|null>(null);
  const[loading,setLoading]=useState(false);

  async function onSubmit(e:React.FormEvent){
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res=await signIn("credentials",{email,password,redirect:false});
    setLoading(false);
    if(!res||res.error){setError("That email or password isn’t right. Try again or request a reset.");return}
    router.push(callbackUrl);
    router.refresh();
  }

  return <div className="relative w-full max-w-[500px]">
    <div className="pointer-events-none absolute -inset-px rounded-[22px] bg-[linear-gradient(135deg,rgba(22,141,255,.62),rgba(255,255,255,.08),rgba(37,199,255,.28))] opacity-70 blur-[.4px]" />
    <div className="relative overflow-hidden rounded-[21px] border border-white/[.08] bg-[linear-gradient(145deg,rgba(10,23,34,.98),rgba(4,12,19,.98))] p-6 shadow-[0_35px_100px_rgba(0,0,0,.55),0_0_50px_rgba(22,141,255,.08)] sm:p-9">
      <div className="pointer-events-none absolute right-[-70px] top-[-80px] h-56 w-56 rounded-full bg-[#168dff]/10 blur-[55px]" />
      <div className="relative">
        <div className="flex items-center justify-between gap-4">
          <img src="/yourplan-wordmark-transparent.webp" alt="YourPlan" className="h-auto w-[150px] object-contain sm:w-[170px]" />
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#168dff]/25 bg-[#168dff]/10 text-[#54b5ff]"><LockKeyhole size={18}/></span>
        </div>

        <div className="mt-9">
          <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#53b4ff]">Secure portal access</p>
          <h2 className="mt-2 text-[30px] font-bold tracking-[-.04em] text-white sm:text-[34px]">Welcome back.</h2>
          <p className="mt-2 text-[14px] leading-6 text-slate-400">Sign in with the work email registered to your YourPlan account.</p>
        </div>

        <form onSubmit={onSubmit} className="mt-7 space-y-5">
          <label className="block">
            <span className="mb-2 block text-[13px] font-medium text-slate-300">Email address</span>
            <input aria-label="Email address" autoComplete="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@business.com.au" className="h-12 w-full rounded-[10px] border border-white/[.11] bg-[#030a10] px-4 text-[14px] text-white outline-none transition placeholder:text-slate-600 focus:border-[#168dff]/70 focus:shadow-[0_0_0_3px_rgba(22,141,255,.10)]" />
          </label>
          <label className="block">
            <span className="mb-2 block text-[13px] font-medium text-slate-300">Password</span>
            <div className="relative">
              <input aria-label="Password" autoComplete="current-password" type={show?"text":"password"} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" className="h-12 w-full rounded-[10px] border border-white/[.11] bg-[#030a10] px-4 pr-12 text-[14px] text-white outline-none transition placeholder:text-slate-600 focus:border-[#168dff]/70 focus:shadow-[0_0_0_3px_rgba(22,141,255,.10)]" />
              <button type="button" onClick={()=>setShow(v=>!v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-white" aria-label={show?"Hide password":"Show password"}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button>
            </div>
          </label>
          <div className="flex items-center justify-between gap-3 text-[12px]">
            <label className="flex items-center gap-2 text-slate-400"><input type="checkbox" defaultChecked className="h-4 w-4 accent-[#168dff]"/> Keep me signed in</label>
            <Link href="/contact" className="font-medium text-[#4cb0ff] hover:text-[#7fc8ff]">Reset password</Link>
          </div>
          {error?<div className="rounded-[9px] border border-red-400/20 bg-red-400/[.07] px-3 py-3 text-[12px] leading-5 text-red-300">{error}</div>:null}
          <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-3 rounded-[10px] bg-[linear-gradient(180deg,#1995ff,#0875e7)] text-[14px] font-semibold text-white shadow-[0_13px_34px_rgba(22,141,255,.28)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">{loading?"Signing in…":<>Sign in to YourPlan <ArrowRight size={17}/></>}</button>
        </form>

        <div className="mt-7 flex items-start gap-3 rounded-xl border border-white/[.07] bg-white/[.025] p-4">
          <ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#35bfff]"/>
          <p className="text-[11px] leading-5 text-slate-500">Your login is encrypted and access is controlled by your business administrator.</p>
        </div>
        <p className="mt-6 text-center text-[12px] text-slate-500">Need access? <Link href="/contact" className="font-medium text-[#4cb0ff]">Contact YourPlan</Link></p>
      </div>
    </div>
  </div>
}
