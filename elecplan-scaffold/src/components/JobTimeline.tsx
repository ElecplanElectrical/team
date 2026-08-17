"use client";

import { CheckCircle2, MapPin, User as UserIcon } from "lucide-react";
import { COLORS, ON_ACCENT, JOB_STAGES, STAGE_LABELS } from "@/lib/theme";

export type TimelineJob = {
  id: string;
  ref: string;
  title: string;
  client: string;
  address: string;
  crew: string | null;
  status: string;
};

export default function JobTimeline({
  job,
  canManage = false,
  updating = false,
  onStatusChange,
}: {
  job: TimelineJob;
  canManage?: boolean;
  updating?: boolean;
  onStatusChange?: (jobId: string, status: (typeof JOB_STAGES)[number]) => void;
}) {
  const current = JOB_STAGES.indexOf(job.status as (typeof JOB_STAGES)[number]);

  return (
    <div className="rounded-lg p-5" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <span className="text-xs font-semibold tracking-wide" style={{ fontFamily: "'IBM Plex Mono', monospace", color: COLORS.textFaint }}>
            {job.ref}
          </span>
          <h3 className="text-base font-semibold truncate" style={{ color: COLORS.text }}>{job.title}</h3>
          <p className="text-xs" style={{ color: COLORS.textMute }}>{job.client}</p>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 text-xs" style={{ color: COLORS.textFaint }}>
          <span className="flex items-center gap-1"><MapPin size={13} /> {job.address}</span>
          {job.crew && <span className="flex items-center gap-1"><UserIcon size={13} /> {job.crew}</span>}
        </div>
      </div>

      <div className="flex items-center overflow-x-auto pb-1">
        {JOB_STAGES.map((stage, i) => {
          const done = current > -1 && i < current;
          const isCurrent = i === current;
          const stageControl = (
            <div className="flex flex-col items-center gap-1.5 shrink-0" style={{ width: 84 }}>
              <div
                className="rounded-full flex items-center justify-center"
                style={{
                  width: 22,
                  height: 22,
                  background: done ? COLORS.teal : isCurrent ? COLORS.accent : COLORS.cardAlt,
                  border: `1px solid ${done ? COLORS.teal : isCurrent ? COLORS.accent : COLORS.border}`,
                }}
              >
                {done ? <CheckCircle2 size={13} color={ON_ACCENT} /> : <span className="w-1.5 h-1.5 rounded-full" style={{ background: isCurrent ? ON_ACCENT : COLORS.textFaint }} />}
              </div>
              <span className="text-xs text-center" style={{ color: done || isCurrent ? COLORS.text : COLORS.textFaint, fontWeight: isCurrent ? 600 : 400 }}>
                {STAGE_LABELS[stage]}
              </span>
            </div>
          );

          return (
            <div key={stage} className="flex items-center flex-1 last:flex-none min-w-[92px]">
              {canManage ? (
                <button
                  type="button"
                  disabled={updating || isCurrent}
                  onClick={() => onStatusChange?.(job.id, stage)}
                  className="rounded-md disabled:cursor-default enabled:hover:opacity-80"
                  title={isCurrent ? "Current status" : `Move job to ${STAGE_LABELS[stage]}`}
                >
                  {stageControl}
                </button>
              ) : stageControl}
              {i < JOB_STAGES.length - 1 && (
                <div className="flex-1 min-w-3" style={{ height: 2, background: i < current ? COLORS.teal : COLORS.border, marginBottom: 20 }} />
              )}
            </div>
          );
        })}
      </div>
      {canManage && <p className="text-[11px] mt-2" style={{ color: COLORS.textFaint }}>{updating ? "Updating status…" : "Select a stage to update this job."}</p>}
    </div>
  );
}
