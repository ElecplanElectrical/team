"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus, Trash2, X } from "lucide-react";
import { PORTAL_UI as UI } from "@/lib/carbon-theme";

export type InvoiceClientOption = { id: string; name: string };
export type InvoiceJobOption = { id: string; title: string; clientId: string; clientName: string };

type DraftLine = {
  description: string;
  quantity: string;
  unitPrice: string;
  gstRate: string;
};

const blankLine = (): DraftLine => ({
  description: "",
  quantity: "1",
  unitPrice: "",
  gstRate: "0.1",
});

function defaultDueDate() {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toISOString().slice(0, 10);
}

export default function NewInvoiceModal({
  clients,
  jobs,
}: {
  clients: InvoiceClientOption[];
  jobs: InvoiceJobOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [jobId, setJobId] = useState("");
  const [dueDate, setDueDate] = useState(() => defaultDueDate());
  const [lines, setLines] = useState<DraftLine[]>([blankLine()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matchedClient = useMemo(() => {
    const name = customerName.trim().toLowerCase();
    if (!name) return null;
    return clients.find((client) => client.name.trim().toLowerCase() === name) ?? null;
  }, [clients, customerName]);

  const visibleJobs = useMemo(() => {
    if (!matchedClient) return jobs;
    return jobs.filter((job) => job.clientId === matchedClient.id);
  }, [jobs, matchedClient]);

  const totals = useMemo(() => lines.reduce((acc, line) => {
    const quantity = Number(line.quantity) || 0;
    const unitPrice = Number(line.unitPrice) || 0;
    const gstRate = Number(line.gstRate) || 0;
    const net = quantity * unitPrice;
    return {
      subtotal: acc.subtotal + net,
      gst: acc.gst + net * gstRate,
    };
  }, { subtotal: 0, gst: 0 }), [lines]);

  function updateLine(index: number, key: keyof DraftLine, value: string) {
    setLines((current) => current.map((line, i) => i === index ? { ...line, [key]: value } : line));
  }

  function chooseJob(id: string) {
    setJobId(id);
    const job = jobs.find((item) => item.id === id);
    if (job) setCustomerName(job.clientName);
  }

  function reset() {
    setCustomerName("");
    setJobId("");
    setDueDate(defaultDueDate());
    setLines([blankLine()]);
    setError(null);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const lineItems = lines.map((line) => ({
      description: line.description.trim(),
      quantity: Number(line.quantity),
      unitPrice: Number(line.unitPrice),
      gstRate: Number(line.gstRate),
    }));

    if (!customerName.trim()) {
      setError("Add the customer name.");
      return;
    }

    if (lineItems.some((line) =>
      !line.description ||
      !Number.isFinite(line.quantity) ||
      line.quantity <= 0 ||
      !Number.isFinite(line.unitPrice) ||
      line.unitPrice < 0
    )) {
      setError("Complete each invoice line.");
      return;
    }

    setSaving(true);
    const response = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: customerName.trim(),
        jobId: jobId || null,
        dueDate,
        lineItems,
      }),
    });
    setSaving(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Could not create the invoice.");
      return;
    }

    reset();
    setOpen(false);
    router.refresh();
  }

  const field = {
    boxShadow: "var(--ep-inset-shadow)",
    background: "var(--ep-input)",
    border: `1px solid ${UI.border}`,
    color: UI.text,
  } as const;

  const money = (value: number) => value.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold sm:w-auto"
        style={{ ...UI.primary, color: UI.activeText, boxShadow: "0 8px 24px rgba(67,210,255,.22)" }}
      >
        <Plus size={17} />
        New invoice
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm md:items-center md:p-4"
          onClick={() => setOpen(false)}
        >
          <section
            className="w-full max-w-3xl overflow-hidden rounded-t-2xl md:rounded-2xl"
            style={{ ...UI.raised, background: UI.panel, border: `1px solid ${UI.border}`, boxShadow: "0 28px 90px rgba(0,0,0,.42)" }}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-start gap-3 border-b px-5 py-4" style={{ borderColor: UI.borderSoft }}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(67,210,255,.11)", color: UI.cyan }}>
                <FileText size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold" style={{ color: UI.text }}>Create invoice</h2>
                <p className="mt-1 text-xs" style={{ color: UI.faint }}>Customer first. A job link is optional.</p>
              </div>
              <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="p-1" style={{ color: UI.mute }}>
                <X size={18} />
              </button>
            </header>

            <form onSubmit={submit} className="max-h-[84vh] overflow-auto p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Customer name">
                  <input
                    autoFocus
                    list="invoice-customer-options"
                    value={customerName}
                    onChange={(event) => {
                      setCustomerName(event.target.value);
                      const selected = clients.find((client) => client.name.trim().toLowerCase() === event.target.value.trim().toLowerCase());
                      if (selected && jobId && !jobs.some((job) => job.id === jobId && job.clientId === selected.id)) setJobId("");
                    }}
                    placeholder="Type any customer name"
                    className="h-11 w-full rounded-lg px-3 text-sm outline-none"
                    style={field}
                  />
                  <datalist id="invoice-customer-options">
                    {clients.map((client) => <option key={client.id} value={client.name} />)}
                  </datalist>
                </Field>

                <Field label="Link to job (optional)">
                  <select
                    value={jobId}
                    onChange={(event) => chooseJob(event.target.value)}
                    className="h-11 w-full rounded-lg px-3 text-sm outline-none"
                    style={field}
                  >
                    <option value="">No linked job</option>
                    {visibleJobs.map((job) => (
                      <option key={job.id} value={job.id}>{job.clientName} · {job.title}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="mt-4 max-w-xs">
                <Field label="Due date">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    className="h-11 w-full rounded-lg px-3 text-sm outline-none"
                    style={field}
                  />
                </Field>
              </div>

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[.12em]" style={{ color: UI.faint }}>Invoice items</span>
                  <button
                    type="button"
                    onClick={() => setLines((current) => [...current, blankLine()])}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold"
                    style={{ background: "rgba(67,210,255,.10)", color: UI.cyan, border: "1px solid rgba(67,210,255,.22)" }}
                  >
                    <Plus size={13} />
                    Add line
                  </button>
                </div>

                <div className="space-y-2">
                  {lines.map((line, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 gap-3 rounded-xl p-3 sm:grid-cols-[minmax(180px,1fr)_90px_130px_110px_38px] sm:items-end"
                      style={{ ...UI.inset, background: UI.panelAlt, border: `1px solid ${UI.borderSoft}` }}
                    >
                      <Field label="Description">
                        <input
                          value={line.description}
                          onChange={(event) => updateLine(index, "description", event.target.value)}
                          placeholder="Electrical works completed"
                          className="h-10 w-full rounded-lg px-2.5 text-sm outline-none"
                          style={field}
                        />
                      </Field>
                      <Field label="Qty">
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={line.quantity}
                          onChange={(event) => updateLine(index, "quantity", event.target.value)}
                          className="h-10 w-full rounded-lg px-2.5 text-sm outline-none"
                          style={field}
                        />
                      </Field>
                      <Field label="Price">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.unitPrice}
                          onChange={(event) => updateLine(index, "unitPrice", event.target.value)}
                          className="h-10 w-full rounded-lg px-2.5 text-sm outline-none"
                          style={field}
                        />
                      </Field>
                      <Field label="GST">
                        <select
                          value={line.gstRate}
                          onChange={(event) => updateLine(index, "gstRate", event.target.value)}
                          className="h-10 w-full rounded-lg px-2.5 text-sm outline-none"
                          style={field}
                        >
                          <option value="0.1">10%</option>
                          <option value="0">GST free</option>
                        </select>
                      </Field>
                      <button
                        type="button"
                        aria-label="Remove line"
                        disabled={lines.length === 1}
                        onClick={() => setLines((current) => current.filter((_, i) => i !== index))}
                        className="flex h-10 items-center justify-center rounded-lg disabled:opacity-30"
                        style={{ color: UI.red, border: `1px solid ${UI.borderSoft}` }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="mt-4 grid grid-cols-3 gap-2 rounded-xl p-3"
                style={{ boxShadow: "var(--ep-inset-shadow)", background: "var(--ep-input)", border: `1px solid ${UI.borderSoft}` }}
              >
                <Total label="Subtotal" value={money(totals.subtotal)} />
                <Total label="GST" value={money(totals.gst)} />
                <Total label="Total" value={money(totals.subtotal + totals.gst)} strong />
              </div>

              {error && <p className="mt-4 text-xs" style={{ color: UI.red }}>{error}</p>}

              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-2.5 text-sm font-semibold"
                  style={{ ...UI.inset, background: UI.panelAlt, color: UI.mute, border: `1px solid ${UI.borderSoft}` }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
                  style={{ ...UI.primary, color: UI.activeText }}
                >
                  {saving ? "Creating…" : "Create invoice"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1.5"><span className="text-xs font-medium" style={{ color: UI.mute }}>{label}</span>{children}</label>;
}

function Total({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div><p className="text-[10px]" style={{ color: UI.faint }}>{label}</p><p className={strong ? "mt-1 text-base font-semibold" : "mt-1 text-sm font-semibold"} style={{ color: strong ? UI.cyan : UI.text }}>{value}</p></div>;
}
