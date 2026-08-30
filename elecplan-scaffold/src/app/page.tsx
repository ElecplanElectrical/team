import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { firstAccessibleModulePath } from "@/lib/access";
import { HomePage } from "@/components/yourplan-public";
import lockedHome0 from "@/lib/locked-home-0";
import lockedHome1 from "@/lib/locked-home-1";
import lockedHome2 from "@/lib/locked-home-2";
import lockedHome3 from "@/lib/locked-home-3";
import lockedHome4 from "@/lib/locked-home-4";
import lockedHome5 from "@/lib/locked-home-5";
import lockedHome6 from "@/lib/locked-home-6";
import lockedHome7 from "@/lib/locked-home-7";
import lockedHome8 from "@/lib/locked-home-8";
import lockedHome9 from "@/lib/locked-home-9";

const lockedHome = [
  lockedHome0,
  lockedHome1,
  lockedHome2,
  lockedHome3,
  lockedHome4,
  lockedHome5,
  lockedHome6,
  lockedHome7,
  lockedHome8,
  lockedHome9,
].join("");

export default async function RootPage() {
  const user = await getSessionUser();
  if (user) {
    if (!user.businessId && user.role === "ADMIN") redirect("/hq");
    if (user.business) redirect(firstAccessibleModulePath(user.role, user.business.modules));
    redirect("/account");
  }

  return (
    <>
      <div className="hidden min-h-screen bg-[#05080c] lg:block">
        <div className="relative mx-auto w-full max-w-[1448px]">
          <img
            src={`data:image/webp;base64,${lockedHome}`}
            alt="YourPlan homepage"
            className="block h-auto w-full select-none"
            draggable={false}
          />

          <Link aria-label="YourPlan home" href="/" className="absolute left-[2.5%] top-[1.4%] h-[5%] w-[12%]" />
          <Link aria-label="Features" href="/features" className="absolute left-[28.4%] top-[2.4%] h-[4%] w-[6.7%]" />
          <Link aria-label="Industries" href="/industries" className="absolute left-[35.8%] top-[2.4%] h-[4%] w-[7.1%]" />
          <Link aria-label="Pricing" href="/pricing" className="absolute left-[43.2%] top-[2.4%] h-[4%] w-[5.1%]" />
          <Link aria-label="About" href="/about" className="absolute left-[48.5%] top-[2.4%] h-[4%] w-[4.8%]" />
          <Link aria-label="Resources" href="/resources" className="absolute left-[53.9%] top-[2.4%] h-[4%] w-[7.1%]" />
          <Link aria-label="Contact" href="/contact" className="absolute left-[61.4%] top-[2.4%] h-[4%] w-[5.6%]" />
          <Link aria-label="Login" href="/login" className="absolute left-[81.6%] top-[2.1%] h-[4.7%] w-[5.7%]" />
          <Link aria-label="Book a Demo" href="/contact" className="absolute left-[88.2%] top-[2.1%] h-[4.7%] w-[8.4%]" />
          <Link aria-label="Book a Demo" href="/contact" className="absolute left-[4.2%] top-[39%] h-[4.5%] w-[12.8%]" />
          <Link aria-label="See Features" href="/features" className="absolute left-[18%] top-[39%] h-[4.5%] w-[10.2%]" />
          <Link aria-label="Footer Features" href="/features" className="absolute left-[28.5%] top-[82%] h-[8%] w-[8%]" />
          <Link aria-label="Footer About" href="/about" className="absolute left-[40%] top-[82%] h-[8%] w-[8%]" />
          <Link aria-label="Footer Resources" href="/resources" className="absolute left-[51.5%] top-[82%] h-[8%] w-[9%]" />
          <Link aria-label="Book a Demo" href="/contact" className="absolute left-[68.8%] top-[83%] h-[4.6%] w-[12.5%]" />
        </div>
      </div>
      <div className="lg:hidden"><HomePage /></div>
    </>
  );
}
