"use client";
import Link from "next/link";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Eye,EyeOff,Lock,LogIn,Mail,ShieldCheck} from "lucide-react";
const g="#69be28",b="#2a3033",m="#9aa3a7";
export default function EmpireLoginDemoClient(){
  const router=useRouter();
  const[email,setEmail]=useState("team@empirekawasaki.com.au");
  const[password,setPassword]=useState("raceweekend");
  const[show,setShow]=useState(false);
  const[loading,setLoading]=useState(false);
  function submit(e:React.FormEvent){e.preventDefault();if(!email.trim()||!password.trim())return;setLoading(true);setTimeout(()=>router.push("/hq/demos/empire"),250)}
  return <main className="min-h-screen overflow-hidden text-white" style={{background:"#070909"}}>
    <div className="grid min-h-screen lg:grid-cols-[1.3fr_.7fr]">
      <section className="relative hidden overflow-hidden border-r lg:block" style={{borderColor:b,background:"linear-gradient(145deg,#101311,#080a0b 64%,#14200e)"}}>
        <div className="absolute inset-0 opacity-70" style={{background:"radial-gradient(circle at 28% 38%,rgba(105,190,40,.22),transparent 25%),radial-gradient(circle at 70% 65%,rgba(255,255,255,.05),transparent 28%)"}}/>
        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <div className="flex items-center gap-5"><div><p className="text-xs font-black uppercase tracking-[.28em] text-[#f2c94c]">Penrite Racing</p></div><div className="h-10 w-px bg-[#c51f2e]"/><div><p className="text-2xl font-black uppercase tracking-tight">Empire <span style={{color:g}}>Kawasaki</span></p><p className="text-[10px] font-bold uppercase tracking-[.3em]" style={{color:m}}>Racing</p></div></div>
          <div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[.28em]" style={{color:g}}>Welcome to Empire HQ</p><h1 className="mt-4 max-w-xl text-5xl font-black uppercase leading-[.95] xl:text-7xl">Built for the team.<br/>Built for race day.</h1><p className="mt-5 max-w-xl text-sm leading-6" style={{color:m}}>Riders, race weekends, bike setup, timings, equipment, documents and team communication inside one private race-team portal.</p></div>
          <p className="text-xs uppercase tracking-[.18em]" style={{color:m}}>Powered by <span className="font-bold text-sky-400">Your</span><span className="font-bold text-white">Plan</span></p>
        </div>
      </section>
      <section className="flex items-center justify-center p-5 md:p-8" style={{background:"radial-gradient(circle at 50% 10%,rgba(105,190,40,.08),transparent 28%)"}}>
        <div className="w-full max-w-md">
          <div className="mb-7 text-center lg:hidden"><p className="text-xs font-black uppercase tracking-[.22em] text-[#f2c94c]">Penrite Racing</p><p className="mt-1 text-2xl font-black uppercase">Empire <span style={{color:g}}>Kawasaki</span></p></div>
          <form onSubmit={submit} className="rounded-2xl border p-6 shadow-2xl md:p-8" style={{background:"rgba(17,20,22,.97)",borderColor:"rgba(105,190,40,.42)",boxShadow:"0 24px 80px rgba(0,0,0,.45)"}}>
            <div className="text-center"><p className="text-xs font-black uppercase tracking-[.28em]" style={{color:g}}>Welcome to</p><h2 className="mt-2 text-4xl font-black uppercase">Empire HQ</h2><p className="mt-2 text-sm" style={{color:m}}>Private team portal</p></div>
            <div className="mt-6 flex items-start gap-2 rounded-lg border p-3 text-xs" style={{borderColor:b,background:"#0d1011",color:m}}><ShieldCheck size={15} style={{color:g}}/><span>Secure access to Empire HQ for authorised race-team members.</span></div>
            <label className="mt-6 block text-xs font-semibold">Email address</label>
            <div className="mt-2 flex items-center gap-3 rounded-lg border px-3" style={{borderColor:b,background:"#0d1011"}}><Mail size={16} style={{color:m}}/><input value={email} onChange={e=>setEmail(e.target.value)} type="email" className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none" aria-label="Email address"/></div>
            <label className="mt-4 block text-xs font-semibold">Password</label>
            <div className="mt-2 flex items-center gap-3 rounded-lg border px-3" style={{borderColor:b,background:"#0d1011"}}><Lock size={16} style={{color:m}}/><input value={password} onChange={e=>setPassword(e.target.value)} type={show?"text":"password"} className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none" aria-label="Password"/><button type="button" onClick={()=>setShow(v=>!v)} className="p-2" style={{color:m}} aria-label={show?"Hide password":"Show password"}>{show?<EyeOff size={16}/>:<Eye size={16}/>}</button></div>
            <button disabled={loading||!email.trim()||!password.trim()} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3.5 text-sm font-black uppercase tracking-wide disabled:opacity-50" style={{background:g,color:"#061008"}}><LogIn size={16}/>{loading?"Opening HQ…":"Enter Empire HQ"}</button>
            <Link href="/hq/demos/empire/present" className="mt-3 flex w-full items-center justify-center rounded-lg border px-4 py-3 text-xs font-bold" style={{borderColor:b,color:m}}>Back to presentation overview</Link>
            <div className="mt-6 text-center"><p className="text-[10px] uppercase tracking-[.18em]" style={{color:m}}>Powered by <span className="font-bold text-sky-400">Your</span><span className="font-bold text-white">Plan</span></p></div>
          </form>
        </div>
      </section>
    </div>
  </main>
}
