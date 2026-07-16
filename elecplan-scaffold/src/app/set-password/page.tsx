import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import SetPasswordForm from "@/components/SetPasswordForm";
import { COLORS } from "@/lib/theme";

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4"
      style={{ background: COLORS.bg }}
    >
      {token ? (
        <SetPasswordForm token={token} />
      ) : (
        <div
          className="w-full max-w-sm rounded-lg p-7 text-center"
          style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
        >
          <div
            className="flex items-center justify-center gap-2 mb-2 text-sm font-semibold"
            style={{ color: COLORS.coral }}
          >
            <AlertTriangle size={16} /> Missing link token
          </div>
          <p className="text-sm mb-4" style={{ color: COLORS.textMute }}>
            This page needs a valid invite or reset link. Ask your admin to send
            you a new one.
          </p>
          <Link href="/login" className="text-sm font-semibold" style={{ color: COLORS.accent }}>
            Back to sign in
          </Link>
        </div>
      )}
    </div>
  );
}
