"use client";

import { CheckCircle2, MapPin, Pencil, UserRound } from "lucide-react";
import { JOB_STAGES, STAGE_LABELS } from "@/lib/theme";

export type TimelineJob = {
  id: string;
  ref: string;
  title: string;
  client: string;
  address: string;
  crew: string | null;
  assignedToId: string | null;
  status: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  notes: string | null;
};

const UI = {
  panel: "var(--brand-panel, #07192b)",
  panelAlt: "var(--brand-panel-alt, #09213a)",
  border: "var(--brand-border, rgba(77,150,221,.24))",
  borderSoft: "var(--brand-border-soft, rgba(77,150,221,.12))",
  text: "#f5f9ff",
  mute: "var(--brand-muted, #93a9c2)",
  faint: "var(--brand-faint, #617993)",
  blue: "var(--brand-primary, #168dff)",
  cyan: "var(--brand-accent, #25c7ff)",
  green: "#18d3a0",
};

export default function JobTimeline({
  job,
  canManage = false,
  updating = false,
  onStatusChange,
  onEdit,
}: {
  job: TimelineJob;
  canManage?: boolean;
  updating?: boolean;
  onStatusChange?: (jobId: string, status: (typeof JOB_STAGES)[number]) => void;
  onEdit?: (job: TimelineJob) => void;
}) {
  const current = JOB_STAGES.indexOf(job.status as (typeof JOB_STAGES)[number]);

  return (
    <section className="overflow-hidden rounded-xl" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}>
      <div className="flex items-start justify-between gap-4 border-b p-4" style={{ borderColor: UI.borderSoft }}>
        <div className="min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-[.12em]" style={{ color: UI.faint }}>{job.ref}</span>
          <h3 className="mt-1 truncate text-base font-semibold" style={{ color: UI.text }}>{job.title}</h3>
          <p className="mt-1 text-xs" style={{ color: UI.mute }}>{job.client}</p>
        </div>
        <div className="flex items-start gap-3 shrink-0">
          <div className="hidden max-w-[260px] flex-col items-end gap-1.5 text-xs sm:flex" style={{ color: UI.faint }}>
            <span className="flex max-w-full items-center gap-1.5"><MapPin size={13} className="shrink-0" /><span className="truncate">{job.address}</span></span>
            <span className="flex max-w-full items-center gap-1.5"><UserRound size={13} className="shrink-0" /><span className="truncate">{job.crew ?? "Unassigned"}</span></span>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => onEdit?.(job)}
              className="rounded-lg p-2 transition hover:opacity-80"
              style={{ background: UI.panelAlt, color: UI.cyan, border: `1px solid ${UI.borderSoft}` }}
              title="Edit job details"
              aria-label={`Edit ${job.title}`}
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-[520px] items-start">
            {JOB_STAGES.map((stage, index) => {
              const done = current > -1 && index < current;
              const isCurrent = index === current;
              const active = done || isCurrent;
              const control = (
                <div className="flex w-[92px] shrink-0 flex-col items-center gap-2">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full"
                    style={{
                      background: done ? "rgba(25,211,160,.16)" : isCurrent ? "rgb(var(--brand-primary-rgb, 22 141 255) / .18)" : UI.panelAlt,
                      border: `1px solid ${done ? "rgba(25,211,160,.38)" : isCurrent ? "rgb(var(--brand-accent-rgb, 37 199 255) / .38)" : UI.borderSoft}`,
                      color: done ? UI.green : isCurrent ? UI.cyan : UI.faint,
                    }}
                  >
                    {done ? <CheckCircle2 size={14} /> : <span className="h-1.5 w-1.5 rounded-full" style={{ background: isCurrent ? UI.cyan : UI.faint }} />}
                  </div>
                  <span className="text-center text-[11px] font-medium" style={{ color: active ? UI.text : UI.faint }}>
                    {STAGE_LABELS[stage]}
                  </span>
                </div>
              );

              return (
                <div key={stage} className="flex min-w-[104px] flex-1 items-start last:flex-none">
                  {canManage ? (
                    <button
                      type="button"
                      disabled={updating || isCurrent}
                      onClick={() => onStatusChange?.(job.id, stage)}
                      className="rounded-lg disabled:cursor-default enabled:hover:opacity-80"
                      title={isCurrent ? "Current status" : `Move job to ${STAGE_LABELS[stage]}`}
                    >
                      {control}
                    </button>
                  ) : control}
                  {index < JOB_STAGES.length - 1 && (
                    <div className="mt-3 h-px min-w-3 flex-1" style={{ background: index < current ? "rgba(25,211,160,.45)" : UI.borderSoft }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 grid gap-2 sm:hidden">
          <div className="flex items-center gap-2 text-xs" style={{ color: UI.mute }}><MapPin size={13} style={{ color: UI.cyan }} /><span className="truncate">{job.address}</span></div>
          <div className="flex items-center gap-2 text-xs" style={{ color: UI.mute }}><UserRound size={13} style={{ color: UI.cyan }} /><span>{job.crew ?? "Unassigned"}</span></div>
        </div>

        {canManage && <p className="mt-3 text-[11px]" style={{ color: UI.faint }}>{updating ? "Updating status…" : "Select a stage to update status, or use edit for schedule and crew assignment."}</p>}
      </div>
    </section>
  );
}
