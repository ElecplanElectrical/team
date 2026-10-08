import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

function keyOf(address: string) {
  return address.trim().replace(/\s+/g, " ").toLowerCase();
}

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ sites: [], clients: [] });

  const jobs = await prisma.job.findMany({
    where: {
      AND: [
        user.role === "EMPLOYEE"
          ? { OR: [{ assignedToId: user.id }, { crew: { some: { id: user.id } } }] }
          : {},
        {
          OR: [
            { address: { contains: q, mode: "insensitive" } },
            { title: { contains: q, mode: "insensitive" } },
            { client: { name: { contains: q, mode: "insensitive" } } },
            { client: { contactName: { contains: q, mode: "insensitive" } } },
          ],
        },
      ],
    },
    orderBy: [{ scheduledStart: "desc" }, { createdAt: "desc" }],
    take: 40,
    select: {
      id: true,
      title: true,
      address: true,
      status: true,
      scheduledStart: true,
      createdAt: true,
      client: { select: { id: true, name: true, contactName: true } },
    },
  });

  const grouped = new Map<string, {
    jobId: string;
    address: string;
    jobCount: number;
    latestTitle: string;
    latestStatus: string;
    clients: Set<string>;
    latestAt: Date;
  }>();

  for (const job of jobs) {
    const key = keyOf(job.address);
    const at = job.scheduledStart ?? job.createdAt;
    const current = grouped.get(key);
    if (!current) {
      grouped.set(key, {
        jobId: job.id,
        address: job.address,
        jobCount: 1,
        latestTitle: job.title,
        latestStatus: job.status,
        clients: new Set([job.client.name]),
        latestAt: at,
      });
      continue;
    }
    current.jobCount += 1;
    current.clients.add(job.client.name);
    if (at > current.latestAt) {
      current.jobId = job.id;
      current.latestTitle = job.title;
      current.latestStatus = job.status;
      current.latestAt = at;
    }
  }

  const sites = [...grouped.values()]
    .sort((a, b) => b.latestAt.getTime() - a.latestAt.getTime())
    .slice(0, 12)
    .map((site) => ({
      jobId: site.jobId,
      address: site.address,
      jobCount: site.jobCount,
      latestTitle: site.latestTitle,
      latestStatus: site.latestStatus,
      clients: [...site.clients],
    }));

  const clients = user.role === "EMPLOYEE" ? [] : await prisma.client.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { contactName: { contains: q, mode: "insensitive" } },
        { address: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { name: "asc" },
    take: 8,
    select: { id: true, name: true, contactName: true, address: true, phone: true },
  });

  return NextResponse.json({ sites, clients });
}
