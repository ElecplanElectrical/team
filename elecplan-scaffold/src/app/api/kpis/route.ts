import { NextResponse } from "next/server";

export async function POST(){
  return NextResponse.json({ error: "This legacy KPI endpoint is not enabled in Your Plan." }, { status: 410 });
}

export async function PATCH(){
  return NextResponse.json({ error: "This legacy KPI endpoint is not enabled in Your Plan." }, { status: 410 });
}
