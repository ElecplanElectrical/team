"use client";

import { X } from "lucide-react";
import { COLORS, FONTS, ON_ACCENT } from "@/lib/theme";
import CopyField from "@/components/CopyField";

/**
 * Shows a generated one-time link (invite or reset) for the admin to copy and
 * send to the crew member however they like — SMS, WhatsApp, in person. The
 * link is shown once; there's no email delivery.
 */
export default function LinkResultModal({
  title,
  blurb,
  url,
  onClose,
}: {
  title: string;
  blurb: string;
  url: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg overflow-hidden"
        style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}
        >
          <h2
            className="text-base font-semibold"
            style={{ fontFamily: FONTS.display, color: COLORS.text }}
          >
            {title}
          </h2>
          <button type="button" aria-label="Close" onClick={onClose} style={{ color: COLORS.textMute }}>
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-3">
          <p className="text-sm" style={{ color: COLORS.textMute }}>
            {blurb}
          </p>
          <CopyField value={url} />
          <p className="text-xs" style={{ color: COLORS.textFaint }}>
            This link works once and expires. It won&apos;t be shown again — copy
            it now.
          </p>
          <div className="flex justify-end mt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-semibold"
              style={{ background: COLORS.accent, color: ON_ACCENT }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
