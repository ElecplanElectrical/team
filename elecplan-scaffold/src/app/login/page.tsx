import LoginForm from "@/components/LoginForm";

function safeCallback(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const url = new URL(value, "https://your-plan.com.au");
    return url.origin === "https://your-plan.com.au" ? `${url.pathname}${url.search}${url.hash}` : "/";
  } catch {
    return "/";
  }
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const { callbackUrl } = await searchParams;
  return <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6" style={{background:"radial-gradient(circle at 20% 10%, rgba(22,141,255,.20), transparent 30%), radial-gradient(circle at 85% 85%, rgba(37,199,255,.10), transparent 26%), #03101f"}}><div className="pointer-events-none absolute inset-0 opacity-30" style={{backgroundImage:"linear-gradient(rgba(77,150,221,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(77,150,221,.05) 1px, transparent 1px)",backgroundSize:"42px 42px"}}/><div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center"><LoginForm callbackUrl={safeCallback(callbackUrl)}/></div></main>;
}
