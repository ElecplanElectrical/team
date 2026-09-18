import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { DOCUMENT_MAX_BYTES, DOCUMENT_TYPES } from "@/lib/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Invoice reading needs OPENAI_API_KEY configured in Elecplan." }, { status: 503 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || !DOCUMENT_TYPES.has(file.type)) return NextResponse.json({ error: "Upload a PDF, JPG, PNG or WebP invoice." }, { status: 400 });
  if (file.size > DOCUMENT_MAX_BYTES) return NextResponse.json({ error: "Invoice file is too large. Maximum is 15 MB." }, { status: 413 });
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
  const prompt = "Read this Australian supplier invoice or receipt. Extract only values visibly supported by the document. Dates must be YYYY-MM-DD. Amounts must be numbers in AUD without currency symbols. Use null when a field is absent or unclear. Do not calculate a missing total. You have no access to any Elecplan portal data.";
  const content = file.type === "application/pdf"
    ? [{ type: "input_text", text: prompt }, { type: "input_file", filename: file.name, file_data: `data:${file.type};base64,${base64}` }]
    : [{ type: "input_text", text: prompt }, { type: "input_image", image_url: `data:${file.type};base64,${base64}`, detail: "high" }];
  try {
    const response = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" }, body: JSON.stringify({ model: process.env.OPENAI_VISION_MODEL || "gpt-5.6-luna", input: [{ role: "user", content }], text: { format: { type: "json_schema", name: "elecplan_invoice", strict: true, schema } } }) });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: "The invoice could not be read right now." }, { status: 502 });
    const output = data.output_text ?? data.output?.flatMap((item: { content?: Array<{ type?: string; text?: string }> }) => item.content ?? []).find((part: { type?: string }) => part.type === "output_text")?.text;
    if (!output) return NextResponse.json({ error: "No invoice details were found." }, { status: 422 });
    return NextResponse.json(JSON.parse(output));
  } catch (error) {
    console.error("INVOICE_EXTRACTION_FAILED", error);
    return NextResponse.json({ error: "Could not read the invoice document." }, { status: 502 });
  }
}
