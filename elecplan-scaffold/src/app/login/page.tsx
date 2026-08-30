import Link from "next/link";
import LoginForm from "@/components/LoginForm";

function safeCallback(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const url = new URL(value, "https://your-plan.com.au");
    return url.origin === "https://your-plan.com.au" ? `${url.pathname}${url.search}${url.hash}` : "/";
  } catch {
    return "/";
  }
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const { callbackUrl } = await searchParams;
  return <main className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_17%_0%,rgba(14,72,117,.16),transparent_30%),linear-gradient(180deg,#020b12,#020a11)] px-5 text-white sm:px-7">
    <header className="mx-auto flex h-[68px] w-full max-w-[1180px] items-center justify-between lg:h-[74px]">
      <Link href="/" className="text-[25px] font-medium tracking-[-.075em]"><span className="text-[#168dff]">Your</span><span>plan</span></Link>
      <Link href="/" className="text-[12px] text-slate-400 hover:text-white">Back to website</Link>
    </header>
    <section className="flex flex-1 items-center justify-center py-8">
      <LoginForm callbackUrl={safeCallback(callbackUrl)}/>
    </section>
    <footer className="mx-auto hidden h-[54px] w-full max-w-[1180px] items-center justify-between border-t border-white/[.07] text-[10px] text-slate-500 lg:flex">
      <span>© 2025 YourPlan. All rights reserved.</span>
      <div className="flex items-center gap-8"><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms of Service</Link><span className="text-white">f</span><span className="text-white">in</span><span className="text-white">▶</span></div>
    </footer>
  </main>;
}
