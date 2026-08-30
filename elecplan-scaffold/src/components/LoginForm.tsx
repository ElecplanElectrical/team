"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function LoginForm({callbackUrl}:{callbackUrl:string}){
  const router=useRouter();
  const[email,setEmail]=useState("");
  const[password,setPassword]=useState("");
  const[show,setShow]=useState(false);
  const[remember,setRemember]=useState(true);
  const[error,setError]=useState<string|null>(null);
  const[loading,setLoading]=useState(false);

  async function onSubmit(e:React.FormEvent){
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res=await signIn("credentials",{email,password,redirect:false});
    setLoading(false);
    if(!res||res.error){setError("Incorrect email or password.");return}
    router.push(callbackUrl);
    router.refresh();
  }

  return <div className="w-full max-w-[470px] rounded-lg border border-white/[.11] bg-[#07131d] p-6 shadow-[0_24px_70px_rgba(0,0,0,.38)] sm:p-8">
    <div className="text-[28px] font-medium tracking-[-.075em]"><span className="text-[#168dff]">Your</span><span className="text-white">plan</span></div>
    <h1 className="mt-8 text-[24px] font-semibold tracking-[-.03em] text-white">Welcome back</h1>
    <p className="mt-2 text-[12px] text-slate-400">Sign in to your account.</p>
    <form onSubmit={onSubmit} className="mt-6 space-y-3">
      <input aria-label="Email Address" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email Address" className="h-11 w-full rounded border border-white/[.11] bg-[#050e16] px-3 text-[12px] text-white outline-none placeholder:text-slate-500 focus:border-[#168dff]/50" />
      <div className="relative">
        <input aria-label="Password" type={show?"text":"password"} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="h-11 w-full rounded border border-white/[.11] bg-[#050e16] px-3 pr-11 text-[12px] text-white outline-none placeholder:text-slate-500 focus:border-[#168dff]/50" />
        <button type="button" onClick={()=>setShow(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-label={show?"Hide password":"Show password"}>{show?<EyeOff size={16}/>:<Eye size={16}/>}</button>
      </div>
      <div className="flex items-center justify-between gap-3 text-[10px]">
        <label className="flex items-center gap-2 text-slate-300"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} className="accent-[#168dff]"/> Remember me</label>
        <Link href="/contact" className="text-[#168dff]">Forgot password?</Link>
      </div>
      {error?<p className="text-[11px] text-red-400">{error}</p>:null}
      <button disabled={loading} className="mt-2 flex h-11 w-full items-center justify-center gap-3 rounded bg-[#0d78ff] text-[12px] font-semibold text-white disabled:opacity-60">{loading?"Signing in…":"Sign In"}<span>→</span></button>
    </form>
    <p className="mt-6 text-center text-[11px] text-slate-400">Don’t have an account? <Link href="/contact" className="text-[#168dff]">Contact us</Link></p>
  </div>
}
