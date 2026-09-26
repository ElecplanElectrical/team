import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

async function authJob(id: string) {
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  const job = await prisma.job.findUnique({ where: { id }, select: { id: true, assignedToId: true, clientId: true, address: true } });
  if (!job) return { error: NextResponse.json({ error: "Job not found" }, { status: 404 }) } as const;
  if (user.role === "EMPLOYEE" && job.assignedToId !== user.id) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) } as const;
  return { user, job } as const;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await authJob(id);
  if ("error" in a) return a.error;

  const [tasks, materials, documents, history, events, quotes, invoices] = await Promise.all([
    prisma.jobTask.findMany({ where: { jobId: id }, orderBy: { createdAt: "asc" } }),
    prisma.jobMaterial.findMany({ where: { jobId: id }, orderBy: { createdAt: "desc" } }),
    prisma.document.findMany({
      where: { jobId: id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, kind: true, url: true, createdAt: true },
    }),
    prisma.job.findMany({
      where: { id: { not: id }, OR: [{ clientId: a.job.clientId }, { address: { equals: a.job.address, mode: "insensitive" } }] },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, title: true, address: true, status: true, createdAt: true },
    }),
    prisma.jobEvent.findMany({
      where: { jobId: id, type: { in: ["field-arrived", "field-complete", "field-revisit"] } },
      orderBy: { startsAt: "asc" },
      select: { type: true, startsAt: true },
    }),
    prisma.quote.findMany({ where: { jobId: id, status: "ACCEPTED" }, select: { amount: true } }),
    prisma.invoice.findMany({ where: { jobId: id }, select: { amount: true, status: true } }),
  ]);

  const materialIds = [...new Set(materials.map((m) => m.materialId).filter(Boolean))];
  const catalogue = materialIds.length
    ? await prisma.material.findMany({ where: { id: { in: materialIds } }, select: { id: true, unitCost: true } })
    : [];
  const costById = new Map(catalogue.map((m) => [m.id, m.unitCost == null ? null : Number(m.unitCost)]));

  const pricedMaterials = materials.filter((material) => costById.get(material.materialId) != null);\n  const unpricedMaterials = materials.length - pricedMaterials.length;\n  const materialCost = pricedMaterials.reduce((sum, material) => sum + Number(material.quantity) * Number(costById.get(material.materialId)), 0);
  let labourMinutes = 0;
  let lastArrival: Date | null = null;
  for (const event of events) {
    if (event.type === "field-arrived") lastArrival = event.startsAt;
    else if (lastArrival && (event.type === "field-complete" || event.type === "field-revisit")) {
      labourMinutes += Math.max(0, (event.startsAt.getTime() - lastArrival.getTime()) / 60000);
      lastArrival = null;
    }
  }

  const invoiced = invoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0);
  const accepted = quotes.reduce((sum, quote) => sum + Number(quote.amount), 0);
  const revenue = invoiced || accepted;

  return NextResponse.json({
    tasks,
    materials: materials.map((material) => ({
      id: material.id,
      name: material.name,
      quantity: String(material.quantity),
      unit: material.unit,
      unitCost: costById.get(material.materialId) == null ? null : String(costById.get(material.materialId)),
      unitSell: "0",
    })),
    documents: documents.map((document) => ({
      id: document.id,
      name: document.name,
      type: document.kind ?? "JOB_ATTACHMENT",
      fileUrl: document.url,
      originalName: null,
    })),
    history,
    profitability: {
      revenue,
      materialCost,
      materialCostComplete: unpricedMaterials === 0,
      unpricedMaterials,
      materialSell: 0,
      labourHours: Math.round(labourMinutes / 6) / 10,
      grossAfterMaterials: revenue - materialCost,
    },
  });
}

const post = z.discriminatedUnion("type", [
  z.object({ type: z.literal("TASK"), title: z.string().trim().min(1).max(160) }),
  z.object({
    type: z.literal("MATERIAL"),
    name: z.string().trim().min(1).max(160),
    quantity: z.coerce.number().positive(),
    unit: z.string().trim().max(30).optional(),
    unitCost: z.coerce.number().min(0).default(0),
    unitSell: z.coerce.number().min(0).default(0),
  }),
  z.object({ type: z.literal("REMINDER"), title: z.string().trim().min(1).max(180), dueDate: z.string().datetime() }),
]);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await authJob(id);
  if ("error" in a) return a.error;

  const p = post.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message || "Invalid request" }, { status: 400 });

  if (p.data.type === "TASK") {
    if (a.user.role === "EMPLOYEE") return NextResponse.json({ error: "Only admins and supervisors can add checklist items" }, { status: 403 });
    return NextResponse.json(await prisma.jobTask.create({ data: { jobId: id, title: p.data.title } }), { status: 201 });
  }

  if (p.data.type === "MATERIAL") {
    let catalogueItem = await prisma.material.findFirst({
      where: { name: { equals: p.data.name, mode: "insensitive" } },
      select: { id: true, unitCost: true, stockOnHand: true, unit: true },
    });
    if (!catalogueItem) {
      catalogueItem = await prisma.material.create({
        data: { name: p.data.name, unit: p.data.unit || null, unitCost: p.data.unitCost, stockOnHand: 0 },
        select: { id: true, unitCost: true, stockOnHand: true, unit: true },
      });
    }
    if (catalogueItem.unitCost == null && p.data.unitCost > 0) {
      catalogueItem = await prisma.material.update({
        where: { id: catalogueItem.id },
        data: { unitCost: p.data.unitCost },
        select: { id: true, unitCost: true, stockOnHand: true, unit: true },
      });
    }
    const before = Number(catalogueItem.stockOnHand);
    if (before < p.data.quantity) {
      return NextResponse.json({ error: `Only ${before} ${catalogueItem.unit || p.data.unit || "units"} of ${p.data.name} are in stock` }, { status: 409 });
    }
    const used = await prisma.$transaction(async (tx) => {
      const row = await tx.jobMaterial.create({
        data: { jobId: id, materialId: catalogueItem.id, name: p.data.name, quantity: p.data.quantity, unit: p.data.unit || catalogueItem.unit || null },
      });
      await tx.material.update({ where: { id: catalogueItem.id }, data: { stockOnHand: { decrement: p.data.quantity } } });
      return row;
    });
    await recordAudit({ actor: a.user, action: "JOB_MATERIAL_USED", entityType: "Job", entityId: id, details: { jobMaterialId: used.id, materialId: catalogueItem.id, name: p.data.name, quantity: p.data.quantity, stockBefore: before, stockAfter: before - p.data.quantity } });
    return NextResponse.json(used, { status: 201 });
  }

  if (a.user.role === "EMPLOYEE") return NextResponse.json({ error: "Only admins and supervisors can create reminders" }, { status: 403 });
  return NextResponse.json(await prisma.reminder.create({
    data: { userId: a.user.id, title: p.data.title, dueAt: new Date(p.data.dueDate) },
  }), { status: 201 });
}

const patch = z.object({
  taskId: z.string(),
  completed: z.boolean().optional(),
  title: z.string().trim().min(1).max(160).optional(),
}).refine((value) => value.completed !== undefined || value.title !== undefined, { message: "No task changes supplied" });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await authJob(id);
  if ("error" in a) return a.error;
  const p = patch.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message || "Invalid task update" }, { status: 400 });

  const task = await prisma.jobTask.findFirst({ where: { id: p.data.taskId, jobId: id } });
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  if (p.data.title !== undefined && a.user.role === "EMPLOYEE") return NextResponse.json({ error: "Only admins and supervisors can edit task text" }, { status: 403 });

  return NextResponse.json(await prisma.jobTask.update({
    where: { id: task.id },
    data: {
      ...(p.data.completed !== undefined ? { completed: p.data.completed } : {}),
      ...(p.data.title !== undefined ? { title: p.data.title } : {}),
    },
  }));
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await authJob(id);
  if ("error" in a) return a.error;
  const url = new URL(req.url);
  const taskId = url.searchParams.get("taskId");
  const materialId = url.searchParams.get("materialId");

  if (taskId) {
    if (a.user.role === "EMPLOYEE") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await prisma.jobTask.deleteMany({ where: { id: taskId, jobId: id } });
    return NextResponse.json({ ok: true });
  }

  if (materialId) {
    if (a.user.role === "EMPLOYEE") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const used = await prisma.jobMaterial.findFirst({ where: { id: materialId, jobId: id } });
    if (!used) return NextResponse.json({ error: "Material usage not found" }, { status: 404 });
    await prisma.$transaction([
      prisma.jobMaterial.delete({ where: { id: used.id } }),
      prisma.material.update({ where: { id: used.materialId }, data: { stockOnHand: { increment: used.quantity } } }),
    ]);
    await recordAudit({ actor: a.user, action: "JOB_MATERIAL_USAGE_REMOVED", entityType: "Job", entityId: id, details: { jobMaterialId: used.id, materialId: used.materialId, name: used.name, quantity: Number(used.quantity), stockRestored: true } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Nothing to delete" }, { status: 400 });
}
