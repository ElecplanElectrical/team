import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { canAccess } from "@/lib/access";

export async function POST() {
  const user = await requireUser();
  if (!canAccess(user.role, "reels")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ error: "Content ideas are temporarily unavailable while the storage model is being upgraded." }, { status: 503 });
}
