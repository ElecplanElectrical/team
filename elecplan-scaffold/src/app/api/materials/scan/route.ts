import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Material scanning is not enabled in Your Plan. Use manual materials entry." },
    { status: 410 },
  );
}
