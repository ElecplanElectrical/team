import Link from "next/link";
import lockedHome0 from "@/lib/locked-home-0";
import lockedHomeGap from "@/lib/locked-home-gap";
import lockedHome1 from "@/lib/locked-home-1";
import lockedHome2 from "@/lib/locked-home-2";
import lockedHome3 from "@/lib/locked-home-3";
import lockedHome4 from "@/lib/locked-home-4";
import lockedHome5 from "@/lib/locked-home-5";
import lockedHome6 from "@/lib/locked-home-6";
import lockedHome7 from "@/lib/locked-home-7";
import lockedHome8 from "@/lib/locked-home-8";
import lockedHome9 from "@/lib/locked-home-9";

const approvedHome = [
  lockedHome0,
  lockedHomeGap,
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

const hotspots = [
  ["/", "Home", 2.4, 1.2, 12.5, 5.0],
  ["/features", "Features", 28.1, 1.4, 7.2, 4.5],
  ["/industries", "Industries", 35.7, 1.4, 7.7, 4.5],
  ["/pricing", "Pricing", 43.5, 1.4, 5.6, 4.5],
  ["/about", "About", 49.0, 1.4, 5.3, 4.5],
  ["/resources", "Resources", 54.5, 1.4, 7.8, 4.5],
  ["/contact", "Contact", 62.3, 1.4, 6.5, 4.5],
  ["/login", "Login", 81.7, 1.0, 6.0, 5.0],
  ["/contact", "Book a Demo", 88.0, 1.0, 9.2, 5.0],
  ["/contact", "Book a Demo", 4.0, 39.0, 13.6, 5.0],
  ["/features", "See Features", 18.0, 39.0, 10.8, 5.0],
  ["/pricing", "Pricing", 2.4, 61.0, 43.5, 14.5],
  ["/industries", "Industries", 47.0, 61.0, 50.5, 14.5],
  ["/features", "Footer Features", 28.0, 79.0, 9.0, 9.0],
  ["/about", "Footer About", 40.0, 79.0, 9.0, 9.0],
  ["/resources", "Footer Resources", 51.5, 79.0, 10.0, 9.0],
  ["/contact", "Footer Book a Demo", 68.5, 82.0, 14.0, 6.0],
] as const;

export function LockedExactHome() {
  return (
    <main className="min-h-screen bg-[#03070b]">
      <div className="relative mx-auto w-full max-w-[1448px]">
        <img
          src={`data:image/webp;base64,${approvedHome}`}
          alt="YourPlan"
          className="block h-auto w-full select-none"
          draggable={false}
        />
        {hotspots.map(([href, label, left, top, width, height], index) => (
          <Link
            key={`${label}-${index}`}
            href={href}
            aria-label={label}
            className="absolute z-10 block"
            style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}
          />
        ))}
      </div>
    </main>
  );
}
