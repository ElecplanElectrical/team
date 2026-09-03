import { NextResponse } from "next/server";
import { canAccess } from "@/lib/access";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

type Result = { id: string; type: "job" | "client" | "quote"; title: string; detail: string; href: string };

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.businessId || !user.business) return NextResponse.json({ results: [] });

  const query = new URL(request.url).searchParams.get("q")?.trim().slice(0, 80) ?? "";
  if (query.length < 2) return NextResponse.json({ results: [] });
  const modules = new Set(user.business.modules);

  const [jobs, clients, quotes] = await Promise.all([
    modules.has("jobs") && canAccess(user.role, "timelines")
      ? prisma.job.findMany({
          where: { businessId: user.businessId, OR: [{ title: { contains: query, mode: "insensitive" } }, { address: { contains: query, mode: "insensitive" } }, { client: { name: { contains: query, mode: "insensitive" } } }] },
          select: { id: true, title: true, address: true, client: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
      : [],
    modules.has("clients") && canAccess(user.role, "clients")
      ? prisma.client.findMany({
          where: { businessId: user.businessId, OR: [{ name: { contains: query, mode: "insensitive" } }, { contactName: { contains: query, mode: "insensitive" } }, { email: { contains: query, mode: "insensitive" } }, { address: { contains: query, mode: "insensitive" } }] },
          select: { id: true, name: true, contactName: true, address: true },
          orderBy: { name: "asc" },
          take: 5,
        })
      : [],
    modules.has("quotes") && canAccess(user.role, "quotes")
      ? prisma.quote.findMany({
          where: { businessId: user.businessId, OR: [{ quoteNumber: { contains: query, mode: "insensitive" } }, { client: { name: { contains: query, mode: "insensitive" } } }, { job: { title: { contains: query, mode: "insensitive" } } }] },
          select: { id: true, quoteNumber: true, status: true, client: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
      : [],
  ]);

  const results: Result[] = [
    ...jobs.map((job) => ({ id: job.id, type: "job" as const, title: job.title, detail: `${job.client.name} · ${job.address}`, href: `/jobs/${job.id}` })),
    ...clients.map((client) => ({ id: client.id, type: "client" as const, title: client.name, detail: client.address || client.contactName || "Client record", href: "/clients" })),
    ...quotes.map((quote) => ({ id: quote.id, type: "quote" as const, title: quote.quoteNumber || `Quote ${quote.id.slice(-4).toUpperCase()}`, detail: `${quote.client.name} · ${quote.status.toLowerCase()}`, href: "/quotes" })),
  ].slice(0, 12);

  return NextResponse.json({ results }, { headers: { "Cache-Control": "private, no-store" } });
}
