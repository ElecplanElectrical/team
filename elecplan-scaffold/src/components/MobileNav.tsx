"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Menu, X } from "lucide-react";
import type { Role } from "@prisma/client";
import { LOGO_WORDMARK } from "@/lib/logo";
import CarbonNavigation from "@/components/CarbonNavigation";

export default function MobileNav({ role, name = "Team member" }: { role: Role; name?: string }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawer.current?.querySelector<HTMLButtonElement>("button")?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); setOpen(false); }
      if (event.key !== "Tab") return;
      const elements = [...(drawer.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled])') ?? [])].filter(element => element.getClientRects().length > 0);
      const first = elements[0], last = elements[elements.length - 1];
      if (!first) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKey); trigger.current?.focus(); };
  }, [open]);
  return <>
    <div className="ep-carbon-mobilebar fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between px-4 md:hidden">
      <button ref={trigger} type="button" onClick={() => setOpen(true)} aria-label="Open navigation" aria-expanded={open} aria-controls="elecplan-mobile-menu" className="flex h-9 w-9 items-center justify-center rounded-lg"><Menu size={18} /></button>
      <Link href="/dashboard" aria-label="Elecplan dashboard" className="flex h-9 items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={LOGO_WORDMARK} alt="elecplan" style={{ width: 112, height: "auto", objectFit: "contain", display: "block" }} />
      </Link>
      {role === "ADMIN" ? <Link href="/reminders" aria-label="To do list" className="ep-mobile-action flex h-9 w-9 items-center justify-center rounded-lg"><Bell size={16} /></Link> : <span className="w-9" />}
    </div>
    {open && <div className="fixed inset-0 z-[60] md:hidden">
      <button type="button" tabIndex={-1} aria-label="Close navigation overlay" className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <aside ref={drawer} id="elecplan-mobile-menu" role="dialog" aria-modal="true" aria-label="Elecplan menu" className="ep-carbon-drawer absolute inset-y-0 left-0 w-[82%] max-w-[320px]">
        <button type="button" aria-label="Close navigation" className="ep-carbon-drawer-close" onClick={() => setOpen(false)}><X size={17} /></button>
        <CarbonNavigation role={role} name={name} onNavigate={() => setOpen(false)} />
      </aside>
    </div>}
  </>;
}
