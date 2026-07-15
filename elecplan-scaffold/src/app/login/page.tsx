import LoginForm from "@/components/LoginForm";
import { COLORS } from "@/lib/theme";

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
    <div
      className="min-h-screen w-full flex items-center justify-center p-4"
      style={{ background: COLORS.bg }}
    >
      <LoginForm callbackUrl={callbackUrl || "/"} demoLogins={demoLogins} />
    </div>
  );
}
