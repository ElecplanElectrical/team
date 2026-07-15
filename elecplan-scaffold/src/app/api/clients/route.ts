import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { canAccess } from "@/lib/access";

const clientSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(160),
  contactName: z.string().trim().max(120).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z.string().trim().email().max(160).optional().nullable().or(z.literal("")),
  address: z.string().trim().max(240).optional().nullable(),
  billingNotes: z.string().trim().max(1000).optional().nullable(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only roles that can see the Clients screen may create clients.
  if (!canAccess(user.role, "clients")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = clientSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const d = parsed.data;

  try {
    const client = await prisma.client.create({
      data: {
        name: d.name,
        contactName: d.contactName || null,
        phone: d.phone || null,
        email: d.email || null,
        address: d.address || null,
        billingNotes: d.billingNotes || null,
      },
    });
    return NextResponse.json(client, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create client" }, { status: 400 });
  }
}
