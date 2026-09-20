import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { DOCUMENT_MAX_BYTES, DOCUMENT_TYPES, verifyCommitToken } from "@/lib/storage";

const billSchema = z.object({
  clientId: z.string().trim().optional().nullable(),
  supplier: z.string().trim().max(160).optional().nullable(),
  jobId: z.string().trim().optional().nullable(),
  amount: z.coerce.number().positive().max(100000000),
  dueDate: z.string().datetime(),
  status: z.enum(["UNPAID", "PAID", "OVERDUE"]).default("UNPAID"),
  invoiceNumber: z.string().trim().max(100).optional().nullable(),
  subtotal: z.coerce.number().nonnegative().optional().nullable(),
  gstAmount: z.coerce.number().nonnegative().optional().nullable(),
  documentCommitToken: z.string().optional().nullable(),
  documentDataBase64: z.string().max(DOCUMENT_MAX_BYTES * 2).optional().nullable(),
  documentFileName: z.string().trim().max(255).optional().nullable(),
  documentContentType: z.string().trim().max(100).optional().nullable(),
  documentSizeBytes: z.coerce.number().int().nonnegative().max(DOCUMENT_MAX_BYTES).optional().nullable(),
}).refine((d) => Boolean(d.clientId || d.supplier), {
  message: "A client or supplier is required",
  path: ["clientId"],
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = billSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const d = parsed.data;
  try {
    const [client, job] = await Promise.all([
      d.clientId ? prisma.client.findUnique({ where: { id: d.clientId }, select: { id: true } }) : Promise.resolve(null),
      d.jobId ? prisma.job.findUnique({ where: { id: d.jobId }, select: { id: true, clientId: true } }) : Promise.resolve(null),
    ]);

    if (d.clientId && !client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
    if (d.jobId && !job) return NextResponse.json({ error: "Job not found" }, { status: 404 });
    if (job && d.clientId && job.clientId !== d.clientId) {
      return NextResponse.json({ error: "Selected job does not belong to this client" }, { status: 400 });
    }

    const document = d.documentCommitToken ? verifyCommitToken(d.documentCommitToken, "invoice-documents") : null;
    if (d.documentCommitToken && !document) {
      return NextResponse.json({ error: "Invoice document upload expired. Choose the file again." }, { status: 400 });
    }

    let documentData: Buffer | null = null;
    if (!document && d.documentDataBase64) {
      if (!d.documentContentType || !DOCUMENT_TYPES.has(d.documentContentType)) {
        return NextResponse.json({ error: "Unsupported invoice document type." }, { status: 400 });
      }
      documentData = Buffer.from(d.documentDataBase64, "base64");
      if (documentData.byteLength === 0 || documentData.byteLength > DOCUMENT_MAX_BYTES) {
        return NextResponse.json({ error: "Invoice document is empty or too large." }, { status: 400 });
      }
    }

    const id = crypto.randomUUID();
    const hasDocument = Boolean(document || documentData);
    const invoice = await prisma.invoice.create({
      data: {
        id,
        clientId: d.clientId || null,
        supplier: d.supplier || null,
        jobId: d.jobId || null,
        amount: d.amount,
        dueDate: new Date(d.dueDate),
        status: d.status,
        invoiceNumber: d.invoiceNumber || null,
        subtotal: d.subtotal ?? null,
        gstAmount: d.gstAmount ?? null,
        ...(document ? {
          documentUrl: `/api/bills/${id}/file`,
          documentStorageKey: document.key,
          documentMimeType: document.contentType,
          documentSizeBytes: document.sizeBytes,
          documentFileName: document.fileName,
        } : {}),
        ...(documentData ? {
          documentUrl: `/api/bills/${id}/file`,
          documentData,
          documentMimeType: d.documentContentType || "application/octet-stream",
          documentSizeBytes: documentData.byteLength,
          documentFileName: d.documentFileName || "invoice-document",
        } : {}),
      },
      select: { id: true, amount: true, dueDate: true, status: true },
    });

    return NextResponse.json({ ...invoice, hasDocument }, { status: 201 });
  } catch (error) {
    console.error("CREATE_BILL_FAILED", error);
    return NextResponse.json({ error: "Could not create bill" }, { status: 400 });
  }
}
