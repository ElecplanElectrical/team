import type { CSSProperties } from "react";

type YourPlanLogoProps = {
  width?: number;
  className?: string;
  style?: CSSProperties;
  decorative?: boolean;
};

/**
 * The locked, approved YourPlan wordmark.
 *
 * The source artwork is the approved homepage master already shipped with the
 * product. Keeping the crop here gives every auth and portal surface the exact
 * same mark without relying on the corrupted legacy transparent file.
 */
export default function YourPlanLogo({
  width = 188,
  className,
  style,
  decorative = false,
}: YourPlanLogoProps) {
  const scale = width / 188;
  return (
    <span
      {...(decorative
        ? { "aria-hidden": true }
        : { "aria-label": "YourPlan", role: "img" })}
      className={`block shrink-0 ${className ?? ""}`}
      style={{
        width,
        height: 43 * scale,
        backgroundImage: "url('/api/approved-home')",
        backgroundRepeat: "no-repeat",
        backgroundSize: `${1448 * scale}px ${1086 * scale}px`,
        backgroundPosition: `${-38 * scale}px ${-20 * scale}px`,
        ...style,
      }}
    />
  );
}
