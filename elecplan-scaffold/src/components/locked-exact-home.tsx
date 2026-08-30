import Link from "next/link";

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
          src="/api/approved-home"
          alt="YourPlan"
          width={1448}
          height={1086}
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
