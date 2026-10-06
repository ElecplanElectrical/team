import Link from "next/link";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";
import { PORTAL_UI as UI } from "@/lib/carbon-theme";

export default function ForgotPasswordPage() {
  return (
    <main
      className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6"
      style={{ background: "var(--ep-main)" }}
    >
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <div className="w-full max-w-md">
          <ForgotPasswordForm />
          <div className="mt-4 text-center">
            <Link href="/login" className="text-sm" style={{ color: UI.cyan }}>
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
