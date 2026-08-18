"use client";

import { useState } from "react";
import { Building2, Trash2, X } from "lucide-react";

export type EditableClient = {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  billingNotes: string | null;
};

const UI = { panel: "#07192b", panelAlt: "#09213a", border: "rgba(77,150,221,.24)", borderSoft: "rgba(77,150,221,.12)", text: "#f5f9ff", mute: "#93a9c2", faint: "#617993", blue: "#168dff", cyan: "#25c7ff", red: "#ff5e72" };

export default function EditClientModal({ client, onClose, onDone }: { client: EditableClient; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState(client.name);
  const [contactName, setContactName] = useState(client.contactName ?? "");
  const [phone, setPhone] = useState(client.phone ?? "");
  const [email, setEmail] = useState(client.email ?? "");
  const [address, setAddress] = useState(client.address ?? "");
  const [billingNotes, setBillingNotes] = useState(client.billingNotes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("Client name is required.");
    setSaving(true);
    const res = await fetch(`/api/clients/${client.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), contactName: contactName.trim() || null, phone: phone.trim() || null, email: email.trim() || null, address: address.trim() || null, billingNotes: billingNotes.trim() || null }) });
    setSaving(false);
    if (!res.ok) { const body = await res.json().catch(() => null); setError(body?.error ?? "Could not update the client."); return; }
    onDone();
  }

  async function deleteClient() {
    if (!confirmDelete) { setConfirmDelete(true); setError(null); return; }
    setError(null);
    setDeleting(true);
    const res = await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
    setDeleting(false);
    if (!res.ok) { const body = await res.json().catch(() => null); setError(body?.error ?? "Could not delete the client."); setConfirmDelete(false); return; }
    onDone();
  }

  const field = { background: "#041323", border: `1px solid ${UI.border}`, color: UI.text } as const;

  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm md:items-center md:p-4" onClick={onClose}>
    <section className="w-full max-w-xl overflow-hidden rounded-t-2xl md:rounded-2xl" style={{ background: UI.panel, border: `1px solid ${UI.border}`, boxShadow: "0 28px 90px rgba(0,0,0,.35)" }} onClick={(e) => e.stopPropagation()}>
      <header className="flex items-start gap-3 border-b px-5 py-4" style={{ borderColor: UI.borderSoft }}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(22,141,255,.11)", color: UI.cyan }}><Building2 size={18} /></span>
        <div className="min-w-0 flex-1"><h2 className="text-base font-semibold" style={{ color: UI.text }}>Edit client</h2><p className="mt-1 truncate text-xs" style={{ color: UI.faint }}>{client.name}</p></div>
        <button type="button" aria-label="Close" onClick={onClose} className="p-1" style={{ color: UI.mute }}><X size={18} /></button>
      </header>

      <form onSubmit={submit} className="max-h-[82vh] overflow-auto p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Business / client name" className="md:col-span-2"><input value={name} onChange={(e) => setName(e.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} autoFocus /></Field>
          <Field label="Contact name"><input value={contactName} onChange={(e) => setContactName(e.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field>
          <Field label="Phone"><input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field>
          <Field label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field>
          <div className="hidden md:block" />
          <Field label="Address" className="md:col-span-2"><input value={address} onChange={(e) => setAddress(e.target.value)} className="h-11 w-full rounded-lg px-3 text-sm outline-none" style={field} /></Field>
          <Field label="Billing notes" className="md:col-span-2"><textarea value={billingNotes} onChange={(e) => setBillingNotes(e.target.value)} rows={3} className="w-full resize-none rounded-lg px-3 py-2.5 text-sm outline-none" style={field} /></Field>
        </div>

        {confirmDelete && <div className="mt-4 rounded-xl p-3 text-xs leading-5" style={{ background: "rgba(255,94,114,.08)", border: "1px solid rgba(255,94,114,.25)", color: UI.text }}>Permanently delete <strong>{client.name}</strong>? This will also permanently delete jobs and other records linked to this client. This cannot be undone. Press <strong>Confirm delete</strong> again to continue.</div>}
        {error && <p className="mt-4 text-xs" style={{ color: UI.red }}>{error}</p>}

        <div className="mt-5 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: UI.borderSoft }}>
          <button type="button" onClick={deleteClient} disabled={deleting || saving} className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ background: confirmDelete ? UI.red : "rgba(255,94,114,.08)", color: confirmDelete ? "white" : UI.red, border: "1px solid rgba(255,94,114,.28)" }}><Trash2 size={15} />{deleting ? "Deleting…" : confirmDelete ? "Confirm delete" : "Delete client"}</button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-semibold" style={{ background: UI.panelAlt, color: UI.mute, border: `1px solid ${UI.borderSoft}` }}>Cancel</button><button type="submit" disabled={saving || deleting || confirmDelete} className="rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ background: UI.blue, color: "white" }}>{saving ? "Saving…" : "Save changes"}</button></div>
        </div>
      </form>
    </section>
  </div>;
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) { return <label className={`flex flex-col gap-1.5 ${className}`}><span className="text-xs font-medium" style={{ color: UI.mute }}>{label}</span>{children}</label>; }
