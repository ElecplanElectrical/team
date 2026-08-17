"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Star } from "lucide-react";
import TopBar from "@/components/TopBar";
import { COLORS, ON_ACCENT } from "@/lib/theme";

type ReviewRow = {
  id: string;
  client: string;
  rating: number;
  text: string | null;
  source: string | null;
  createdAt: string;
};

type ClientOption = { id: string; name: string };

export default function ReviewsView({ reviews, clients }: { reviews: ReviewRow[]; clients: ClientOption[] }) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;
  const fiveStar = reviews.filter((review) => review.rating === 5).length;

  async function createReview(formData: FormData) {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: formData.get("clientId"),
        rating: Number(formData.get("rating")),
        text: formData.get("text"),
        source: formData.get("source"),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not save review.");
      return;
    }
    setShowNew(false);
    router.refresh();
  }

  return (
    <>
      <TopBar
        title="Reviews"
        subtitle={`${average.toFixed(1)} average · ${reviews.length} total`}
        rightSlot={<button type="button" onClick={() => setShowNew(true)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-semibold" style={{ background: COLORS.accent, color: ON_ACCENT }}><Plus size={15} /> Add review</button>}
      />
      <div className="flex-1 overflow-auto p-4 md:p-8 flex flex-col gap-4">
        {error && <div className="rounded-md px-4 py-3 text-sm" style={{ background: COLORS.card, border: `1px solid ${COLORS.coral}`, color: COLORS.coral }}>{error}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Metric label="Average rating" value={reviews.length ? `${average.toFixed(1)} / 5` : "—"} />
          <Metric label="5-star reviews" value={String(fiveStar)} />
          <Metric label="Total reviews" value={String(reviews.length)} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-lg p-4" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold" style={{ color: COLORS.text }}>{review.client}</div>
                <div className="flex items-center gap-1" aria-label={`${review.rating} stars`}>
                  {Array.from({ length: 5 }, (_, index) => <Star key={index} size={14} fill={index < review.rating ? "currentColor" : "none"} style={{ color: index < review.rating ? COLORS.accent : COLORS.textFaint }} />)}
                </div>
              </div>
              {review.text && <p className="text-sm mt-3 leading-6" style={{ color: COLORS.textMute }}>{review.text}</p>}
              <div className="text-xs mt-3" style={{ color: COLORS.textFaint }}>{review.source || "Direct"} · {new Date(review.createdAt).toLocaleDateString("en-AU")}</div>
            </div>
          ))}
          {reviews.length === 0 && <div className="rounded-lg p-8 text-center text-sm lg:col-span-2" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.textFaint }}>No reviews recorded yet.</div>}
        </div>
      </div>

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,.62)" }} onMouseDown={() => setShowNew(false)}>
          <form action={createReview} onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-lg rounded-xl p-5 flex flex-col gap-4" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
            <div><div className="text-lg font-semibold" style={{ color: COLORS.text }}>Add review</div><div className="text-xs mt-1" style={{ color: COLORS.textFaint }}>Record a client review already received by Elecplan.</div></div>
            <label className="text-xs" style={{ color: COLORS.textMute }}>Client<select name="clientId" required className="mt-1 w-full rounded-md px-3 py-2" style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, color: COLORS.text }}><option value="">Select client</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
            <label className="text-xs" style={{ color: COLORS.textMute }}>Rating<select name="rating" defaultValue="5" className="mt-1 w-full rounded-md px-3 py-2" style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, color: COLORS.text }}>{[5,4,3,2,1].map((rating) => <option key={rating} value={rating}>{rating} star{rating === 1 ? "" : "s"}</option>)}</select></label>
            <label className="text-xs" style={{ color: COLORS.textMute }}>Source<input name="source" placeholder="Google, Facebook, direct..." className="mt-1 w-full rounded-md px-3 py-2" style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, color: COLORS.text }} /></label>
            <label className="text-xs" style={{ color: COLORS.textMute }}>Review<textarea name="text" rows={4} className="mt-1 w-full rounded-md px-3 py-2 resize-none" style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, color: COLORS.text }} /></label>
            <div className="flex justify-end gap-2"><button type="button" onClick={() => setShowNew(false)} className="px-3 py-2 text-sm" style={{ color: COLORS.textMute }}>Cancel</button><button disabled={saving} className="px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-60" style={{ background: COLORS.accent, color: ON_ACCENT }}>{saving ? "Saving..." : "Save review"}</button></div>
          </form>
        </div>
      )}
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg p-4" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}><div className="text-xs" style={{ color: COLORS.textFaint }}>{label}</div><div className="text-xl font-semibold mt-1" style={{ color: COLORS.text }}>{value}</div></div>;
}
