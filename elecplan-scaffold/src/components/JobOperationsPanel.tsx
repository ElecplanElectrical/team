"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckSquare, FileText, History, PackagePlus, Paperclip, Search, Trash2, X } from "lucide-react";

const U = {
  panel: "#181e27",
  alt: "#20272f",
  border: "rgba(197,205,215,.24)",
  text: "#f4f7fa",
  mute: "#c5cdd7",
  cyan: "#43D2FF",
  green: "#18d3a0",
  red: "#ff6673",
};

type Data = {
  tasks: { id: string; title: string; completed: boolean }[];
  materials: { id: string; name: string; quantity: string; unit: string | null; unitCost: string; unitSell: string }[];
  documents: { id: string; name: string; type: string; fileUrl: string; originalName: string | null }[];
  history: { id: string; title: string; address: string; status: string; createdAt: string }[];
  profitability: { revenue: number; materialCost: number; materialSell: number; labourHours: number; grossAfterMaterials: number };
};

type CatalogueItem = {
  id: string;
  name: string;
  unit: string;
  onHand: number;
  unitCost: number;
  supplier: string | null;
  sku: string | null;
  supplierSku: string | null;
  barcode: string | null;
};

export default function JobOperationsPanel({ jobId, canManage }: { jobId: string; canManage: boolean }) {
  const router = useRouter();
  const file = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<Data | null>(null);
  const [busy, setBusy] = useState(false);
  const [materialOpen, setMaterialOpen] = useState(false);

  async function load() {
    const response = await fetch(`/api/jobs/${jobId}/operations`, { cache: "no-store" });
    if (response.ok) setData(await response.json());
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [jobId]);

  async function post(body: object) {
    setBusy(true);
    const response = await fetch(`/api/jobs/${jobId}/operations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      alert(body?.error || "Could not save");
      return false;
    }
    await load();
    return true;
  }

  async function addTask() {
    const title = prompt("Checklist item");
    if (title) await post({ type: "TASK", title });
  }

  async function reminder() {
    const title = prompt("Reminder", "Follow up job");
    if (!title) return;
    const due = prompt("Due date (YYYY-MM-DD)", new Date().toISOString().slice(0, 10));
    if (!due) return;
    const dueDate = new Date(`${due}T09:00:00`).toISOString();
    await post({ type: "REMINDER", title, dueDate });
  }

  async function toggle(id: string, completed: boolean) {
    await fetch(`/api/jobs/${jobId}/operations`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: id, completed }),
    });
    await load();
  }

  async function remove(kind: "taskId" | "materialId", id: string) {
    if (!confirm("Remove this item?")) return;
    await fetch(`/api/jobs/${jobId}/operations?${kind}=${encodeURIComponent(id)}`, { method: "DELETE" });
    await load();
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const nextFile of Array.from(files)) {
        const ticketResponse = await fetch("/api/storage/upload-ticket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kind: "documents",
            fileName: nextFile.name,
            contentType: nextFile.type || "application/octet-stream",
            sizeBytes: nextFile.size,
          }),
        });
        const ticket = await ticketResponse.json();
        if (!ticketResponse.ok) throw new Error(ticket?.error || "Upload failed");

        const put = await fetch(ticket.uploadUrl, { method: "PUT", headers: ticket.uploadHeaders, body: nextFile });
        if (!put.ok) throw new Error("Upload failed");

        const save = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: nextFile.name, type: "JOB_ATTACHMENT", jobId, commitToken: ticket.commitToken }),
        });
        if (!save.ok) throw new Error("Could not attach file");
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
      if (file.current) file.current.value = "";
      await load();
    }
  }

  if (!data) {
    return <div className="mt-3 rounded-xl p-4 text-sm" style={{ background: U.panel, color: U.mute, border: `1px solid ${U.border}` }}>Loading job controls…</div>;
  }

  const money = (n: number) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(n);

  return <>
    <div className="mt-3 space-y-3">
      <Box title="Checklist" icon={<CheckSquare size={17} />} action={canManage ? <button onClick={addTask}>+ Add</button> : null}>
        {data.tasks.length ? data.tasks.map((task) => <div key={task.id} className="flex items-center gap-3 py-2">
          <input type="checkbox" checked={task.completed} onChange={(event) => toggle(task.id, event.target.checked)} className="h-5 w-5" />
          <span className="flex-1 text-sm" style={{ color: task.completed ? U.mute : U.text, textDecoration: task.completed ? "line-through" : "none" }}>{task.title}</span>
          {canManage && <button onClick={() => remove("taskId", task.id)} style={{ color: U.red }}><Trash2 size={15} /></button>}
        </div>) : <Empty text="No checklist items yet." />}
      </Box>

      <Box title="Materials used" icon={<PackagePlus size={17} />} action={<button onClick={() => setMaterialOpen(true)}>+ Add material</button>}>
        {data.materials.length ? data.materials.map((material) => <div key={material.id} className="flex items-center gap-2 border-b py-2 last:border-0" style={{ borderColor: U.border }}>
          <div className="flex-1">
            <p className="text-sm" style={{ color: U.text }}>{material.name}</p>
            <p className="text-xs" style={{ color: U.mute }}>{Number(material.quantity)} {material.unit || ""} · cost {money(Number(material.unitCost))} ea</p>
          </div>
          <button onClick={() => remove("materialId", material.id)} aria-label={`Remove ${material.name}`} style={{ color: U.red }}><Trash2 size={15} /></button>
        </div>) : <Empty text="No materials recorded." />}
        <p className="mt-2 text-[10px] leading-4" style={{ color: U.mute }}>Catalogue pricing is saved against the job when you add the material. Available stock is deducted immediately; any shortfall still remains recorded as a job cost.</p>
      </Box>

      {canManage && <Box title="Job profitability" icon={<FileText size={17} />}>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Stat l="Revenue / job value" v={money(data.profitability.revenue)} />
          <Stat l="Material cost" v={money(data.profitability.materialCost)} />
          <Stat l="Field labour tracked" v={`${data.profitability.labourHours} h`} />
          <Stat l="After materials" v={money(data.profitability.grossAfterMaterials)} good={data.profitability.grossAfterMaterials >= 0} />
        </div>
        <p className="mt-2 text-[10px]" style={{ color: U.mute }}>Labour hours are shown separately until an employee labour-cost rate is configured.</p>
      </Box>}

      <Box title="Attachments" icon={<Paperclip size={17} />} action={<button onClick={() => file.current?.click()}>+ Upload</button>}>
        <input ref={file} type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp,text/plain" className="hidden" onChange={(event) => upload(event.target.files)} />
        {data.documents.length ? data.documents.map((document) => <a key={document.id} href={document.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 py-2 text-sm" style={{ color: U.cyan }}>
          <FileText size={15} /><span className="truncate">{document.name}</span>
        </a>) : <Empty text="No files attached." />}
      </Box>

      {canManage && <Box title="Job reminders" icon={<Bell size={17} />} action={<button onClick={reminder}>+ Add reminder</button>}>
        <p className="text-xs" style={{ color: U.mute }}>Use reminders for certificates, invoicing, revisits or client follow-ups. They appear in Reminders and on the dashboard.</p>
      </Box>}

      <Box title="Client / property history" icon={<History size={17} />}>
        <div className="space-y-2">
          {data.history.length ? data.history.map((history) => <button key={history.id} onClick={() => router.push(`/jobs/${history.id}`)} className="w-full rounded-lg p-3 text-left" style={{ background: U.alt, border: `1px solid ${U.border}` }}>
            <p className="text-sm font-semibold" style={{ color: U.text }}>{history.title}</p>
            <p className="mt-1 text-xs" style={{ color: U.mute }}>{history.address} · {history.status.replaceAll("_", " ")}</p>
          </button>) : <Empty text="No previous jobs for this client or property." />}
        </div>
      </Box>

      <input type="hidden" disabled={busy} />
    </div>

    {materialOpen && <MaterialPicker
      jobId={jobId}
      onClose={() => setMaterialOpen(false)}
      onAdded={async () => {
        setMaterialOpen(false);
        await load();
      }}
    />}
  </>;
}

function MaterialPicker({ jobId, onClose, onAdded }: { jobId: string; onClose: () => void; onAdded: () => Promise<void> }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<CatalogueItem[]>([]);
  const [selected, setSelected] = useState<CatalogueItem | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [manual, setManual] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualUnit, setManualUnit] = useState("each");
  const [manualCost, setManualCost] = useState("0");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/materials?q=${encodeURIComponent(query)}&limit=30`, { cache: "no-store", signal: controller.signal });
        if (response.ok) setItems(await response.json());
      } catch {
        // A new keystroke aborting the previous search is expected.
      } finally {
        setLoading(false);
      }
    }, query ? 180 : 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  async function addSelected() {
    const qty = Number(quantity);
    if (!selected || !Number.isFinite(qty) || qty <= 0) return;
    setSaving(true);
    setError(null);
    const response = await fetch(`/api/jobs/${jobId}/operations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "MATERIAL",
        materialId: selected.id,
        name: selected.name,
        quantity: qty,
        unit: selected.unit,
        unitCost: selected.unitCost,
      }),
    });
    setSaving(false);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error || "Could not add material");
      return;
    }
    await onAdded();
  }

  async function addManual() {
    const qty = Number(quantity);
    const cost = Number(manualCost);
    if (!manualName.trim() || !Number.isFinite(qty) || qty <= 0 || !Number.isFinite(cost) || cost < 0) {
      setError("Enter a material name, quantity and valid cost.");
      return;
    }
    setSaving(true);
    setError(null);
    const response = await fetch(`/api/jobs/${jobId}/operations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "MATERIAL",
        name: manualName.trim(),
        quantity: qty,
        unit: manualUnit.trim() || "each",
        unitCost: cost,
      }),
    });
    setSaving(false);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error || "Could not add material");
      return;
    }
    await onAdded();
  }

  const money = (n: number) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(n);
  const field = { background: "#10151b", border: `1px solid ${U.border}`, color: U.text };

  return <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 md:items-center md:p-4" onClick={onClose}>
    <section className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-t-2xl p-5 md:rounded-2xl" style={{ background: U.panel, border: `1px solid ${U.border}` }} onClick={(event) => event.stopPropagation()}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-bold" style={{ color: U.text }}>Add material used</h2>
          <p className="mt-1 text-xs" style={{ color: U.mute }}>Search Elecplan stock and supplier pricing, then enter the quantity used.</p>
        </div>
        <button onClick={onClose} className="p-2" style={{ color: U.mute }}><X size={19} /></button>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setManual(false)} className="rounded-lg px-3 py-2.5 text-sm font-semibold" style={manual ? { border: `1px solid ${U.border}`, color: U.mute } : { background: "rgba(67,210,255,.12)", border: "1px solid rgba(67,210,255,.35)", color: U.cyan }}>Catalogue</button>
        <button type="button" onClick={() => setManual(true)} className="rounded-lg px-3 py-2.5 text-sm font-semibold" style={!manual ? { border: `1px solid ${U.border}`, color: U.mute } : { background: "rgba(67,210,255,.12)", border: "1px solid rgba(67,210,255,.35)", color: U.cyan }}>Manual item</button>
      </div>

      {!manual ? <>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: U.mute }} />
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, CNW / TradeZone code, barcode…" className="h-12 w-full rounded-xl pl-10 pr-3 text-sm outline-none" style={field} />
        </div>

        <div className="mt-3 max-h-72 overflow-y-auto rounded-xl" style={{ border: `1px solid ${U.border}` }}>
          {loading && <p className="p-4 text-sm" style={{ color: U.mute }}>Searching materials…</p>}
          {!loading && items.length === 0 && <p className="p-4 text-sm" style={{ color: U.mute }}>No catalogue items match. Use Manual item if it is not in the list yet.</p>}
          {!loading && items.map((item) => <button type="button" key={item.id} onClick={() => setSelected(item)} className="flex w-full items-center gap-3 border-b p-3 text-left last:border-0" style={{ borderColor: U.border, background: selected?.id === item.id ? "rgba(67,210,255,.09)" : "transparent" }}>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold" style={{ color: U.text }}>{item.name}</p>
              <p className="mt-1 truncate text-xs" style={{ color: U.mute }}>{[item.supplier, item.supplierSku || item.sku].filter(Boolean).join(" · ") || "Elecplan catalogue"}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-semibold" style={{ color: item.onHand > 0 ? U.green : U.mute }}>{item.onHand} {item.unit} in stock</p>
              <p className="mt-1 text-xs" style={{ color: U.cyan }}>{money(item.unitCost)} cost</p>
            </div>
          </button>)}
        </div>

        {selected && <div className="mt-3 rounded-xl p-4" style={{ background: U.alt, border: `1px solid ${U.border}` }}>
          <p className="text-sm font-semibold" style={{ color: U.text }}>{selected.name}</p>
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-3">
            <label>
              <span className="mb-1 block text-xs" style={{ color: U.mute }}>Quantity used ({selected.unit})</span>
              <input type="number" min="0.01" step="0.01" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="h-11 w-full rounded-lg px-3 outline-none" style={field} />
            </label>
            <button disabled={saving} onClick={() => void addSelected()} className="self-end rounded-lg px-5 py-3 text-sm font-bold disabled:opacity-50" style={{ background: U.green, color: "#0d1117" }}>{saving ? "Adding…" : "Add to job"}</button>
          </div>
          {Number(quantity) > selected.onHand && <p className="mt-2 text-xs" style={{ color: "#ffb04a" }}>Only {selected.onHand} {selected.unit} is currently in stock. The full quantity will still stay on the job for costing.</p>}
        </div>}
      </> : <div className="space-y-3">
        <label><span className="mb-1 block text-xs" style={{ color: U.mute }}>Material name</span><input autoFocus value={manualName} onChange={(event) => setManualName(event.target.value)} className="h-11 w-full rounded-lg px-3 outline-none" style={field} /></label>
        <div className="grid grid-cols-3 gap-3">
          <label><span className="mb-1 block text-xs" style={{ color: U.mute }}>Quantity</span><input type="number" min="0.01" step="0.01" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="h-11 w-full rounded-lg px-3 outline-none" style={field} /></label>
          <label><span className="mb-1 block text-xs" style={{ color: U.mute }}>Unit</span><input value={manualUnit} onChange={(event) => setManualUnit(event.target.value)} className="h-11 w-full rounded-lg px-3 outline-none" style={field} /></label>
          <label><span className="mb-1 block text-xs" style={{ color: U.mute }}>Cost ea</span><input type="number" min="0" step="0.01" value={manualCost} onChange={(event) => setManualCost(event.target.value)} className="h-11 w-full rounded-lg px-3 outline-none" style={field} /></label>
        </div>
        <button disabled={saving} onClick={() => void addManual()} className="w-full rounded-lg py-3 text-sm font-bold disabled:opacity-50" style={{ background: U.green, color: "#0d1117" }}>{saving ? "Adding…" : "Add manual material"}</button>
      </div>}

      {error && <p className="mt-3 rounded-lg p-3 text-sm" style={{ background: "rgba(255,102,115,.08)", color: U.red }}>{error}</p>}
    </section>
  </div>;
}

function Box({ title, icon, action, children }: { title: string; icon: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="rounded-2xl p-4" style={{ background: U.panel, border: `1px solid ${U.border}` }}>
    <div className="mb-3 flex items-center gap-2" style={{ color: U.cyan }}>{icon}<h3 className="flex-1 text-sm font-bold" style={{ color: U.text }}>{title}</h3>{action && <div className="text-xs font-semibold" style={{ color: U.cyan }}>{action}</div>}</div>
    {children}
  </section>;
}

function Empty({ text }: { text: string }) {
  return <p className="py-2 text-xs" style={{ color: U.mute }}>{text}</p>;
}

function Stat({ l, v, good }: { l: string; v: string; good?: boolean }) {
  return <div className="rounded-xl p-3" style={{ background: U.alt }}><p className="text-[10px]" style={{ color: U.mute }}>{l}</p><p className="mt-1 font-bold" style={{ color: good === false ? U.red : U.text }}>{v}</p></div>;
}
