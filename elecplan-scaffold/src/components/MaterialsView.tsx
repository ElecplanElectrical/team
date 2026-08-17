"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, PackageSearch, Plus, Search, X } from "lucide-react";
import TopBar from "@/components/TopBar";

export type StockRow = { id: string; name: string; unit: string; onHand: number; parLevel: number; supplier: string | null };

const UI = { panel: "#07192b", panelAlt: "#09213a", border: "rgba(77,150,221,.24)", borderSoft: "rgba(77,150,221,.12)", text: "#f5f9ff", mute: "#93a9c2", faint: "#617993", blue: "#168dff", cyan: "#25c7ff", green: "#18d3a0", red: "#ff5e72", orange: "#ff9f1c" };

export default function MaterialsView({ items }: { items: StockRow[] }) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const lowStock = items.filter((item) => item.onHand < item.parLevel).length;
  const filtered = useMemo(() => { const needle = query.trim().toLowerCase(); return needle ? items.filter((item) => [item.name, item.unit, item.supplier ?? ""].join(" ").toLowerCase().includes(needle)) : items; }, [items, query]);

  async function update(item: StockRow, delta: number) {
    const next = Math.max(0, item.onHand + delta);
    setBusy(item.id); setError(null);
    const res = await fetch(`/api/materials/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ onHand: next }) });
    setBusy(null);
    if (!res.ok) { const body = await res.json().catch(() => null); setError(body?.error ?? "Could not update stock."); return; }
    router.refresh();
  }

  return <>
    <TopBar title="Materials" subtitle="Track stock levels and reorder needs" rightSlot={<button type="button" onClick={() => setShowNew(true)} className="flex h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold" style={{ background: UI.blue, color: "white" }}><Plus size={16} /> New stock item</button>} />
    <div className="flex-1 overflow-auto p-3 md:p-4 xl:p-5" style={{ background: "radial-gradient(circle at 55% 0%,rgba(20,91,160,.12),transparent 35%),#03101f" }}><div className="mx-auto w-full max-w-[1700px] space-y-3">
      <div className="grid gap-3 sm:grid-cols-3"><Metric label="Stock items" value={String(items.length)} /><Metric label="Below par" value={String(lowStock)} accent={lowStock ? UI.red : undefined} /><Metric label="At / above par" value={String(items.length - lowStock)} /></div>
      {error && <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(255,94,114,.08)", border: "1px solid rgba(255,94,114,.28)", color: UI.red }}>{error}</div>}
      <section className="overflow-hidden rounded-xl" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}><div className="border-b p-3" style={{ borderColor: UI.borderSoft }}><div className="relative max-w-md"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: UI.faint }} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search materials…" className="h-10 w-full rounded-lg pl-9 pr-3 text-sm outline-none" style={{ background: "#041323", color: UI.text, border: `1px solid ${UI.border}` }} /></div></div><div className="hidden grid-cols-[minmax(220px,1.4fr)_100px_110px_minmax(150px,1fr)_150px] gap-4 border-b px-4 py-3 text-[10px] font-semibold uppercase tracking-[.10em] md:grid" style={{ borderColor: UI.borderSoft, color: UI.faint }}><span>Material</span><span>Unit</span><span>On hand</span><span>Par level</span><span>Adjust</span></div>{filtered.map((item) => { const low = item.onHand < item.parLevel; return <div key={item.id} className="grid grid-cols-1 gap-3 border-b px-4 py-4 md:grid-cols-[minmax(220px,1.4fr)_100px_110px_minmax(150px,1fr)_150px] md:items-center md:gap-4" style={{ borderColor: UI.borderSoft }}><div className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: low ? "rgba(255,94,114,.08)" : "rgba(22,141,255,.11)", color: low ? UI.red : UI.cyan }}><PackageSearch size={16} /></span><div className="min-w-0"><div className="truncate text-sm font-semibold" style={{ color: UI.text }}>{item.name}</div><div className="mt-1 truncate text-[11px]" style={{ color: UI.faint }}>{item.supplier ?? "No supplier"}</div></div></div><span className="text-xs" style={{ color: UI.mute }}>{item.unit}</span><span className="text-sm font-semibold" style={{ color: low ? UI.red : UI.text }}>{item.onHand}</span><span className="text-xs" style={{ color: low ? UI.orange : UI.mute }}>Par {item.parLevel}{low ? " · reorder" : ""}</span><div className="flex gap-2"><button type="button" disabled={busy === item.id || item.onHand === 0} onClick={() => void update(item, -1)} className="flex h-9 w-9 items-center justify-center rounded-lg disabled:opacity-40" style={{ background: UI.panelAlt, border: `1px solid ${UI.borderSoft}`, color: UI.text }}><Minus size={15} /></button><button type="button" disabled={busy === item.id} onClick={() => void update(item, 1)} className="flex h-9 w-9 items-center justify-center rounded-lg disabled:opacity-40" style={{ background: UI.panelAlt, border: `1px solid ${UI.borderSoft}`, color: UI.text }}><Plus size={15} /></button></div></div>; })}{filtered.length === 0 && <div className="px-5 py-14 text-center text-sm" style={{ color: UI.faint }}>No materials match your search.</div>}<div className="px-4 py-3 text-[11px]" style={{ color: UI.faint }}>Showing {filtered.length} of {items.length} stock items</div></section>
    </div></div>
    {showNew && <NewStockItem onClose={() => setShowNew(false)} onDone={() => { setShowNew(false); router.refresh(); }} />}
  </>;
}

function NewStockItem({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState(""); const [unit, setUnit] = useState("each"); const [onHand, setOnHand] = useState("0"); const [parLevel, setParLevel] = useState("0"); const [supplier, setSupplier] = useState(""); const [saving, setSaving] = useState(false); const [error, setError] = useState<string | null>(null);
  const field = { background: "#041323", border: `1px solid ${UI.border}`, color: UI.text } as const;
  async function submit(e: React.FormEvent) { e.preventDefault(); setSaving(true); setError(null); const res = await fetch("/api/materials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, unit, onHand: Number(onHand), parLevel: Number(parLevel), supplier: supplier || null }) }); setSaving(false); if (!res.ok) { const body = await res.json().catch(() => null); setError(body?.error ?? "Could not create stock item."); return; } onDone(); }
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm md:items-center md:p-4" onClick={onClose}><div className="w-full max-w-lg rounded-t-2xl md:rounded-2xl" style={{ background: UI.panel, border: `1px solid ${UI.border}` }} onClick={(e) => e.stopPropagation()}><div className="flex justify-between border-b px-5 py-4" style={{ borderColor: UI.borderSoft }}><h2 className="font-semibold" style={{ color: UI.text }}>New stock item</h2><button type="button" onClick={onClose} style={{ color: UI.mute }}><X size={18} /></button></div><form onSubmit={submit} className="flex flex-col gap-3 p-5"><Field title="Name"><input required value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg px-3 py-2.5 text-sm" style={field} /></Field><div className="grid grid-cols-2 gap-3"><Field title="Unit"><input required value={unit} onChange={(e) => setUnit(e.target.value)} className="rounded-lg px-3 py-2.5 text-sm" style={field} /></Field><Field title="Supplier"><input value={supplier} onChange={(e) => setSupplier(e.target.value)} className="rounded-lg px-3 py-2.5 text-sm" style={field} /></Field></div><div className="grid grid-cols-2 gap-3"><Field title="On hand"><input type="number" min="0" required value={onHand} onChange={(e) => setOnHand(e.target.value)} className="rounded-lg px-3 py-2.5 text-sm" style={field} /></Field><Field title="Par level"><input type="number" min="0" required value={parLevel} onChange={(e) => setParLevel(e.target.value)} className="rounded-lg px-3 py-2.5 text-sm" style={field} /></Field></div>{error && <p className="text-xs" style={{ color: UI.red }}>{error}</p>}<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm" style={{ background: UI.panelAlt, color: UI.mute }}>Cancel</button><button type="submit" disabled={saving} className="rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60" style={{ background: UI.blue, color: "white" }}>{saving ? "Saving…" : "Create item"}</button></div></form></div></div>;
}

function Field({ title, children }: { title: string; children: React.ReactNode }) { return <label className="flex flex-col gap-1.5"><span className="text-xs" style={{ color: UI.mute }}>{title}</span>{children}</label>; }
function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) { return <div className="rounded-xl p-4" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}><div className="text-[11px]" style={{ color: UI.faint }}>{label}</div><div className="mt-1 text-xl font-semibold" style={{ color: accent ?? UI.text }}>{value}</div></div>; }
