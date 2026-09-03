import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { AlertTriangle } from "lucide-react";
import SetPasswordForm from "@/components/SetPasswordForm";

const UI={panel:"#07192b",border:"rgba(77,150,221,.24)",text:"#f5f9ff",mute:"#93a9c2",blue:"#168dff",red:"#ff5e72"};
async function qlsRequest(){const requestHeaders=await headers();const host=(requestHeaders.get("x-forwarded-host")??requestHeaders.get("host")??"").split(":")[0].toLowerCase();return host==="qls.your-plan.com.au";}
export async function generateMetadata():Promise<Metadata>{return await qlsRequest()?{title:{absolute:"Set password | Quality Landscape Solutions"},robots:{index:false,follow:false}}:{};}
export async function generateViewport():Promise<Viewport>{return {themeColor:await qlsRequest()?"#040605":"#03101f"};}
export default async function SetPasswordPage({searchParams}:{searchParams:Promise<{token?:string}>}){
 const {token}=await searchParams;
 const isQls=await qlsRequest();const panel=isQls?"#0d1110":UI.panel;const border=isQls?"rgba(180,198,186,.17)":UI.border;const mute=isQls?"#aab3ad":UI.mute;const primary=isQls?"#50d878":UI.blue;
 return <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6" style={{background:isQls?"radial-gradient(circle at 20% 10%,rgba(80,216,120,.10),transparent 30%),radial-gradient(circle at 85% 85%,rgba(130,236,160,.05),transparent 26%),#040605":"radial-gradient(circle at 20% 10%, rgba(22,141,255,.20), transparent 30%), radial-gradient(circle at 85% 85%, rgba(37,199,255,.10), transparent 26%), #03101f"}}><div className="pointer-events-none absolute inset-0 opacity-30" style={{backgroundImage:isQls?"linear-gradient(rgba(180,198,186,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(180,198,186,.03) 1px,transparent 1px)":"linear-gradient(rgba(77,150,221,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(77,150,221,.05) 1px, transparent 1px)",backgroundSize:"42px 42px"}}/><div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">{token?<SetPasswordForm token={token} isQls={isQls}/>:<section className="w-full max-w-md rounded-2xl p-6 text-center shadow-[0_28px_90px_rgba(0,0,0,.35)] sm:p-8" style={{background:panel,border:`1px solid ${border}`}}><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl" style={{background:"rgba(255,94,114,.08)",border:"1px solid rgba(255,94,114,.22)",color:UI.red}}><AlertTriangle size={20}/></div><h1 className="mt-4 text-xl font-semibold" style={{color:UI.text}}>This invite link is incomplete</h1><p className="mt-2 text-sm leading-6" style={{color:mute}}>Ask your business administrator to issue a new secure invite or password-reset link.</p><Link href="/login" className="mt-6 inline-flex rounded-lg px-4 py-2.5 text-sm font-semibold" style={{background:primary,color:isQls?"#071008":"white"}}>Back to sign in</Link></section>}</div></main>;
}
