import { CheckCircle2, MapPin, User as UserIcon } from "lucide-react";
import { COLORS, ON_ACCENT, JOB_STAGES, STAGE_LABELS } from "@/lib/theme";

export type TimelineJob = {
  id: string;
  ref: string; // short human ref, e.g. "JB-2211"
  title: string;
  client: string;
  address: string;
  crew: string | null;
  status: string; // JobStatus
};

/**
 * The pipeline stepper card from the mockup's TimelinesView — one row of
 * stage dots (Quoted → Invoiced) with the job's current stage highlighted.
 * Purely presentational, so it renders on the server.
 */
export default function JobTimeline({ job }: { job: TimelineJob }) {
  const current = JOB_STAGES.indexOf(job.status as (typeof JOB_STAGES)[number]);

  return (
    <div
      className="rounded-lg p-5"
      style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <span
            className="text-xs font-semibold tracking-wide"
            style={{ fontFamily: "'IBM Plex Mono', monospace", color: COLORS.textFaint }}
          >
            {job.ref}
          </span>
          <h3 className="text-base font-semibold truncate" style={{ color: COLORS.text }}>
            {job.title}
          </h3>
          <p className="text-xs" style={{ color: COLORS.textMute }}>
            {job.client}
          </p>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 text-xs" style={{ color: COLORS.textFaint }}>
          <span className="flex items-center gap-1">
            <MapPin size={13} /> {job.address}
          </span>
          {job.crew && (
            <span className="flex items-center gap-1">
              <UserIcon size={13} /> {job.crew}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center">
        {JOB_STAGES.map((stage, i) => {
          const done = current > -1 && i < current;
          const isCurrent = i === current;
          return (
            <div key={stage} className="flex items-center flex-1 last:flex-none">
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
                  {done ? (
                    <CheckCircle2 size={13} color={ON_ACCENT} />
                  ) : (
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: isCurrent ? ON_ACCENT : COLORS.textFaint }}
                    />
                  )}
                </div>
                <span
                  className="text-xs text-center"
                  style={{
                    color: done || isCurrent ? COLORS.text : COLORS.textFaint,
                    fontWeight: isCurrent ? 600 : 400,
                  }}
                >
                  {STAGE_LABELS[stage]}
                </span>
              </div>
              {i < JOB_STAGES.length - 1 && (
                <div
                  className="flex-1"
                  style={{ height: 2, background: i < current ? COLORS.teal : COLORS.border, marginBottom: 20 }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
