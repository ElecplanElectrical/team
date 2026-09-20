/** Elecplan only. Recessed Carbon (#10) from the approved coded design gallery. */
export const CARBON = {
  shell: "linear-gradient(135deg,#272d34,#14181e)",
  tray: "linear-gradient(135deg,#181d23,#20272f)",
  active: "linear-gradient(110deg,#78e5ff 0%,#43D2FF 55%,#25b5e7 100%)",
  activeText: "#062531",
  raisedShadow: "8px 8px 20px rgba(0,0,0,.22),inset 0 1px 0 rgba(255,255,255,.055)",
  insetShadow: "inset 1px 1px 3px #0008,0 1px 0 #ffffff0d",
  activeShadow: "0 3px 10px #0008,inset 0 1px 0 #bcefff",
} as const;

/** Shared by every Elecplan view, modal and form. No other product imports this. */
export const PORTAL_UI = {
  bg: "#0d1117", deep: "#10151b", panel: CARBON.shell,
  panelAlt: CARBON.tray, alt: CARBON.tray,
  border: "rgba(255,255,255,.14)", borderSoft: "rgba(255,255,255,.08)",
  text: "#f4f7fa", mute: "#c5cdd7", faint: "#a5b0bd",
  blue: "#43D2FF", cyan: "#78e5ff", green: "#3BE6B7",
  orange: "#FFC34D", purple: "#C084FC", red: "#FF8192",
  activeText: CARBON.activeText,
  raised: { boxShadow: CARBON.raisedShadow },
  inset: { boxShadow: CARBON.insetShadow },
  primary: { background: CARBON.active, color: CARBON.activeText, boxShadow: CARBON.activeShadow },
} as const;
