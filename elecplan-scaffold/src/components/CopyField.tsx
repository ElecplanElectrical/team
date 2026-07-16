"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { COLORS, FONTS } from "@/lib/theme";

/** Read-only value with a copy-to-clipboard button. Used for invite/reset links. */
export default function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard API can be blocked (insecure context) — fall back to select.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div
      className="flex items-stretch gap-2 rounded-md p-1.5"
      style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}` }}
    >
      <input
        readOnly
        value={value}
        onFocus={(e) => e.currentTarget.select()}
        className="flex-1 bg-transparent outline-none text-xs px-2"
        style={{ color: COLORS.text, fontFamily: FONTS.mono }}
      />
      <button
        type="button"
        onClick={copy}
        className="flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-semibold shrink-0"
        style={{
          background: copied ? COLORS.tealBg : COLORS.accentDim,
          color: copied ? COLORS.teal : COLORS.accent,
        }}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
