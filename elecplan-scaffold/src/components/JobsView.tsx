"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import TopBar from "@/components/TopBar";
import JobTimeline, { type TimelineJob } from "@/components/JobTimeline";
import NewJobModal, { type JobClientOption, type JobCrewOption } from "@/components/NewJobModal";
import { COLORS, ON_ACCENT } from "@/lib/theme";

export default function JobsView({
  jobs,
  clients,
  crew,
  canCreate,
}: {
  jobs: TimelineJob[];
  clients: JobClientOption[];
  crew: JobCrewOption[];
  canCreate: boolean;
}) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);

  const active = jobs.filter((j) => j.status !== "COMPLETE" && j.status !== "INVOICED").length;
  const subtitle = jobs.length === 0 ? "No jobs yet" : `${active} active job${active === 1 ? "" : "s"} across the pipeline`;

  return (
    <>
      <TopBar
        title="Job timelines"
        subtitle={subtitle}
        rightSlot={
          canCreate ? (
            <button
              type="button"
              onClick={() => setShowNew(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-semibold"
              style={{ background: COLORS.accent, color: ON_ACCENT }}
            >
              <Plus size={15} /> New job
            </button>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-auto p-4 md:p-8 flex flex-col gap-5">
        {jobs.map((job) => <JobTimeline key={job.id} job={job} />)}
        {jobs.length === 0 && (
          <div
            className="rounded-lg p-8 text-center text-sm"
            style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, color: COLORS.textFaint }}
          >
            {canCreate ? "No jobs yet — create the first one." : "No jobs assigned to you yet."}
          </div>
        )}
      </div>

      {showNew && (
        <NewJobModal
          clients={clients}
          crew={crew}
          onClose={() => setShowNew(false)}
          onDone={() => {
            setShowNew(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
