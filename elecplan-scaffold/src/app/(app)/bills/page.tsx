import { requireAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import BillsView, { type BillRow } from "@/components/BillsView";
import { storageConfigured } from "@/lib/storage";

function billRef(id: string, invoiceNumber: string | null): string {
  return invoiceNumber?.trim() || "BL-" + id.slice(-4).toUpperCase();
}

function effectiveStatus(status: string, dueDate: Date): string {
  if (status === "PAID") return status;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today ? "OVERDUE" : status;
}

export default async function BillsPage() {
  await requireAccess("bills");

  const [invoiceRows, clients, jobs, jobMaterials, materials] = await Promise.all([
    prisma.invoice.findMany({
      select: {
        id: true,
        supplier: true,
        invoiceNumber: true,
        amount: true,
        dueDate: true,
        status: true,
        createdAt: true,
        documentStorageKey: true,
        documentSizeBytes: true,
        client: { select: { name: true } },
        job: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.job.findMany({
      select: { id: true, title: true, clientId: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.jobMaterial.findMany({
      select: { jobId: true, materialId: true, quantity: true },
    }),
    prisma.material.findMany({
      select: { id: true, supplier: true, unitCost: true },
    }),
  ]);

  const materialMap = new Map(materials.map((material) => [material.id, material]));
  const paidJobIds = new Set(
    invoiceRows.filter((invoice) => invoice.client && invoice.status === "PAID" && invoice.job).map((invoice) => jobs.find((job) => job.title === invoice.job?.title)?.id).filter(Boolean) as string[],
  );
  const supplierMaterialCost = new Map<string, number>();
  for (const usage of jobMaterials) {
    if (!paidJobIds.has(usage.jobId)) continue;
    const material = materialMap.get(usage.materialId);
    const supplier = material?.supplier?.trim();
    const unitCost = Number(material?.unitCost ?? 0);
    if (!supplier || !unitCost) continue;
    supplierMaterialCost.set(supplier, (supplierMaterialCost.get(supplier) ?? 0) + Number(usage.quantity) * unitCost);
  }

  const supplierBills = new Map<string, number>();
  for (const invoice of invoiceRows) {
    const supplier = invoice.supplier?.trim();
    if (!supplier || invoice.status === "PAID") continue;
    supplierBills.set(supplier, (supplierBills.get(supplier) ?? 0) + Number(invoice.amount));
  }

  const reserveSuppliers = Array.from(new Set([...supplierMaterialCost.keys(), ...supplierBills.keys()])).sort();
  const reserves = reserveSuppliers.map((supplier) => {
    const fundedFromPaidJobs = supplierMaterialCost.get(supplier) ?? 0;
    const outstandingBills = supplierBills.get(supplier) ?? 0;
    const requiredReserve = Math.max(outstandingBills, fundedFromPaidJobs);
    return {
      supplier,
      fundedFromPaidJobs,
      outstandingBills,
      requiredReserve,
      shortfall: Math.max(0, requiredReserve - fundedFromPaidJobs),
    };
  });
  const totalReserve = reserves.reduce((sum, item) => sum + item.requiredReserve, 0);
  const totalShortfall = reserves.reduce((sum, item) => sum + item.shortfall, 0);

  const bills: BillRow[] = invoiceRows.map((invoice) => ({
    id: invoice.id,
    ref: billRef(invoice.id, invoice.invoiceNumber),
    client: invoice.client?.name ?? null,
    supplier: invoice.supplier,
    job: invoice.job?.title ?? null,
    amount: Number(invoice.amount),
    dueDate: invoice.dueDate.toISOString(),
    status: effectiveStatus(invoice.status, invoice.dueDate),
    createdAt: invoice.createdAt.toISOString(),
    hasDocument: Boolean(invoice.documentStorageKey || invoice.documentSizeBytes),
  }));

  return <BillsView bills={bills} clients={clients} jobs={jobs} storageReady={storageConfigured()} reserves={reserves} totalReserve={totalReserve} totalShortfall={totalShortfall} />;
}
