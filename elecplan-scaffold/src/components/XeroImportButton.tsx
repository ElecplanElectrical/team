"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CloudDownload, FileUp, Loader2 } from "lucide-react";

export default function XeroImportButton({ configured, connected, tenantName }: { configured: boolean; connected: boolean; tenantName?: string | null }) {
  const router = useRouter();
  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState(connected ? "Import Xero clients" : configured ? "Connect Xero" : "Import Xero CSV");

  async function importCsv(file?: File) {
    if (!file) return;
    setBusy(true);
    setLabel("Importing CSV…");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/xero/import-csv", { method: "POST", body: form });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "CSV import failed");
      setLabel(`${body.created} new · ${body.updated} updated`);
      router.refresh();
      window.setTimeout(() => setLabel(connected ? "Import Xero clients" : configured ? "Connect Xero" : "Import Xero CSV"), 5000);
    } catch (error) {
      setLabel(error instanceof Error ? error.message : "CSV import failed");
    } finally {
      setBusy(false);
    }
  }

  async function runImport() {
    setBusy(true);
    setLabel("Importing…");
    try {
      const response = await fetch("/api/xero/import-contacts", { method: "POST" });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error || "Import failed");
      setLabel(`${body.created} new · ${body.updated} updated`);
      router.refresh();
      window.setTimeout(() => setLabel("Import Xero clients"), 5000);
    } catch (error) {
      setLabel(error instanceof Error ? error.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  if (!configured) {
    return <>
      <button type="button" disabled={busy} title="Import a contacts CSV exported from Xero" onClick={() => csvInputRef.current?.click()} className="hidden h-10 items-center gap-2 rounded-lg border border-sky-300/30 bg-sky-400/10 px-3 text-sm font-semibold text-sky-200 disabled:opacity-60 md:flex">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}{label}
      </button>
      <input ref={csvInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; event.currentTarget.value = ""; void importCsv(file); }} />
    </>;
  }

  if (!connected) {
    return <div className="hidden items-center gap-2 md:flex">
      <Link href="/api/xero/connect" className="flex h-10 items-center gap-2 rounded-lg border border-sky-300/30 bg-sky-400/10 px-3 text-sm font-semibold text-sky-200"><CloudDownload size={16} />Connect Xero</Link>
      <button type="button" disabled={busy} title="Or import a Xero contacts CSV" onClick={() => csvInputRef.current?.click()} className="flex h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-sm font-semibold text-slate-300 disabled:opacity-60">
        {busy ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}CSV
      </button>
      <input ref={csvInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; event.currentTarget.value = ""; void importCsv(file); }} />
    </div>;
  }

  return <button type="button" disabled={busy} title={tenantName ? `Import customers from ${tenantName}` : "Import Xero customers"} onClick={() => void runImport()} className="hidden h-10 items-center gap-2 rounded-lg border border-sky-300/30 bg-sky-400/10 px-3 text-sm font-semibold text-sky-200 disabled:opacity-60 md:flex">{busy ? <Loader2 size={16} className="animate-spin" /> : <CloudDownload size={16} />}{label}</button>;
}
