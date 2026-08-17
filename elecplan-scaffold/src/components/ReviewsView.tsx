"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Plus, Search, Star, X } from "lucide-react";
import TopBar from "@/components/TopBar";

type ReviewRow = { id: string; client: string; rating: number; text: string | null; source: string | null; createdAt: string };
type ClientOption = { id: string; name: string };

const UI = { panel: "#07192b", panelAlt: "#09213a", border: "rgba(77,150,221,.24)", borderSoft: "rgba(77,150,221,.12)", text: "#f5f9ff", mute: "#93a9c2", faint: "#617993", blue: "#168dff", cyan: "#25c7ff", green: "#18d3a0", orange: "#ff9f1c", red: "#ff5e72" };

export default function ReviewsView({ reviews, clients }: { reviews: ReviewRow[]; clients: ClientOption[] }) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const fiveStar = reviews.filter((review) => review.rating === 5).length;
  const filtered = useMemo(() => { const needle = query.trim().toLowerCase(); return needle ? reviews.filter((review) => [review.client, review.text ?? "", review.source ?? ""].join(" ").toLowerCase().includes(needle)) : reviews; }, [reviews, query]);

  async function createReview(formData: FormData) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId: formData.get("clientId"), rating: Number(formData.get("rating")), text: formData.get("text"), source: formData.get("source") }) });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Could not save review.");
        return;
      }
      setShowNew(false);
      router.refresh();
    } catch {
      setError("Could not reach Elecplan. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  const field = { background: "#041323", border: `1px solid ${UI.border}`, color: UI.text } as const;
  return <>
    <TopBar title="Reviews" subtitle="Track client reputation and feedback" rightSlot={<button type="button" onClick={() => setShowNew(true)} className="flex h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold" style={{ background: UI.blue, color: "white" }}><Plus size={16} /> Add review</button>} />
    <div className="flex-1 overflow-auto p-3 md:p-4 xl:p-5" style={{ background: "radial-gradient(circle at 55% 0%,rgba(20,91,160,.12),transparent 35%),#03101f" }}><div className="mx-auto w-full max-w-[1700px] space-y-3">
      <div className="grid gap-3 sm:grid-cols-3"><Metric label="Average rating" value={reviews.length ? `${average.toFixed(1)} / 5` : "—"} /><Metric label="5-star reviews" value={String(fiveStar)} /><Metric label="Total reviews" value={String(reviews.length)} /></div>
      {error && !showNew && <div role="alert" className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(255,94,114,.08)", border: "1px solid rgba(255,94,114,.28)", color: UI.red }}><AlertTriangle size={15} />{error}</div>}
      <section className="rounded-xl" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}><div className="border-b p-3" style={{ borderColor: UI.borderSoft }}><div className="relative max-w-md"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: UI.faint }} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search reviews…" className="h-10 w-full rounded-lg pl-9 pr-3 text-sm outline-none" style={field} /></div></div><div className="grid gap-3 p-3 lg:grid-cols-2">{filtered.map((review) => <article key={review.id} className="rounded-xl p-4" style={{ background: UI.panelAlt, border: `1px solid ${UI.borderSoft}` }}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-sm font-semibold" style={{ color: UI.text }}>{review.client}</h3><p className="mt-1 text-[11px]" style={{ color: UI.faint }}>{review.source || "Direct"} · {new Date(review.createdAt).toLocaleDateString("en-AU")}</p></div><div className="flex items-center gap-1" aria-label={`${review.rating} stars`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={14} fill={index < review.rating ? "currentColor" : "none"} style={{ color: index < review.rating ? UI.orange : UI.faint }} />)}</div></div>{review.text && <p className="mt-4 text-sm leading-6" style={{ color: UI.mute }}>{review.text}</p>}</article>)}{filtered.length === 0 && <div className="rounded-xl p-10 text-center text-sm lg:col-span-2" style={{ background: UI.panelAlt, color: UI.faint }}>No reviews match your search.</div>}</div><div className="border-t px-4 py-3 text-[11px]" style={{ borderColor: UI.borderSoft, color: UI.faint }}>Showing {filtered.length} of {reviews.length} reviews</div></section>
    </div></div>
    {showNew && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm md:items-center md:p-4" onMouseDown={() => setShowNew(false)} role="presentation"><form action={createReview} onMouseDown={(event) => event.stopPropagation()} aria-busy={saving} className="w-full max-w-lg overflow-hidden rounded-t-2xl md:rounded-2xl" style={{ background: UI.panel, border: `1px solid ${UI.border}`, boxShadow: "0 28px 90px rgba(0,0,0,.35)" }} role="dialog" aria-modal="true" aria-labelledby="add-review-title"><div className="flex items-start justify-between border-b px-5 py-4" style={{ borderColor: UI.borderSoft }}><div><div id="add-review-title" className="text-lg font-semibold" style={{ color: UI.text }}>Add review</div><div className="mt-1 text-xs" style={{ color: UI.faint }}>Record a client review already received by Elecplan.</div></div><button type="button" aria-label="Close" onClick={() => setShowNew(false)} className="p-1" style={{ color: UI.mute }}><X size={18} /></button></div><div className="flex max-h-[82vh] flex-col gap-4 overflow-auto p-5"><label className="text-xs" style={{ color: UI.mute }}>Client<select name="clientId" required className="mt-1 w-full rounded-lg px-3 py-2.5 outline-none" style={field} autoFocus><option value="">Select client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label><label className="text-xs" style={{ color: UI.mute }}>Rating<select name="rating" defaultValue="5" className="mt-1 w-full rounded-lg px-3 py-2.5 outline-none" style={field}>{[5,4,3,2,1].map((rating) => <option key={rating} value={rating}>{rating} star{rating === 1 ? "" : "s"}</option>)}</select></label><label className="text-xs" style={{ color: UI.mute }}>Source<input name="source" placeholder="Google, Facebook, direct..." className="mt-1 w-full rounded-lg px-3 py-2.5 outline-none" style={field} /></label><label className="text-xs" style={{ color: UI.mute }}>Review<textarea name="text" rows={4} className="mt-1 w-full resize-none rounded-lg px-3 py-2.5 outline-none" style={field} /></label>{error && <div role="alert" className="flex gap-2 rounded-lg p-3 text-xs leading-5" style={{ background: "rgba(255,94,114,.08)", border: "1px solid rgba(255,94,114,.22)", color: UI.red }}><AlertTriangle size={14} className="mt-0.5 shrink-0" /><span>{error}</span></div>}<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setShowNew(false)} className="rounded-lg px-3 py-2.5 text-sm" style={{ background: UI.panelAlt, color: UI.mute, border: `1px solid ${UI.borderSoft}` }}>Cancel</button><button disabled={saving || clients.length === 0} className="rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ background: UI.blue, color: "white" }}>{saving ? "Saving..." : "Save review"}</button></div></div></form></div>}
  </>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl p-4" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}><div className="text-[11px]" style={{ color: UI.faint }}>{label}</div><div className="mt-1 text-xl font-semibold" style={{ color: UI.text }}>{value}</div></div>; }
