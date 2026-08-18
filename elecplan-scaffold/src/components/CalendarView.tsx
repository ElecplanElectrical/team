"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  parseISO,
  differenceInCalendarDays,
  getHours,
  getMinutes,
  format,
  addDays,
  addMinutes,
  addWeeks,
  isToday,
  isSameMonth,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Filter, MessageSquareText, Mic, Plus, Users } from "lucide-react";
import type { Role } from "@prisma/client";
import { EVENT_COLOR } from "@/lib/theme";
import { weekDays, weekKey, CAL_HOUR_START, CAL_HOUR_END, CAL_ROW_PX } from "@/lib/week";
import TopBar from "@/components/TopBar";
import NewEventModal from "@/components/NewEventModal";
import EditEventModal, { type CalendarEvent } from "@/components/EditEventModal";
import VoiceScheduler from "@/components/VoiceScheduler";
import ClientSmsPanel from "@/components/ClientSmsPanel";

const UI = {
  bg: "#03101f",
  panel: "#07192b",
  panelAlt: "#09213a",
  border: "rgba(77,150,221,.24)",
  borderSoft: "rgba(77,150,221,.12)",
  text: "#f5f9ff",
  mute: "#93a9c2",
  faint: "#617993",
  blue: "#168dff",
  cyan: "#25c7ff",
};

const HOURS = Array.from({ length: CAL_HOUR_END - CAL_HOUR_START }, (_, i) => CAL_HOUR_START + i);
const SNAP_MINUTES = 15;
const MIN_DURATION_MINUTES = 15;

type DragState = {
  eventId: string;
  mode: "move" | "resize";
  pointerId: number;
  startX: number;
  startY: number;
  columnWidth: number;
  originalStart: Date;
  originalEnd: Date;
  previewStart: Date;
  previewEnd: Date;
};

function hourLabel(hour: number) {
  const suffix = hour < 12 ? "AM" : "PM";
  const value = hour % 12 === 0 ? 12 : hour % 12;
  return `${value}:00 ${suffix}`;
}

function timeRange(startsAt: string, endsAt: string) {
  const s = parseISO(startsAt);
  const e = parseISO(endsAt);
  return `${format(s, "h:mm a")} – ${format(e, "h:mm a")}`;
}

function floatHours(date: Date) {
  return getHours(date) + getMinutes(date) / 60;
}

export default function CalendarView({
  weekStart,
  events,
  jobs,
  employees,
  role,
  currentUserId,
}: {
  weekStart: string;
  events: CalendarEvent[];
  jobs: { id: string; title: string; client?: string | null }[];
  employees: { id: string; name: string }[];
  role: Role;
  currentUserId: string;
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedCrew, setSelectedCrew] = useState<string[]>([]);
  const [smsJobId, setSmsJobId] = useState<string | null>(null);
  const [calendarEvents, setCalendarEvents] = useState(events);
  const [dragError, setDragError] = useState<string | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);

  useEffect(() => setCalendarEvents(events), [events]);

  const start = parseISO(weekStart);
  const days = weekDays(start);
  const label = `${format(days[0], "MMM d")} – ${format(days[6], isSameMonth(days[0], days[6]) ? "d, yyyy" : "MMM d, yyyy")}`;

  const filteredEvents = useMemo(() => {
    if (selectedCrew.length === 0) return calendarEvents;
    return calendarEvents.filter((event) => event.assignedToId && selectedCrew.includes(event.assignedToId));
  }, [calendarEvents, selectedCrew]);

  function go(delta: number) {
    router.push(`/calendar?week=${weekKey(addWeeks(start, delta))}`);
  }
  function goToday() {
    router.push("/calendar");
  }
  function eventsForDay(dayIndex: number) {
    return filteredEvents.filter((event) => differenceInCalendarDays(parseISO(event.startsAt), start) === dayIndex);
  }
  function refresh() {
    setShowModal(false);
    setEditingEvent(null);
    router.refresh();
  }
  function toggleCrew(id: string) {
    setSelectedCrew((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function canDrag(event: CalendarEvent) {
    return role !== "EMPLOYEE" && Boolean(event.jobId);
  }

  function beginPointerAction(e: React.PointerEvent<HTMLDivElement>, event: CalendarEvent, mode: "move" | "resize") {
    if (!canDrag(event)) return;
    e.preventDefault();
    e.stopPropagation();
    const dayColumn = e.currentTarget.closest("[data-day-column]") as HTMLElement | null;
    const columnWidth = dayColumn?.getBoundingClientRect().width ?? 135;
    e.currentTarget.setPointerCapture(e.pointerId);
    const originalStart = parseISO(event.startsAt);
    const originalEnd = parseISO(event.endsAt);
    dragRef.current = {
      eventId: event.id,
      mode,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      columnWidth,
      originalStart,
      originalEnd,
      previewStart: originalStart,
      previewEnd: originalEnd,
    };
    suppressClickRef.current = true;
    setDragError(null);
  }

  function movePointerAction(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    e.preventDefault();

    const minuteDelta = Math.round(((e.clientY - drag.startY) / CAL_ROW_PX) * (60 / SNAP_MINUTES)) * SNAP_MINUTES;
    const dayDelta = drag.mode === "move" ? Math.round((e.clientX - drag.startX) / drag.columnWidth) : 0;

    let nextStart = drag.originalStart;
    let nextEnd = drag.originalEnd;
    if (drag.mode === "move") {
      nextStart = addMinutes(addDays(drag.originalStart, dayDelta), minuteDelta);
      nextEnd = addMinutes(addDays(drag.originalEnd, dayDelta), minuteDelta);
    } else {
      nextEnd = addMinutes(drag.originalEnd, minuteDelta);
      if (nextEnd.getTime() - nextStart.getTime() < MIN_DURATION_MINUTES * 60_000) {
        nextEnd = addMinutes(nextStart, MIN_DURATION_MINUTES);
      }
    }

    drag.previewStart = nextStart;
    drag.previewEnd = nextEnd;
    setCalendarEvents((current) => current.map((item) => item.id === drag.eventId ? { ...item, startsAt: nextStart.toISOString(), endsAt: nextEnd.toISOString() } : item));
  }

  async function endPointerAction(e: React.PointerEvent<HTMLDivElement>, event: CalendarEvent) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId || drag.eventId !== event.id) return;
    e.preventDefault();
    dragRef.current = null;

    const moved = drag.previewStart.getTime() !== drag.originalStart.getTime() || drag.previewEnd.getTime() !== drag.originalEnd.getTime();
    if (!moved) {
      suppressClickRef.current = false;
      return;
    }

    try {
      const url = event.jobId ? `/api/jobs/${event.jobId}` : `/api/events/${event.id}`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledStart: drag.previewStart.toISOString(), scheduledEnd: drag.previewEnd.toISOString(), startsAt: drag.previewStart.toISOString(), endsAt: drag.previewEnd.toISOString() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Could not move this job");
      }
      router.refresh();
    } catch (error) {
      setCalendarEvents(events);
      setDragError(error instanceof Error ? error.message : "Could not update the job schedule");
    } finally {
      setTimeout(() => { suppressClickRef.current = false; }, 0);
    }
  }

  return (
    <>
      <TopBar
        title="Calendar"
        subtitle="Schedule jobs, appointments and team availability"
        rightSlot={
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setShowVoice(true)} className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold" style={{ background: "rgba(22,141,255,.13)", color: UI.cyan, border: "1px solid rgba(37,199,255,.28)" }}><Mic size={17} /><span className="hidden sm:inline">Voice</span></button>
            <button type="button" onClick={() => setShowModal(true)} className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold" style={{ background: UI.blue, color: "white", boxShadow: "0 8px 24px rgba(22,141,255,.25)" }}><Plus size={17} /><span className="hidden sm:inline">New event</span></button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-3 md:p-4 xl:p-5" style={{ background: "radial-gradient(circle at 55% 0%,rgba(20,91,160,.13),transparent 35%),#03101f" }}>
        <div className="mx-auto grid w-full max-w-[1700px] gap-3 xl:grid-cols-[190px_minmax(0,1fr)_280px]">
          <aside className="hidden xl:flex flex-col rounded-xl p-3" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}>
            <div className="flex items-center gap-2 px-1 py-2"><Users size={15} style={{ color: UI.cyan }} /><h2 className="text-xs font-semibold uppercase tracking-[.12em]" style={{ color: UI.mute }}>Team / crew</h2></div>
            <button type="button" onClick={() => setSelectedCrew([])} className="mt-2 flex items-center justify-between rounded-lg px-3 py-2 text-xs" style={{ background: selectedCrew.length === 0 ? "rgba(22,141,255,.13)" : UI.panelAlt, color: selectedCrew.length === 0 ? UI.cyan : UI.mute, border: `1px solid ${UI.borderSoft}` }}><span>All team members</span><Filter size={12} /></button>
            <div className="mt-3 space-y-1">
              {employees.map((employee) => {
                const active = selectedCrew.includes(employee.id);
                return <button type="button" key={employee.id} onClick={() => toggleCrew(employee.id)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left" style={{ background: active ? "rgba(22,141,255,.10)" : "transparent", color: active ? UI.text : UI.mute }}><span className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold" style={{ background: active ? UI.blue : "#0d2a48", color: "white" }}>{employee.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2)}</span><span className="truncate text-xs">{employee.name}</span></button>;
              })}
            </div>
          </aside>

          <main className="min-w-0 rounded-xl" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-3" style={{ borderColor: UI.borderSoft }}>
              <div className="flex items-center gap-2">
                <button type="button" onClick={goToday} className="rounded-lg px-3 py-2 text-xs font-semibold" style={{ background: UI.panelAlt, color: UI.text, border: `1px solid ${UI.border}` }}>Today</button>
                <NavButton onClick={() => go(-1)} label="Previous week"><ChevronLeft size={15} /></NavButton>
                <NavButton onClick={() => go(1)} label="Next week"><ChevronRight size={15} /></NavButton>
                <strong className="hidden text-sm sm:block" style={{ color: UI.text }}>{label}</strong>
              </div>
              <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: "#041323", border: `1px solid ${UI.borderSoft}` }}>
                {['Day', 'Week', 'Month', 'Agenda'].map((view) => <button key={view} type="button" className="rounded-md px-3 py-1.5 text-[11px] font-medium" style={{ background: view === 'Week' ? UI.blue : 'transparent', color: view === 'Week' ? 'white' : UI.mute }}>{view}</button>)}
              </div>
            </div>

            {dragError && <div className="mx-3 mt-3 rounded-lg px-3 py-2 text-xs" style={{ background: "rgba(255,94,114,.1)", border: "1px solid rgba(255,94,114,.3)", color: "#ff7487" }}>{dragError}</div>}
            {role !== "EMPLOYEE" && <div className="hidden px-3 pt-3 text-[11px] md:block" style={{ color: UI.faint }}>Drag a job to move it. Drag the handle at the bottom of a job to change its length. Changes snap to 15 minutes.</div>}

            <div className="md:hidden p-3">
              <div className="mb-3 flex items-center justify-between"><strong className="text-sm" style={{ color: UI.text }}>{label}</strong></div>
              <div className="mt-3 space-y-2">
                {days.flatMap((day, dayIndex) => eventsForDay(dayIndex).map((event) => ({ day, event }))).map(({ day, event }) => {
                  const c = EVENT_COLOR[event.type] ?? EVENT_COLOR.job;
                  return <button key={event.id} type="button" onClick={() => setEditingEvent(event)} className="w-full rounded-xl p-3 text-left" style={{ background: UI.panelAlt, border: `1px solid ${UI.borderSoft}`, borderLeft: `3px solid ${c.border}` }}><div className="flex items-center gap-2"><span className="text-xs font-semibold" style={{ color: UI.text }}>{format(day, 'EEE d')}</span><span className="ml-auto text-[10px]" style={{ color: UI.mute }}>{timeRange(event.startsAt, event.endsAt)}</span></div><p className="mt-2 truncate text-sm font-semibold" style={{ color: UI.text }}>{event.title}</p></button>;
                })}
                {filteredEvents.length === 0 && <div className="rounded-xl py-12 text-center" style={{ background: UI.panelAlt, color: UI.faint }}><CalendarDays className="mx-auto mb-2" size={24} /><p className="text-xs">No events this week.</p></div>}
              </div>
            </div>

            <div className="hidden md:block overflow-x-auto">
              <div style={{ minWidth: 56 + 7 * 135 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(7,minmax(135px,1fr))' }}>
                  <div />
                  {days.map((day) => <div key={day.toISOString()} className="border-b px-2 py-3 text-center" style={{ borderColor: UI.borderSoft, background: isToday(day) ? 'rgba(22,141,255,.05)' : 'transparent' }}><div className="text-[10px] font-semibold uppercase tracking-[.10em]" style={{ color: UI.faint }}>{format(day, 'EEE')}</div><div className="mt-1 text-xs font-semibold" style={{ color: isToday(day) ? UI.cyan : UI.text }}>{format(day, 'MMM d')}</div></div>)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(7,minmax(135px,1fr))' }}>
                  <div style={{ position: 'relative', height: (CAL_HOUR_END - CAL_HOUR_START) * CAL_ROW_PX }}>
                    {HOURS.map((hour, index) => <div key={hour} className="pr-2 text-right text-[10px]" style={{ position: 'absolute', top: index * CAL_ROW_PX - 7, right: 0, width: '100%', color: UI.faint }}>{hourLabel(hour)}</div>)}
                  </div>
                  {days.map((day, dayIndex) => <div data-day-column key={day.toISOString()} style={{ position: 'relative', height: (CAL_HOUR_END - CAL_HOUR_START) * CAL_ROW_PX, borderLeft: `1px solid ${UI.borderSoft}`, background: isToday(day) ? 'rgba(22,141,255,.025)' : 'transparent' }}>
                    {HOURS.map((hour, index) => <div key={hour} style={{ position: 'absolute', top: index * CAL_ROW_PX, left: 0, right: 0, borderTop: `1px solid ${UI.borderSoft}` }} />)}
                    {eventsForDay(dayIndex).map((event) => {
                      const s = parseISO(event.startsAt);
                      const e = parseISO(event.endsAt);
                      const top = (floatHours(s) - CAL_HOUR_START) * CAL_ROW_PX;
                      const height = Math.max((floatHours(e) - floatHours(s)) * CAL_ROW_PX - 4, 30);
                      if (top < 0 || top >= (CAL_HOUR_END - CAL_HOUR_START) * CAL_ROW_PX) return null;
                      const c = EVENT_COLOR[event.type] ?? EVENT_COLOR.job;
                      const draggable = canDrag(event);
                      return <div
                        key={event.id}
                        onPointerDown={(pointerEvent) => beginPointerAction(pointerEvent, event, "move")}
                        onPointerMove={movePointerAction}
                        onPointerUp={(pointerEvent) => endPointerAction(pointerEvent, event)}
                        onPointerCancel={(pointerEvent) => endPointerAction(pointerEvent, event)}
                        onClick={() => { if (!suppressClickRef.current) setEditingEvent(event); }}
                        className="absolute overflow-hidden rounded-lg px-2 py-1.5 text-left shadow-lg hover:brightness-110"
                        style={{ top, height: Math.min(height, (CAL_HOUR_END - CAL_HOUR_START) * CAL_ROW_PX - top), left: 5, right: 5, background: c.bg, border: `1px solid ${c.border}55`, borderLeft: `3px solid ${c.border}`, color: c.fg, cursor: draggable ? "grab" : "pointer", touchAction: draggable ? "none" : "auto", userSelect: "none" }}
                      >
                        <div className="text-[10px] opacity-80">{timeRange(event.startsAt, event.endsAt)}</div>
                        <div className="mt-0.5 truncate text-[11px] font-semibold">{event.title}</div>
                        {draggable && <div
                          aria-label="Resize job"
                          onPointerDown={(pointerEvent) => beginPointerAction(pointerEvent, event, "resize")}
                          className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize"
                          style={{ background: `linear-gradient(to bottom, transparent, ${c.border}55)`, touchAction: "none" }}
                        ><div className="mx-auto mt-1 h-0.5 w-8 rounded-full" style={{ background: c.border }} /></div>}
                      </div>;
                    })}
                  </div>)}
                </div>
              </div>
            </div>
          </main>

          <aside className="hidden xl:block rounded-xl p-4" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}>
            {editingEvent ? <><div className="flex items-center justify-between"><h2 className="text-sm font-semibold" style={{ color: UI.text }}>Event details</h2></div><h3 className="mt-5 text-base font-semibold" style={{ color: UI.text }}>{editingEvent.title}</h3><p className="mt-2 text-xs leading-5" style={{ color: UI.mute }}>{format(parseISO(editingEvent.startsAt), 'EEE d MMM yyyy')}<br />{timeRange(editingEvent.startsAt, editingEvent.endsAt)}</p>{role !== "EMPLOYEE" && editingEvent.jobId && <button type="button" onClick={() => setSmsJobId(editingEvent.jobId)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold" style={{ background: "rgba(22,141,255,.12)", color: UI.cyan, border: "1px solid rgba(37,199,255,.28)" }}><MessageSquareText size={15} /> Send SMS to client</button>}</> : <div className="flex min-h-[320px] flex-col items-center justify-center text-center"><CalendarDays size={28} style={{ color: UI.faint }} /><p className="mt-3 text-sm font-semibold" style={{ color: UI.text }}>Select an event</p></div>}
          </aside>
        </div>
      </div>

      <button type="button" onClick={() => setShowVoice(true)} aria-label="Voice schedule" className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-2xl md:hidden" style={{ background: 'linear-gradient(145deg,#168dff,#075fd0)', color: 'white', boxShadow: '0 12px 40px rgba(22,141,255,.4)' }}><Mic size={23} /></button>

      {showModal && <NewEventModal jobs={jobs} employees={employees} role={role} currentUserId={currentUserId} defaultDate={weekKey(days[0])} onClose={() => setShowModal(false)} onDone={refresh} />}
      {editingEvent && <EditEventModal event={editingEvent} jobs={jobs} employees={employees} role={role} currentUserId={currentUserId} onClose={() => setEditingEvent(null)} onDone={refresh} />}
      <VoiceScheduler open={showVoice} onClose={() => setShowVoice(false)} onDone={() => router.refresh()} jobs={jobs} employees={employees} role={role} currentUserId={currentUserId} />
      <ClientSmsPanel jobId={smsJobId} open={Boolean(smsJobId)} onClose={() => setSmsJobId(null)} />
    </>
  );
}

function NavButton({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return <button type="button" onClick={onClick} aria-label={label} className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: UI.panelAlt, border: `1px solid ${UI.border}`, color: UI.mute }}>{children}</button>;
}
