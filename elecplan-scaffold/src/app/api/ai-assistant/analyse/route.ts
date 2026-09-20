import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";

export const runtime = "nodejs";
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "aiAssistant")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const apiKey = process.env.OPENAI_API_KEY?.trim();

  const form = await req.formData();
  const upload = form.get("file");
  const instruction = String(form.get("instruction") || "Organise this whiteboard into my calendar and reminders.").slice(0, 1000);

  if (!(upload instanceof File) && !instruction.trim()) return NextResponse.json({ error: "Add a photo, screenshot, TXT file or some text to analyse." }, { status: 400 });
  if (upload instanceof File && upload.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: "File is too large. Maximum is 12 MB." }, { status: 413 });

  let attachmentContent: { type: "input_image"; image_url: string; detail: "high" } | { type: "input_text"; text: string } | null = null;
  if (upload instanceof File) {
    if (ALLOWED_IMAGE_TYPES.has(upload.type)) {
      const base64 = Buffer.from(await upload.arrayBuffer()).toString("base64");
      attachmentContent = { type: "input_image", image_url: `data:${upload.type};base64,${base64}`, detail: "high" };
    } else if (upload.type === "text/plain") {
      attachmentContent = { type: "input_text", text: (await upload.text()).slice(0, 50000) };
    } else if (upload.type === "application/pdf") {
      const mod = await import("pdf-parse");
      const pdfParse = (mod.default ?? mod) as unknown as (input: Buffer) => Promise<{ text?: string }>;
      const parsedPdf = await pdfParse(Buffer.from(await upload.arrayBuffer()));
      const text = parsedPdf.text?.trim();
      if (!text) return NextResponse.json({ error: "The PDF did not contain readable text. Try a screenshot or clearer copy." }, { status: 422 });
      attachmentContent = { type: "input_text", text: text.slice(0, 50000) };
    } else {
      return NextResponse.json({ error: "Use PDF, JPG, PNG, WebP or TXT." }, { status: 415 });
    }
  }
  const localNow = new Intl.DateTimeFormat("en-AU", { dateStyle: "full", timeStyle: "long", timeZone: "Australia/Melbourne" }).format(new Date());

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      summary: { type: "string" },
      proposals: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            kind: { type: "string", enum: ["event", "reminder"] },
            title: { type: "string" },
            startsAt: { type: ["string", "null"] },
            endsAt: { type: ["string", "null"] },
            dueDate: { type: ["string", "null"] },
            notes: { type: ["string", "null"] },
            confidence: { type: "number", minimum: 0, maximum: 1 },
          },
          required: ["kind", "title", "startsAt", "endsAt", "dueDate", "notes", "confidence"],
        },
      },
    },
    required: ["summary", "proposals"],
  } as const;

  const prompt = `You are Elecplan's scheduling assistant for an electrical contractor in Melbourne, Australia. Read any supplied whiteboard photo, screenshot, message, email screenshot, document text or typed/voice instruction. Local time is ${localNow}.\n\nUSER INSTRUCTION: ${instruction}\n\nPRIVACY BOUNDARY:\n- You receive only this uploaded image and the instruction above.\n- You do not have access to Elecplan pages, clients, jobs, reminders, documents, users, or any other portal data.\n- Do not assume or request hidden portal context.\n\nWHEN THE INPUT IS A WHITEBOARD, USE THESE LAYOUT RULES:\n- Bottom Monday-Friday row usually contains jobs for those weekdays.\n- Right-side checklist contains reminders/tasks.\n- Left calendar contains dated/timed commitments or jobs.\n- Crossed-out or clearly completed items should not be proposed.\n\nReturn proposals only. Do not write data. Do not invent unreadable handwriting. If wording is uncertain, preserve the uncertainty in notes and reduce confidence. For an event with a reliable day but no written time, use 08:00-16:00 Melbourne time and state that the time was assumed. For reminders with no reliable date, set dueDate to null so the UI leaves them unselected.`;

  if (!apiKey) {
    return NextResponse.json({
      error: "AI Assistant is ready, but the OpenAI API key has not been connected in Railway yet.",
      code: "AI_NOT_CONFIGURED",
    }, { status: 503 });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL || "gpt-5.6-luna",
        input: [{ role: "user", content: [{ type: "input_text", text: prompt }, ...(attachmentContent ? [attachmentContent] : [])] }],
        text: { format: { type: "json_schema", name: "elecplan_whiteboard_plan", strict: true, schema } },
      }),
    });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: "AI could not read the board right now." }, { status: 502 });

    const outputText = data.output_text ?? data.output?.flatMap((item: { content?: Array<{ type?: string; text?: string }> }) => item.content ?? []).find((part: { type?: string }) => part.type === "output_text")?.text;
    if (!outputText) return NextResponse.json({ error: "AI returned no readable plan." }, { status: 502 });

    const parsed = JSON.parse(outputText) as { summary?: string; proposals?: Array<{ kind: "event" | "reminder"; title: string; startsAt?: string | null; endsAt?: string | null; dueDate?: string | null; notes?: string | null; confidence: number }> };

    // Privacy-preserving local match: OpenAI never receives portal data. After the
    // response returns, the Elecplan server may match an event title to an
    // existing active job using only job IDs/titles kept inside Elecplan.
    const activeJobs = await prisma.job.findMany({
      where: { status: { in: ["QUOTED", "SCHEDULED", "IN_PROGRESS"] } },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const matchJob = (title: string) => {
      const needle = normalise(title);
      if (!needle) return undefined;
      const exact = activeJobs.find((job) => normalise(job.title) === needle);
      if (exact) return exact.id;
      const strong = activeJobs.filter((job) => {
        const candidate = normalise(job.title);
        return candidate.length >= 6 && (needle.includes(candidate) || candidate.includes(needle));
      });
      return strong.length === 1 ? strong[0].id : undefined;
    };

    const proposals = (parsed.proposals ?? [])
      .filter((proposal) => proposal?.title && ((proposal.kind === "event" && proposal.startsAt && proposal.endsAt) || proposal.kind === "reminder"))
      .map((proposal) => ({
        kind: proposal.kind,
        title: proposal.title.trim().slice(0, 200),
        jobId: proposal.kind === "event" ? matchJob(proposal.title) : undefined,
        startsAt: proposal.startsAt || undefined,
        endsAt: proposal.endsAt || undefined,
        dueDate: proposal.dueDate || undefined,
        notes: [proposal.notes, proposal.confidence < 0.75 ? `AI confidence: ${Math.round(proposal.confidence * 100)}% — check this item.` : null].filter(Boolean).join(" ") || undefined,
      }));

    return NextResponse.json({ summary: parsed.summary || "Board read. Check every item before applying.", proposals });
  } catch (error) {
    console.error("AI_ASSISTANT_ANALYSE_FAILED", error);
    return NextResponse.json({ error: "Could not analyse the supplied content." }, { status: 502 });
  }
}
