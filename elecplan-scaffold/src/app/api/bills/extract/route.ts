import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { DOCUMENT_MAX_BYTES, DOCUMENT_TYPES } from "@/lib/storage";

export const runtime = "nodejs";

type InvoiceExtraction = {
  supplier: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  dueDate: string | null;
  subtotal: number | null;
  gstAmount: number | null;
  total: number | null;
  confidence: number;
};

function normaliseDate(value: string | null): string | null {
  if (!value) return null;
  const cleaned = value.trim().replace(/\./g, "/").replace(/-/g, "/");
  const match = cleaned.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/);
  if (!match) return null;
  let year = Number(match[3]);
  if (year < 100) year += year >= 70 ? 1900 : 2000;
  const month = Number(match[2]);
  const day = Number(match[1]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function moneyValue(value: string | null): number | null {
  if (!value) return null;
  const n = Number(value.replace(/[$,\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function firstMatch(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return null;
}

function localExtract(text: string, fileName: string): InvoiceExtraction {
  const compact = text.replace(/\r/g, "\n").replace(/[ \t]+/g, " ");
  const lines = compact.split(/\n+/).map((line) => line.trim()).filter(Boolean);

  const invoiceNumber = firstMatch(compact, [
    /(?:tax\s+invoice|invoice)\s*(?:no\.?|number|#)?\s*[:#-]?\s*([A-Z0-9][A-Z0-9\-\/]{2,30})/i,
    /(?:document|reference|ref)\s*(?:no\.?|number|#)?\s*[:#-]?\s*([A-Z0-9][A-Z0-9\-\/]{2,30})/i,
  ]);

  const dueRaw = firstMatch(compact, [
    /(?:due\s+date|payment\s+due)\s*[:\-]?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
  ]);
  const invoiceDateRaw = firstMatch(compact, [
    /(?:invoice\s+date|date)\s*[:\-]?\s*(\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})/i,
  ]);

  const total = moneyValue(firstMatch(compact, [
    /(?:amount\s+due|balance\s+due|total\s+due|invoice\s+total|grand\s+total|total)\s*(?:aud)?\s*[:$]?\s*\$?\s*([0-9][0-9,]*\.\d{2})/i,
  ]));
  const gstAmount = moneyValue(firstMatch(compact, [
    /(?:gst|tax)\s*(?:amount|total)?\s*[:$]?\s*\$?\s*([0-9][0-9,]*\.\d{2})/i,
  ]));
  const subtotal = moneyValue(firstMatch(compact, [
    /(?:subtotal|sub\s*total|ex\.?\s*gst)\s*[:$]?\s*\$?\s*([0-9][0-9,]*\.\d{2})/i,
  ]));

  const supplierCandidates = lines.filter((line) =>
    line.length >= 2 &&
    line.length <= 80 &&
    !/^(tax invoice|invoice|statement|account|date|page|abn|phone|email|www\.|total|gst)/i.test(line) &&
    !/^\d/.test(line)
  );
  let supplier = supplierCandidates[0] ?? null;
  const fileSupplier = fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  if ((!supplier || supplier.length < 2) && fileSupplier) supplier = fileSupplier.slice(0, 80);

  const populated = [invoiceNumber, dueRaw, invoiceDateRaw, total, gstAmount, subtotal, supplier].filter((value) => value !== null).length;
  const confidence = Math.min(0.88, 0.32 + populated * 0.08);

  return {
    supplier,
    invoiceNumber,
    invoiceDate: normaliseDate(invoiceDateRaw),
    dueDate: normaliseDate(dueRaw),
    subtotal,
    gstAmount,
    total,
    confidence,
  };
}

async function extractText(file: File): Promise<string> {
  const bytes = Buffer.from(await file.arrayBuffer());
  if (file.type === "application/pdf") {
    const mod = await import("pdf-parse");
    const pdfParse = (mod.default ?? mod) as unknown as (input: Buffer) => Promise<{ text?: string }>;
    const parsed = await pdfParse(bytes);
    return parsed.text?.trim() ?? "";
  }

  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const result = await worker.recognize(bytes);
    return result.data.text?.trim() ?? "";
  } finally {
    await worker.terminate();
  }
}

async function openAiExtract(file: File, apiKey: string): Promise<InvoiceExtraction | null> {
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      supplier: { type: ["string", "null"] },
      invoiceNumber: { type: ["string", "null"] },
      invoiceDate: { type: ["string", "null"] },
      dueDate: { type: ["string", "null"] },
      subtotal: { type: ["number", "null"] },
      gstAmount: { type: ["number", "null"] },
      total: { type: ["number", "null"] },
      confidence: { type: "number", minimum: 0, maximum: 1 },
    },
    required: ["supplier", "invoiceNumber", "invoiceDate", "dueDate", "subtotal", "gstAmount", "total", "confidence"],
  } as const;
  const prompt = "Read this Australian supplier invoice, statement or receipt. Extract only values visibly supported by the document. Dates must be YYYY-MM-DD. Amounts must be numbers in AUD without currency symbols. Use null when a field is absent or unclear. You have no access to any Elecplan portal data.";
  const content = file.type === "application/pdf"
    ? [{ type: "input_text", text: prompt }, { type: "input_file", filename: file.name, file_data: `data:${file.type};base64,${base64}` }]
    : [{ type: "input_text", text: prompt }, { type: "input_image", image_url: `data:${file.type};base64,${base64}`, detail: "high" }];

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL || "gpt-5.6-luna",
      input: [{ role: "user", content }],
      text: { format: { type: "json_schema", name: "elecplan_invoice", strict: true, schema } },
    }),
  });
  if (!response.ok) return null;
  const data = await response.json();
  const output = data.output_text ?? data.output?.flatMap((item: { content?: Array<{ type?: string; text?: string }> }) => item.content ?? []).find((part: { type?: string }) => part.type === "output_text")?.text;
  if (!output) return null;
  return JSON.parse(output) as InvoiceExtraction;
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !DOCUMENT_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Upload a PDF, JPG, PNG or WebP invoice." }, { status: 400 });
  }
  if (file.size > DOCUMENT_MAX_BYTES) {
    return NextResponse.json({ error: "Invoice file is too large. Maximum is 15 MB." }, { status: 413 });
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (apiKey) {
    try {
      const aiResult = await openAiExtract(file, apiKey);
      if (aiResult) return NextResponse.json(aiResult);
    } catch (error) {
      console.error("INVOICE_AI_EXTRACTION_FAILED", error);
    }
  }

  try {
    const text = await extractText(file);
    if (!text) {
      return NextResponse.json({ error: "The document could not be read. Try a clearer photo or a text-based PDF." }, { status: 422 });
    }
    return NextResponse.json(localExtract(text, file.name));
  } catch (error) {
    console.error("INVOICE_LOCAL_EXTRACTION_FAILED", error);
    return NextResponse.json({ error: "Could not read the invoice document." }, { status: 502 });
  }
}
