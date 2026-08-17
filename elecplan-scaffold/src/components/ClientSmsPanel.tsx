"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, MessageSquareText, Phone, Send, X } from "lucide-react";

type Preview = {
  jobId: string;
  jobTitle: string;
  clientName: string;
  contactName: string | null;
  phoneNumber: string;
  address: string;
  scheduledStart: string;
  scheduledEnd: string | null;
  message: string;
  configured: boolean;
};

const UI = {
  bg: "#061525",
  panel: "#0a2038",
  border: "rgba(77,150,221,.25)",
  text: "#f5f9ff",
  mute: "#91a8c1",
  faint: "#607892",
  blue: "#168dff",
  cyan: "#25c7ff",
  green: "#19d3a2",
  red: "#ff5e72",
  orange: "#ff9f1c",
};

export default function ClientSmsPanel({
  jobId,
  open,
  onClose,
}: {
  jobId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open || !jobId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSent(false);
    setPreview(null);

    void fetch(`/api/jobs/${jobId}/confirmation`, { method: "GET" })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (cancelled) return;
        if (!response.ok) {
          setError(body?.error ?? "Could not prepare the client confirmation.");
          return;
        }
        setPreview(body as Preview);
      })
      .catch(() => {
        if (!cancelled) setError("Could not prepare the client confirmation.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [jobId, open]);

  if (!open || !jobId) return null;

  async function send() {
    if (!preview || sending || sent) return;
    setSending(true);
    setError(null);
    const response = await fetch(`/api/jobs/${jobId}/confirmation`, { method: "POST" });
    const body = await response.json().catch(() => null);
    setSending(false);
    if (!response.ok) {
      setError(body?.error ?? "Could not send the client confirmation.");
      return;
    }
    setSent(true);
  }

  const schedule = preview
    ? new Intl.DateTimeFormat("en-AU", {
        timeZone: "Australia/Melbourne",
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(preview.scheduledStart))
    : null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm md:items-center md:p-5"
      onClick={onClose}
    >
      <section
        className="w-full max-w-xl rounded-t-2xl p-5 shadow-2xl md:rounded-2xl"
        style={{ background: UI.bg, border: `1px solid ${UI.border}` }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "rgba(22,141,255,.14)", color: UI.cyan, border: "1px solid rgba(37,199,255,.22)" }}
          >
            <MessageSquareText size={21} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold" style={{ color: UI.text }}>Send SMS to client</h2>
            <p className="mt-1 text-xs leading-5" style={{ color: UI.mute }}>
              Review the booking confirmation, then press Send SMS. Nothing is sent automatically.
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1" style={{ color: UI.mute }} aria-label="Close SMS panel">
            <X size={18} />
          </button>
        </div>

        {loading && (
          <div className="mt-5 rounded-xl p-5 text-sm" style={{ background: UI.panel, color: UI.mute, border: `1px solid ${UI.border}` }}>
            Preparing client confirmation…
          </div>
        )}

        {preview && (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl p-4" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}>
              <div className="flex items-center gap-2">
                <Phone size={14} style={{ color: UI.cyan }} />
                <span className="text-[11px] font-semibold uppercase tracking-[.10em]" style={{ color: UI.faint }}>To</span>
              </div>
              <p className="mt-2 text-sm font-semibold" style={{ color: UI.text }}>{preview.clientName}</p>
              <p className="mt-1 text-xs" style={{ color: UI.mute }}>{preview.phoneNumber}</p>
              <p className="mt-2 text-[11px]" style={{ color: UI.faint }}>{preview.jobTitle} · {schedule}</p>
            </div>

            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[.10em]" style={{ color: UI.faint }}>Message preview</span>
              <textarea
                readOnly
                value={preview.message}
                rows={6}
                className="mt-2 w-full resize-none rounded-xl px-3 py-3 text-sm leading-6 outline-none"
                style={{ background: UI.panel, border: `1px solid ${UI.border}`, color: UI.text }}
              />
            </label>

            {!preview.configured && (
              <div className="rounded-lg p-3 text-xs leading-5" style={{ background: "rgba(255,159,28,.09)", border: "1px solid rgba(255,159,28,.24)", color: UI.orange }}>
                ClickSend is not configured in production yet. The button is ready, but live SMS will stay disabled until the server credentials are added.
              </div>
            )}

            {sent && (
              <div className="flex items-center gap-2 rounded-lg p-3 text-xs font-semibold" style={{ background: "rgba(25,211,162,.10)", border: "1px solid rgba(25,211,162,.26)", color: UI.green }}>
                <CheckCircle2 size={15} /> Confirmation accepted for sending to {preview.phoneNumber}.
              </div>
            )}

            {error && <p className="text-xs" style={{ color: UI.red }}>{error}</p>}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-semibold" style={{ color: UI.mute, border: `1px solid ${UI.border}` }}>
                Close
              </button>
              <button
                type="button"
                disabled={sending || sent || !preview.configured}
                onClick={() => void send()}
                className="flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
                style={{ background: UI.blue, color: "white", boxShadow: "0 10px 28px rgba(22,141,255,.24)" }}
              >
                <Send size={15} /> {sending ? "Sending…" : sent ? "Sent" : "Send SMS"}
              </button>
            </div>
          </div>
        )}

        {!preview && error && !loading && <p className="mt-5 text-sm" style={{ color: UI.red }}>{error}</p>}
      </section>
    </div>
  );
}
