import { PrismaClient } from "@prisma/client";
import { createWorker, PSM } from "tesseract.js";
import { createDownloadUrl } from "../src/lib/storage";

const prisma = new PrismaClient();
const brands = ["Voltex", "Clipsal", "Hager", "NHP", "Legrand", "Trader", "HPM", "Deta", "Cabac", "Schneider", "NB Lights", "SAL", "Pierlite", "Brilliant", "Hyena"];
const knownProducts: Record<string, string> = { VMB16B: "Voltex Mounting Block 16mm Black" };

function parseQuantity(text: string) {
  const clean = text.replace(/\s+/g, " ");
  const labelled = clean.match(/\b(?:qty|quantity)\s*[:x-]?\s*(\d{1,4})\b/i);
  if (labelled) {
    const value = Number(labelled[1]);
    if (value >= 1 && value <= 9999) return value;
  }
  const packaged = clean.match(/\b(\d{1,4})\s*(?:pack(?:s)?|rolls?|pcs?|pieces?|units?|each|ea)\b/i);
  if (packaged) {
    const value = Number(packaged[1]);
    if (value >= 1 && value <= 9999) return value;
  }
  return 0;
}

function humanNameFromModel(model: string | null, supplier: string | null, text: string) {
  if (!model) return "";
  const clean = model.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (knownProducts[clean]) return knownProducts[clean];
  if ((supplier || "").toLowerCase() === "voltex") {
    const match = clean.match(/^VMB(\d{1,3})([A-Z])$/);
    if (match) {
      const colour: Record<string, string> = { B: "Black", W: "White", G: "Grey" };
      return `Voltex Mounting Block ${match[1]}mm ${colour[match[2]] || match[2]}`;
    }
  }
  const lines = text.split(/\n/).map((line) => line.replace(/[^\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim()).filter(Boolean);
  const productWords = /(mounting\s*(?:block|flange)|socket|outlet|switch|plug|downlight|batten|power\s*point|junction\s*box|enclosure|dimmer|sensor|breaker|rcbo|rccb|isolator|transformer|driver|cable|conduit|coupler|adapter|connector|wall\s*plate|mechanism|smoke\s*alarm|pendant|floodlight|fan|light fitting)/i;
  const line = lines.find((candidate) => productWords.test(candidate) && /[A-Za-z]{4,}/.test(candidate));
  if (!line) return "";
  const stripped = line.replace(model, " ").replace(/\b(model|cat(?:alogue)?|catalog|part|item|code|sku)\b/gi, " ").replace(/\s+/g, " ").trim();
  if (stripped.length < 6) return "";
  const prefix = supplier && !stripped.toLowerCase().includes(supplier.toLowerCase()) ? `${supplier} ` : "";
  return `${prefix}${stripped}`.slice(0, 160);
}

function parseProduct(text: string, barcode = "") {
  const compact = (value: string) => value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  const supplier = brands.find((brand) => text.toLowerCase().includes(brand.toLowerCase())) || null;
  const barcodeCompact = compact(barcode);
  const brandCompacts = new Set(brands.map(compact));
  const raw = text.split(/\n/).map((line) => line.replace(/[|_]+/g, " ").replace(/\s+/g, " ").trim()).filter((line) => line.length > 1);
  const labelled: string[] = [];
  for (const line of raw) if (/\b(model|cat(?:alogue)?|catalog|part|item|code|sku)\b/i.test(line)) labelled.push(...(line.match(/[A-Z0-9][A-Z0-9._\/-]{2,18}/gi) || []));
  const allTokens = text.match(/\b[A-Z0-9][A-Z0-9._\/-]{2,18}\b/gi) || [];
  const candidates = [...labelled, ...allTokens].map((value) => value.replace(/^[^A-Z0-9]+|[^A-Z0-9]+$/gi, "").toUpperCase()).filter(Boolean).filter((value) => /[A-Z]/.test(value) && /\d/.test(value)).filter((value) => compact(value) !== barcodeCompact).filter((value) => !brandCompacts.has(compact(value))).filter((value) => !/^\d{5,14}$/.test(compact(value))).filter((value) => compact(value).length >= 4 && compact(value).length <= 18).filter((value) => !/(240V|230V|220V|50HZ|60HZ|IP\d\d|WATT|VOLT|AMP|BATCH|SERIAL|QTY|PACK)/i.test(value));
  const score = (value: string) => {
    let result = 0;
    const cleaned = compact(value);
    if (/[A-Z]{1,5}\d/.test(cleaned)) result += 4;
    if (/\d[A-Z]/.test(cleaned)) result += 2;
    if (cleaned.length >= 5 && cleaned.length <= 12) result += 2;
    if (labelled.some((candidate) => compact(candidate) === cleaned)) result += 5;
    if (/^[A-Z]{1,6}\d[A-Z0-9-]{2,12}$/.test(cleaned)) result += 4;
    if (knownProducts[cleaned]) result += 10;
    return result;
  };
  const model = candidates.sort((a, b) => score(b) - score(a))[0] || null;
  return { supplier, model, name: humanNameFromModel(model, supplier, text) };
}

function machineLike(name: string, barcode: string | null) {
  const compact = name.replace(/\s+/g, "");
  return name === barcode || /^[A-Z]{1,6}[A-Z0-9-]{2,12}$/i.test(compact) || /^\d{5,14}$/.test(compact);
}

async function photoBytes(key: string) {
  if (key.startsWith("data:image/")) {
    const comma = key.indexOf(",");
    if (comma < 0) throw new Error("invalid embedded photo");
    return Buffer.from(key.slice(comma + 1), "base64");
  }
  const image = await fetch(createDownloadUrl(key));
  if (!image.ok) throw new Error(`photo download ${image.status}`);
  return Buffer.from(await image.arrayBuffer());
}

async function main() {
  await prisma.scanEnrichmentQueue.updateMany({ where: { status: "PROCESSING", updatedAt: { lt: new Date(Date.now() - 15 * 60 * 1000) } }, data: { status: "PENDING", lastError: "Recovered stale processing job" } });
  const jobs = await prisma.scanEnrichmentQueue.findMany({ where: { status: "PENDING", attempts: { lt: 3 } }, orderBy: { createdAt: "asc" }, take: 50 });
  if (!jobs.length) {
    console.log("No pending scan jobs");
    return;
  }

  const worker = await createWorker("eng");
  await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
  try {
    for (const job of jobs) {
      const claimed = await prisma.scanEnrichmentQueue.updateMany({ where: { id: job.id, status: "PENDING" }, data: { status: "PROCESSING", attempts: { increment: 1 }, lastError: null } });
      if (claimed.count !== 1) continue;
      try {
        const target = await prisma.material.findUnique({ where: { id: job.materialId } });
        if (!target) throw new Error("Material disappeared before scan completed");
        const photo = job.photoUrl || target.photoStorageKey;
        if (!photo) throw new Error("No scan photo is attached");
        const bytes = await photoBytes(photo);
        if (bytes.length < 500) throw new Error(`Photo too small for reliable OCR (${bytes.length} bytes)`);
        const output = await worker.recognize(bytes);
        const text = output.data.text || "";
        const quantity = parseQuantity(text);
        if (!quantity) throw new Error("No reliable Qty / Pack / Rolls quantity found on label");
        const product = parseProduct(text, target.barcode || "");
        const name = machineLike(target.name, target.barcode) && product.name ? product.name : target.name;
        await prisma.$transaction([
          prisma.material.update({ where: { id: target.id }, data: { stockOnHand: { increment: quantity }, name, supplier: product.supplier || target.supplier, model: product.model || target.model, photoStorageKey: photo } }),
          prisma.auditLog.create({ data: { action: "STOCK_SCAN_COMPLETED", entityType: "Material", entityId: target.id, details: { barcode: target.barcode, quantity, jobId: job.id } } }),
          prisma.scanEnrichmentQueue.update({ where: { id: job.id }, data: { status: "DONE", lastError: null } }),
        ]);
        console.log(`Completed scan ${job.id}: +${quantity} -> ${name}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const fresh = await prisma.scanEnrichmentQueue.findUnique({ where: { id: job.id }, select: { attempts: true } });
        const failed = (fresh?.attempts || 3) >= 3;
        await prisma.scanEnrichmentQueue.update({ where: { id: job.id }, data: { status: failed ? "FAILED" : "PENDING", lastError: message.slice(0, 500) } });
        console.error(`Failed ${job.id}: ${message}`);
      }
    }
  } finally {
    await worker.terminate();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
