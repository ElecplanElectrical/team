import { LockedExactHome } from "@/components/locked-exact-home";
import { LockedMobileHome } from "@/components/locked-mobile-home";

export default function RootPage() {
  return (
    <>
      <div className="hidden md:block"><LockedExactHome /></div>
      <div className="md:hidden"><LockedMobileHome /></div>
    </>
  );
}
