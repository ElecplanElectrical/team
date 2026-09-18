"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CloudDownload, Loader2 } from "lucide-react";

export default function XeroImportButton({ configured, connected, tenantName }: { configured: boolean; connected: boolean; tenantName?: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState(connected ? "Import Xero clients" : configured ? "Connect Xero" : "Xero setup needed");
  if (!configured) return <button type="button" disabled title="Add the Xero app credentials in Elecplan's Railway service first" className="hidden h-10 items-center gap-2 rounded-lg border border-sky-300/20 px-3 text-sm font-semibold text-sky-200/50 md:flex"><CloudDownload size={16} />{label}</button>;
  if (!connected) return <Link href="/api/xero/connect" className="hidden h-10 items-center gap-2 rounded-lg border border-sky-300/30 bg-sky-400/10 px-3 text-sm font-semibold text-sky-200 md:flex"><CloudDownload size={16} />{label}</Link>;

  async function runImport() {
    setBusy(true);
    setLabel("Importing…");
    const response = await fetch("/api/xero/import-contacts", { method: "POST" });
    const body = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok) {
      setLabel(body?.error || "Import failed");
      return;
    }
    setLabel(`${body.created} new · ${body.updated} updated`);
    router.refresh();
    setTimeout(() => setLabel("Import Xero clients"), 5000);
  }

  return <button type="button" disabled={busy} title={tenantName ? `Import customers from ${tenantName}` : "Import Xero customers"} onClick={() => void runImport()} className="hidden h-10 items-center gap-2 rounded-lg border border-sky-300/30 bg-sky-400/10 px-3 text-sm font-semibold text-sky-200 disabled:opacity-60 md:flex">{busy ? <Loader2 size={16} className="animate-spin" /> : <CloudDownload size={16} />}{label}</button>;
}
