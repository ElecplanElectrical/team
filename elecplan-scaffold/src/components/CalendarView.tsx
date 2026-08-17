"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  parseISO,
  differenceInCalendarDays,
  getHours,
  getMinutes,
  format,
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
  green: "#18d3a0",
  purple: "#8a5cf6",
  orange: "#ff9f1c",
};

const HOURS = Array.from({ length: CAL_HOUR_END - CAL_HOUR_START }, (_, i) => CAL_HOUR_START + i);

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

  const start = parseISO(weekStart);
  const days = weekDays(start);
  const label = `${format(days[0], "MMM d")} – ${format(days[6], isSameMonth(days[0], days[6]) ? "d, yyyy" : "MMM d, yyyy")}`;

  const filteredEvents = useMemo(() => {
    if (selectedCrew.length === 0) return events;
    return events.filter((event) => event.assignedToId && selectedCrew.includes(event.assignedToId));
  }, [events, selectedCrew]);

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

  return (
    <>
      <TopBar
        title="Calendar"
        subtitle="Schedule jobs, appointments and team availability"
        rightSlot={
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setShowVoice(true)} className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold" style={{ background: "rgba(22,141,255,.13)", color: UI.cyan, border: "1px solid rgba(37,199,255,.28)" }}>
              <Mic size={17} /><span className="hidden sm:inline">Voice</span>
            </button>
            <button type="button" onClick={() => setShowModal(true)} className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold" style={{ background: UI.blue, color: "white", boxShadow: "0 8px 24px rgba(22,141,255,.25)" }}>
              <Plus size={17} /><span className="hidden sm:inline">New event</span>
            </button>
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
                return <button type="button" key={employee.id} onClick={() => toggleCrew(employee.id)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left" style={{ background: active ? "rgba(22,141,255,.10)" : "transparent", color: active ? UI.text : UI.mute }}><span className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold" style={{ background: active ? UI.blue : "#0d2a48", color: "white" }}>{employee.name.split(/\s+/).map((part) => part[0]).join("").slice(0,2)}</span><span className="truncate text-xs">{employee.name}</span></button>;
              })}
              {employees.length === 0 && <p className="px-2 py-3 text-xs" style={{ color: UI.faint }}>Your assigned schedule</p>}
            </div>
            <div className="mt-auto rounded-xl p-3" style={{ background: "linear-gradient(145deg,rgba(22,141,255,.13),rgba(10,32,56,.85))", border: "1px solid rgba(37,199,255,.22)" }}>
              <div className="flex items-center gap-2"><Mic size={15} style={{ color: UI.cyan }} /><span className="text-xs font-semibold" style={{ color: UI.text }}>Schedule by voice</span></div>
              <p className="mt-2 text-[10px] leading-4" style={{ color: UI.mute }}>“Schedule the switchboard job tomorrow at 7am with Tom for two hours.”</p>
              <button type="button" onClick={() => setShowVoice(true)} className="mt-3 w-full rounded-lg px-3 py-2 text-xs font-semibold" style={{ color: UI.cyan, border: "1px solid rgba(37,199,255,.30)" }}>Open voice scheduler</button>
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
                {['Day','Week','Month','Agenda'].map((view) => <button key={view} type="button" className="rounded-md px-3 py-1.5 text-[11px] font-medium" style={{ background: view === 'Week' ? UI.blue : 'transparent', color: view === 'Week' ? 'white' : UI.mute }}>{view}</button>)}
              </div>
            </div>

            <div className="md:hidden p-3">
              <div className="mb-3 flex items-center justify-between"><strong className="text-sm" style={{ color: UI.text }}>{label}</strong><button type="button" onClick={() => setShowVoice(true)} className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: UI.blue, color: 'white' }}><Mic size={17} /></button></div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {days.map((day) => <div key={day.toISOString()} className="min-w-[52px] rounded-lg px-2 py-2 text-center" style={{ background: isToday(day) ? "rgba(22,141,255,.18)" : UI.panelAlt, border: `1px solid ${isToday(day) ? 'rgba(37,199,255,.35)' : UI.borderSoft}` }}><div className="text-[10px] uppercase" style={{ color: isToday(day) ? UI.cyan : UI.faint }}>{format(day,'EEE')}</div><div className="text-sm font-semibold" style={{ color: UI.text }}>{format(day,'d')}</div></div>)}
              </div>
              <div className="mt-3 space-y-2">
                {days.flatMap((day, dayIndex) => eventsForDay(dayIndex).map((event) => ({ day, event }))).map(({ day, event }) => {
                  const c = EVENT_COLOR[event.type] ?? EVENT_COLOR.job;
                  return (
                    <div key={event.id} className="flex items-stretch gap-2 rounded-xl p-2" style={{ background: UI.panelAlt, border: `1px solid ${UI.borderSoft}`, borderLeft: `3px solid ${c.border}` }}>
                      <button type="button" onClick={() => setEditingEvent(event)} className="min-w-0 flex-1 p-1 text-left">
                        <div className="flex items-center gap-2"><span className="text-xs font-semibold" style={{ color: UI.text }}>{format(day,'EEE d')}</span><span className="ml-auto text-[10px]" style={{ color: UI.mute }}>{timeRange(event.startsAt,event.endsAt)}</span></div>
                        <p className="mt-2 truncate text-sm font-semibold" style={{ color: UI.text }}>{event.title}</p>
                      </button>
                      {role !== "EMPLOYEE" && event.jobId && (
                        <button type="button" onClick={() => setSmsJobId(event.jobId)} aria-label={`Send SMS for ${event.title}`} className="flex w-11 shrink-0 items-center justify-center rounded-lg" style={{ background: "rgba(22,141,255,.12)", color: UI.cyan, border: "1px solid rgba(37,199,255,.22)" }}>
                          <MessageSquareText size={17} />
                        </button>
                      )}
                    </div>
                  );
                })}
                {filteredEvents.length === 0 && <div className="rounded-xl py-12 text-center" style={{ background: UI.panelAlt, color: UI.faint }}><CalendarDays className="mx-auto mb-2" size={24} /><p className="text-xs">No events this week.</p></div>}
              </div>
            </div>

            <div className="hidden md:block overflow-x-auto">
              <div style={{ minWidth: 56 + 7 * 135 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(7,minmax(135px,1fr))' }}>
                  <div />
                  {days.map((day) => <div key={day.toISOString()} className="border-b px-2 py-3 text-center" style={{ borderColor: UI.borderSoft, background: isToday(day) ? 'rgba(22,141,255,.05)' : 'transparent' }}><div className="text-[10px] font-semibold uppercase tracking-[.10em]" style={{ color: UI.faint }}>{format(day,'EEE')}</div><div className="mt-1 text-xs font-semibold" style={{ color: isToday(day) ? UI.cyan : UI.text }}>{format(day,'MMM d')}</div></div>)}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '56px repeat(7,minmax(135px,1fr))' }}>
                  <div style={{ position:'relative', height:(CAL_HOUR_END-CAL_HOUR_START)*CAL_ROW_PX }}>
                    {HOURS.map((hour,index) => <div key={hour} className="pr-2 text-right text-[10px]" style={{ position:'absolute', top:index*CAL_ROW_PX-7, right:0, width:'100%', color:UI.faint }}>{hourLabel(hour)}</div>)}
                    <div className="pr-2 text-right text-[10px]" style={{ position:'absolute', bottom:-7, right:0, width:'100%', color:UI.faint }}>9:00 PM</div>
                  </div>
                  {days.map((day,dayIndex) => <div key={day.toISOString()} style={{ position:'relative', height:(CAL_HOUR_END-CAL_HOUR_START)*CAL_ROW_PX, borderLeft:`1px solid ${UI.borderSoft}`, background:isToday(day)?'rgba(22,141,255,.025)':'transparent' }}>
                    {HOURS.map((hour,index) => <div key={hour} style={{ position:'absolute', top:index*CAL_ROW_PX, left:0, right:0, borderTop:`1px solid ${UI.borderSoft}` }} />)}
                    {eventsForDay(dayIndex).map((event) => {
                      const s=parseISO(event.startsAt); const e=parseISO(event.endsAt); const top=(floatHours(s)-CAL_HOUR_START)*CAL_ROW_PX; const height=Math.max((floatHours(e)-floatHours(s))*CAL_ROW_PX-4,30); if(top<0 || top>=(CAL_HOUR_END-CAL_HOUR_START)*CAL_ROW_PX) return null; const c=EVENT_COLOR[event.type]??EVENT_COLOR.job;
                      return <button key={event.id} onClick={() => setEditingEvent(event)} className="absolute overflow-hidden rounded-lg px-2 py-1.5 text-left shadow-lg hover:brightness-110" style={{ top, height:Math.min(height,(CAL_HOUR_END-CAL_HOUR_START)*CAL_ROW_PX-top), left:5, right:5, background:c.bg, border:`1px solid ${c.border}55`, borderLeft:`3px solid ${c.border}`, color:c.fg }}><div className="text-[10px] opacity-80">{timeRange(event.startsAt,event.endsAt)}</div><div className="mt-0.5 truncate text-[11px] font-semibold">{event.title}</div></button>;
                    })}
                  </div>)}
                </div>
              </div>
            </div>
          </main>

          <aside className="hidden xl:block rounded-xl p-4" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}>
            {editingEvent ? (
              <>
                <div className="flex items-center justify-between"><h2 className="text-sm font-semibold" style={{ color:UI.text }}>Event details</h2><span className="rounded-full px-2 py-1 text-[9px] capitalize" style={{ background:'rgba(22,141,255,.13)', color:UI.cyan }}>{editingEvent.type}</span></div>
                <h3 className="mt-5 text-base font-semibold" style={{ color:UI.text }}>{editingEvent.title}</h3>
                <p className="mt-2 text-xs leading-5" style={{ color:UI.mute }}>{format(parseISO(editingEvent.startsAt),'EEE d MMM yyyy')}<br />{timeRange(editingEvent.startsAt,editingEvent.endsAt)}</p>
                <button type="button" onClick={() => setEditingEvent(editingEvent)} className="mt-6 w-full rounded-lg px-3 py-2.5 text-xs font-semibold" style={{ background:UI.blue,color:'white' }}>Edit event</button>
                {role !== "EMPLOYEE" && editingEvent.jobId && (
                  <div className="mt-4 border-t pt-4" style={{ borderColor: UI.borderSoft }}>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.12em]" style={{ color: UI.faint }}>Quick actions</p>
                    <button type="button" onClick={() => setSmsJobId(editingEvent.jobId)} className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold" style={{ background: "rgba(22,141,255,.12)", color: UI.cyan, border: "1px solid rgba(37,199,255,.28)" }}>
                      <MessageSquareText size={15} /> Send SMS to client
                    </button>
                    <p className="mt-2 text-[10px] leading-4" style={{ color: UI.faint }}>You will review the recipient and booking message before anything is sent.</p>
                  </div>
                )}
              </>
            ) : <div className="flex min-h-[320px] flex-col items-center justify-center text-center"><CalendarDays size={28} style={{ color:UI.faint }} /><p className="mt-3 text-sm font-semibold" style={{ color:UI.text }}>Select an event</p><p className="mt-1 max-w-[190px] text-xs leading-5" style={{ color:UI.mute }}>Job and appointment details will appear here.</p></div>}
          </aside>
        </div>
      </div>

      <button type="button" onClick={() => setShowVoice(true)} aria-label="Voice schedule" className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-2xl md:hidden" style={{ background:'linear-gradient(145deg,#168dff,#075fd0)', color:'white', boxShadow:'0 12px 40px rgba(22,141,255,.4)' }}><Mic size={23} /></button>

      {showModal && <NewEventModal jobs={jobs} employees={employees} role={role} currentUserId={currentUserId} defaultDate={weekKey(days[0])} onClose={() => setShowModal(false)} onDone={refresh} />}
      {editingEvent && <EditEventModal event={editingEvent} jobs={jobs} employees={employees} role={role} currentUserId={currentUserId} onClose={() => setEditingEvent(null)} onDone={refresh} />}
      <VoiceScheduler open={showVoice} onClose={() => setShowVoice(false)} onDone={() => router.refresh()} jobs={jobs} employees={employees} role={role} currentUserId={currentUserId} />
      <ClientSmsPanel jobId={smsJobId} open={Boolean(smsJobId)} onClose={() => setSmsJobId(null)} />
    </>
  );
}

function NavButton({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return <button type="button" onClick={onClick} aria-label={label} className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background:UI.panelAlt,border:`1px solid ${UI.border}`,color:UI.mute }}>{children}</button>;
}
