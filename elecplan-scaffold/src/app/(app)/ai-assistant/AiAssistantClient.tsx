"use client";
/* eslint-disable @next/next/no-img-element -- object URLs are used for a local, unsaved capture preview. */

import { useMemo, useRef, useState } from "react";
import { Camera, CheckCircle2, ImagePlus, Loader2, Mic, MicOff, Sparkles, Upload, X } from "lucide-react";

type RecognitionEvent = Event & {
  results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>;
};

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

type Proposal = {
  kind: "event" | "reminder";
  title: string;
  startsAt?: string;
  endsAt?: string;
  dueDate?: string;
  notes?: string;
  selected: boolean;
};

export default function AiAssistantClient() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<Proposal[]>([]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<Recognition | null>(null);

  const selected = useMemo(() => items.filter((x) => x.selected).length, [items]);

  function choose(next?: File) {
    if (!next) return;
    setFile(next);
    setItems([]);
    setStatus("");
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(next));
  }

  function toggleVoice() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const browser = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const RecognitionCtor = browser.SpeechRecognition || browser.webkitSpeechRecognition;
    if (!RecognitionCtor) {
      setStatus("Voice input is not available in this browser. You can still type the instruction.");
      return;
    }
    const recognition = new RecognitionCtor();
    recognition.lang = "en-AU";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognitionRef.current = recognition;
    setListening(true);
    setStatus("Listening — tell the assistant what to do.");
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = 0; index < event.results.length; index += 1) transcript += event.results[index][0].transcript;
      setMessage(transcript.trim());
    };
    recognition.onerror = () => {
      setListening(false);
      setStatus("I couldn’t hear that clearly. Tap the microphone and try again.");
    };
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
      setStatus((current) => current.startsWith("Listening") ? "Voice instruction ready. Check it, then read the whiteboard." : current);
    };
    recognition.start();
  }

  async function analyse() {
    if (!file) return;
    setBusy(true);
    setStatus("");
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("instruction", message || "Organise this whiteboard into my calendar and reminders.");
      const response = await fetch("/api/ai-assistant/analyse", { method: "POST", body: fd });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not analyse board");
      setItems((data.proposals || []).map((x: Proposal) => ({ ...x, selected: Boolean(x.startsAt || x.dueDate) })));
      setStatus(data.summary || "Board read. Check the preview before applying.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not analyse board");
    } finally {
      setBusy(false);
    }
  }

  async function apply() {
    const proposals = items.filter((x) => x.selected);
    if (!proposals.length) return;
    setBusy(true);
    try {
      const response = await fetch("/api/ai-assistant/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ proposals }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not apply changes");
      setStatus(`Done — ${data.created} item${data.created === 1 ? "" : "s"} added to Elecplan.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not apply changes");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <div>
          <div className="flex items-center gap-2 text-2xl font-semibold"><Sparkles className="h-6 w-6" />AI Assistant</div>
          <p className="mt-1 text-sm text-slate-400">Photograph the weekly whiteboard. Elecplan reads it, proposes calendar events and reminders, then waits for your approval.</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/[.04] p-4 md:p-5">
            <h2 className="font-semibold">1. Add whiteboard photo</h2>
            <div className="mt-4 flex min-h-64 items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/20 bg-black/20">
              {preview ? <img src={preview} alt="Whiteboard preview" className="max-h-[430px] w-full object-contain" /> : <div className="text-center text-slate-400"><ImagePlus className="mx-auto mb-2 h-10 w-10" /><div className="font-medium text-slate-200">Add a whiteboard photo</div><div className="mt-1 text-xs">JPG, PNG or HEIC</div></div>}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[.06] px-3 py-3 text-sm font-medium text-slate-100">
                <Camera className="h-4 w-4" />Take photo
                <input className="hidden" type="file" accept="image/*" capture="environment" onChange={(e) => { choose(e.target.files?.[0]); e.currentTarget.value = ""; }} />
              </label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-sky-300/25 bg-sky-950/30 px-3 py-3 text-sm font-medium text-slate-100">
                <ImagePlus className="h-4 w-4" />Photo library
                <input className="hidden" type="file" accept="image/*" onChange={(e) => { choose(e.target.files?.[0]); e.currentTarget.value = ""; }} />
              </label>
            </div>
            <div className="relative mt-3">
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell the assistant what to do, or tap the microphone…" className="min-h-28 w-full rounded-xl border border-sky-300/20 bg-sky-950/30 p-3 pr-16 text-sm outline-none focus:border-sky-300/50" />
              <button type="button" onClick={toggleVoice} aria-label={listening ? "Stop listening" : "Talk to AI assistant"} className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full border" style={{ background: listening ? "#fb7185" : "#38bdf8", borderColor: listening ? "#fda4af" : "#7dd3fc", color: "#06213a" }}>{listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}</button>
            </div>
            <button disabled={!file || busy} onClick={analyse} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-400 px-4 py-3 font-semibold text-sky-950 disabled:opacity-40">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}Read whiteboard</button>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[.04] p-4 md:p-5">
            <div className="flex items-center justify-between"><h2 className="font-semibold">2. Check what I read</h2>{items.length > 0 && <span className="text-xs text-slate-400">{selected} selected</span>}</div>
            {!items.length ? <div className="mt-4 flex min-h-64 items-center justify-center rounded-xl border border-white/10 bg-black/10 p-8 text-center text-sm text-slate-400">Nothing gets added automatically. Proposed jobs, appointments and reminders appear here first.</div> : <div className="mt-4 space-y-2">{items.map((x, i) => <div key={`${x.kind}-${i}`} className="flex gap-3 rounded-xl border border-white/10 bg-black/20 p-3"><input type="checkbox" checked={x.selected} onChange={() => setItems((value) => value.map((item, n) => n === i ? { ...item, selected: !item.selected } : item))} className="mt-1" /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="rounded bg-white/10 px-2 py-0.5 text-[10px] uppercase text-slate-300">{x.kind}</span><strong className="truncate text-sm">{x.title}</strong></div><div className="mt-1 text-xs text-slate-400">{x.startsAt ? `${new Date(x.startsAt).toLocaleString()}${x.endsAt ? ` → ${new Date(x.endsAt).toLocaleString()}` : ""}` : x.dueDate ? `Due ${new Date(x.dueDate).toLocaleString()}` : "No reliable date detected — left unselected"}</div>{x.notes && <div className="mt-1 text-xs text-slate-300">{x.notes}</div>}</div><button onClick={() => setItems((value) => value.filter((_, n) => n !== i))} aria-label="Remove"><X className="h-4 w-4 text-slate-500" /></button></div>)}</div>}
            <button disabled={!selected || busy} onClick={apply} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-40"><CheckCircle2 className="h-4 w-4" />Apply selected to Elecplan</button>
          </section>
        </div>

        {status && <div className="rounded-xl border border-white/10 bg-white/[.05] p-3 text-sm">{status}</div>}
        <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4"><div className="flex items-center gap-2 text-sm font-medium"><Upload className="h-4 w-4" />Examples</div><p className="mt-2 text-sm text-slate-400">“Organise this board into my calendar and tasks” · “Move Warrandyte to Friday” · “Schedule these five jobs around my exam” · “Remind me about insurance Monday”</p></div>
      </div>
    </div>
  );
}
