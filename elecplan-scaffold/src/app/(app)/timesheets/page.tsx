import { requireAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import TimesheetsView, { type TimesheetRow, type TrackedTimeRow } from "@/components/TimesheetsView";

function melbourneWeekStart(date: Date) {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const calendar = new Date(Date.UTC(year, month - 1, day));
  const daysFromMonday = (calendar.getUTCDay() + 6) % 7;
  calendar.setUTCDate(calendar.getUTCDate() - daysFromMonday);
  return calendar.toISOString().slice(0, 10);
}

export default async function TimesheetsPage() {
  const user = await requireAccess("timesheets");

  const [rows, events] = await Promise.all([
    prisma.timesheet.findMany({
      where: user.role === "EMPLOYEE" ? { userId: user.id } : {},
      include: { user: { select: { name: true } } },
      orderBy: [{ weekStart: "desc" }, { user: { name: "asc" } }],
    }),
    prisma.jobEvent.findMany({
      where: {
        type: { in: ["field-arrived", "field-complete", "field-revisit"] },
        assignedToId: user.role === "EMPLOYEE" ? user.id : { not: null },
      },
      orderBy: { startsAt: "asc" },
      select: {
        jobId: true,
        type: true,
        startsAt: true,
        assignedToId: true,
        assignedTo: { select: { name: true } },
      },
    }),
  ]);

  const entries: TimesheetRow[] = rows.map((entry) => ({
    id: entry.id,
    userId: entry.userId,
    userName: entry.user.name,
    weekStart: entry.weekStart.toISOString(),
    hours: Number(entry.hours),
    status: entry.status,
  }));

  const active = new Map<string, { startsAt: Date; userId: string; userName: string }>();
  const totals = new Map<string, TrackedTimeRow>();

  for (const event of events) {
    if (!event.assignedToId) continue;
    const visitKey = `${event.assignedToId}:${event.jobId ?? "no-job"}`;
    if (event.type === "field-arrived") {
      active.set(visitKey, {
        startsAt: event.startsAt,
        userId: event.assignedToId,
        userName: event.assignedTo?.name ?? "Team member",
      });
      continue;
    }

    const arrival = active.get(visitKey);
    if (!arrival) continue;
    const minutes = Math.max(0, Math.round((event.startsAt.getTime() - arrival.startsAt.getTime()) / 60000));
    const weekStart = melbourneWeekStart(arrival.startsAt);
    const totalKey = `${arrival.userId}:${weekStart}`;
    const current = totals.get(totalKey) ?? {
      userId: arrival.userId,
      userName: arrival.userName,
      weekStart,
      hours: 0,
    };
    current.hours += minutes / 60;
    totals.set(totalKey, current);
    active.delete(visitKey);
  }

  const tracked = [...totals.values()]
    .map((row) => ({ ...row, hours: Math.round(row.hours * 100) / 100 }))
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart) || a.userName.localeCompare(b.userName));

  return <TimesheetsView entries={entries} tracked={tracked} role={user.role} currentUserId={user.id} />;
}
