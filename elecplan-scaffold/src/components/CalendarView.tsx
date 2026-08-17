"use client";

import { useState } from "react";
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
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { Role } from "@prisma/client";
import {
  COLORS,
  FONTS,
  ON_ACCENT,
  EVENT_COLOR,
  EVENT_TYPES,
} from "@/lib/theme";
import {
  weekDays,
  weekKey,
  CAL_HOUR_START,
  CAL_HOUR_END,
  CAL_ROW_PX,
} from "@/lib/week";
import TopBar from "@/components/TopBar";
import NewEventModal from "@/components/NewEventModal";
import EditEventModal, { type CalendarEvent } from "@/components/EditEventModal";

const HOURS = Array.from(
  { length: CAL_HOUR_END - CAL_HOUR_START },
  (_, i) => CAL_HOUR_START + i,
);

function hourLabel(h: number): string {
  const ampm = h < 12 ? "am" : "pm";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}${ampm}`;
}

function timeRange(startsAt: string, endsAt: string): string {
  const s = parseISO(startsAt);
  const e = parseISO(endsAt);
  return `${format(s, "h:mm")} – ${format(e, "h:mma").toLowerCase()}`;
}

function floatHours(d: Date): number {
  return getHours(d) + getMinutes(d) / 60;
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
  jobs: { id: string; title: string }[];
  employees: { id: string; name: string }[];
  role: Role;
  currentUserId: string;
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  const start = parseISO(weekStart);
  const days = weekDays(start);
  const label = `${format(days[0], "MMM d")} – ${format(
    days[6],
    isSameMonth(days[0], days[6]) ? "d, yyyy" : "MMM d, yyyy",
  )}`;

  function go(delta: number) {
    router.push(`/calendar?week=${weekKey(addWeeks(start, delta))}`);
  }
  function goToday() {
    router.push("/calendar");
  }

  function eventsForDay(di: number): CalendarEvent[] {
    return events.filter(
      (ev) => differenceInCalendarDays(parseISO(ev.startsAt), start) === di,
    );
  }

  function onCreated() {
    setShowModal(false);
    router.refresh();
  }

  function onEdited() {
    setEditingEvent(null);
    router.refresh();
  }

  return (
    <>
      <TopBar
        title="Calendar"
        subtitle={`${label} · Melbourne time`}
        rightSlot={
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold"
            style={{ background: COLORS.accent, color: ON_ACCENT }}
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New event</span>
          </button>
        }
      />

      <div className="flex-1 overflow-auto p-4 md:p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <NavBtn onClick={() => go(-1)} aria-label="Previous week">
              <ChevronLeft size={16} />
            </NavBtn>
            <NavBtn onClick={() => go(1)} aria-label="Next week">
              <ChevronRight size={16} />
            </NavBtn>
            <button
              type="button"
              onClick={goToday}
              className="rounded-md px-3 py-1.5 text-xs font-medium"
              style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                color: COLORS.textMute,
              }}
            >
              Today
            </button>
            <span
              className="ml-1 text-sm font-medium"
              style={{ color: COLORS.text, fontFamily: FONTS.mono }}
            >
              {label}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {EVENT_TYPES.map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: EVENT_COLOR[t].border }}
                />
                <span
                  className="text-xs capitalize"
                  style={{ color: COLORS.textMute }}
                >
                  {t === "material" ? "materials" : t}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <div style={{ minWidth: 56 + 7 * 150 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `56px repeat(7, minmax(150px, 1fr))`,
              }}
            >
              <div />
              {days.map((d, i) => {
                const today = isToday(d);
                return (
                  <div
                    key={i}
                    className="text-center py-2"
                    style={{
                      background: today ? "rgba(61,197,240,0.08)" : "transparent",
                      borderBottom: `1px solid ${COLORS.borderSoft}`,
                    }}
                  >
                    <div
                      className="text-xs font-semibold tracking-wider"
                      style={{ color: COLORS.textFaint }}
                    >
                      {format(d, "EEE").toUpperCase()}
                    </div>
                    <div
                      className="text-sm font-semibold"
                      style={{
                        color: today ? COLORS.accent : COLORS.text,
                        fontFamily: FONTS.mono,
                      }}
                    >
                      {format(d, "d")}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: `56px repeat(7, minmax(150px, 1fr))`,
              }}
            >
              <div
                style={{ position: "relative", height: HOURS.length * CAL_ROW_PX }}
              >
                {HOURS.map((h, i) => (
                  <div
                    key={h}
                    className="text-xs text-right pr-2"
                    style={{
                      position: "absolute",
                      top: i * CAL_ROW_PX - 6,
                      right: 0,
                      width: "100%",
                      color: COLORS.textFaint,
                    }}
                  >
                    {hourLabel(h)}
                  </div>
                ))}
              </div>

              {days.map((d, di) => (
                <div
                  key={di}
                  style={{
                    position: "relative",
                    height: HOURS.length * CAL_ROW_PX,
                    borderLeft: `1px solid ${COLORS.borderSoft}`,
                    background: isToday(d)
                      ? "rgba(61,197,240,0.03)"
                      : "transparent",
                  }}
                >
                  {HOURS.map((h, i) => (
                    <div
                      key={h}
                      style={{
                        position: "absolute",
                        top: i * CAL_ROW_PX,
                        left: 0,
                        right: 0,
                        borderTop: `1px solid ${COLORS.borderSoft}`,
                      }}
                    />
                  ))}
                  {eventsForDay(di).map((ev) => {
                    const s = parseISO(ev.startsAt);
                    const e = parseISO(ev.endsAt);
                    const top = (floatHours(s) - CAL_HOUR_START) * CAL_ROW_PX;
                    const height = Math.max(
                      (floatHours(e) - floatHours(s)) * CAL_ROW_PX - 4,
                      30,
                    );
                    const c = EVENT_COLOR[ev.type] ?? EVENT_COLOR.job;
                    return (
                      <button
                        key={ev.id}
                        onClick={() => setEditingEvent(ev)}
                        title="Edit event"
                        className="absolute rounded-md px-2.5 py-1.5 text-left overflow-hidden hover:opacity-90"
                        style={{
                          top,
                          height,
                          left: 6,
                          right: 6,
                          background: c.bg,
                          borderLeft: `2px solid ${c.border}`,
                          color: c.fg,
                        }}
                      >
                        <div className="text-xs font-semibold truncate">
                          {ev.title}
                        </div>
                        <div className="text-xs" style={{ opacity: 0.8 }}>
                          {timeRange(ev.startsAt, ev.endsAt)}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="md:hidden flex flex-col gap-4">
          {days.map((d, di) => {
            const dayEvents = eventsForDay(di);
            if (dayEvents.length === 0) return null;
            return (
              <div key={di} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: isToday(d) ? COLORS.accent : COLORS.text }}
                  >
                    {format(d, "EEEE d")}
                  </span>
                  <span className="text-xs" style={{ color: COLORS.textFaint }}>
                    {dayEvents.length} event{dayEvents.length > 1 ? "s" : ""}
                  </span>
                </div>
                {dayEvents.map((ev) => {
                  const c = EVENT_COLOR[ev.type] ?? EVENT_COLOR.job;
                  return (
                    <button
                      key={ev.id}
                      onClick={() => setEditingEvent(ev)}
                      className="rounded-lg px-4 py-3 text-left"
                      style={{
                        background: COLORS.card,
                        border: `1px solid ${COLORS.border}`,
                        borderLeft: `3px solid ${c.border}`,
                      }}
                    >
                      <div
                        className="text-sm font-semibold"
                        style={{ color: COLORS.text }}
                      >
                        {ev.title}
                      </div>
                      <div className="text-xs" style={{ color: COLORS.textMute }}>
                        {timeRange(ev.startsAt, ev.endsAt)}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
          {events.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: COLORS.textFaint }}>
              No events this week.
            </p>
          )}
        </div>
      </div>

      {showModal && (
        <NewEventModal
          jobs={jobs}
          employees={employees}
          role={role}
          currentUserId={currentUserId}
          defaultDate={weekKey(days[0])}
          onClose={() => setShowModal(false)}
          onDone={onCreated}
        />
      )}

      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          jobs={jobs}
          employees={employees}
          role={role}
          currentUserId={currentUserId}
          onClose={() => setEditingEvent(null)}
          onDone={onEdited}
        />
      )}
    </>
  );
}

function NavBtn({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="w-8 h-8 flex items-center justify-center rounded-md"
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        color: COLORS.textMute,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
