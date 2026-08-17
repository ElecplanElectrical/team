"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, X } from "lucide-react";
import TopBar from "@/components/TopBar";
import { COLORS, FONTS, ON_ACCENT } from "@/lib/theme";

export type StockRow = {
  id: string;
  name: string;
  unit: string;
  onHand: number;
  parLevel: number;
  supplier: string | null;
};

export default function MaterialsView({ items }: { items: StockRow[] }) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lowStock = items.filter((item) => item.onHand < item.parLevel).length;

  async function update(item: StockRow, delta: number) {
    const next = Math.max(0, item.onHand + delta);
    setBusy(item.id);
    setError(null);
    const res = await fetch(`/api/materials/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onHand: next }),
    });
    setBusy(null);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not update stock.");
      return;
    }
    router.refresh();
  }

  return <>
    <TopBar
      title="Materials"
      subtitle={`${items.length} stock items · ${lowStock} below par`}
      rightSlot={<button type="button" onClick={() => setShowNew(true)} className="flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-semibold" style={{ background: COLORS.accent, color: ON_ACCENT }}><Plus size={15} /> New stock item</button>}
    />
    <div className="flex-1 overflow-auto p-4 md:p-8 flex flex-col gap-4">
      {error && <div className="rounded-md px-4 py-3 text-sm" style={{ border: `1px solid ${COLORS.coral}`, color: COLORS.coral }}>{error}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Metric label="Stock items" value={items.length} />
        <Metric label="Below par" value={lowStock} />
        <Metric label="At / above par" value={items.length - lowStock} />
      </div>
      <div className="rounded-lg overflow-hidden" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
        {items.map((item, index) => {
          const low = item.onHand < item.parLevel;
          return <div key={item.id} className="grid grid-cols-1 md:grid-cols-[1.4fr_110px_110px_1fr_150px] gap-2 md:gap-3 items-center px-4 md:px-5 py-4" style={{ borderTop: index ? `1px solid ${COLORS.borderSoft}` : "none" }}>
            <div className="min-w-0"><div className="text-sm font-semibold truncate" style={{ color: COLORS.text }}>{item.name}</div><div className="text-xs truncate" style={{ color: COLORS.textFaint }}>{item.supplier ?? "No supplier"}</div></div>
            <span className="text-xs" style={{ color: COLORS.textMute }}>{item.unit}</span>
            <span className="text-sm font-semibold" style={{ fontFamily: FONTS.mono, color: low ? COLORS.coral : COLORS.text }}>{item.onHand}</span>
            <span className="text-xs" style={{ color: COLORS.textMute }}>Par {item.parLevel}{low ? " · reorder" : ""}</span>
            <div className="flex gap-2">
              <button type="button" disabled={busy === item.id || item.onHand === 0} onClick={() => update(item, -1)} className="w-9 h-9 rounded-md flex items-center justify-center disabled:opacity-40" style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, color: COLORS.text }}><Minus size={15} /></button>
              <button type="button" disabled={busy === item.id} onClick={() => update(item, 1)} className="w-9 h-9 rounded-md flex items-center justify-center disabled:opacity-40" style={{ background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, color: COLORS.text }}><Plus size={15} /></button>
            </div>
          </div>;
        })}
        {items.length === 0 && <div className="px-5 py-10 text-center text-sm" style={{ color: COLORS.textFaint }}>No stock items yet — add the first one.</div>}
      </div>
    </div>
    {showNew && <NewStockItem onClose={() => setShowNew(false)} onDone={() => { setShowNew(false); router.refresh(); }} />}
  </>;
}

function NewStockItem({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("each");
  const [onHand, setOnHand] = useState("0");
  const [parLevel, setParLevel] = useState("0");
  const [supplier, setSupplier] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const style = { background: COLORS.cardAlt, border: `1px solid ${COLORS.border}`, color: COLORS.text };

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(null);
    const res = await fetch("/api/materials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, unit, onHand: Number(onHand), parLevel: Number(parLevel), supplier: supplier || null }) });
    setSaving(false);
    if (!res.ok) { const body = await res.json().catch(() => null); return setError(body?.error ?? "Could not create stock item."); }
    onDone();
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
    <div className="w-full max-w-lg rounded-lg" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }} onClick={(e) => e.stopPropagation()}>
      <div className="flex justify-between px-5 py-4" style={{ borderBottom: `1px solid ${COLORS.borderSoft}` }}><h2 className="font-semibold" style={{ fontFamily: FONTS.display, color: COLORS.text }}>New stock item</h2><button type="button" onClick={onClose} style={{ color: COLORS.textMute }}><X size={18} /></button></div>
      <form onSubmit={submit} className="p-5 flex flex-col gap-3">
        <Field title="Name"><input required value={name} onChange={(e) => setName(e.target.value)} className="rounded-md px-3 py-2 text-sm" style={style} /></Field>
        <div className="grid grid-cols-2 gap-3"><Field title="Unit"><input required value={unit} onChange={(e) => setUnit(e.target.value)} className="rounded-md px-3 py-2 text-sm" style={style} /></Field><Field title="Supplier"><input value={supplier} onChange={(e) => setSupplier(e.target.value)} className="rounded-md px-3 py-2 text-sm" style={style} /></Field></div>
        <div className="grid grid-cols-2 gap-3"><Field title="On hand"><input type="number" min="0" required value={onHand} onChange={(e) => setOnHand(e.target.value)} className="rounded-md px-3 py-2 text-sm" style={style} /></Field><Field title="Par level"><input type="number" min="0" required value={parLevel} onChange={(e) => setParLevel(e.target.value)} className="rounded-md px-3 py-2 text-sm" style={style} /></Field></div>
        {error && <p className="text-xs" style={{ color: COLORS.coral }}>{error}</p>}
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm" style={{ background: COLORS.cardAlt, color: COLORS.textMute }}>Cancel</button><button type="submit" disabled={saving} className="rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-60" style={{ background: COLORS.accent, color: ON_ACCENT }}>{saving ? "Saving…" : "Create item"}</button></div>
      </form>
    </div>
  </div>;
}

function Field({ title, children }: { title: string; children: React.ReactNode }) { return <label className="flex flex-col gap-1.5"><span className="text-xs" style={{ color: COLORS.textMute }}>{title}</span>{children}</label>; }
function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-lg p-4" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}><div className="text-xs" style={{ color: COLORS.textFaint }}>{label}</div><div className="text-xl font-semibold mt-1" style={{ color: COLORS.text }}>{value}</div></div>; }
