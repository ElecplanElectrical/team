import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { Layers3, ShieldCheck, Sparkles } from "lucide-react";
import LoginForm from "@/components/LoginForm";
import YourPlanLogo from "@/components/YourPlanLogo";
import TenantLoginForm from "@/components/TenantLoginForm";
import { prisma } from "@/lib/prisma";

function safeCallback(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const url = new URL(value, "https://your-plan.com.au");
    return url.origin === "https://your-plan.com.au" ? `${url.pathname}${url.search}${url.hash}` : "/";
  } catch {
    return "/";
  }
}

function tenantSlugFromCallback(value:string){
  const match=value.match(/^\/b\/([a-z0-9-]+)\/dashboard(?:[/?#]|$)/i);
  return match?.[1]?.toLowerCase()??null;
}

export async function generateMetadata():Promise<Metadata>{
  const requestHeaders=await headers();
  const host=(requestHeaders.get("x-forwarded-host")??requestHeaders.get("host")??"").split(":")[0].toLowerCase();
  if(host==="qls.your-plan.com.au")return {title:{absolute:"Sign in | Quality Landscape Solutions"},description:"Private Quality Landscape Solutions team portal.",robots:{index:false,follow:false}};
  return {title:"Sign in"};
}

export async function generateViewport():Promise<Viewport>{
  const requestHeaders=await headers();
  const host=(requestHeaders.get("x-forwarded-host")??requestHeaders.get("host")??"").split(":")[0].toLowerCase();
  return {themeColor:host==="qls.your-plan.com.au"?"#040605":"#03070b"};
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; tenant?: string }> }) {
  const { callbackUrl, tenant } = await searchParams;
  const destination=safeCallback(callbackUrl);
  const requestedTenant=/^[a-z0-9-]+$/.test(tenant??"")?tenant!.toLowerCase():null;
  const tenantSlug=requestedTenant??tenantSlugFromCallback(destination);
  if(tenantSlug){
    const business=await prisma.businessPortal.findFirst({
      where:{slug:tenantSlug,active:true},
      select:{name:true,slug:true,primaryColor:true,accentColor:true},
    });
    if(business){
      return <TenantLoginForm
        callbackUrl={destination}
        tenantSlug={business.slug}
        businessName={business.name}
        shortName={business.slug.toUpperCase()}
        primaryColor={business.primaryColor}
        accentColor={business.accentColor}
      />;
    }
  }
  return <main className="relative min-h-screen overflow-hidden bg-[#03070b] text-white [font-family:Inter,Arial,sans-serif]">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(22,141,255,.24),transparent_28%),radial-gradient(circle_at_88%_82%,rgba(37,199,255,.12),transparent_25%),linear-gradient(135deg,#060d14_0%,#03070b_55%,#07111b_100%)]" />
    <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(83,160,235,.055)_1px,transparent_1px),linear-gradient(90deg,rgba(83,160,235,.055)_1px,transparent_1px)] [background-size:48px_48px]" />
    <div className="pointer-events-none absolute -left-28 top-[18%] h-[430px] w-[430px] rounded-full border border-[#168dff]/10" />
    <div className="pointer-events-none absolute -left-12 top-[25%] h-[290px] w-[290px] rounded-full border border-[#25c7ff]/10" />
    <YourPlanLogo decorative width={620} className="pointer-events-none absolute -left-16 bottom-[7%] hidden lg:block" style={{opacity:.035,filter:"blur(1px)",transform:"rotate(-6deg)"}} />
    <YourPlanLogo decorative width={430} className="pointer-events-none absolute -right-20 top-[5%]" style={{opacity:.025,filter:"blur(1px)",transform:"rotate(6deg)"}} />

    <div className="relative z-10 mx-auto grid min-h-screen w-[92%] max-w-[1380px] lg:grid-cols-[1.08fr_.92fr]">
      <section className="flex min-h-[310px] flex-col justify-between py-7 lg:min-h-screen lg:py-9 lg:pr-16">
        <header className="flex items-center justify-between">
          <Link href="/" aria-label="YourPlan home" className="inline-flex">
            <YourPlanLogo width={205} />
          </Link>
          <Link href="/" className="rounded-full border border-white/10 bg-white/[.025] px-4 py-2 text-[12px] text-slate-400 transition hover:border-white/25 hover:text-white lg:hidden">Back to website</Link>
        </header>

        <div className="max-w-[670px] py-12 lg:py-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#168dff]/25 bg-[#168dff]/[.07] px-3 py-2 text-[11px] font-semibold uppercase tracking-[.14em] text-[#57b7ff]">
            <Sparkles size={14} /> Your business operating system
          </div>
          <h1 className="mt-7 text-[42px] font-black leading-[.98] tracking-[-.055em] sm:text-[56px] lg:text-[70px]">
            One sign-in.<br /><span className="text-[#168dff]">Your whole business.</span>
          </h1>
          <p className="mt-6 max-w-[570px] text-[15px] leading-7 text-slate-300 sm:text-[17px]">Jobs, scheduling, customers, staff, documents, billing and reporting—connected in one secure place.</p>
          <div className="mt-8 grid max-w-[620px] gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/[.025] p-4 backdrop-blur-sm"><Layers3 size={19} className="text-[#168dff]"/><strong className="mt-3 block text-[13px]">One platform</strong><span className="mt-1 block text-[11px] leading-5 text-slate-500">Everything connected</span></div>
            <div className="rounded-xl border border-white/10 bg-white/[.025] p-4 backdrop-blur-sm"><ShieldCheck size={19} className="text-[#25c7ff]"/><strong className="mt-3 block text-[13px]">Secure access</strong><span className="mt-1 block text-[11px] leading-5 text-slate-500">Protected business data</span></div>
            <div className="rounded-xl border border-white/10 bg-white/[.025] p-4 backdrop-blur-sm"><Sparkles size={19} className="text-[#6fc8ff]"/><strong className="mt-3 block text-[13px]">Built your way</strong><span className="mt-1 block text-[11px] leading-5 text-slate-500">Configured for your team</span></div>
          </div>
        </div>

        <footer className="hidden items-center justify-between border-t border-white/[.07] pt-5 text-[11px] text-slate-600 lg:flex">
          <span>© {new Date().getFullYear()} YourPlan. All rights reserved.</span>
          <div className="flex items-center gap-6"><span>Private</span><span>Secure</span><span>Australian owned</span></div>
        </footer>
      </section>

      <section className="flex items-center justify-center border-t border-white/[.07] py-10 lg:min-h-screen lg:border-l lg:border-t-0 lg:border-white/[.07] lg:pl-16">
        <LoginForm callbackUrl={destination} />
      </section>
    </div>
  </main>;
}
