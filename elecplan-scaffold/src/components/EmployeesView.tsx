"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, KeyRound, UserX, UserCheck } from "lucide-react";
import type { Role } from "@prisma/client";
import { COLORS, ON_ACCENT } from "@/lib/theme";
import { ROLE_TITLE } from "@/lib/nav";
import TopBar from "@/components/TopBar";
import InviteUserModal from "@/components/InviteUserModal";
import LinkResultModal from "@/components/LinkResultModal";

export type EmployeeRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  active: boolean;
  hasPassword: boolean;
  licenseNumber: string | null;
  licenseExpiry: string | null; // ISO or null
};

type StatusPill = { label: string; bg: string; fg: string };

function statusOf(row: EmployeeRow): StatusPill {
  if (!row.active) return { label: "Disabled", bg: COLORS.coralBg, fg: COLORS.coral };
  if (!row.hasPassword) return { label: "Invited", bg: COLORS.amberBg, fg: COLORS.amber };
  return { label: "Active", bg: COLORS.tealBg, fg: COLORS.teal };
}

export default function EmployeesView({
  rows,
  currentUserId,
  assignableRoles,
}: {
  rows: EmployeeRow[];
  currentUserId: string;
  assignableRoles: Role[];
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [linkResult, setLinkResult] = useState<{
    title: string;
    blurb: string;
    url: string;
  } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canInvite = assignableRoles.length > 0;
  const canManage = (row: EmployeeRow) => assignableRoles.includes(row.role);

  const query = q.trim().toLowerCase();
  const filtered = query
    ? rows.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.email.toLowerCase().includes(query),
      )
    : rows;

  async function issueReset(row: EmployeeRow) {
    setError(null);
    setBusyId(row.id);
    const res = await fetch(`/api/users/${row.id}/reset`, { method: "POST" });
    setBusyId(null);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not create a reset link.");
      return;
    }
    const { resetUrl } = await res.json();
    setLinkResult({
      title: `Reset link for ${row.name}`,
      blurb: `Send this to ${row.name} — it lets them set a new password.`,
      url: resetUrl,
    });
  }

  async function toggleActive(row: EmployeeRow) {
    setError(null);
    setBusyId(row.id);
    const res = await fetch(`/api/users/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !row.active }),
    });
    setBusyId(null);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not update this user.");
      return;
    }
    router.refresh();
  }

  const activeCount = rows.filter((r) => r.active).length;

  return (
    <>
      <TopBar
        title="Employees"
        subtitle={`${activeCount} active · ${rows.length} total`}
        rightSlot={
          canInvite ? (
            <button
              type="button"
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-semibold"
              style={{ background: COLORS.accent, color: ON_ACCENT }}
            >
              <Plus size={15} /> Invite
            </button>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-auto p-4 md:p-8">
        <div
          className="flex items-center gap-2 mb-4 px-3 py-2 rounded-md"
          style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
        >
          <Search size={15} style={{ color: COLORS.textFaint }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email"
            className="bg-transparent outline-none text-sm flex-1"
            style={{ color: COLORS.text }}
          />
        </div>

        {error && (
          <p className="text-xs mb-3" style={{ color: COLORS.coral }}>
            {error}
          </p>
        )}

        <div
          className="rounded-lg overflow-hidden"
          style={{ border: `1px solid ${COLORS.border}`, background: COLORS.card }}
        >
          <div
            className="hidden sm:flex items-center px-5 py-2.5"
            style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}
          >
            <span className="text-xs font-semibold flex-1" style={{ color: COLORS.textFaint }}>
              NAME
            </span>
            <span className="text-xs font-semibold w-36 shrink-0" style={{ color: COLORS.textFaint }}>
              ROLE
            </span>
            <span className="text-xs font-semibold w-24 shrink-0" style={{ color: COLORS.textFaint }}>
              STATUS
            </span>
            <span className="text-xs font-semibold w-44 shrink-0 text-right" style={{ color: COLORS.textFaint }}>
              ACTIONS
            </span>
          </div>

          {filtered.map((row, i) => {
            const status = statusOf(row);
            const manageable = canManage(row);
            const busy = busyId === row.id;
            return (
              <div
                key={row.id}
                className="flex items-center flex-wrap gap-y-2 px-4 sm:px-5 py-3 sm:py-3.5"
                style={{ borderTop: i === 0 ? "none" : `1px solid ${COLORS.borderSoft}` }}
              >
                <div className="flex-1 basis-full sm:basis-auto min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: COLORS.text }}>
                    {row.name}
                    {row.id === currentUserId && (
                      <span className="ml-2 text-xs font-normal" style={{ color: COLORS.textFaint }}>
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="text-xs truncate" style={{ color: COLORS.textMute }}>
                    {row.email}
                  </p>
                </div>

                <span
                  className="text-xs sm:w-36 shrink-0"
                  style={{ color: COLORS.textMute }}
                >
                  {ROLE_TITLE[row.role]}
                </span>

                <span className="sm:w-24 shrink-0">
                  <span
                    className="inline-block rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{ background: status.bg, color: status.fg }}
                  >
                    {status.label}
                  </span>
                </span>

                <div className="flex items-center gap-1.5 sm:w-44 shrink-0 sm:justify-end ml-auto">
                  {manageable ? (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => issueReset(row)}
                        className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium disabled:opacity-50"
                        style={{ background: COLORS.cardAlt, color: COLORS.text }}
                        title="Generate a set/reset password link"
                      >
                        <KeyRound size={13} />
                        {row.hasPassword ? "Reset" : "Invite link"}
                      </button>
                      {row.id !== currentUserId && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => toggleActive(row)}
                          className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium disabled:opacity-50"
                          style={{
                            background: row.active ? COLORS.coralBg : COLORS.tealBg,
                            color: row.active ? COLORS.coral : COLORS.teal,
                          }}
                          title={row.active ? "Deactivate" : "Reactivate"}
                        >
                          {row.active ? <UserX size={13} /> : <UserCheck size={13} />}
                          {row.active ? "Disable" : "Enable"}
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="text-xs" style={{ color: COLORS.textFaint }}>
                      —
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="px-5 py-8 text-center text-sm" style={{ color: COLORS.textFaint }}>
              {rows.length === 0 ? "No team members yet." : `No one matches "${q}"`}
            </div>
          )}
        </div>
      </div>

      {showInvite && (
        <InviteUserModal
          assignableRoles={assignableRoles}
          onClose={() => setShowInvite(false)}
          onInvited={({ url, name }) => {
            setShowInvite(false);
            router.refresh();
            setLinkResult({
              title: `Invite sent to create: ${name}`,
              blurb: `Account created. Send ${name} this link so they can set their password and sign in.`,
              url,
            });
          }}
        />
      )}

      {linkResult && (
        <LinkResultModal
          title={linkResult.title}
          blurb={linkResult.blurb}
          url={linkResult.url}
          onClose={() => setLinkResult(null)}
        />
      )}
    </>
  );
}
