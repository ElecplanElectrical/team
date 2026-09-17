import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";

export const runtime = "nodejs";
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "aiAssistant")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI Assistant needs OPENAI_API_KEY configured in Railway." }, { status: 503 });

  const form = await req.formData();
  const image = form.get("image");
  const instruction = String(form.get("instruction") || "Organise this whiteboard into my calendar and reminders.").slice(0, 1000);

  if (!(image instanceof File) || !image.type.startsWith("image/")) return NextResponse.json({ error: "Please upload a whiteboard image." }, { status: 400 });
  if (image.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: "Image is too large. Maximum is 12 MB." }, { status: 413 });

  const [jobs, reminders] = await Promise.all([
    prisma.job.findMany({
      where: { status: { in: ["QUOTED", "SCHEDULED", "IN_PROGRESS"] } },
      select: { id: true, title: true, address: true, status: true, scheduledStart: true, scheduledEnd: true, client: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    prisma.reminder.findMany({ where: { userId: user.id, completed: false }, select: { title: true, dueAt: true }, orderBy: { dueAt: "asc" }, take: 40 }),
  ]);

  const jobIds = new Set(jobs.map((job) => job.id));
  const portalContext = {
    jobs: jobs.map((job) => ({ id: job.id, title: job.title, client: job.client.name, address: job.address, status: job.status, scheduledStart: job.scheduledStart, scheduledEnd: job.scheduledEnd })),
    openReminders: reminders,
  };
  const base64 = Buffer.from(await image.arrayBuffer()).toString("base64");
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
            jobId: { type: ["string", "null"] },
            startsAt: { type: ["string", "null"] },
            endsAt: { type: ["string", "null"] },
            dueDate: { type: ["string", "null"] },
            notes: { type: ["string", "null"] },
            confidence: { type: "number", minimum: 0, maximum: 1 },
          },
          required: ["kind", "title", "jobId", "startsAt", "endsAt", "dueDate", "notes", "confidence"],
        },
      },
    },
    required: ["summary", "proposals"],
  } as const;

  const prompt = `You are Elecplan's scheduling assistant for an electrical contractor in Melbourne, Australia. Local time is ${localNow}.\n\nUSER INSTRUCTION: ${instruction}\n\nWHITEBOARD LAYOUT RULES:\n- Bottom Monday-Friday row usually contains jobs for those weekdays.\n- Right-side checklist contains reminders/tasks.\n- Left calendar contains dated/timed commitments or jobs.\n- Crossed-out or clearly completed items should not be proposed.\n\nPORTAL CONTEXT (use it to match handwritten jobs to existing Elecplan jobs; only return a jobId when the match is strong):\n${JSON.stringify(portalContext)}\n\nReturn proposals only. Do not write data. Do not invent unreadable handwriting. If wording is uncertain, preserve the uncertainty in notes and reduce confidence. For an event with a reliable day but no written time, use 08:00-16:00 Melbourne time and state that the time was assumed. For reminders with no reliable date, set dueDate to null so the UI leaves them unselected. For generic appointments/events jobId must be null.`;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL || "gpt-5.6-luna",
        input: [{ role: "user", content: [{ type: "input_text", text: prompt }, { type: "input_image", image_url: `data:${image.type};base64,${base64}`, detail: "high" }] }],
        text: { format: { type: "json_schema", name: "elecplan_whiteboard_plan", strict: true, schema } },
      }),
    });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: "AI could not read the board right now." }, { status: 502 });

    const outputText = data.output_text ?? data.output?.flatMap((item: { content?: Array<{ type?: string; text?: string }> }) => item.content ?? []).find((part: { type?: string }) => part.type === "output_text")?.text;
    if (!outputText) return NextResponse.json({ error: "AI returned no readable plan." }, { status: 502 });

    const parsed = JSON.parse(outputText) as { summary?: string; proposals?: Array<{ kind: "event" | "reminder"; title: string; jobId?: string | null; startsAt?: string | null; endsAt?: string | null; dueDate?: string | null; notes?: string | null; confidence: number }> };
    const proposals = (parsed.proposals ?? [])
      .filter((proposal) => proposal?.title && ((proposal.kind === "event" && proposal.startsAt && proposal.endsAt) || proposal.kind === "reminder"))
      .map((proposal) => ({
        kind: proposal.kind,
        title: proposal.title.trim().slice(0, 200),
        jobId: proposal.jobId && jobIds.has(proposal.jobId) ? proposal.jobId : undefined,
        startsAt: proposal.startsAt || undefined,
        endsAt: proposal.endsAt || undefined,
        dueDate: proposal.dueDate || undefined,
        notes: [proposal.notes, proposal.confidence < 0.75 ? `AI confidence: ${Math.round(proposal.confidence * 100)}% — check this item.` : null].filter(Boolean).join(" ") || undefined,
      }));

    return NextResponse.json({ summary: parsed.summary || "Board read. Check every item before applying.", proposals });
  } catch (error) {
    console.error("AI_ASSISTANT_ANALYSE_FAILED", error);
    return NextResponse.json({ error: "Could not analyse whiteboard image." }, { status: 502 });
  }
}
