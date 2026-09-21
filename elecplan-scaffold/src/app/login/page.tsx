import LoginForm from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  const demoLogins =
    process.env.NODE_ENV !== "production"
      ? [
          { role: "Admin", email: "luke@elecplan.com.au" },
          { role: "Lead", email: "reyne@elecplan.com.au" },
          { role: "Crew", email: "dean@elecplan.com.au" },
        ]
      : undefined;

  return (
    <main
      className="relative min-h-screen overflow-hidden px-4 py-7 sm:px-6 sm:py-10"
      style={{
        background: "radial-gradient(circle at 16% 12%,rgba(67,210,255,.10),transparent 24%),radial-gradient(circle at 87% 78%,rgba(67,210,255,.055),transparent 28%),linear-gradient(145deg,#070b10,#0c1219 52%,#080d12)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage: "linear-gradient(rgba(67,210,255,.035) 1px, transparent 1px),linear-gradient(90deg, rgba(67,210,255,.035) 1px, transparent 1px)",
          backgroundSize: "46px 46px",
          maskImage: "linear-gradient(to bottom,black,transparent 88%)",
        }}
      />
      <div className="pointer-events-none absolute left-[-180px] top-1/2 h-[520px] w-[520px] -translate-y-1/2 rounded-full border border-cyan-300/5" />
      <div className="pointer-events-none absolute right-[-240px] top-[-220px] h-[520px] w-[520px] rounded-full border border-cyan-300/5" />
      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-7xl items-center justify-center">
        <LoginForm callbackUrl={callbackUrl || "/"} demoLogins={demoLogins} />
      </div>
    </main>
  );
}
