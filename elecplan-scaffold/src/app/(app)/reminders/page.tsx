import { prisma } from "@/lib/prisma";
import { requireAccess, requireUser } from "@/lib/session";
import RemindersView from "@/components/RemindersView";

export default async function RemindersPage() {
  await requireAccess("reminders");
  const user = await requireUser();
  const reminders = await prisma.reminder.findMany({ where: { userId: user.id }, orderBy: [{ completed: "asc" }, { createdAt: "desc" }] });

  return <RemindersView reminders={reminders.map((reminder) => ({ id: reminder.id, title: reminder.title, completed: reminder.completed }))} />;
}
