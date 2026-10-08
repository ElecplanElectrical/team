import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

async function authJob(id: string) {
  const user = await getSessionUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  const job = await prisma.job.findUnique({ where: { id }, select: { id: true, assignedToId: true, clientId: true, address: true, crew: { select: { id: true } } } });
  if (!job) return { error: NextResponse.json({ error: "Job not found" }, { status: 404 }) } as const;
  if (user.role === "EMPLOYEE" && job.assignedToId !== user.id && !job.crew.some((member) => member.id === user.id)) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) } as const;
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
      select: { type: true, startsAt: true, assignedToId: true },
    }),
    prisma.quote.findMany({ where: { jobId: id, status: "ACCEPTED" }, select: { amount: true } }),
    prisma.invoice.findMany({ where: { jobId: id }, select: { amount: true, status: true } }),
  ]);

  const materialCost = materials.reduce((sum, material) => sum + Number(material.quantity) * Number(material.unitCost ?? 0), 0);
  let labourMinutes = 0;
  const activeStarts = new Map<string, Date>();
  for (const event of events) {
    const key = event.assignedToId ?? "unknown";
    if (event.type === "field-arrived") {
      activeStarts.set(key, event.startsAt);
      continue;
    }
    const start = activeStarts.get(key);
    if (!start) continue;
    if (event.type === "field-complete" || event.type === "field-revisit") {
      labourMinutes += Math.max(0, (event.startsAt.getTime() - start.getTime()) / 60000);
      activeStarts.delete(key);
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
      unitCost: String(material.unitCost ?? 0),
      unitSell: String(material.unitSell ?? 0),
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
    materialId: z.string().trim().min(1).optional(),
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
    const materialInput = p.data;
    let catalogueItem = materialInput.materialId
      ? await prisma.material.findUnique({
          where: { id: materialInput.materialId },
          select: { id: true, name: true, unit: true, unitCost: true, stockOnHand: true },
        })
      : await prisma.material.findFirst({
          where: { name: { equals: materialInput.name, mode: "insensitive" } },
          select: { id: true, name: true, unit: true, unitCost: true, stockOnHand: true },
        });

    if (materialInput.materialId && !catalogueItem) {
      return NextResponse.json({ error: "Material no longer exists in the catalogue" }, { status: 404 });
    }

    if (!catalogueItem) {
      catalogueItem = await prisma.material.create({
        data: { name: materialInput.name, unit: materialInput.unit || null, unitCost: materialInput.unitCost, stockOnHand: 0 },
        select: { id: true, name: true, unit: true, unitCost: true, stockOnHand: true },
      });
    }

    const now = new Date();
    const quantityUsed = Number(materialInput.quantity);
    const stockBefore = Math.max(0, Number(catalogueItem.stockOnHand));
    const quantityFromStock = Math.min(stockBefore, quantityUsed);
    const unitCost = Number(catalogueItem.unitCost ?? materialInput.unitCost ?? 0);

    const created = await prisma.$transaction(async (tx) => {
      if (quantityFromStock > 0) {
        await tx.material.update({
          where: { id: catalogueItem.id },
          data: { stockOnHand: stockBefore - quantityFromStock },
        });
      }

      const jobMaterial = await tx.jobMaterial.create({
        data: {
          jobId: id,
          materialId: catalogueItem.id,
          name: catalogueItem.name,
          quantity: materialInput.quantity,
          unit: catalogueItem.unit || materialInput.unit || null,
          unitCost,
          unitSell: materialInput.unitSell,
          stockQuantityApplied: quantityFromStock,
          stockAppliedAt: now,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "JOB_MATERIAL_ADDED",
          entityType: "JobMaterial",
          entityId: jobMaterial.id,
          actorId: a.user.id,
          actorName: a.user.name,
          actorEmail: a.user.email,
          actorRole: a.user.role,
          details: {
            jobId: id,
            materialId: catalogueItem.id,
            name: catalogueItem.name,
            quantityUsed,
            unitCost,
            stockBefore,
            quantityFromStock,
            quantityShortfall: Math.max(0, quantityUsed - quantityFromStock),
          },
        },
      });

      return jobMaterial;
    });

    return NextResponse.json(created, { status: 201 });
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
    const used = await prisma.jobMaterial.findFirst({
      where: { id: materialId, jobId: id },
      select: { id: true, materialId: true, name: true, stockQuantityApplied: true },
    });
    if (!used) return NextResponse.json({ error: "Material entry not found" }, { status: 404 });

    const restore = Math.max(0, Number(used.stockQuantityApplied));
    await prisma.$transaction(async (tx) => {
      if (restore > 0) {
        const material = await tx.material.findUnique({ where: { id: used.materialId }, select: { id: true } });
        if (material) {
          await tx.material.update({ where: { id: used.materialId }, data: { stockOnHand: { increment: restore } } });
        }
      }
      await tx.jobMaterial.delete({ where: { id: used.id } });
      await tx.auditLog.create({
        data: {
          action: "JOB_MATERIAL_REMOVED",
          entityType: "JobMaterial",
          entityId: used.id,
          actorId: a.user.id,
          actorName: a.user.name,
          actorEmail: a.user.email,
          actorRole: a.user.role,
          details: { jobId: id, materialId: used.materialId, name: used.name, stockRestored: restore },
        },
      });
    });
    return NextResponse.json({ ok: true, stockRestored: restore });
  }

  return NextResponse.json({ error: "Nothing to delete" }, { status: 400 });
}
