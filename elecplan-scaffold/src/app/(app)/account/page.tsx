import { requireUser } from "@/lib/session";
import TopBar from "@/components/TopBar";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import { COLORS, FONTS } from "@/lib/theme";
import { ROLE_TITLE } from "@/lib/nav";

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <>
      <TopBar title="Account" subtitle={user.email ?? undefined} />

      <div className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-md flex flex-col gap-6">
          <section
            className="rounded-lg p-5"
            style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
          >
            <h2
              className="text-sm font-semibold mb-3"
              style={{ fontFamily: FONTS.display, color: COLORS.text }}
            >
              Profile
            </h2>
            <dl className="flex flex-col gap-2 text-sm">
              <Row label="Name" value={user.name ?? "—"} />
              <Row label="Email" value={user.email ?? "—"} />
              <Row label="Role" value={ROLE_TITLE[user.role]} />
            </dl>
          </section>

          <ChangePasswordForm />
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt style={{ color: COLORS.textMute }}>{label}</dt>
      <dd className="font-medium truncate" style={{ color: COLORS.text }}>
        {value}
      </dd>
    </div>
  );
}
