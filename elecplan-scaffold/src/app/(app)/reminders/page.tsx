import { prisma } from "@/lib/prisma";
import { requireAccess, requireUser } from "@/lib/session";
import RemindersView from "@/components/RemindersView";

export default async function RemindersPage() {
  await requireAccess("reminders");
  const user = await requireUser();
  const reminders = await prisma.reminder.findMany({ where: { userId: user.id }, orderBy: [{ completed: "asc" }, { dueDate: "asc" }] });

  return <RemindersView reminders={reminders.map((reminder) => ({ id: reminder.id, title: reminder.title, dueDate: reminder.dueDate?.toISOString() ?? null, tag: reminder.tag, completed: reminder.completed }))} />;
}
