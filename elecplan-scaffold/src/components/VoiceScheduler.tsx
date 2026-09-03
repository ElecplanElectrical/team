"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Keyboard, Mic, MicOff, Send, X } from "lucide-react";
import type { Role } from "@prisma/client";

type JobChoice = { id: string; title: string; client?: string | null };
type EmployeeChoice = { id: string; name: string };
type Conflict = { id: string; title: string; startsAt: string; endsAt: string; assignedTo: string | null };

type Proposal = {
  title: string;
  type: "job" | "call";
  jobId: string | null;
  jobLabel: string | null;
  assignedToId: string | null;
  assignedToLabel: string | null;
  date: string;
  start: string;
  end: string;
};

type RecognitionResultEvent = Event & {
  results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
};

type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

const UI = {
  bg: "#061525",
  panel: "#0a2038",
  border: "rgba(77,150,221,.25)",
  text: "#f5f9ff",
  mute: "#91a8c1",
  faint: "#607892",
  blue: "var(--brand-primary, #168dff)",
  cyan: "var(--brand-accent, #25c7ff)",
  green: "#19d3a2",
  orange: "#ff9f1c",
  red: "#ff5e72",
};

const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function ymd(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function resolveDate(text: string) {
  const now = new Date();
  if (/\btomorrow\b/.test(text)) {
    const date = new Date(now);
    date.setDate(date.getDate() + 1);
    return ymd(date);
  }
  if (/\btoday\b/.test(text)) return ymd(now);

  for (let index = 0; index < weekdays.length; index += 1) {
    const day = weekdays[index];
    if (new RegExp(`\\b${day}\\b`).test(text)) {
      const date = new Date(now);
      let delta = (index - now.getDay() + 7) % 7;
      if (delta === 0 || new RegExp(`\\bnext\\s+${day}\\b`).test(text)) delta += 7;
      date.setDate(date.getDate() + delta);
      return ymd(date);
    }
  }
  return ymd(now);
}

function parseClock(rawHour: string, rawMinute?: string, ampm?: string) {
  let hour = Number(rawHour);
  const minute = Number(rawMinute ?? "0");
  if (ampm === "pm" && hour < 12) hour += 12;
  if (ampm === "am" && hour === 12) hour = 0;
  if (!ampm && hour < 4) hour += 12;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function addMinutes(time: string, minutesToAdd: number) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutesToAdd;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function scoreMatch(haystack: string, needle: string) {
  const normalizedHaystack = haystack.toLowerCase();
  const normalizedNeedle = needle.toLowerCase();
  if (normalizedNeedle.includes(normalizedHaystack)) return 100;
  const words = normalizedHaystack.split(/\s+/).filter((word) => word.length > 2);
  return words.reduce((score, word) => score + (normalizedNeedle.includes(word) ? 10 : 0), 0);
}

function buildProposal(text: string, jobs: JobChoice[], employees: EmployeeChoice[], role: Role, currentUserId: string): Proposal {
  const lower = text.toLowerCase().trim();
  const timeMatch = lower.match(/(?:\bat\b|\bfrom\b)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  const start = timeMatch ? parseClock(timeMatch[1], timeMatch[2], timeMatch[3]) : "09:00";

  const untilMatch = lower.match(/\buntil\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  const durationMatch = lower.match(/\bfor\s*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/);
  const end = untilMatch
    ? parseClock(untilMatch[1], untilMatch[2], untilMatch[3])
    : addMinutes(start, durationMatch ? Number(durationMatch[1]) * 60 : 60);

  const bestJob = jobs
    .map((job) => ({ job, score: Math.max(scoreMatch(job.title, lower), job.client ? scoreMatch(job.client, lower) : 0) }))
    .sort((a, b) => b.score - a.score)[0];
  const matchedJob = bestJob && bestJob.score >= 10 ? bestJob.job : null;

  const bestEmployee = employees
    .map((employee) => ({ employee, score: scoreMatch(employee.name, lower) }))
    .sort((a, b) => b.score - a.score)[0];
  const matchedEmployee = bestEmployee && bestEmployee.score >= 10 ? bestEmployee.employee : null;

  const crewOnly = role === "EMPLOYEE";
  const fallbackTitle = text.trim().replace(/^(schedule|book|create)\s+/i, "").slice(0, 120) || "Calendar event";
  return {
    title: matchedJob?.title ?? fallbackTitle,
    type: crewOnly || !matchedJob ? "call" : "job",
    jobId: crewOnly ? null : matchedJob?.id ?? null,
    jobLabel: crewOnly ? null : matchedJob ? `${matchedJob.title}${matchedJob.client ? ` · ${matchedJob.client}` : ""}` : null,
    assignedToId: crewOnly ? currentUserId : matchedEmployee?.id ?? null,
    assignedToLabel: crewOnly ? "Me" : matchedEmployee?.name ?? null,
    date: resolveDate(lower),
    start,
    end,
  };
}

export default function VoiceScheduler({
  open,
  onClose,
  onDone,
  jobs,
  employees,
  role,
  currentUserId,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
  jobs: JobChoice[];
  employees: EmployeeChoice[];
  role: Role;
  currentUserId: string;
}) {
  const [transcript, setTranscript] = useState("");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [listening, setListening] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const speechAvailable = useMemo(() => {
    if (typeof window === "undefined") return false;
    const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
  }, []);

  if (!open) return null;

  function toIso(date: string, time: string) {
    return new Date(`${date}T${time}:00`).toISOString();
  }

  async function preview(textOverride?: string) {
    const text = (textOverride ?? transcript).trim();
    if (!text) return;
    setError(null);
    const next = buildProposal(text, jobs, employees, role, currentUserId);
    setProposal(next);
    const res = await fetch("/api/events/conflicts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startsAt: toIso(next.date, next.start),
        endsAt: toIso(next.date, next.end),
        assignedToId: next.assignedToId,
        jobId: next.jobId,
      }),
    });
    if (res.ok) {
      const body = await res.json();
      setConflicts(body.conflicts ?? []);
    } else {
      setConflicts([]);
    }
  }

  function startListening() {
    const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const RecognitionCtor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!RecognitionCtor) {
      setError("Voice recognition is not available in this browser. Type the scheduling request below instead.");
      return;
    }
    const recognition = new RecognitionCtor();
    recognition.lang = "en-AU";
    recognition.continuous = false;
    recognition.interimResults = true;
    setListening(true);
    setError(null);
    recognition.onresult = (event) => {
      let text = "";
      for (let index = 0; index < event.results.length; index += 1) text += event.results[index][0].transcript;
      setTranscript(text);
    };
    recognition.onerror = () => {
      setListening(false);
      setError("I couldn’t hear that clearly. Try again or type the request.");
    };
    recognition.onend = () => {
      setListening(false);
      setTimeout(() => {
        const input = document.querySelector<HTMLTextAreaElement>("[data-voice-schedule-input]");
        if (input?.value.trim()) void preview(input.value);
      }, 0);
    };
    recognition.start();
  }

  async function create(sendClientText: boolean) {
    if (!proposal || saving) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: proposal.title,
        type: proposal.type,
        jobId: proposal.jobId,
        assignedToId: proposal.assignedToId,
        startsAt: toIso(proposal.date, proposal.start),
        endsAt: toIso(proposal.date, proposal.end),
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "Could not create that calendar event.");
      setSaving(false);
      return;
    }
    if (sendClientText && proposal.jobId) {
      const textRes = await fetch(`/api/jobs/${proposal.jobId}/confirmation`, { method: "POST" });
      if (!textRes.ok) {
        const body = await textRes.json().catch(() => null);
        setError(`Event created, but client text failed: ${body?.error ?? "check SMS settings"}`);
        setSaving(false);
        onDone();
        return;
      }
    }
    setSaving(false);
    onDone();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/65 p-0 backdrop-blur-sm md:items-center md:p-5" onClick={onClose}>
      <section className="w-full max-w-xl rounded-t-2xl p-5 shadow-2xl md:rounded-2xl" style={{ background: UI.bg, border: `1px solid ${UI.border}` }} onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: "rgb(var(--brand-primary-rgb, 22 141 255) / .14)", color: UI.cyan, border: "1px solid rgb(var(--brand-accent-rgb, 37 199 255) / .22)" }}><Mic size={21} /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2"><h2 className="text-base font-semibold" style={{ color: UI.text }}>Voice scheduler</h2><span className="rounded-full px-2 py-0.5 text-[9px] font-semibold" style={{ color: UI.cyan, background: "rgb(var(--brand-primary-rgb, 22 141 255) / .12)" }}>BETA</span></div>
            <p className="mt-1 text-xs leading-5" style={{ color: UI.mute }}>Try: “Schedule switchboard upgrade tomorrow at 7am with Tom for 2 hours.”</p>
          </div>
          <button type="button" onClick={onClose} className="p-1" style={{ color: UI.mute }} aria-label="Close voice scheduler"><X size={18} /></button>
        </div>

        <button type="button" onClick={startListening} className="mx-auto mt-6 flex h-24 w-24 items-center justify-center rounded-full transition active:scale-95" style={{ background: listening ? "radial-gradient(circle,var(--brand-accent, #2a9cff),var(--brand-primary-deep, #0d6fe7))" : "radial-gradient(circle,var(--brand-primary, #138cff),var(--brand-primary-deep, #075fd0))", color: "white", boxShadow: listening ? "0 0 0 12px rgb(var(--brand-primary-rgb, 22 141 255) / .10),0 0 50px rgb(var(--brand-primary-rgb, 22 141 255) / .45)" : "0 0 35px rgb(var(--brand-primary-rgb, 22 141 255) / .25)" }}>
          {listening ? <MicOff size={34} /> : <Mic size={34} />}
        </button>
        <p className="mt-3 text-center text-xs font-medium" style={{ color: listening ? UI.cyan : UI.mute }}>{listening ? "Listening…" : speechAvailable ? "Tap to speak" : "Voice unavailable here — type below"}</p>

        <div className="mt-5">
          <label className="mb-1.5 flex items-center gap-2 text-[11px] font-medium" style={{ color: UI.mute }}><Keyboard size={13} /> Scheduling request</label>
          <textarea data-voice-schedule-input value={transcript} onChange={(event) => setTranscript(event.target.value)} rows={3} placeholder="Schedule a job tomorrow at 9am with Jack for 2 hours" className="w-full resize-none rounded-xl px-3 py-3 text-sm outline-none" style={{ background: UI.panel, border: `1px solid ${UI.border}`, color: UI.text }} />
          <button type="button" onClick={() => void preview()} disabled={!transcript.trim()} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-40" style={{ background: "rgb(var(--brand-primary-rgb, 22 141 255) / .14)", color: UI.cyan, border: "1px solid rgb(var(--brand-primary-rgb, 22 141 255) / .25)" }}><Send size={14} /> Interpret request</button>
        </div>

        {proposal && (
          <div className="mt-4 rounded-xl p-4" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}>
            <div className="flex items-center gap-2"><CheckCircle2 size={16} style={{ color: UI.green }} /><h3 className="text-sm font-semibold" style={{ color: UI.text }}>Ready to schedule</h3></div>
            <dl className="mt-3 grid grid-cols-[90px_1fr] gap-x-3 gap-y-2 text-xs">
              <dt style={{ color: UI.faint }}>Event</dt><dd style={{ color: UI.text }}>{proposal.title}</dd>
              <dt style={{ color: UI.faint }}>When</dt><dd style={{ color: UI.text }}>{proposal.date} · {proposal.start}–{proposal.end}</dd>
              <dt style={{ color: UI.faint }}>Job</dt><dd style={{ color: proposal.jobLabel ? UI.text : UI.orange }}>{proposal.jobLabel ?? "No job confidently matched"}</dd>
              <dt style={{ color: UI.faint }}>Crew</dt><dd style={{ color: proposal.assignedToLabel ? UI.text : UI.orange }}>{proposal.assignedToLabel ?? "Unassigned"}</dd>
            </dl>
            {conflicts.length > 0 && <div className="mt-3 rounded-lg p-3 text-xs" style={{ background: "rgba(255,159,28,.09)", border: "1px solid rgba(255,159,28,.24)", color: UI.orange }}><div className="flex items-center gap-2 font-semibold"><AlertTriangle size={14} /> {conflicts.length} scheduling conflict{conflicts.length === 1 ? "" : "s"}</div><div className="mt-1 space-y-1">{conflicts.slice(0, 3).map((item) => <p key={item.id}>{item.title}{item.assignedTo ? ` · ${item.assignedTo}` : ""}</p>)}</div></div>}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              {proposal.type === "job" && proposal.jobId && role !== "EMPLOYEE" && <button type="button" disabled={saving} onClick={() => void create(true)} className="rounded-lg px-4 py-2.5 text-sm font-semibold" style={{ color: UI.cyan, border: "1px solid rgb(var(--brand-accent-rgb, 37 199 255) / .35)" }}>Create & text client</button>}
              <button type="button" disabled={saving} onClick={() => void create(false)} className="rounded-lg px-4 py-2.5 text-sm font-semibold" style={{ background: UI.blue, color: "white" }}>{saving ? "Scheduling…" : conflicts.length ? "Schedule anyway" : "Confirm schedule"}</button>
            </div>
          </div>
        )}
        {error && <p className="mt-3 text-xs" style={{ color: UI.red }}>{error}</p>}
      </section>
    </div>
  );
}
