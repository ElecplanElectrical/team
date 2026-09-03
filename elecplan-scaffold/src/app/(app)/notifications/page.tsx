import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";

export default async function NotificationsPage() {
  const user = await requireUser();
  redirect(user.role === "ADMIN" && user.business?.modules.includes("reminders") ? "/reminders" : "/team-chat");
}
