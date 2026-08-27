"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Barcode, Check } from "lucide-react";

type Item = { id: string; name: string; onHand: number; unit: string; barcode?: string | null };
type Region = { text: string; x0: number; y0: number; x1: number; y1: number };

declare global {
  interface Window {
    Quagga?: any;
    Tesseract?: any;
    webkitAudioContext?: typeof AudioContext;
  }
}

const BUILD = "scanner-r5-2026-08-27";
const QUAGGA = "https://cdn.jsdelivr.net/npm/@ericblade/quagga2@1.8.4/dist/quagga.min.js";
const TESSERACT = "https://cdn.jsdelivr.net/npm/tesseract.js@6/dist/tesseract.min.js";

function loadScript(id: string, src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === "1") resolve();
      else existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "1";
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function quantityFromText(value: string) {
  const text = value.trim();
  const explicit = text.match(/\b(\d{1,4})\s*(rolls?|pcs?|pieces?|pack(?:s)?|each|ea|units?|qty)\b/i);
  if (explicit) return Math.max(1, Math.min(9999, Number(explicit[1])));
  const qtyFirst = text.match(/\bqty\s*[:x-]?\s*(\d{1,4})\b/i);
  if (qtyFirst) return Math.max(1, Math.min(9999, Number(qtyFirst[1])));
  if (/^\d{1,4}$/.test(text)) return Math.max(1, Math.min(9999, Number(text)));
  return 0;
}

function pct(n: number, d: number) {
  return Math.max(0, Math.min(100, (n / d) * 100));
}

function tsvRegions(tsv: string, width: number, height: number) {
  const rows = String(tsv || "").split(/\n+/).slice(1).map((row) => row.split("\t"));
  const words = rows
    .filter((row) => row.length >= 12 && row[0] === "5" && row[11]?.trim())
    .map((row) => ({
      key: `${row[1]}-${row[2]}-${row[3]}-${row[4]}`,
      left: Number(row[6]),
      top: Number(row[7]),
      width: Number(row[8]),
      height: Number(row[9]),
      text: row[11].trim(),
    }));

  const groups = new Map<string, typeof words>();
  for (const word of words) {
    const group = groups.get(word.key) || [];
    group.push(word);
    groups.set(word.key, group);
  }

  const regions: Region[] = [];
  for (const group of groups.values()) {
    group.sort((a, b) => a.left - b.left);
    const left = Math.min(...group.map((x) => x.left));
    const top = Math.min(...group.map((x) => x.top));
    const right = Math.max(...group.map((x) => x.left + x.width));
    const bottom = Math.max(...group.map((x) => x.top + x.height));
    regions.push({
      text: group.map((x) => x.text).join(" "),
      x0: pct(left, width),
      y0: pct(top, height),
      x1: pct(right, width),
      y1: pct(bottom, height),
    });
    for (const word of group) {
      regions.push({
        text: word.text,
        x0: pct(word.left, width),
        y0: pct(word.top, height),
        x1: pct(word.left + word.width, width),
        y1: pct(word.top + word.height, height),
      });
    }
  }
  return regions.filter((r) => r.x1 > r.x0 && r.y1 > r.y0);
}

function blockRegions(blocks: any[], width: number, height: number) {
  const regions: Region[] = [];
  for (const block of blocks || []) {
    for (const paragraph of block?.paragraphs || []) {
      for (const line of paragraph?.lines || []) {
        const lineText = String(line?.text || "").trim();
        const lineBox = line?.bbox;
        if (lineText && lineBox) {
          regions.push({
            text: lineText,
            x0: pct(lineBox.x0, width),
            y0: pct(lineBox.y0, height),
            x1: pct(lineBox.x1, width),
            y1: pct(lineBox.y1, height),
          });
        }
        for (const word of line?.words || []) {
          const text = String(word?.text || "").trim();
          const box = word?.bbox;
          if (!text || !box) continue;
          regions.push({
            text,
            x0: pct(box.x0, width),
            y0: pct(box.y0, height),
            x1: pct(box.x1, width),
            y1: pct(box.y1, height),
          });
        }
      }
    }
  }
  return regions;
}

export default function Scan() {
  const cameraHost = useRef<HTMLDivElement>(null);
  const photoHost = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const locked = useRef("");
  const current = useRef({ code: "", photo: "" });
  const ocrWorker = useRef<any>(null);
  const ocrLoading = useRef<Promise<any> | null>(null);
  const audio = useRef<AudioContext | null>(null);

  const [status, setStatus] = useState("Starting camera…");
  const [item, setItem] = useState<Item | null>(null);
  const [manual, setManual] = useState("");
  const [code, setCode] = useState("");
  const [photo, setPhoto] = useState("");
  const [regions, setRegions] = useState<Region[]>([]);
  const [choices, setChoices] = useState<string[]>([]);
  const [selected, setSelected] = useState("");
  const [review, setReview] = useState(false);
  const [reading, setReading] = useState(false);
  const [running, setRunning] = useState(false);

  function beep() {
    try {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return;
      if (!audio.current) audio.current = new AudioCtor();
      const ctx = audio.current;
      void ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 1150;
      gain.gain.value = 0.15;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  }

  async function getWorker() {
    if (ocrWorker.current) return ocrWorker.current;
    if (ocrLoading.current) return ocrLoading.current;
    ocrLoading.current = (async () => {
      await loadScript("tesseract-js", TESSERACT);
      const worker = await window.Tesseract.createWorker("eng");
      ocrWorker.current = worker;
      return worker;
    })().finally(() => {
      ocrLoading.current = null;
    });
    return ocrLoading.current;
  }

  function stopCamera() {
    try {
      window.Quagga?.offDetected();
      window.Quagga?.stop();
    } catch {}
    setRunning(false);
    if (cameraHost.current) cameraHost.current.innerHTML = "";
  }

  function snapshot() {
    const video = cameraHost.current?.querySelector("video") as HTMLVideoElement | null;
    if (!video?.videoWidth || !video.videoHeight) return null;
    const canvas = document.createElement("canvas");
    canvas.width = Math.min(video.videoWidth, 1400);
    canvas.height = Math.round(video.videoHeight * (canvas.width / video.videoWidth));
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  function restart() {
    stopCamera();
    busy.current = false;
    locked.current = "";
    current.current = { code: "", photo: "" };
    setReview(false);
    setReading(false);
    setPhoto("");
    setCode("");
    setRegions([]);
    setChoices([]);
    setSelected("");
    setStatus("Restarting camera…");
    window.setTimeout(() => void startCamera(), 450);
  }

  async function saveQuantity() {
    const qty = quantityFromText(selected);
    const { code: barcode, photo: capturedPhoto } = current.current;
    if (!qty) {
      setStatus("Choose a quantity from the label or type it, e.g. 20 / 75 Pack / 40 Rolls");
      return;
    }
    if (!barcode || !capturedPhoto || busy.current) return;

    busy.current = true;
    try {
      setStatus(`Saving ${qty}…`);
      const response = await fetch("/api/materials/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode, quantity: qty }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || "stock save failed");

      void fetch("/api/materials/scan-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockItemId: body.item.id, dataUrl: capturedPhoto }),
      }).catch(() => {});

      setItem(body.item);
      beep();
      restart();
    } catch (error) {
      setStatus(`NOT SAVED — ${error instanceof Error ? error.message : "try again"}`);
      busy.current = false;
    }
  }

  async function mapLabel(dataUrl: string, width: number, height: number) {
    setReading(true);
    setStatus("Reading label — nothing saves until you confirm");
    try {
      const worker = await getWorker();
      const recognize = worker.recognize(dataUrl, {}, { text: true, tsv: true, blocks: true });
      const timeout = new Promise((_, reject) => window.setTimeout(() => reject(new Error("OCR timeout")), 12000));
      const result: any = await Promise.race([recognize, timeout]);

      let mapped = tsvRegions(result?.data?.tsv, width, height);
      if (!mapped.length) mapped = blockRegions(result?.data?.blocks || [], width, height);
      setRegions(mapped);

      const text = String(result?.data?.text || "");
      const lines = text.split(/\n+/).map((x: string) => x.trim()).filter(Boolean);
      const all = [...new Set([...lines, ...mapped.map((x) => x.text)])] as string[];
      const qtyChoices = all.filter((x) => quantityFromText(x) > 0);
      const otherNumberText = all.filter((x) => /\d/.test(x) && quantityFromText(x) === 0);
      setChoices([...qtyChoices, ...otherNumberText].slice(0, 20));
      if (qtyChoices.length === 1) setSelected(qtyChoices[0]);

      setStatus(mapped.length
        ? "TEXT READY — tap the text on the photo, choose below, or type quantity"
        : "OCR read the label but no tap boxes were returned — choose below or type quantity");
    } catch (error) {
      setStatus(`OCR unavailable — ${error instanceof Error ? error.message : "type quantity or rescan"}`);
    } finally {
      setReading(false);
    }
  }

  function selectNearestFromTap(event: React.MouseEvent<HTMLDivElement>) {
    if (!regions.length || !photoHost.current) return;
    const rect = photoHost.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    const scored = regions.map((region) => {
      const cx = (region.x0 + region.x1) / 2;
      const cy = (region.y0 + region.y1) / 2;
      const inside = x >= region.x0 - 3 && x <= region.x1 + 3 && y >= region.y0 - 3 && y <= region.y1 + 3;
      const distance = Math.hypot(x - cx, y - cy);
      return { region, score: inside ? distance * 0.2 : distance };
    }).sort((a, b) => a.score - b.score);

    const best = scored[0];
    if (best && best.score <= 18) {
      setSelected(best.region.text);
      setStatus(`Selected: ${best.region.text}`);
    }
  }

  async function capture(barcode: string) {
    if (busy.current || review) return;
    const canvas = snapshot();
    if (!canvas) return;
    busy.current = true;
    stopCamera();

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    current.current = { code: barcode, photo: dataUrl };
    setCode(barcode);
    setPhoto(dataUrl);
    setReview(true);
    setStatus("Label captured — tap/select the quantity, then save");
    busy.current = false;
    void mapLabel(dataUrl, canvas.width, canvas.height);
  }

  async function startCamera() {
    try {
      await loadScript("quagga2-js", QUAGGA);
      if (!cameraHost.current) return;
      stopCamera();
      cameraHost.current.innerHTML = "";

      window.Quagga.init({
        inputStream: {
          type: "LiveStream",
          target: cameraHost.current,
          constraints: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
          area: { top: "8%", right: "3%", left: "3%", bottom: "8%" },
        },
        locator: { patchSize: "medium", halfSample: true },
        numOfWorkers: 0,
        frequency: 18,
        decoder: { readers: ["code_128_reader", "ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader", "code_39_reader", "code_93_reader", "i2of5_reader"] },
        locate: true,
      }, (error: any) => {
        if (error) {
          setStatus("Camera failed — tap Retry Camera");
          return;
        }
        window.Quagga.start();
        setRunning(true);
        setStatus("READY — keep barcode + full label in frame");
      });

      window.Quagga.onDetected((result: any) => {
        const barcode = String(result?.codeResult?.code || "").trim();
        if (!barcode || busy.current || review || locked.current === barcode) return;
        locked.current = barcode;
        void capture(barcode);
      });
    } catch {
      setStatus("Camera failed — tap Retry Camera");
    }
  }

  useEffect(() => {
    void startCamera();
    void getWorker().catch(() => {});
    return () => {
      stopCamera();
      try { ocrWorker.current?.terminate(); } catch {}
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#03101f] p-4 text-white">
      <div className="mx-auto max-w-xl space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/materials" className="flex items-center gap-2 text-sm text-[#93a9c2]"><ArrowLeft size={16}/> Materials</Link>
          <span className="text-[11px] text-[#5f7894]">{BUILD}</span>
        </div>
        <h1 className="text-3xl font-semibold">Scan Stock</h1>

        <div className="overflow-hidden rounded-2xl border border-[#168dff55] bg-[#07192b]">
          <div ref={photoHost} onClick={review ? selectNearestFromTap : undefined} className="relative aspect-[4/3] overflow-hidden bg-black">
            <div ref={cameraHost} className={`absolute inset-0 [&_canvas]:hidden [&_video]:h-full [&_video]:w-full [&_video]:object-cover ${review ? "hidden" : "block"}`} />
            {review && photo && <img src={photo} className="absolute inset-0 h-full w-full object-fill" alt="Frozen label" />}
            {review && regions.map((region, index) => (
              <button
                key={`${region.text}-${index}`}
                type="button"
                onClick={(event) => { event.stopPropagation(); setSelected(region.text); setStatus(`Selected: ${region.text}`); }}
                className={`absolute z-20 rounded border-2 ${selected === region.text ? "border-[#18d3a0] bg-[#18d3a066]" : "border-[#25c7ffbb] bg-[#25c7ff12]"}`}
                style={{ left: `${region.x0}%`, top: `${region.y0}%`, width: `${Math.max(7, region.x1 - region.x0)}%`, height: `${Math.max(7, region.y1 - region.y0)}%` }}
                aria-label={`Select ${region.text}`}
              />
            ))}
            {!review && <div className="pointer-events-none absolute inset-[8%_3%] rounded-xl border-4 border-[#25c7ff]" />}
          </div>
          <div className="p-4 text-center font-semibold text-[#18d3a0]">{status}</div>
        </div>

        {review && (
          <div className="rounded-2xl border border-[#18d3a055] bg-[#07192b] p-4">
            <div className="font-semibold">Choose what gets saved</div>
            <div className="mt-1 text-sm text-[#93a9c2]">Barcode {code}. Nothing saves or beeps until you press Save Quantity.</div>
            {choices.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {choices.map((choice, index) => (
                  <button key={`${choice}-${index}`} type="button" onClick={() => setSelected(choice)} className={`rounded-xl border p-3 text-left ${selected === choice ? "border-[#18d3a0] bg-[#0b302c]" : "border-[#168dff44] bg-[#041323]"}`}>{choice}</button>
                ))}
              </div>
            )}
            <input inputMode="numeric" value={selected} onChange={(event) => setSelected(event.target.value)} placeholder={reading ? "OCR loading… or type quantity" : "e.g. 20"} className="mt-3 w-full rounded-xl border border-[#168dff44] bg-[#041323] px-3 py-4 text-xl" />
            <button disabled={!quantityFromText(selected)} onClick={() => void saveQuantity()} className="mt-3 w-full rounded-xl bg-[#18d3a0] py-4 text-lg font-bold text-[#03101f] disabled:opacity-35"><Check className="mr-2 inline"/>Save Quantity</button>
            <button type="button" onClick={restart} className="mt-2 w-full rounded-xl border border-[#168dff44] py-3">Cancel / Scan Next</button>
          </div>
        )}

        {!review && (
          <div className="rounded-2xl border border-[#168dff33] bg-[#07192b] p-4">
            <div className="mb-2 flex items-center gap-2 font-semibold"><Barcode size={17}/> Enter barcode</div>
            <form onSubmit={(event) => { event.preventDefault(); const barcode = manual.trim(); if (barcode) { void capture(barcode); setManual(""); } }} className="flex gap-2">
              <input value={manual} onChange={(event) => setManual(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-[#168dff44] bg-[#041323] px-3 py-3" placeholder="Barcode number" />
              <button className="rounded-xl bg-[#168dff] px-4 font-semibold">Add</button>
            </form>
            {!running && <button type="button" onClick={restart} className="mt-3 w-full rounded-xl border border-[#168dff44] py-3">Retry Camera</button>}
          </div>
        )}

        {item && !review && <div className="rounded-xl border border-[#18d3a055] bg-[#07192b] p-3 text-sm">Last saved: {item.name} · stock {item.onHand}</div>}
      </div>
    </div>
  );
}
