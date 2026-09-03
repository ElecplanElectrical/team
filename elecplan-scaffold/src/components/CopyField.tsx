"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

const UI = { panelAlt: "var(--brand-panel-alt, #09213a)", border: "var(--brand-border, rgba(77,150,221,.24))", text: "#f5f9ff", blue: "var(--brand-primary, #168dff)", cyan: "var(--brand-accent, #25c7ff)", green: "#18d3a0" };

export default function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard API can be blocked in some contexts; the field remains selectable.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return <div className="flex items-stretch gap-2 rounded-xl p-2" style={{ background: UI.panelAlt, border: `1px solid ${UI.border}` }}>
    <input readOnly value={value} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 bg-transparent px-2 text-xs outline-none" style={{ color: UI.text, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }} />
    <button type="button" onClick={copy} className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: copied ? "rgba(25,211,162,.10)" : "rgb(var(--brand-primary-rgb, 22 141 255) / .12)", color: copied ? UI.green : UI.cyan, border: `1px solid ${copied ? "rgba(25,211,162,.22)" : "rgb(var(--brand-accent-rgb, 37 199 255) / .22)"}` }}>{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? "Copied" : "Copy"}</button>
  </div>;
}
