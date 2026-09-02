import type { CSSProperties } from "react";

type YourPlanMarkProps = {
  size?: number;
  className?: string;
  style?: CSSProperties;
};

export default function YourPlanMark({
  size = 72,
  className,
  style,
}: YourPlanMarkProps) {
  const scale = size / 83;
  return (
    <span
      aria-label="YourPlan"
      role="img"
      className={`block shrink-0 ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        backgroundImage: "url('/yourplan-powered-footer.webp')",
        backgroundRepeat: "no-repeat",
        backgroundSize: `${384 * scale}px ${136 * scale}px`,
        backgroundPosition: `${-28 * scale}px ${-33 * scale}px`,
        mixBlendMode: "screen",
        ...style,
      }}
    />
  );
}
