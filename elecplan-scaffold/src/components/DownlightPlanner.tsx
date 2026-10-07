"use client";

import { useMemo, useState } from "react";
import { Copy, Printer, RotateCcw, Ruler } from "lucide-react";

type AxisMode = "even" | "fixed";
type Side = "left" | "right";
type End = "front" | "back";

type AxisLayout = {
  valid: boolean;
  positions: number[];
  spacing: number;
  edgeOffset: number;
  oppositeOffset: number;
};

function axisLayout(total: number, count: number, mode: AxisMode, fixedOffset: number): AxisLayout {
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(count) || count < 1) {
    return { valid: false, positions: [], spacing: 0, edgeOffset: 0, oppositeOffset: 0 };
  }
  if (count === 1) {
    return { valid: true, positions: [total / 2], spacing: 0, edgeOffset: total / 2, oppositeOffset: total / 2 };
  }
  const edgeOffset = mode === "even" ? total / (count * 2) : fixedOffset;
  if (!Number.isFinite(edgeOffset) || edgeOffset < 0 || edgeOffset * 2 >= total) {
    return { valid: false, positions: [], spacing: 0, edgeOffset, oppositeOffset: edgeOffset };
  }
  const spacing = mode === "even" ? total / count : (total - edgeOffset * 2) / (count - 1);
  const positions = Array.from({ length: count }, (_, index) => edgeOffset + spacing * index);
  return { valid: spacing > 0, positions, spacing, edgeOffset, oppositeOffset: total - positions[positions.length - 1] };
}

function mm(value: number) {
  return Math.round(value).toLocaleString("en-AU");
}

function oppositeSide(side: Side): Side {
  return side === "right" ? "left" : "right";
}

export default function DownlightPlanner() {
  const [roomWidth, setRoomWidth] = useState(4980);
  const [roomLength, setRoomLength] = useState(5580);
  const [columns, setColumns] = useState(3);
  const [rows, setRows] = useState(3);
  const [sideMode, setSideMode] = useState<AxisMode>("fixed");
  const [sideOffset, setSideOffset] = useState(700);
  const [endMode, setEndMode] = useState<AxisMode>("even");
  const [endOffset, setEndOffset] = useState(930);
  const [startSide, setStartSide] = useState<Side>("right");
  const [startEnd, setStartEnd] = useState<End>("front");
  const [copied, setCopied] = useState(false);

  const width = useMemo(() => axisLayout(roomWidth, columns, sideMode, sideOffset), [roomWidth, columns, sideMode, sideOffset]);
  const length = useMemo(() => axisLayout(roomLength, rows, endMode, endOffset), [roomLength, rows, endMode, endOffset]);
  const valid = width.valid && length.valid && columns <= 10 && rows <= 10;
  const lightCount = Math.max(0, columns * rows);

  const sequence = useMemo(() => {
    if (!valid) return [];
    const rowIndexes = startEnd === "front"
      ? Array.from({ length: rows }, (_, index) => index)
      : Array.from({ length: rows }, (_, index) => rows - 1 - index);

    const points: Array<{ row: number; col: number; x: number; y: number }> = [];
    rowIndexes.forEach((rowIndex, travelRowIndex) => {
      const rowStartSide = travelRowIndex % 2 === 0 ? startSide : oppositeSide(startSide);
      const colIndexes = rowStartSide === "left"
        ? Array.from({ length: columns }, (_, index) => index)
        : Array.from({ length: columns }, (_, index) => columns - 1 - index);
      colIndexes.forEach((colIndex) => {
        points.push({ row: rowIndex, col: colIndex, x: width.positions[colIndex], y: length.positions[rowIndex] });
      });
    });
    return points;
  }, [valid, rows, columns, startEnd, startSide, width.positions, length.positions]);

  const numberByPoint = useMemo(() => {
    const map = new Map<string, number>();
    sequence.forEach((point, index) => map.set(`${point.row}-${point.col}`, index + 1));
    return map;
  }, [sequence]);

  const steps = useMemo(() => {
    if (!valid || sequence.length === 0) return [];
    return sequence.map((point, index) => {
      if (index === 0) {
        const depthDistance = startEnd === "front" ? point.y : roomLength - point.y;
        const sideDistance = startSide === "left" ? point.x : roomWidth - point.x;
        return `Light 1: measure ${mm(depthDistance)} mm from the ${startEnd} end and ${mm(sideDistance)} mm in from the ${startSide} wall. Mark the first centre.`;
      }
      const previous = sequence[index - 1];
      const dx = point.x - previous.x;
      const dy = point.y - previous.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        return `Light ${index + 1}: from Light ${index}, measure ${mm(Math.abs(dx))} mm ${dx > 0 ? "right" : "left"} and mark the next centre.`;
      }
      return `Light ${index + 1}: from Light ${index}, measure ${mm(Math.abs(dy))} mm ${dy > 0 ? "back" : "toward the front"} and mark the next centre.`;
    });
  }, [valid, sequence, startEnd, startSide, roomLength, roomWidth]);

  const acrossSegments = useMemo(() => {
    if (!valid) return [];
    const points = [0, ...width.positions, roomWidth];
    return points.slice(1).map((value, index) => value - points[index]);
  }, [valid, width.positions, roomWidth]);

  const lengthSegments = useMemo(() => {
    if (!valid) return [];
    const points = [0, ...length.positions, roomLength];
    return points.slice(1).map((value, index) => value - points[index]);
  }, [valid, length.positions, roomLength]);

  const reset = () => {
    setRoomWidth(4980);
    setRoomLength(5580);
    setColumns(3);
    setRows(3);
    setSideMode("fixed");
    setSideOffset(700);
    setEndMode("even");
    setEndOffset(930);
    setStartSide("right");
    setStartEnd("front");
  };

  const copyMeasurements = async () => {
    if (!valid) return;
    const text = [
      `ELECPLAN Downlight Plan — ${roomWidth} x ${roomLength} mm`,
      `${columns} columns x ${rows} rows = ${lightCount} downlights`,
      `Across: ${acrossSegments.map(mm).join(" / ")} mm`,
      `Front to back: ${lengthSegments.map(mm).join(" / ")} mm`,
      "",
      ...steps,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const roomX = 100;
  const roomY = 90;
  const roomW = 560;
  const roomH = 500;
  const svgX = (x: number) => roomX + (x / Math.max(roomWidth, 1)) * roomW;
  const svgY = (y: number) => roomY + (y / Math.max(roomLength, 1)) * roomH;

  return (
    <div className="min-h-full bg-[#0d1117] px-4 py-5 text-white sm:px-6 lg:px-8">
      <style>{`
        @media print {
          .ep-carbon-sidebar,.ep-carbon-mobilebar,.ep-carbon-drawer,.downlight-controls,.downlight-actions,.downlight-safety { display:none !important; }
          .ep-portal-main { overflow:visible !important; padding-top:0 !important; }
          .downlight-print { background:#fff !important; color:#0d1117 !important; padding:0 !important; }
          .downlight-print * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
        }
      `}</style>

      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#43D2FF]">
              <Ruler size={16} /> Elecplan Tools
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Downlight Planner</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Enter the room size and light grid. Elecplan calculates the centres, produces a plan, and gives the apprentice a point-to-point marking sequence.
            </p>
          </div>
          <div className="downlight-actions flex flex-wrap gap-2">
            <button type="button" onClick={reset} className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-slate-200 hover:bg-white/[0.08]">
              <RotateCcw size={15} /> Example
            </button>
            <button type="button" onClick={copyMeasurements} disabled={!valid} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#43D2FF]/30 bg-[#43D2FF]/10 px-4 text-sm font-semibold text-[#7ce2ff] hover:bg-[#43D2FF]/15 disabled:opacity-40">
              <Copy size={15} /> {copied ? "Copied" : "Copy measurements"}
            </button>
            <button type="button" onClick={() => window.print()} disabled={!valid} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#43D2FF] px-4 text-sm font-bold text-[#06213a] hover:bg-[#6addff] disabled:opacity-40">
              <Printer size={15} /> Print plan
            </button>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
          <section className="downlight-controls rounded-2xl border border-white/10 bg-[#111923] p-5 shadow-2xl shadow-black/20">
            <h2 className="text-base font-bold">Room & layout</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">All measurements are centre-to-centre in millimetres.</p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <NumberField label="Width — left to right" value={roomWidth} onChange={setRoomWidth} min={1} suffix="mm" />
              <NumberField label="Length — front to back" value={roomLength} onChange={setRoomLength} min={1} suffix="mm" />
              <NumberField label="Columns — left to right" value={columns} onChange={(value) => setColumns(Math.max(1, Math.min(10, Math.round(value))))} min={1} max={10} />
              <NumberField label="Rows — front to back" value={rows} onChange={(value) => setRows(Math.max(1, Math.min(10, Math.round(value))))} min={1} max={10} />
            </div>

            <div className="mt-5 border-t border-white/10 pt-5">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Left / right spacing</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <ModeButton active={sideMode === "even"} onClick={() => setSideMode("even")}>Auto even</ModeButton>
                <ModeButton active={sideMode === "fixed"} onClick={() => setSideMode("fixed")}>Fixed wall offset</ModeButton>
              </div>
              {sideMode === "fixed" && <div className="mt-3"><NumberField label="Offset from each side wall" value={sideOffset} onChange={setSideOffset} min={0} suffix="mm" /></div>}
            </div>

            <div className="mt-5 border-t border-white/10 pt-5">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Front / back spacing</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <ModeButton active={endMode === "even"} onClick={() => setEndMode("even")}>Auto even</ModeButton>
                <ModeButton active={endMode === "fixed"} onClick={() => setEndMode("fixed")}>Fixed end offset</ModeButton>
              </div>
              {endMode === "fixed" && <div className="mt-3"><NumberField label="Offset from each end" value={endOffset} onChange={setEndOffset} min={0} suffix="mm" /></div>}
            </div>

            <div className="mt-5 border-t border-white/10 pt-5">
              <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Starting point for apprentice</label>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <SelectField label="Start side" value={startSide} onChange={(value) => setStartSide(value as Side)} options={[["right","Right wall"],["left","Left wall"]]} />
                <SelectField label="Start end" value={startEnd} onChange={(value) => setStartEnd(value as End)} options={[["front","Front / door"],["back","Back end"]]} />
              </div>
            </div>

            {!valid && <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-200">
              The offsets are too large for this room, or one of the measurements is invalid. Reduce the wall offset or check the room size.
            </div>}
          </section>

          <div className="downlight-print space-y-5">
            <section className="rounded-2xl border border-white/10 bg-[#111923] p-4 shadow-2xl shadow-black/20 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">Generated plan</h2>
                  <p className="mt-1 text-xs text-slate-500">Front is shown at the top. Numbering follows the point-to-point install path.</p>
                </div>
                <div className="rounded-lg border border-[#43D2FF]/25 bg-[#43D2FF]/10 px-3 py-2 text-sm font-bold text-[#7ce2ff]">
                  {lightCount} downlights · {columns} × {rows}
                </div>
              </div>

              {valid ? (
                <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0b1016] p-2 sm:p-4">
                  <svg viewBox="0 0 780 680" className="mx-auto min-w-[620px] max-w-[900px]" role="img" aria-label="Downlight layout plan">
                    <defs>
                      <marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto-start-reverse">
                        <path d="M0,0 L8,4 L0,8 z" fill="#8da2b8" />
                      </marker>
                    </defs>

                    <text x="380" y="30" textAnchor="middle" fill="#ffffff" fontSize="18" fontWeight="700">{mm(roomWidth)} mm — LEFT TO RIGHT</text>
                    <text x="18" y="340" transform="rotate(-90 18 340)" textAnchor="middle" fill="#ffffff" fontSize="18" fontWeight="700">{mm(roomLength)} mm — FRONT TO BACK</text>
                    <text x="380" y="68" textAnchor="middle" fill="#43D2FF" fontSize="13" fontWeight="700">FRONT / DOOR END</text>
                    <text x="380" y="628" textAnchor="middle" fill="#75889b" fontSize="12" fontWeight="700">BACK END</text>
                    <text x="72" y="340" transform="rotate(-90 72 340)" textAnchor="middle" fill="#75889b" fontSize="12" fontWeight="700">LEFT WALL</text>
                    <text x="704" y="340" transform="rotate(90 704 340)" textAnchor="middle" fill="#75889b" fontSize="12" fontWeight="700">RIGHT WALL</text>

                    <rect x={roomX} y={roomY} width={roomW} height={roomH} rx="2" fill="#101820" stroke="#b9c7d5" strokeWidth="2" />

                    {width.positions.map((position, index) => (
                      <line key={`vg-${index}`} x1={svgX(position)} y1={roomY} x2={svgX(position)} y2={roomY + roomH} stroke="#43D2FF" strokeOpacity="0.2" strokeDasharray="5 6" />
                    ))}
                    {length.positions.map((position, index) => (
                      <line key={`hg-${index}`} x1={roomX} y1={svgY(position)} x2={roomX + roomW} y2={svgY(position)} stroke="#43D2FF" strokeOpacity="0.2" strokeDasharray="5 6" />
                    ))}

                    {columns <= 5 && acrossSegments.map((segment, index) => {
                      const boundaries = [0, ...width.positions, roomWidth];
                      const x1 = svgX(boundaries[index]);
                      const x2 = svgX(boundaries[index + 1]);
                      return <g key={`wd-${index}`}>
                        <line x1={x1} y1="48" x2={x2} y2="48" stroke="#8da2b8" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                        <text x={(x1 + x2) / 2} y="44" textAnchor="middle" fill="#dbe6ef" fontSize="12" fontWeight="700">{mm(segment)}</text>
                      </g>;
                    })}

                    {rows <= 5 && lengthSegments.map((segment, index) => {
                      const boundaries = [0, ...length.positions, roomLength];
                      const y1 = svgY(boundaries[index]);
                      const y2 = svgY(boundaries[index + 1]);
                      return <g key={`ld-${index}`}>
                        <line x1="45" y1={y1} x2="45" y2={y2} stroke="#8da2b8" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
                        <text x="39" y={(y1 + y2) / 2} textAnchor="middle" dominantBaseline="middle" transform={`rotate(-90 39 ${(y1 + y2) / 2})`} fill="#dbe6ef" fontSize="12" fontWeight="700">{mm(segment)}</text>
                      </g>;
                    })}

                    {length.positions.flatMap((y, rowIndex) => width.positions.map((x, colIndex) => {
                      const number = numberByPoint.get(`${rowIndex}-${colIndex}`) ?? 0;
                      return <g key={`light-${rowIndex}-${colIndex}`}>
                        <circle cx={svgX(x)} cy={svgY(y)} r="15" fill="#43D2FF" stroke="#e8f9ff" strokeWidth="3" />
                        <circle cx={svgX(x)} cy={svgY(y)} r="5" fill="#0b1016" />
                        <text x={svgX(x)} y={svgY(y) - 23} textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="800">{number}</text>
                      </g>;
                    }))}
                  </svg>
                </div>
              ) : <div className="rounded-xl border border-dashed border-white/15 p-10 text-center text-sm text-slate-500">Fix the room measurements to generate the plan.</div>}
            </section>

            {valid && <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-[#111923] p-5">
                <h2 className="text-base font-bold">Measurements</h2>
                <div className="mt-4 space-y-3 text-sm">
                  <MeasurementRow label="Room" value={`${mm(roomWidth)} × ${mm(roomLength)} mm`} />
                  <MeasurementRow label="Lights" value={`${columns} × ${rows} = ${lightCount}`} />
                  <MeasurementRow label="Across each row" value={acrossSegments.map(mm).join(" / ") + " mm"} />
                  <MeasurementRow label="Front to back" value={lengthSegments.map(mm).join(" / ") + " mm"} />
                  <MeasurementRow label="Light centres across" value={columns > 1 ? mm(width.spacing) + " mm" : "Single centre"} />
                  <MeasurementRow label="Row centres" value={rows > 1 ? mm(length.spacing) + " mm" : "Single centre"} />
                </div>
              </div>

              <div className="rounded-2xl border border-[#43D2FF]/20 bg-[#43D2FF]/[0.06] p-5">
                <h2 className="text-base font-bold">Quick tape-measure run</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Start at the <strong className="text-white">{startEnd}</strong> end and <strong className="text-white">{startSide}</strong> wall. The numbering snakes across the room so each new mark can be measured from the last one.
                </p>
                <div className="mt-4 rounded-xl bg-black/20 p-4 font-mono text-sm leading-7 text-[#a9edff]">
                  Across: {acrossSegments.map(mm).join(" → ")} mm<br />
                  Depth: {lengthSegments.map(mm).join(" → ")} mm
                </div>
              </div>
            </section>}

            {valid && <section className="rounded-2xl border border-white/10 bg-[#111923] p-5 sm:p-6">
              <h2 className="text-lg font-bold">Point-to-point install sequence</h2>
              <p className="mt-1 text-sm text-slate-500">Put your first centre in, then hook the tape from each marked point to the next.</p>
              <div className="mt-5 grid gap-3 lg:grid-cols-2">
                {steps.map((step, index) => <div key={index} className="flex gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#43D2FF] text-xs font-black text-[#06213a]">{index + 1}</div>
                  <p className="text-sm leading-6 text-slate-300">{step}</p>
                </div>)}
              </div>
            </section>}

            <div className="downlight-safety rounded-xl border border-amber-400/15 bg-amber-400/[0.06] px-4 py-3 text-xs leading-5 text-amber-100/80">
              Layout aid only. Before cutting, check framing, services, insulation clearances, fire/acoustic requirements and the selected fitting manufacturer's installation requirements.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange, min, max, suffix }: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  return <label className="block">
    <span className="mb-1.5 block text-xs font-semibold text-slate-400">{label}</span>
    <div className="flex items-center rounded-lg border border-white/10 bg-black/20 focus-within:border-[#43D2FF]/60">
      <input
        type="number"
        inputMode="numeric"
        value={Number.isFinite(value) ? value : 0}
        min={min}
        max={max}
        onChange={(event) => onChange(Number(event.target.value))}
        className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm font-semibold text-white outline-none"
      />
      {suffix && <span className="pr-3 text-xs font-semibold text-slate-500">{suffix}</span>}
    </div>
  </label>;
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`rounded-lg border px-3 py-2.5 text-xs font-bold transition ${active ? "border-[#43D2FF]/50 bg-[#43D2FF]/15 text-[#7ce2ff]" : "border-white/10 bg-white/[0.025] text-slate-400 hover:bg-white/[0.05]"}`}>
    {children}
  </button>;
}

function SelectField({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return <label className="block">
    <span className="mb-1.5 block text-xs font-semibold text-slate-400">{label}</span>
    <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-white/10 bg-[#0b1016] px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-[#43D2FF]/60">
      {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
    </select>
  </label>;
}

function MeasurementRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] pb-3 last:border-0 last:pb-0">
    <span className="text-slate-500">{label}</span>
    <strong className="text-right font-semibold text-slate-200">{value}</strong>
  </div>;
}
