"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Filter, MapPin, Plus, Users } from "lucide-react";
import type { Role } from "@prisma/client";
import NewEventModal from "@/components/NewEventModal";
import type { CalendarEvent } from "@/components/EditEventModal";

type MobileJob = {
  id: string;
  title: string;
  client?: string | null;
  address?: string | null;
  status?: string | null;
  crew?: string | null;
  assignedToId?: string | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
};

type Employee = { id: string; name: string };

type StatusStyle = {
  label: string;
  bg: string;
  border: string;
  text: string;
  dot: string;
};

const UI = {
  bg: "#07110d",
  panel: "#0d1913",
  panelAlt: "#13231a",
  border: "rgba(151, 184, 160, .22)",
  borderSoft: "rgba(151, 184, 160, .12)",
  text: "#f4f7f4",
  mute: "#a5b6a9",
  faint: "#74877a",
  accent: "#5ea676",
};

const STATUS: Record<string, StatusStyle> = {
  SCHEDULED: {
    label: "Scheduled",
    bg: "#bfe8e4",
    border: "#72c9c1",
    text: "#123d3a",
    dot: "#72c9c1",
  },
  IN_PROGRESS: {
    label: "In progress",
    bg: "#bfe6ca",
    border: "#63b57a",
    text: "#173f23",
    dot: "#63b57a",
  },
  COMPLETE: {
    label: "Complete",
    bg: "#d9ddda",
    border: "#aeb6b0",
    text: "#3d4941",
    dot: "#aeb6b0",
  },
};

const FALLBACK_STATUS: StatusStyle = STATUS.SCHEDULED;
const WEEK_DAYS = ["M", "T", "W", "T", "F", "S", "S"];

function jobStatus(status?: string | null) {
  return STATUS[status ?? ""] ?? FALLBACK_STATUS;
}

function dateOnly(value: string) {
  return startOfDay(parseISO(value));
}

function overlapsDay(job: MobileJob, day: Date) {
  if (!job.scheduledStart || !job.scheduledEnd) return false;
  const target = startOfDay(day).getTime();
  const from = dateOnly(job.scheduledStart).getTime();
  const to = dateOnly(job.scheduledEnd).getTime();
  return target >= Math.min(from, to) && target <= Math.max(from, to);
}

function statusLabel(status?: string | null) {
  return jobStatus(status).label;
}

export default function QLSMobileCalendar({
  events,
  jobs,
  employees,
  role,
  currentUserId,
}: {
  events: CalendarEvent[];
  jobs: MobileJob[];
  employees: Employee[];
  role: Role;
  currentUserId: string;
}) {
  const router = useRouter();
  const [displayMonth, setDisplayMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));
  const [crewFilter, setCrewFilter] = useState("all");
  const [showNewEvent, setShowNewEvent] = useState(false);

  const monthDays = useMemo(() => {
    const from = startOfWeek(startOfMonth(displayMonth), { weekStartsOn: 1 });
    const to = endOfWeek(endOfMonth(displayMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start: from, end: to });
  }, [displayMonth]);

  const filteredJobs = useMemo(
    () =>
      jobs.filter((job) => {
        if (!job.scheduledStart || !job.scheduledEnd) return false;
        if (crewFilter === "all") return true;
        return job.assignedToId === crewFilter;
      }),
    [crewFilter, jobs],
  );

  const visibleEvents = useMemo(
    () => events.filter((event) => !event.jobId && (crewFilter === "all" || event.assignedToId === crewFilter)),
    [crewFilter, events],
  );

  const selectedJobs = useMemo(
    () => filteredJobs.filter((job) => overlapsDay(job, selectedDay)),
    [filteredJobs, selectedDay],
  );

  const selectedEvents = useMemo(
    () => visibleEvents.filter((event) => isSameDay(parseISO(event.startsAt), selectedDay)),
    [selectedDay, visibleEvents],
  );

  function changeMonth(delta: number) {
    const next = addMonths(displayMonth, delta);
    setDisplayMonth(next);
    setSelectedDay(startOfMonth(next));
  }

  function goToday() {
    const today = startOfDay(new Date());
    setDisplayMonth(startOfMonth(today));
    setSelectedDay(today);
  }

  function jobsForDay(day: Date) {
    return filteredJobs.filter((job) => overlapsDay(job, day));
  }

  function extraEventsForDay(day: Date) {
    return visibleEvents.filter((event) => isSameDay(parseISO(event.startsAt), day));
  }

  return (
    <div className="min-h-dvh w-full overflow-x-hidden pb-24" style={{ background: UI.bg, color: UI.text }}>
      <header className="sticky top-0 z-30 border-b px-3 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-xl" style={{ background: "rgba(7,17,13,.96)", borderColor: UI.borderSoft }}>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[.16em]" style={{ color: UI.faint }}>QLS schedule</p>
            <h1 className="mt-0.5 truncate text-xl font-semibold">Calendar</h1>
          </div>
          <button
            type="button"
            onClick={() => setShowNewEvent(true)}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold"
            style={{ background: UI.accent, color: "white" }}
          >
            <Plus size={16} /> New
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month" className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: UI.panelAlt, border: `1px solid ${UI.border}` }}><ChevronLeft size={18} /></button>
          <button type="button" onClick={goToday} className="min-w-0 flex-1 rounded-xl px-3 py-2 text-center" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}>
            <div className="truncate text-sm font-semibold">{format(displayMonth, "MMMM yyyy")}</div>
            <div className="mt-0.5 text-[10px]" style={{ color: UI.mute }}>Tap to return to today</div>
          </button>
          <button type="button" onClick={() => changeMonth(1)} aria-label="Next month" className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: UI.panelAlt, border: `1px solid ${UI.border}` }}><ChevronRight size={18} /></button>
        </div>

        {employees.length > 0 && (
          <label className="mt-2 flex h-10 items-center gap-2 rounded-xl px-3" style={{ background: UI.panelAlt, border: `1px solid ${UI.border}` }}>
            <Filter size={14} style={{ color: UI.mute }} />
            <span className="shrink-0 text-[11px] font-medium" style={{ color: UI.mute }}>Crew</span>
            <select
              value={crewFilter}
              onChange={(event) => setCrewFilter(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-right text-xs font-semibold outline-none"
              style={{ color: UI.text }}
            >
              <option value="all">All team members</option>
              {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}
            </select>
          </label>
        )}

        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
          {Object.entries(STATUS).map(([key, style]) => (
            <span key={key} className="inline-flex items-center gap-1.5 text-[10px] font-medium" style={{ color: UI.mute }}>
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: style.bg, border: `1px solid ${style.border}` }} />
              {style.label}
            </span>
          ))}
        </div>
      </header>

      <main className="px-2.5 py-3">
        <section className="overflow-hidden rounded-2xl" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}>
          <div className="grid grid-cols-7 border-b" style={{ borderColor: UI.borderSoft }}>
            {WEEK_DAYS.map((label, index) => (
              <div key={`${label}-${index}`} className="py-2 text-center text-[10px] font-semibold" style={{ color: UI.faint }}>{label}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {monthDays.map((day, index) => {
              const dayJobs = jobsForDay(day);
              const dayEvents = extraEventsForDay(day);
              const selected = isSameDay(day, selectedDay);
              const currentMonth = isSameMonth(day, displayMonth);
              return (
                <button
                  type="button"
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(day)}
                  className="relative min-h-[78px] min-w-0 overflow-hidden border-b border-r p-1 text-left active:opacity-80"
                  style={{
                    borderColor: UI.borderSoft,
                    background: selected ? "rgba(94,166,118,.14)" : isToday(day) ? "rgba(94,166,118,.06)" : "transparent",
                    opacity: currentMonth ? 1 : .43,
                    borderRightWidth: index % 7 === 6 ? 0 : 1,
                  }}
                >
                  <span
                    className="mb-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold"
                    style={{
                      background: isToday(day) ? UI.accent : "transparent",
                      color: isToday(day) ? "white" : currentMonth ? UI.text : UI.faint,
                      outline: selected && !isToday(day) ? `1px solid ${UI.accent}` : "none",
                    }}
                  >
                    {format(day, "d")}
                  </span>

                  <div className="space-y-0.5">
                    {dayJobs.slice(0, 2).map((job) => {
                      const style = jobStatus(job.status);
                      return (
                        <span
                          key={job.id}
                          className="block w-full truncate rounded-[4px] px-1 py-[2px] text-[8px] font-semibold leading-[1.25]"
                          style={{ background: style.bg, color: style.text, borderLeft: `2px solid ${style.border}` }}
                        >
                          {job.title}
                        </span>
                      );
                    })}
                    {dayJobs.length > 2 && <span className="block px-0.5 text-[8px] font-semibold" style={{ color: UI.mute }}>+{dayJobs.length - 2} jobs</span>}
                    {dayJobs.length === 0 && dayEvents.length > 0 && <span className="block truncate px-0.5 text-[8px] font-medium" style={{ color: UI.mute }}>• {dayEvents[0].title}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-3 overflow-hidden rounded-2xl" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}>
          <div className="flex items-center justify-between gap-3 border-b px-3 py-3" style={{ borderColor: UI.borderSoft }}>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[.12em]" style={{ color: UI.faint }}>Selected day</p>
              <h2 className="mt-0.5 truncate text-base font-semibold">{format(selectedDay, "EEEE d MMMM")}</h2>
            </div>
            <CalendarDays size={18} style={{ color: UI.accent }} />
          </div>

          {selectedJobs.length === 0 && selectedEvents.length === 0 ? (
            <div className="px-4 py-7 text-center">
              <p className="text-sm font-semibold">No bookings</p>
              <p className="mt-1 text-xs" style={{ color: UI.mute }}>There are no QLS jobs or calendar items booked for this day.</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: UI.borderSoft }}>
              {selectedJobs.map((job) => {
                const style = jobStatus(job.status);
                return (
                  <button
                    type="button"
                    key={job.id}
                    onClick={() => router.push(`/jobs/${job.id}`)}
                    className="block w-full px-3 py-3 text-left active:opacity-75"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-1 h-3 w-3 shrink-0 rounded-sm" style={{ background: style.bg, border: `1px solid ${style.border}` }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 flex-1 text-sm font-semibold leading-5">{job.title}</p>
                          <span className="shrink-0 rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wide" style={{ background: style.bg, color: style.text }}>{statusLabel(job.status)}</span>
                        </div>
                        {job.client && <p className="mt-1 truncate text-xs font-medium" style={{ color: UI.mute }}>{job.client}</p>}
                        {job.address && <p className="mt-1 flex items-start gap-1.5 text-[11px] leading-4" style={{ color: UI.faint }}><MapPin size={12} className="mt-0.5 shrink-0" />{job.address}</p>}
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px]" style={{ color: UI.mute }}>
                          {job.scheduledStart && job.scheduledEnd && <span>{format(parseISO(job.scheduledStart), "d MMM")} → {format(parseISO(job.scheduledEnd), "d MMM")}</span>}
                          {job.crew && <span className="inline-flex items-center gap-1"><Users size={11} />{job.crew}</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

              {selectedEvents.map((event) => (
                <div key={event.id} className="px-3 py-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: UI.accent }} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{event.title}</p>
                      <p className="mt-1 text-[10px]" style={{ color: UI.mute }}>{format(parseISO(event.startsAt), "h:mm a")} – {format(parseISO(event.endsAt), "h:mm a")}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {showNewEvent && (
        <NewEventModal
          jobs={jobs}
          employees={employees}
          role={role}
          currentUserId={currentUserId}
          defaultDate={format(selectedDay, "yyyy-MM-dd")}
          onClose={() => setShowNewEvent(false)}
          onDone={() => {
            setShowNewEvent(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
