import Link from "next/link";
import type { ReactNode } from "react";
import { Menu } from "lucide-react";

const nav = [
  ["Features", "/features"],
  ["Industries", "/industries"],
  ["Pricing", "/pricing"],
  ["About", "/about"],
  ["Resources", "/resources"],
  ["Contact", "/contact"],
] as const;

function ApprovedLogo({ small = false }: { small?: boolean }) {
  return (
    <span
      aria-label="YourPlan"
      role="img"
      className={`block shrink-0 ${small ? "h-[24px] w-[108px]" : "h-[43px] w-[188px]"}`}
      style={{
        backgroundImage: "url('/api/approved-home')",
        backgroundRepeat: "no-repeat",
        backgroundSize: small ? "832px 624px" : "1448px 1086px",
        backgroundPosition: small ? "-22px -12px" : "-38px -20px",
      }}
    />
  );
}

function PublicHeader({ active }: { active?: string }) {
  return (
    <header className="relative z-30 border-b border-white/[.06] bg-[#0a0d10]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-[78px] w-[92.5%] items-center justify-between lg:h-[104px]">
        <Link href="/" aria-label="YourPlan home">
          <ApprovedLogo />
        </Link>

        <nav className="hidden items-center gap-[clamp(28px,2vw,40px)] text-[clamp(12px,.83vw,16px)] text-slate-100 lg:flex" aria-label="Primary navigation">
          {nav.map(([label, href]) => (
            <Link key={href} href={href} className={`relative py-3 transition hover:text-white ${active === label ? "text-white" : "text-slate-300"}`}>
              {label}{label === "Features" || label === "Industries" || label === "Resources" ? "⌄" : ""}
              {active === label ? <span className="absolute inset-x-0 -bottom-1 h-px bg-[#168dff] shadow-[0_0_10px_rgba(22,141,255,.85)]" /> : null}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login" className="rounded-[7px] border border-white/35 px-[clamp(18px,1.3vw,25px)] py-[clamp(11px,.78vw,15px)] text-[clamp(12px,.83vw,16px)] transition hover:border-white/60 hover:bg-white/[.04]">Login</Link>
          <Link href="/contact" className="rounded-[7px] bg-[#0b86ff] px-[clamp(22px,1.55vw,30px)] py-[clamp(11px,.78vw,15px)] text-[clamp(12px,.83vw,16px)] shadow-[0_0_18px_rgba(22,141,255,.28)] transition hover:bg-[#168dff]">Book a Demo</Link>
        </div>

        <details className="group relative lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-center rounded-[7px] border border-white/25 bg-black/20 p-2.5 text-white marker:hidden" aria-label="Open menu">
            <Menu size={24} strokeWidth={1.8} />
          </summary>
          <div className="absolute right-0 top-14 z-50 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#090e13]/95 p-2 shadow-2xl backdrop-blur-xl">
            {nav.map(([label, href]) => (
              <Link key={href} href={href} className={`block rounded-lg px-3 py-2.5 text-sm ${active === label ? "bg-[#168dff]/10 text-[#66b5ff]" : "text-slate-200 hover:bg-white/5"}`}>
                {label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/[.07] pt-2">
              <Link href="/login" className="rounded-lg border border-white/15 px-3 py-2 text-center text-sm text-white">Login</Link>
              <Link href="/contact" className="rounded-lg bg-[#0b86ff] px-3 py-2 text-center text-sm text-white">Book Demo</Link>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}

function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-white/[.07] bg-[#070b0f]">
      <div className="mx-auto flex w-[92.5%] flex-col gap-5 py-7 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:min-h-[72px] lg:py-0">
        <div className="flex items-center gap-4">
          <ApprovedLogo small />
          <span>© 2026 YourPlan. All rights reserved.</span>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white">Terms of Service</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
        </div>
      </div>
    </footer>
  );
}

export function LockedPublicFrame({ active, children }: { active?: string; children: ReactNode }) {
  return (
    <div data-public-page={active?.toLowerCase()} className="locked-public-frame flex min-h-screen flex-col overflow-x-hidden bg-[#05090d] text-white [font-family:Inter,Arial,sans-serif]">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_10%_8%,rgba(255,255,255,.06),transparent_29%),radial-gradient(ellipse_at_78%_28%,rgba(22,141,255,.08),transparent_34%),linear-gradient(115deg,#252a2f_0%,#171c21_28%,#0c1116_58%,#05090d_100%)]" />
      <div className="pointer-events-none fixed inset-0 z-0 opacity-35 [background-image:repeating-linear-gradient(18deg,rgba(255,255,255,.018)_0px,rgba(255,255,255,.018)_1px,transparent_1px,transparent_4px),repeating-linear-gradient(104deg,rgba(0,0,0,.16)_0px,rgba(0,0,0,.16)_2px,transparent_2px,transparent_8px)]" />
      <div className="relative z-10 flex min-h-screen flex-col">
        <PublicHeader active={active} />
        <div className="locked-public-content flex flex-1 flex-col">{children}</div>
        <PublicFooter />
      </div>
    </div>
  );
}
