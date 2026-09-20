import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import SetPasswordForm from "@/components/SetPasswordForm";

import { PORTAL_UI as UI } from "@/lib/carbon-theme";

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main
      className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6"
      style={{
        background: "var(--ep-main)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(rgba(197,205,215,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(197,205,215,.05) 1px, transparent 1px)", backgroundSize: "42px 42px" }} />
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        {token ? (
          <SetPasswordForm token={token} />
        ) : (
          <section className="w-full max-w-md rounded-2xl p-6 text-center shadow-[0_28px_90px_rgba(0,0,0,.35)] sm:p-8" style={{ ...UI.raised, background: UI.panel, border: `1px solid ${UI.border}` }}>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "rgba(255,94,114,.08)", border: "1px solid rgba(255,94,114,.22)", color: UI.red }}><AlertTriangle size={20} /></div>
            <h1 className="mt-4 text-xl font-semibold" style={{ color: UI.text }}>This reset link is incomplete</h1>
            <p className="mt-2 text-sm leading-6" style={{ color: UI.mute }}>Ask your Elecplan admin to issue a new secure invite or password-reset link.</p>
            <Link href="/login" className="mt-6 inline-flex rounded-lg px-4 py-2.5 text-sm font-semibold" style={{ ...UI.primary, color: UI.activeText }}>Back to sign in</Link>
          </section>
        )}
      </div>
    </main>
  );
}
