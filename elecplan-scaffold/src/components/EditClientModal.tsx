"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { COLORS, FONTS, ON_ACCENT } from "@/lib/theme";

export type EditableClient = {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  billingNotes: string | null;
};

export default function EditClientModal({
  client,
  onClose,
  onDone,
}: {
  client: EditableClient;
  onClose: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState(client.name);
  const [contactName, setContactName] = useState(client.contactName ?? "");
  const [phone, setPhone] = useState(client.phone ?? "");
  const [email, setEmail] = useState(client.email ?? "");
  const [address, setAddress] = useState(client.address ?? "");
  const [billingNotes, setBillingNotes] = useState(client.billingNotes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Client name is required.");
      return;
    }

    setSaving(true);
    const res = await fetch(`/api/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        contactName: contactName.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        billingNotes: billingNotes.trim() || null,
      }),
    });
    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not update the client.");
      return;
    }
    onDone();
  }

  const fieldStyle: React.CSSProperties = {
    background: COLORS.cardAlt,
    border: `1px solid ${COLORS.border}`,
    color: COLORS.text,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg overflow-hidden"
        style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}
        >
          <h2 className="text-base font-semibold" style={{ fontFamily: FONTS.display, color: COLORS.text }}>
            Edit client
          </h2>
          <button type="button" aria-label="Close" onClick={onClose} style={{ color: COLORS.textMute }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 flex flex-col gap-3 max-h-[80vh] overflow-auto">
          <Field label="Business / client name">
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle} autoFocus />
          </Field>

          <Field label="Contact name">
            <input value={contactName} onChange={(e) => setContactName(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle} />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Phone">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle} />
            </Field>
            <Field label="Email">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle} />
            </Field>
          </div>

          <Field label="Address">
            <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full rounded-md px-3 py-2 text-sm outline-none" style={fieldStyle} />
          </Field>

          <Field label="Billing notes">
            <textarea value={billingNotes} onChange={(e) => setBillingNotes(e.target.value)} rows={3} className="w-full rounded-md px-3 py-2 text-sm outline-none resize-none" style={fieldStyle} />
          </Field>

          {error && <p className="text-xs" style={{ color: COLORS.coral }}>{error}</p>}

          <div className="flex justify-end gap-2 mt-1">
            <button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm font-medium" style={{ background: COLORS.cardAlt, color: COLORS.textMute }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60" style={{ background: COLORS.accent, color: ON_ACCENT }}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium" style={{ color: COLORS.textMute }}>{label}</span>
      {children}
    </label>
  );
}
