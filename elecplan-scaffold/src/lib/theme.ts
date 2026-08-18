/**
 * Elecplan design tokens — copied verbatim from the design mockups'
 * `COLORS` object (docs/design-reference/responsive-full-app.jsx).
 * Dark theme, cyan accent. Colours flow through inline styles the same
 * way the mockups do, so screens match the reference exactly.
 */
export const COLORS = {
  bg: "#0A0D12",
  sidebar: "#07090C",
  card: "#14181F",
  cardAlt: "#191E26",
  border: "#242A33",
  borderSoft: "#1B2028",
  text: "#EDEFF2",
  textMute: "#8B94A0",
  textFaint: "#5B6472",
  accent: "#3DC5F0",
  accentDim: "rgba(61,197,240,0.14)",
  accentGlow: "rgba(61,197,240,0.35)",
  teal: "#33D6AC",
  tealBg: "rgba(51,214,172,0.14)",
  amber: "#F0B23D",
  amberBg: "rgba(240,178,61,0.14)",
  coral: "#FF6E64",
  coralBg: "rgba(255,110,100,0.14)",
} as const;

/** On-accent (dark) text used over cyan fills. */
export const ON_ACCENT = "#06222C";

export const FONTS = {
  display: "'Sora', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'IBM Plex Mono', monospace",
} as const;

/** Calendar item type -> calendar block colours. */
export const EVENT_COLOR: Record<
  string,
  { bg: string; border: string; fg: string }
> = {
  job: { bg: "rgba(61,197,240,0.22)", border: COLORS.accent, fg: "#BFEBFA" },
  inspection: { bg: "rgba(138,92,246,0.22)", border: "#9D7BFF", fg: "#E5DCFF" },
  call: { bg: "rgba(51,214,172,0.22)", border: COLORS.teal, fg: "#B9F5E4" },
  admin: { bg: "rgba(255,110,100,0.22)", border: COLORS.coral, fg: "#FFD3CF" },
  material: { bg: "rgba(240,178,61,0.22)", border: COLORS.amber, fg: "#FBE3B8" },
  personal: { bg: "rgba(236,72,153,0.22)", border: "#EC4899", fg: "#FFD1E8" },
};

export const EVENT_TYPES = ["job", "call", "admin", "material", "personal"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/** JobStatus -> pill styling. Mockup only styled 3; extended to all 5. */
export const STATUS_STYLE: Record<
  string,
  { label: string; bg: string; fg: string }
> = {
  QUOTED: { label: "Quoted", bg: COLORS.amberBg, fg: COLORS.amber },
  SCHEDULED: { label: "Scheduled", bg: COLORS.accentDim, fg: COLORS.accent },
  IN_PROGRESS: { label: "In progress", bg: COLORS.amberBg, fg: COLORS.amber },
  COMPLETE: { label: "Complete", bg: COLORS.tealBg, fg: COLORS.teal },
  INVOICED: { label: "Invoiced", bg: COLORS.tealBg, fg: COLORS.teal },
};

/** Ordered pipeline stages for the Job timelines stepper. */
export const JOB_STAGES = [
  "QUOTED",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETE",
  "INVOICED",
] as const;

export const STAGE_LABELS: Record<string, string> = {
  QUOTED: "Quoted",
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In progress",
  COMPLETE: "Complete",
  INVOICED: "Invoiced",
};
