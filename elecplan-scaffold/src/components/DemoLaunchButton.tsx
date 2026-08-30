"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowRight } from "lucide-react";

export default function DemoLaunchButton({ label = "Open live demo" }: { label?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function launch() {
    setLoading(true);
    setError(false);
    const result = await signIn("credentials", {
      email: "demo@your-plan.com.au",
      password: "YourPlanDemo2026!",
      redirect: false,
    });
    setLoading(false);
    if (!result || result.error) {
      setError(true);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={launch}
        disabled={loading}
        className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#168dff] px-6 text-sm font-semibold text-white shadow-[0_12px_35px_rgba(22,141,255,.28)] transition hover:bg-[#2998ff] disabled:opacity-60"
      >
        {loading ? "Opening demo…" : label} <ArrowRight size={15} />
      </button>
      {error ? <p className="mt-2 text-center text-[11px] text-rose-300">Demo sign-in is temporarily unavailable.</p> : null}
    </div>
  );
}
