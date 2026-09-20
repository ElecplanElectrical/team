"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, addMinutes, addWeeks, differenceInCalendarDays, format, getHours, getMinutes, isSameMonth, isToday, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Filter, MapPin, MessageSquareText, Mic, Plus, Users, UserRound, X } from "lucide-react";
import type { Role } from "@prisma/client";
import { EVENT_COLOR } from "@/lib/theme";
import { CAL_HOUR_END, CAL_HOUR_START, CAL_ROW_PX, weekDays, weekKey } from "@/lib/week";
import TopBar from "@/components/TopBar";
import NewEventModal from "@/components/NewEventModal";
import EditEventModal, { type CalendarEvent } from "@/components/EditEventModal";
import VoiceScheduler from "@/components/VoiceScheduler";
import ClientSmsPanel from "@/components/ClientSmsPanel";

import { PORTAL_UI as UI } from "@/lib/carbon-theme";

const HOURS = Array.from({ length: CAL_HOUR_END - CAL_HOUR_START }, (_, index) => CAL_HOUR_START + index);
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

type JobOption = {
  id: string;
  title: string;
  client?: string | null;
  contactName?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  status?: string | null;
  crew?: string | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
};

function hourLabel(hour: number) {
  const suffix = hour < 12 ? "AM" : "PM";
  const value = hour % 12 === 0 ? 12 : hour % 12;
  return `${value}:00 ${suffix}`;
}

function timeRange(start: string, end: string) {
  return `${format(parseISO(start), "h:mm a")} – ${format(parseISO(end), "h:mm a")}`;
}

function floatHours(date: Date) {
  return getHours(date) + getMinutes(date) / 60;
}

export default function CalendarView({ weekStart, events, jobs, employees, role, currentUserId }: {
  weekStart: string;
  events: CalendarEvent[];
  jobs: JobOption[];
  employees: { id: string; name: string }[];
  role: Role;
  currentUserId: string;
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedCrew, setSelectedCrew] = useState<string[]>([]);
  const [showCrewFilter, setShowCrewFilter] = useState(false);
  const [smsJobId, setSmsJobId] = useState<string | null>(null);
  const [calendarEvents, setCalendarEvents] = useState(events);
  const [dragError, setDragError] = useState<string | null>(null);
  const [mobileDay, setMobileDay] = useState(() => {
    const index = differenceInCalendarDays(new Date(), parseISO(weekStart));
    return index >= 0 && index < 7 ? index : 0;
  });
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setCalendarEvents(events));
    return () => window.cancelAnimationFrame(frame);
  }, [events]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setSelectedEvent(null); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  const start = parseISO(weekStart);
  const days = weekDays(start);
  const label = `${format(days[0], "MMM d")} – ${format(days[6], isSameMonth(days[0], days[6]) ? "d, yyyy" : "MMM d, yyyy")}`;
  const filteredEvents = useMemo(
    () => selectedCrew.length === 0 ? calendarEvents : calendarEvents.filter((event) => event.assignedToId && selectedCrew.includes(event.assignedToId)),
    [calendarEvents, selectedCrew],
  );
  const selectedJob = selectedEvent?.jobId ? jobs.find((job) => job.id === selectedEvent.jobId) ?? null : null;

  function eventsForDay(index: number) {
    return filteredEvents.filter((event) => differenceInCalendarDays(parseISO(event.startsAt), start) === index);
  }

  function refresh() {
    setShowModal(false);
    setEditingEvent(null);
    setSelectedEvent(null);
    router.refresh();
  }

  function toggleCrew(id: string) {
    setSelectedCrew((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function canDrag(event: CalendarEvent) {
    return role !== "EMPLOYEE" || (!event.jobId && event.assignedToId === currentUserId);
  }

  function editFromCalendar(event: CalendarEvent) {
    if (suppressClickRef.current) return;
    if ((event.fallback || role === "EMPLOYEE") && event.jobId) {
      router.push(`/jobs/${event.jobId}`);
      return;
    }
    setSelectedEvent(event);
    setEditingEvent(event);
  }

  function beginPointerAction(pointer: React.PointerEvent<HTMLDivElement>, event: CalendarEvent, mode: "move" | "resize") {
    if (!canDrag(event)) return;
    pointer.preventDefault();
    pointer.stopPropagation();
    const column = pointer.currentTarget.closest("[data-day-column]") as HTMLElement | null;
    const startAt = parseISO(event.startsAt);
    const endAt = parseISO(event.endsAt);
    pointer.currentTarget.setPointerCapture(pointer.pointerId);
    dragRef.current = { eventId: event.id, mode, pointerId: pointer.pointerId, startX: pointer.clientX, startY: pointer.clientY, columnWidth: column?.getBoundingClientRect().width ?? 135, originalStart: startAt, originalEnd: endAt, previewStart: startAt, previewEnd: endAt };
    suppressClickRef.current = true;
    setDragError(null);
  }

  function movePointerAction(pointer: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== pointer.pointerId) return;
    pointer.preventDefault();
    const minutes = Math.round(((pointer.clientY - drag.startY) / CAL_ROW_PX) * (60 / SNAP_MINUTES)) * SNAP_MINUTES;
    const daysMoved = drag.mode === "move" ? Math.round((pointer.clientX - drag.startX) / drag.columnWidth) : 0;
    let startsAt = drag.originalStart;
    let endsAt = drag.originalEnd;
    if (drag.mode === "move") {
      startsAt = addMinutes(addDays(drag.originalStart, daysMoved), minutes);
      endsAt = addMinutes(addDays(drag.originalEnd, daysMoved), minutes);
    } else {
      endsAt = addMinutes(drag.originalEnd, minutes);
      if (endsAt.getTime() - startsAt.getTime() < MIN_DURATION_MINUTES * 60_000) endsAt = addMinutes(startsAt, MIN_DURATION_MINUTES);
    }
    drag.previewStart = startsAt;
    drag.previewEnd = endsAt;
    setCalendarEvents((current) => current.map((item) => item.id === drag.eventId ? { ...item, startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() } : item));
  }

  async function endPointerAction(pointer: React.PointerEvent<HTMLDivElement>, event: CalendarEvent) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== pointer.pointerId || drag.eventId !== event.id) return;
    pointer.preventDefault();
    dragRef.current = null;
    const moved = drag.previewStart.getTime() !== drag.originalStart.getTime() || drag.previewEnd.getTime() !== drag.originalEnd.getTime();
    if (!moved) {
      suppressClickRef.current = false;
      return;
    }
    try {
      const isJob = Boolean(event.jobId);
      const url = isJob ? `/api/jobs/${event.jobId}` : `/api/events/${event.id}`;
      const payload = isJob ? { scheduledStart: drag.previewStart.toISOString(), scheduledEnd: drag.previewEnd.toISOString() } : { startsAt: drag.previewStart.toISOString(), endsAt: drag.previewEnd.toISOString() };
      const response = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Could not move this calendar item");
      }
      router.refresh();
    } catch (error) {
      setCalendarEvents(events);
      setDragError(error instanceof Error ? error.message : "Could not update this calendar item");
    } finally {
      setTimeout(() => { suppressClickRef.current = false; }, 0);
    }
  }

  function eventBlock(event: CalendarEvent) {
    const startsAt = parseISO(event.startsAt);
    const endsAt = parseISO(event.endsAt);
    const top = (floatHours(startsAt) - CAL_HOUR_START) * CAL_ROW_PX;
    const height = Math.max((floatHours(endsAt) - floatHours(startsAt)) * CAL_ROW_PX - 4, 30);
    if (top < 0 || top >= (CAL_HOUR_END - CAL_HOUR_START) * CAL_ROW_PX) return null;
    const colour = EVENT_COLOR[event.type] ?? EVENT_COLOR.job;
    const draggable = canDrag(event);
    const selected = selectedEvent?.id === event.id;
    return <div key={event.id} onPointerDown={(pointer) => beginPointerAction(pointer, event, "move")} onPointerMove={movePointerAction} onPointerUp={(pointer) => void endPointerAction(pointer, event)} onPointerCancel={(pointer) => void endPointerAction(pointer, event)} onClick={(click) => { click.stopPropagation(); if (!suppressClickRef.current) setSelectedEvent(event); }} onDoubleClick={(click) => { click.stopPropagation(); editFromCalendar(event); }} className="absolute overflow-hidden rounded-lg px-2 py-1.5 text-left shadow-lg" style={{ top, height: Math.min(height, (CAL_HOUR_END - CAL_HOUR_START) * CAL_ROW_PX - top), left: 5, right: 5, background: colour.bg, border: `${selected ? 2 : 1}px solid ${selected ? UI.cyan : `${colour.border}55`}`, borderLeft: `3px solid ${colour.border}`, color: colour.fg, cursor: draggable ? "grab" : "pointer", touchAction: draggable ? "none" : "auto", userSelect: "none" }}><div className="text-[10px] opacity-80">{timeRange(event.startsAt, event.endsAt)}</div><div className="mt-0.5 truncate text-[11px] font-semibold">{event.title}</div>{draggable && <div aria-label="Resize calendar item" onPointerDown={(pointer) => beginPointerAction(pointer, event, "resize")} className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize" style={{ background: `linear-gradient(to bottom,transparent,${colour.border}55)`, touchAction: "none" }}><div className="mx-auto mt-1 h-0.5 w-8 rounded-full" style={{ background: colour.border }} /></div>}</div>;
  }

  return <>
    <TopBar title="Calendar" subtitle="Schedule jobs, appointments and team availability" rightSlot={<div className="flex items-center gap-2"><button onClick={() => setShowVoice(true)} className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold" style={{ background: "rgba(67,210,255,.14)", color: UI.cyan, border: "1px solid rgba(197,205,215,.30)" }}><Mic size={17} /><span className="hidden sm:inline">Voice</span></button><button onClick={() => setShowModal(true)} className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold" style={{ ...UI.primary, color: "#06213a" }}><Plus size={17} /><span className="hidden sm:inline">New event</span></button></div>} />
    <div className="flex-1 overflow-auto p-3 md:p-4 xl:p-5" style={{ background: "var(--ep-main)" }} onClick={() => setSelectedEvent(null)}>
      <div className="w-full">
        <main className="relative min-w-0 rounded-xl" style={{ ...UI.raised, background: UI.panel, border: `1px solid ${UI.border}` }}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-3" style={{ borderColor: UI.borderSoft }}><div className="flex items-center gap-2"><div className="relative"><button onClick={() => setShowCrewFilter((open) => !open)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold" style={{ ...UI.inset, background: UI.panelAlt, color: selectedCrew.length ? UI.cyan : UI.text, border: `1px solid ${UI.border}` }}><Users size={14} /><span>{selectedCrew.length ? `Crew (${selectedCrew.length})` : "Team / crew"}</span><ChevronRight size={13} style={{ transform: showCrewFilter ? "rotate(90deg)" : "none" }} /></button>{showCrewFilter && <div className="absolute left-0 top-11 z-50 w-56 rounded-xl p-2 shadow-2xl" style={{ ...UI.raised, background: UI.panel, border: `1px solid ${UI.border}` }}><button onClick={() => setSelectedCrew([])} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs" style={{ background: selectedCrew.length === 0 ? "rgba(67,210,255,.14)" : "transparent", color: selectedCrew.length === 0 ? UI.cyan : UI.mute }}><span>All team members</span><Filter size={12} /></button>{employees.map((employee) => <button key={employee.id} onClick={() => toggleCrew(employee.id)} className="mt-1 w-full rounded-lg px-3 py-2 text-left text-xs" style={{ background: selectedCrew.includes(employee.id) ? "rgba(67,210,255,.12)" : "transparent", color: selectedCrew.includes(employee.id) ? UI.text : UI.mute }}>{employee.name}</button>)}</div>}</div><button onClick={() => router.push("/calendar")} className="rounded-lg px-3 py-2 text-xs font-semibold" style={{ ...UI.inset, background: UI.panelAlt, color: UI.text, border: `1px solid ${UI.border}` }}>Today</button><NavButton onClick={() => router.push(`/calendar?week=${weekKey(addWeeks(start, -1))}`)} label="Previous week"><ChevronLeft size={15} /></NavButton><NavButton onClick={() => router.push(`/calendar?week=${weekKey(addWeeks(start, 1))}`)} label="Next week"><ChevronRight size={15} /></NavButton><strong className="hidden text-sm sm:block" style={{ color: UI.text }}>{label}</strong></div></div>
          {dragError && <div className="mx-3 mt-3 rounded-lg px-3 py-2 text-xs" style={{ color: "#ff7487" }}>{dragError}</div>}
          <div className="md:hidden"><div className="flex gap-1 overflow-x-auto border-b p-2" style={{ borderColor: UI.borderSoft }}>{days.map((day, index) => <button key={day.toISOString()} onClick={() => setMobileDay(index)} className="min-w-[52px] flex-1 rounded-lg px-2 py-2 text-center" style={{ background: mobileDay === index ? UI.blue : isToday(day) ? "rgba(67,210,255,.12)" : UI.panelAlt, color: mobileDay === index ? "#06213a" : isToday(day) ? UI.cyan : UI.mute }}><div className="text-[9px] font-semibold uppercase">{format(day, "EEE")}</div><div className="mt-1 text-sm font-bold">{format(day, "d")}</div></button>)}</div><div className="px-3 py-2 text-xs font-semibold" style={{ color: UI.text }}>{format(days[mobileDay], "EEEE d MMMM")}</div><div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 245px)" }}><div style={{ display: "grid", gridTemplateColumns: "52px minmax(0,1fr)" }}><div style={{ position: "relative", height: (CAL_HOUR_END - CAL_HOUR_START) * CAL_ROW_PX }}>{HOURS.map((hour, index) => <div key={hour} className="pr-2 text-right text-[9px]" style={{ position: "absolute", top: index * CAL_ROW_PX - 6, right: 0, width: "100%", color: UI.faint }}>{hourLabel(hour)}</div>)}</div><div data-day-column style={{ position: "relative", height: (CAL_HOUR_END - CAL_HOUR_START) * CAL_ROW_PX, borderLeft: `1px solid ${UI.borderSoft}`, background: isToday(days[mobileDay]) ? "rgba(67,210,255,.035)" : "transparent" }}>{HOURS.map((hour, index) => <div key={hour} style={{ position: "absolute", top: index * CAL_ROW_PX, left: 0, right: 0, borderTop: `1px solid ${UI.borderSoft}` }} />)}{eventsForDay(mobileDay).map(eventBlock)}</div></div></div></div>
          <div className="hidden overflow-x-auto md:block"><div style={{ minWidth: 56 + 7 * 135 }}><div style={{ display: "grid", gridTemplateColumns: "56px repeat(7,minmax(135px,1fr))" }}><div />{days.map((day) => <div key={day.toISOString()} className="border-b px-2 py-3 text-center" style={{ borderColor: UI.borderSoft, background: isToday(day) ? "rgba(67,210,255,.07)" : "transparent" }}><div className="text-[10px] font-semibold uppercase" style={{ color: UI.faint }}>{format(day, "EEE")}</div><div className="mt-1 text-xs font-semibold" style={{ color: isToday(day) ? UI.cyan : UI.text }}>{format(day, "MMM d")}</div></div>)}</div><div style={{ display: "grid", gridTemplateColumns: "56px repeat(7,minmax(135px,1fr))" }}><div style={{ position: "relative", height: (CAL_HOUR_END - CAL_HOUR_START) * CAL_ROW_PX }}>{HOURS.map((hour, index) => <div key={hour} className="pr-2 text-right text-[10px]" style={{ position: "absolute", top: index * CAL_ROW_PX - 7, right: 0, width: "100%", color: UI.faint }}>{hourLabel(hour)}</div>)}</div>{days.map((day, dayIndex) => <div data-day-column key={day.toISOString()} style={{ position: "relative", height: (CAL_HOUR_END - CAL_HOUR_START) * CAL_ROW_PX, borderLeft: `1px solid ${UI.borderSoft}`, background: isToday(day) ? "rgba(67,210,255,.035)" : "transparent" }}>{HOURS.map((hour, hourIndex) => <div key={hour} style={{ position: "absolute", top: hourIndex * CAL_ROW_PX, left: 0, right: 0, borderTop: `1px solid ${UI.borderSoft}` }} />)}{eventsForDay(dayIndex).map(eventBlock)}</div>)}</div></div></div>
          {selectedEvent && <EventDetails event={selectedEvent} job={selectedJob} role={role} onClose={() => setSelectedEvent(null)} onEdit={() => setEditingEvent(selectedEvent)} onOpenJob={() => selectedJob && router.push(`/jobs/${selectedJob.id}`)} onSms={() => selectedEvent.jobId && setSmsJobId(selectedEvent.jobId)} />}
        </main>
      </div>
    </div>
    <button onClick={() => setShowVoice(true)} aria-label="Voice schedule" className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full md:hidden" style={{ background: "linear-gradient(145deg,#43D2FF,#43D2FF)", color: "#06213a" }}><Mic size={23} /></button>
    {showModal && <NewEventModal jobs={jobs} employees={employees} role={role} currentUserId={currentUserId} defaultDate={weekKey(days[0])} onClose={() => setShowModal(false)} onDone={refresh} />}
    {editingEvent && <EditEventModal event={editingEvent} jobs={jobs} employees={employees} role={role} currentUserId={currentUserId} onClose={() => setEditingEvent(null)} onDone={refresh} />}
    <VoiceScheduler open={showVoice} onClose={() => setShowVoice(false)} onDone={() => router.refresh()} jobs={jobs} employees={employees} role={role} currentUserId={currentUserId} />
    <ClientSmsPanel jobId={smsJobId} open={Boolean(smsJobId)} onClose={() => setSmsJobId(null)} />
  </>;
}

function EventDetails({ event, job, role, onClose, onEdit, onOpenJob, onSms }: { event: CalendarEvent; job: JobOption | null; role: Role; onClose: () => void; onEdit: () => void; onOpenJob: () => void; onSms: () => void }) {
  return <section className="fixed inset-x-3 bottom-20 z-50 max-h-[72vh] overflow-auto rounded-2xl p-4 shadow-2xl md:absolute md:inset-x-auto md:bottom-auto md:right-4 md:top-16 md:w-[340px]" style={{ background:"var(--ep-shell)", border: `1px solid ${UI.border}`, boxShadow: "0 24px 70px rgba(0,0,0,.48)" }} onClick={(click) => click.stopPropagation()}><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase tracking-[.12em]" style={{ color: UI.faint }}>{job ? "Job details" : "Event details"}</p><h2 className="mt-2 text-base font-semibold" style={{ color: UI.text }}>{event.title}</h2></div><button type="button" aria-label="Close details" onClick={onClose} className="rounded-lg p-1.5" style={{ color: UI.mute, ...UI.inset, background: UI.panelAlt }}><X size={16} /></button></div><p className="mt-2 text-xs" style={{ color: UI.mute }}>{format(parseISO(event.startsAt), "EEE d MMM yyyy")}<br />{timeRange(event.startsAt, event.endsAt)}</p>{job && <div className="mt-5 space-y-3 text-xs"><div><p style={{ color: UI.faint }}>Client</p><p className="mt-1 font-semibold" style={{ color: UI.text }}>{job.client ?? "—"}</p>{job.contactName && <p className="mt-1" style={{ color: UI.mute }}>{job.contactName}</p>}{job.phone && <a href={`tel:${job.phone}`} className="mt-1 block" style={{ color: UI.cyan }}>{job.phone}</a>}</div>{job.address && <div className="flex gap-2"><MapPin size={14} className="mt-0.5 shrink-0" style={{ color: UI.cyan }} /><p style={{ color: UI.text }}>{job.address}</p></div>}<div className="flex gap-2"><UserRound size={14} className="mt-0.5 shrink-0" style={{ color: UI.cyan }} /><p style={{ color: UI.text }}>{job.crew ?? "Unassigned"}</p></div>{job.notes && <div className="rounded-xl p-3" style={{ ...UI.inset, background: UI.panelAlt, border: `1px solid ${UI.borderSoft}` }}><p className="text-[10px] font-semibold uppercase tracking-[.1em]" style={{ color: UI.faint }}>Job notes</p><p className="mt-2 whitespace-pre-wrap leading-5" style={{ color: UI.mute }}>{job.notes}</p></div>}</div>}<div className="mt-5 space-y-2">{job && <button onClick={onOpenJob} className="w-full rounded-lg py-2.5 text-xs font-semibold" style={{ background: "rgba(24,211,160,.10)", color: UI.green, border: "1px solid rgba(24,211,160,.28)" }}>Open full job</button>}{role !== "EMPLOYEE" && !event.fallback && <button onClick={onEdit} className="w-full rounded-lg py-2.5 text-xs font-semibold" style={{ ...UI.primary, color: "#06213a" }}>Edit booking</button>}{role !== "EMPLOYEE" && event.jobId && <button onClick={onSms} className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold" style={{ color: UI.cyan, border: `1px solid ${UI.border}` }}><MessageSquareText size={15} />Send SMS to client</button>}</div></section>;
}

function NavButton({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return <button onClick={onClick} aria-label={label} className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ ...UI.inset, background: UI.panelAlt, border: `1px solid ${UI.border}`, color: UI.mute }}>{children}</button>;
}
