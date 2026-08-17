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
      className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6"
      style={{
        background:
          "radial-gradient(circle at 20% 10%, rgba(22,141,255,.20), transparent 30%), radial-gradient(circle at 85% 85%, rgba(37,199,255,.10), transparent 26%), #03101f",
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(rgba(77,150,221,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(77,150,221,.05) 1px, transparent 1px)", backgroundSize: "42px 42px" }} />
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
        <LoginForm callbackUrl={callbackUrl || "/"} demoLogins={demoLogins} />
      </div>
    </main>
  );
}
