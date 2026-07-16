"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Role } from "@prisma/client";
import { COLORS, FONTS, ON_ACCENT } from "@/lib/theme";
import { ROLE_TITLE } from "@/lib/nav";

export default function InviteUserModal({
  assignableRoles,
  onClose,
  onInvited,
}: {
  assignableRoles: Role[];
  onClose: () => void;
  onInvited: (info: { url: string; name: string }) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>(assignableRoles[0] ?? "EMPLOYEE");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        role,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not create the user. Check the details and try again.");
      return;
    }
    const body = await res.json();
    onInvited({ url: body.inviteUrl, name: name.trim() });
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
          <h2
            className="text-base font-semibold"
            style={{ fontFamily: FONTS.display, color: COLORS.text }}
          >
            Invite team member
          </h2>
          <button type="button" aria-label="Close" onClick={onClose} style={{ color: COLORS.textMute }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 flex flex-col gap-3">
          <Field label="Full name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jordan Fielding"
              className="w-full rounded-md px-3 py-2 text-sm outline-none"
              style={fieldStyle}
              autoFocus
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@elecplan.com.au"
              className="w-full rounded-md px-3 py-2 text-sm outline-none"
              style={fieldStyle}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone (optional)">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+61 …"
                className="w-full rounded-md px-3 py-2 text-sm outline-none"
                style={fieldStyle}
              />
            </Field>
            <Field label="Role">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full rounded-md px-3 py-2 text-sm outline-none"
                style={fieldStyle}
              >
                {assignableRoles.map((r) => (
                  <option key={r} value={r} style={{ background: COLORS.cardAlt }}>
                    {ROLE_TITLE[r]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {error && (
            <p className="text-xs" style={{ color: COLORS.coral }}>
              {error}
            </p>
          )}

          <p className="text-xs" style={{ color: COLORS.textFaint }}>
            Creates the account and generates a one-time link for them to set
            their own password. You&apos;ll get the link to send them.
          </p>

          <div className="flex justify-end gap-2 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium"
              style={{ background: COLORS.cardAlt, color: COLORS.textMute }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60"
              style={{ background: COLORS.accent, color: ON_ACCENT }}
            >
              {saving ? "Creating…" : "Create & get link"}
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
      <span className="text-xs font-medium" style={{ color: COLORS.textMute }}>
        {label}
      </span>
      {children}
    </label>
  );
}
