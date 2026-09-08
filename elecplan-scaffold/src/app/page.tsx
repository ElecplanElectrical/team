import { LockedExactHome } from "@/components/locked-exact-home";
import { LockedMobileHome } from "@/components/locked-mobile-home";
import { StandaloneLoginRedirect } from "@/components/standalone-login-redirect";

export default function RootPage() {
  return (
    <>
      <StandaloneLoginRedirect />
      <div className="hidden md:block"><LockedExactHome /></div>
      <div className="md:hidden"><LockedMobileHome /></div>
    </>
  );
}
