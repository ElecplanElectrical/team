import { requireAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import TimesheetsView, { type TimesheetRow } from "@/components/TimesheetsView";

export default async function TimesheetsPage() {
  const user = await requireAccess("timesheets");

  const rows = await prisma.timesheet.findMany({
    where: user.role === "EMPLOYEE" ? { userId: user.id } : {},
    include: { user: { select: { name: true } } },
    orderBy: [{ date: "desc" }, { user: { name: "asc" } }],
  });

  const entries: TimesheetRow[] = rows.map((entry) => ({
    id: entry.id,
    userId: entry.userId,
    userName: entry.user.name,
    date: entry.date.toISOString(),
    hours: Number(entry.hours),
    status: entry.status,
  }));

  return <TimesheetsView entries={entries} role={user.role} currentUserId={user.id} />;
}
