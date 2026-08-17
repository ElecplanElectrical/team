"use client";

import { Link2, ShieldCheck, X } from "lucide-react";
import CopyField from "@/components/CopyField";

const UI = { panel: "#07192b", panelAlt: "#09213a", border: "rgba(77,150,221,.24)", borderSoft: "rgba(77,150,221,.12)", text: "#f5f9ff", mute: "#93a9c2", faint: "#617993", blue: "#168dff", cyan: "#25c7ff" };

export default function LinkResultModal({ title, blurb, url, onClose }: { title: string; blurb: string; url: string; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm md:items-center md:p-4" onClick={onClose} role="presentation">
    <section className="w-full max-w-lg overflow-hidden rounded-t-2xl md:rounded-2xl" style={{ background: UI.panel, border: `1px solid ${UI.border}`, boxShadow: "0 28px 90px rgba(0,0,0,.35)" }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="secure-link-title">
      <header className="flex items-start gap-3 border-b px-5 py-4" style={{ borderColor: UI.borderSoft }}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(22,141,255,.11)", color: UI.cyan }}><Link2 size={18} /></span>
        <div className="min-w-0 flex-1"><h2 id="secure-link-title" className="text-base font-semibold" style={{ color: UI.text }}>{title}</h2><p className="mt-1 text-xs leading-5" style={{ color: UI.faint }}>{blurb}</p></div>
        <button type="button" aria-label="Close" onClick={onClose} className="p-1" style={{ color: UI.mute }}><X size={18} /></button>
      </header>

      <div className="p-5">
        <CopyField value={url} />
        <div className="mt-4 flex gap-3 rounded-xl p-3" style={{ background: UI.panelAlt, border: `1px solid ${UI.borderSoft}` }}><ShieldCheck size={15} className="mt-0.5 shrink-0" style={{ color: UI.cyan }} /><p className="text-xs leading-5" style={{ color: UI.faint }}>This link is single-use and expires. Copy it now and send it directly to the team member.</p></div>
        <div className="mt-5 flex justify-end"><button type="button" onClick={onClose} className="rounded-lg px-5 py-2.5 text-sm font-semibold" style={{ background: UI.blue, color: "white" }}>Done</button></div>
      </div>
    </section>
  </div>;
}
