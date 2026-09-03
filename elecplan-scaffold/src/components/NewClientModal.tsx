"use client";

import { useState } from "react";
import { Building2, X } from "lucide-react";

const UI = { panel: "var(--brand-panel, #07192b)", panelAlt: "var(--brand-panel-alt, #09213a)", border: "var(--brand-border, rgba(77,150,221,.24))", borderSoft: "var(--brand-border-soft, rgba(77,150,221,.12))", text: "#f5f9ff", mute: "var(--brand-muted, #93a9c2)", faint: "var(--brand-faint, #617993)", blue: "var(--brand-primary, #168dff)", cyan: "var(--brand-accent, #25c7ff)", red: "#ff5e72" };

export default function NewClientModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [billingNotes, setBillingNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Client name is required.");
    setSaving(true);
    const res = await fetch("/api/clients", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), contactName: contactName.trim() || null, phone: phone.trim() || null, email: email.trim() || null, address: address.trim() || null, billingNotes: billingNotes.trim() || null }) });
    setSaving(false);
    if (!res.ok) { const body = await res.json().catch(() => null); setError(body?.error ?? "Could not create the client. Check the details and try again."); return; }
    onDone();
  }

  const field = { background: "var(--brand-panel-deep, #041323)", border: `1px solid ${UI.border}`, color: UI.text } as const;

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm md:items-center md:p-4" onClick={onClose}>
    <section className="w-full max-w-xl overflow-hidden rounded-t-2xl md:rounded-2xl" style={{ background: UI.panel, border: `1px solid ${UI.border}`, boxShadow: "0 28px 90px rgba(0,0,0,.35)" }} onClick={(e) => e.stopPropagation()}>
      <header className="flex items-start gap-3 border-b px-5 py-4" style={{ borderColor: UI.borderSoft }}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgb(var(--brand-primary-rgb, 22 141 255) / .11)", color: UI.cyan }}><Building2 size={18} /></span>
        <div className="min-w-0 flex-1"><h2 className="text-base font-semibold" style={{ color: UI.text }}>New client</h2><p className="mt-1 text-xs" style={{ color: UI.faint }}>Add the client details you need for jobs, quotes and billing.</p></div>
        <button type="button" aria-label="Close" onClick={onClose} className="p-1" style={{ color: UI.mute }}><X size={18} /></button>
      </header>

      <form onSubmit={submit} className="max-h-[82vh] overflow-auto p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Business / client name" className="md:col-span-2"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Riverbend Cafe" className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} autoFocus /></Field>
          <Field label="Contact name"><input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="e.g. Nadia Kell" className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field>
          <Field label="Phone"><input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="04xx xxx xxx" className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field>
          <Field label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field>
          <div className="hidden md:block" />
          <Field label="Address" className="md:col-span-2"><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, suburb, state" className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field>
          <Field label="Billing notes" className="md:col-span-2"><textarea value={billingNotes} onChange={(e) => setBillingNotes(e.target.value)} placeholder="e.g. Net 30, PO required" rows={3} className="w-full resize-none rounded-lg px-3 py-2.5 text-sm outline-none" style={field} /></Field>
        </div>

        {error && <p className="mt-4 text-xs" style={{ color: UI.red }}>{error}</p>}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-semibold" style={{ background: UI.panelAlt, color: UI.mute, border: `1px solid ${UI.borderSoft}` }}>Cancel</button><button type="submit" disabled={saving} className="rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ background: UI.blue, color: "white" }}>{saving ? "Saving…" : "Create client"}</button></div>
      </form>
    </section>
  </div>;
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) { return <label className={`flex flex-col gap-1.5 ${className}`}><span className="text-xs font-medium" style={{ color: UI.mute }}>{label}</span>{children}</label>; }
