/**
 * Elecplan design tokens — copied verbatim from the design mockups'
 * `COLORS` object (docs/design-reference/responsive-full-app.jsx).
 * Dark theme, cyan accent. Colours flow through inline styles the same
 * way the mockups do, so screens match the reference exactly.
 */
export const COLORS = {
  bg: "#0A0D12", sidebar: "#07090C", card: "#181E26", cardAlt: "#222A35", border: "#35404D", borderSoft: "#29323D", text: "#FFFFFF", textMute: "#B7C0CC", textFaint: "#7F8B9B", accent: "#43D2FF", accentDim: "rgba(61,197,240,0.14)", accentGlow: "rgba(61,197,240,0.35)", teal: "#3BE6B7", tealBg: "rgba(51,214,172,0.14)", amber: "#FFC34D", amberBg: "rgba(240,178,61,0.14)", coral: "#FF756B", coralBg: "rgba(255,110,100,0.14)",
} as const;
export const ON_ACCENT = "#06222C";
export const FONTS = { display: "'Sora', sans-serif", body: "'Inter', sans-serif", mono: "'IBM Plex Mono', monospace" } as const;
export const EVENT_COLOR: Record<string,{ bg:string;border:string;fg:string }> = {
  event:{bg:"rgba(167,139,250,0.24)",border:"#A78BFA",fg:"#EDE9FE"},
  job:{bg:"rgba(61,197,240,0.22)",border:COLORS.accent,fg:"#BFEBFA"},
  "job-history":{bg:"rgba(61,197,240,0.16)",border:COLORS.accent,fg:"#BFEBFA"},
  "job-scheduled":{bg:"rgba(67,210,255,0.24)",border:"#43D2FF",fg:"#D5F5FF"},
  "job-in-progress":{bg:"rgba(255,195,77,0.25)",border:"#FFC34D",fg:"#FFF0C2"},
  "job-complete":{bg:"rgba(59,230,183,0.25)",border:"#3BE6B7",fg:"#C9FFEF"},
  revisit:{bg:"rgba(255,159,28,0.24)",border:"#FF9F1C",fg:"#FFE0AD"},
  inspection:{bg:"rgba(168,85,247,0.26)",border:"#C084FC",fg:"#F3E8FF"},
  call:{bg:"rgba(34,211,238,0.24)",border:"#22D3EE",fg:"#CFFAFE"},
  admin:{bg:"rgba(251,113,133,0.25)",border:"#FB7185",fg:"#FFE4E6"},
  material:{bg:"rgba(249,115,22,0.25)",border:"#FB923C",fg:"#FFEDD5"},
  personal:{bg:"rgba(244,114,182,0.25)",border:"#F472B6",fg:"#FCE7F3"},
};
export const EVENT_TYPES=["event","job","call","admin","material","personal"] as const;
export type EventType=(typeof EVENT_TYPES)[number];
export const STATUS_STYLE:Record<string,{label:string;bg:string;fg:string}>={QUOTED:{label:"Quoted",bg:COLORS.amberBg,fg:COLORS.amber},SCHEDULED:{label:"Scheduled",bg:COLORS.accentDim,fg:COLORS.accent},IN_PROGRESS:{label:"In progress",bg:COLORS.amberBg,fg:COLORS.amber},COMPLETE:{label:"Complete",bg:COLORS.tealBg,fg:COLORS.teal},INVOICED:{label:"Invoiced",bg:COLORS.tealBg,fg:COLORS.teal}};
export const JOB_STAGES=["QUOTED","SCHEDULED","IN_PROGRESS","COMPLETE","INVOICED"] as const;
export const STAGE_LABELS:Record<string,string>={QUOTED:"Quoted",SCHEDULED:"Scheduled",IN_PROGRESS:"In progress",COMPLETE:"Complete",INVOICED:"Invoiced"};
