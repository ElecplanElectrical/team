import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const DEFAULT_INSTRUCTION = "Organise this whiteboard into my calendar and reminders.";
const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

type ProposalLike = {
  kind: "event" | "reminder";
  title: string;
  startsAt?: string;
  endsAt?: string;
  dueDate?: string;
  notes?: string;
};

function melbourneToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Melbourne",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return new Date(Date.UTC(value("year"), value("month") - 1, value("day")));
}

function targetDate(line: string): Date | null {
  const today = melbourneToday();

  const au = line.match(/\b(\d{1,2})[\/.\-](\d{1,2})(?:[\/.\-](\d{2,4}))?\b/);
  if (au) {
    let year = au[3] ? Number(au[3]) : today.getUTCFullYear();
    if (year < 100) year += 2000;
    const month = Number(au[2]);
    const day = Number(au[1]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) return new Date(Date.UTC(year, month - 1, day));
  }

  const iso = line.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if (iso) return new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])));

  const lower = line.toLowerCase();
  const target = WEEKDAYS.findIndex((day) => lower.includes(day) || lower.includes(day.slice(0, 3)));
  if (target >= 0) {
    const delta = (target - today.getUTCDay() + 7) % 7;
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() + delta);
    return date;
  }

  if (/\btoday\b/i.test(line)) return today;
  if (/\btomorrow\b/i.test(line)) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() + 1);
    return date;
  }

  return null;
}

function timeOfDay(line: string): { hour: number; minute: number } | null {
  const twelve = line.match(/\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(am|pm)\b/i);
  if (twelve) {
    let hour = Number(twelve[1]) % 12;
    if (twelve[3].toLowerCase() === "pm") hour += 12;
    return { hour, minute: Number(twelve[2] || 0) };
  }

  const twentyFour = line.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  return twentyFour ? { hour: Number(twentyFour[1]), minute: Number(twentyFour[2]) } : null;
}

function melbourneOffset(date: Date) {
  const offsetName = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
    timeZoneName: "longOffset",
    hour: "2-digit",
  }).formatToParts(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12)))
    .find((part) => part.type === "timeZoneName")?.value;
  const match = offsetName?.match(/GMT([+-]\d{2}:\d{2})/);
  return match?.[1] || "+10:00";
}

function localIso(date: Date, hour: number, minute: number) {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00${melbourneOffset(date)}`;
}

function isCalendarCheck(instruction: string) {
  return /\b(available|availability|free|booked|booking|bookings|what(?:'s| is) on|calendar|schedule)\b/i.test(instruction)
    && /\b(today|tomorrow|next|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}[\/.\-]\d{1,2})\b/i.test(instruction);
}

function shortTime(date: Date) {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function shortDay(date: Date) {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(date);
}

async function answerCalendarCheck(instruction: string) {
  const day = targetDate(instruction);
  if (!day) return null;

  const start = new Date(localIso(day, 0, 0));
  const endDay = new Date(day);
  endDay.setUTCDate(endDay.getUTCDate() + 1);
  const end = new Date(localIso(endDay, 0, 0));

  const events = await prisma.jobEvent.findMany({
    where: { startsAt: { lt: end }, endsAt: { gt: start } },
    select: { title: true, startsAt: true, endsAt: true, type: true },
    orderBy: { startsAt: "asc" },
    take: 100,
  });

  const label = shortDay(start);
  if (!events.length) {
    return `${label}: nothing is booked in the Elecplan calendar.`;
  }

  const booked = events
    .map((event) => `${event.title} ${shortTime(event.startsAt)}–${shortTime(event.endsAt)}`)
    .join("; ");

  const wantsAvailability = /\b(available|availability|free)\b/i.test(instruction);
  if (!wantsAvailability) return `${label}: ${events.length} booking${events.length === 1 ? "" : "s"} — ${booked}.`;

  const workStart = new Date(localIso(day, 7, 0));
  const workEnd = new Date(localIso(day, 17, 0));
  const busy = events
    .map((event) => ({
      start: new Date(Math.max(event.startsAt.getTime(), workStart.getTime())),
      end: new Date(Math.min(event.endsAt.getTime(), workEnd.getTime())),
    }))
    .filter((slot) => slot.end > slot.start)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const gaps: Array<{ start: Date; end: Date }> = [];
  let cursor = workStart;
  for (const slot of busy) {
    if (slot.start > cursor) gaps.push({ start: cursor, end: slot.start });
    if (slot.end > cursor) cursor = slot.end;
  }
  if (cursor < workEnd) gaps.push({ start: cursor, end: workEnd });

  const free = gaps.length
    ? gaps.map((gap) => `${shortTime(gap.start)}–${shortTime(gap.end)}`).join(", ")
    : "no free time between 7:00am and 5:00pm";

  return `${label}: booked — ${booked}. Free — ${free}.`;
}

function tidyTitle(line: string) {
  return line
    .replace(/^[-*•☐☑✓\s]+/, "")
    .replace(/\b(?:mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b/gi, "")
    .replace(/\b\d{1,2}[\/.\-]\d{1,2}(?:[\/.\-]\d{2,4})?\b/g, "")
    .replace(/\b(?:1[0-2]|0?[1-9])(?::[0-5]\d)?\s*(?:am|pm)\b/gi, "")
    .replace(/\b(?:[01]?\d|2[0-3]):[0-5]\d\b/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s:,-]+|[\s:,-]+$/g, "")
    .trim()
    .slice(0, 200);
}

function localProposals(source: string): ProposalLike[] {
  const lines = source
    .replace(/\r/g, "\n")
    .split(/\n+/)
    .map((line) => line.replace(/[|_]+/g, " ").replace(/\s+/g, " ").trim())
    .filter((line) => line.length >= 3 && line.length <= 220)
    .filter((line) => !/^(calendar|reminders?|notes?|monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i.test(line))
    .slice(0, 60);

  const proposals: ProposalLike[] = [];
  for (const line of lines) {
    const date = targetDate(line);
    const time = timeOfDay(line);
    const title = tidyTitle(line);
    if (!title || title.length < 2) continue;

    const looksLikeTask = /^[-*•☐☑]/.test(line) || /\b(remind|call|order|buy|follow up|follow-up|todo|to do|pick up|collect|send|email|book)\b/i.test(line);

    if (date || time) {
      const day = date || melbourneToday();
      const startHour = time?.hour ?? 8;
      const startMinute = time?.minute ?? 0;
      const end = new Date(day);
      const endHour = time ? Math.min(startHour + 1, 23) : 16;
      proposals.push({
        kind: "event",
        title,
        startsAt: localIso(day, startHour, startMinute),
        endsAt: localIso(end, endHour, startMinute),
        notes: time ? "Read locally from the supplied content — check the time before applying." : "Read locally from the supplied content. No time was written, so 8:00am–4:00pm was assumed.",
      });
    } else if (looksLikeTask || lines.length <= 12) {
      proposals.push({
        kind: "reminder",
        title,
        notes: "Read locally from the supplied content. No reliable due date was detected, so this item is left unselected.",
      });
    }
  }

  return proposals.slice(0, 50);
}

async function attachJobMatches(proposals: ProposalLike[]) {
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

  return proposals.map((proposal) => ({
    ...proposal,
    jobId: proposal.kind === "event" ? matchJob(proposal.title) : undefined,
  }));
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(user.role, "aiAssistant")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const form = await req.formData();
  const upload = form.get("file");
  const instruction = String(form.get("instruction") || DEFAULT_INSTRUCTION).slice(0, 1000);

  if (!(upload instanceof File) && isCalendarCheck(instruction)) {
    try {
      const answer = await answerCalendarCheck(instruction);
      if (answer) return NextResponse.json({ summary: answer, proposals: [], mode: "calendar-check" });
    } catch (error) {
      console.error("AI_ASSISTANT_CALENDAR_CHECK_FAILED", error);
      return NextResponse.json({ error: "Could not check the Elecplan calendar right now." }, { status: 502 });
    }
  }

  if (!(upload instanceof File) && !instruction.trim()) {
    return NextResponse.json({ error: "Add a photo, screenshot, PDF, TXT file or some text to analyse." }, { status: 400 });
  }
  if (upload instanceof File && upload.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: "File is too large. Maximum is 12 MB." }, { status: 413 });
  }

  let attachmentContent: { type: "input_image"; image_url: string; detail: "high" } | { type: "input_text"; text: string } | null = null;
  let localText = "";
  let imageBytes: Buffer | null = null;

  if (upload instanceof File) {
    if (ALLOWED_IMAGE_TYPES.has(upload.type)) {
      imageBytes = Buffer.from(await upload.arrayBuffer());
      attachmentContent = { type: "input_image", image_url: `data:${upload.type};base64,${imageBytes.toString("base64")}`, detail: "high" };
    } else if (upload.type === "text/plain") {
      localText = (await upload.text()).slice(0, 50000);
      attachmentContent = { type: "input_text", text: localText };
    } else if (upload.type === "application/pdf") {
      const mod = await import("pdf-parse");
      const pdfParse = (mod.default ?? mod) as unknown as (input: Buffer) => Promise<{ text?: string }>;
      const parsedPdf = await pdfParse(Buffer.from(await upload.arrayBuffer()));
      localText = parsedPdf.text?.trim().slice(0, 50000) || "";
      if (!localText) return NextResponse.json({ error: "The PDF did not contain readable text. Try a screenshot or clearer copy." }, { status: 422 });
      attachmentContent = { type: "input_text", text: localText };
    } else {
      return NextResponse.json({ error: "Use PDF, JPG, PNG, WebP or TXT." }, { status: 415 });
    }
  }

  if (!apiKey) {
    try {
      if (imageBytes) {
        const { createWorker } = await import("tesseract.js");
        const worker = await createWorker("eng");
        try {
          const result = await worker.recognize(imageBytes);
          localText = result.data.text?.trim().slice(0, 50000) || "";
        } finally {
          await worker.terminate();
        }
      }

      const instructionText = instruction !== DEFAULT_INSTRUCTION ? instruction : "";
      const source = [localText, instructionText].filter(Boolean).join("\n");
      if (!source.trim()) {
        return NextResponse.json({ error: "I could not read enough text from that file. Try a clearer image or type the instruction." }, { status: 422 });
      }

      const proposals = await attachJobMatches(localProposals(source));
      return NextResponse.json({
        summary: proposals.length
          ? "I read that and found some actionable items. Check them before applying."
          : "I read that, but I could not find a reliable dated event or reminder.",
        proposals,
        mode: "local",
      });
    } catch (error) {
      console.error("AI_ASSISTANT_LOCAL_FALLBACK_FAILED", error);
      return NextResponse.json({ error: "Could not read the supplied content locally." }, { status: 502 });
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

  const prompt = `You are Elecplan's scheduling assistant for an electrical contractor in Melbourne, Australia. Read any supplied whiteboard photo, screenshot, message, email screenshot, document text or typed/voice instruction. Local time is ${localNow}.

USER INSTRUCTION: ${instruction}

PRIVACY BOUNDARY:
- You receive only this uploaded image and the instruction above.
- You do not have access to Elecplan pages, clients, jobs, reminders, documents, users, or any other portal data.
- Do not assume or request hidden portal context.

WHEN THE INPUT IS A WHITEBOARD, USE THESE LAYOUT RULES:
- Bottom Monday-Friday row usually contains jobs for those weekdays.
- Right-side checklist contains reminders/tasks.
- Left calendar contains dated/timed commitments or jobs.
- Crossed-out or clearly completed items should not be proposed.

Return proposals only. Do not write data. Do not invent unreadable handwriting. If wording is uncertain, preserve the uncertainty in notes and reduce confidence. For an event with a reliable day but no written time, use 08:00-16:00 Melbourne time and state that the time was assumed. For reminders with no reliable date, set dueDate to null so the UI leaves them unselected.`;

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

    const proposals = await attachJobMatches(
      (parsed.proposals ?? [])
        .filter((proposal) => proposal?.title && ((proposal.kind === "event" && proposal.startsAt && proposal.endsAt) || proposal.kind === "reminder"))
        .map((proposal) => ({
          kind: proposal.kind,
          title: proposal.title.trim().slice(0, 200),
          startsAt: proposal.startsAt || undefined,
          endsAt: proposal.endsAt || undefined,
          dueDate: proposal.dueDate || undefined,
          notes: [proposal.notes, proposal.confidence < 0.75 ? `AI confidence: ${Math.round(proposal.confidence * 100)}% — check this item.` : null].filter(Boolean).join(" ") || undefined,
        })),
    );

    return NextResponse.json({ summary: parsed.summary || "Board read. Check every item before applying.", proposals, mode: "ai" });
  } catch (error) {
    console.error("AI_ASSISTANT_ANALYSE_FAILED", error);
    return NextResponse.json({ error: "Could not analyse the supplied content." }, { status: 502 });
  }
}
