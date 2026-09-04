import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/session";

export async function GET() {
  await requireAccess("dashboard");
  return NextResponse.json({ goal: "" });
}

export async function PUT(request: Request) {
  await requireAccess("dashboard");
  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim().slice(0, 500) : "";
  return NextResponse.json({ goal: text });
}
