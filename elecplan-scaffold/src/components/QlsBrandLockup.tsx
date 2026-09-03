import Image from "next/image";

type QlsBrandLockupProps = {
  variant?: "mobile" | "drawer" | "sidebar";
  className?: string;
};

/**
 * The QLS tenant header lockup. Mobile and drawer views keep the approved
 * emblem + wordmark treatment; the desktop sidebar intentionally uses the
 * emblem on its own at a larger size for a cleaner navigation rail.
 */
export default function QlsBrandLockup({
  variant = "mobile",
  className = "",
}: QlsBrandLockupProps) {
  const isDrawer = variant === "drawer";
  const isSidebar = variant === "sidebar";

  return (
    <div
      className={`flex min-w-0 items-center ${
        isDrawer ? "gap-3" : isSidebar ? "justify-center" : "gap-2"
      } ${className}`}
      aria-label="Quality Landscape Solutions"
    >
      <Image
        src="/qls-logo-transparent.svg"
        alt=""
        aria-hidden="true"
        width={241}
        height={282}
        className={`shrink-0 object-contain ${
          isDrawer
            ? "h-[76px] w-[65px]"
            : isSidebar
              ? "h-14 w-12 xl:h-[98px] xl:w-[84px]"
              : "h-[47px] w-10"
        }`}
      />
      {!isSidebar ? (
        <div
          className="min-w-0"
          style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}
        >
          <div
            className={`whitespace-nowrap font-medium uppercase text-[#f3f6f3] ${
              isDrawer
                ? "text-[11px] tracking-[0.22em]"
                : "text-[8px] tracking-[0.13em]"
            }`}
          >
            Quality Landscape
          </div>
          <div
            className={`mt-1 flex items-center text-[var(--brand-accent,#82eca0)] ${
              isDrawer ? "gap-2" : "gap-1.5"
            }`}
          >
            <span className="h-px min-w-3 flex-1 bg-current" />
            <span
              className={`font-semibold uppercase ${
                isDrawer
                  ? "text-[11px] tracking-[0.42em]"
                  : "text-[8px] tracking-[0.26em]"
              }`}
            >
              Solutions
            </span>
            <span className="h-px min-w-3 flex-1 bg-current" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
