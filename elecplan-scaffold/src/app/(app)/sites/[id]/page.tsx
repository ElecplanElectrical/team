import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Briefcase, Clock3, FileText, Images, MapPin, PackageSearch, Receipt, ShieldCheck, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { PORTAL_UI as UI } from "@/lib/carbon-theme";

export const dynamic = "force-dynamic";

function money(value: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(value);
}

function duration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
}

export default async function SiteFilePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;

  const seed = await prisma.job.findUnique({
    where: { id },
    select: {
      id: true,
      address: true,
      assignedToId: true,
      crew: { select: { id: true } },
    },
  });
  if (!seed) notFound();
  if (user.role === "EMPLOYEE" && seed.assignedToId !== user.id && !seed.crew.some((member) => member.id === user.id)) notFound();

  const jobs = await prisma.job.findMany({
    where: { AND: [{ address: { equals: seed.address, mode: "insensitive" } }, user.role === "EMPLOYEE" ? { OR: [{ assignedToId: user.id }, { crew: { some: { id: user.id } } }] } : {}] },
    orderBy: [{ scheduledStart: "desc" }, { createdAt: "desc" }],
    include: {
      client: { select: { id: true, name: true, contactName: true, phone: true, email: true } },
      assignedTo: { select: { id: true, name: true } },
      crew: { select: { id: true, name: true } },
      events: {
        where: { type: { in: ["field-arrived", "field-complete", "field-revisit"] } },
        orderBy: { startsAt: "asc" },
        select: {
          type: true,
          startsAt: true,
          assignedToId: true,
          assignedTo: { select: { id: true, name: true } },
        },
      },
      materials: { orderBy: { createdAt: "desc" } },
      documents: { orderBy: { createdAt: "desc" } },
      photos: { orderBy: { createdAt: "desc" } },
      quotes: { select: { amount: true, status: true } },
      invoices: { select: { amount: true, status: true } },
      certificates: { select: { id: true, certNumber: true, type: true, status: true } },
      inspections: { select: { id: true, type: true, status: true, date: true } },
    },
  });

  if (!jobs.length) notFound();

  const materialIds = [...new Set(jobs.flatMap((job) => job.materials.map((material) => material.materialId)))];
  const catalogue = materialIds.length ? await prisma.material.findMany({
    where: { id: { in: materialIds } },
    select: { id: true, supplier: true },
  }) : [];
  const catalogueById = new Map(catalogue.map((item) => [item.id, { supplier: item.supplier }]));

  let totalMinutes = 0;
  const employeeMinutes = new Map<string, { name: string; minutes: number }>();
  const people = new Map<string, string>();

  for (const job of jobs) {
    if (job.assignedTo) people.set(job.assignedTo.id, job.assignedTo.name);
    for (const crew of job.crew) people.set(crew.id, crew.name);

    const active = new Map<string, Date>();
    for (const event of job.events) {
      const key = event.assignedToId ?? "unknown";
      if (event.assignedTo) people.set(event.assignedTo.id, event.assignedTo.name);
      if (event.type === "field-arrived") {
        active.set(key, event.startsAt);
        continue;
      }
      const start = active.get(key);
      if (!start) continue;
      const minutes = Math.max(0, Math.round((event.startsAt.getTime() - start.getTime()) / 60000));
      totalMinutes += minutes;
      const name = event.assignedTo?.name ?? people.get(key) ?? "Team member";
      const current = employeeMinutes.get(key) ?? { name, minutes: 0 };
      current.minutes += minutes;
      employeeMinutes.set(key, current);
      active.delete(key);
    }
  }

  const materialGroups = new Map<string, { name: string; quantity: number; unit: string; cost: number; supplier: string | null }>();
  for (const job of jobs) {
    for (const material of job.materials) {
      const catalogueItem = catalogueById.get(material.materialId);
      const key = `${material.materialId}:${material.unit ?? ""}`;
      const current = materialGroups.get(key) ?? {
        name: material.name,
        quantity: 0,
        unit: material.unit ?? "each",
        cost: 0,
        supplier: catalogueItem?.supplier ?? null,
      };
      const qty = Number(material.quantity);
      current.quantity += qty;
      current.cost += qty * Number(material.unitCost ?? 0);
      materialGroups.set(key, current);
    }
  }
  const materials = [...materialGroups.values()].sort((a, b) => b.cost - a.cost || a.name.localeCompare(b.name));
  const totalMaterialCost = materials.reduce((sum, item) => sum + item.cost, 0);

  const documents = jobs.flatMap((job) => job.documents.map((document) => ({ ...document, jobTitle: job.title })));
  const photos = jobs.flatMap((job) => job.photos.map((photo) => ({ ...photo, jobTitle: job.title })));
  const invoices = jobs.flatMap((job) => job.invoices);
  const quotes = jobs.flatMap((job) => job.quotes);
  const certificates = jobs.flatMap((job) => job.certificates.map((item) => ({ ...item, jobTitle: job.title })));
  const inspections = jobs.flatMap((job) => job.inspections.map((item) => ({ ...item, jobTitle: job.title })));
  const invoiced = invoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0);
  const acceptedQuoteValue = quotes.filter((quote) => quote.status === "ACCEPTED").reduce((sum, quote) => sum + Number(quote.amount), 0);
  const clients = [...new Set(jobs.map((job) => job.client.name))];

  return <div className="flex-1 overflow-auto p-3 pb-10 md:p-5" style={{ background: "#0d1117" }}>
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href="/search" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold" style={{ color: UI.cyan }}><ArrowLeft size={17} />Search</Link>
        <span className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[.12em]" style={{ background: "rgba(67,210,255,.10)", color: UI.cyan, border: "1px solid rgba(67,210,255,.22)" }}>Property file</span>
      </div>

      <section className="rounded-2xl p-5 md:p-6" style={{ ...UI.raised, background: UI.panel, border: `1px solid ${UI.border}` }}>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(67,210,255,.11)", color: UI.cyan }}><MapPin size={22} /></div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[.12em]" style={{ color: UI.cyan }}>Address</p>
            <h1 className="mt-1 text-xl font-bold md:text-3xl" style={{ color: UI.text }}>{seed.address}</h1>
            <p className="mt-2 text-sm" style={{ color: UI.mute }}>{clients.join(", ")} · {jobs.length} job{jobs.length === 1 ? "" : "s"} at this address</p>
          </div>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric icon={<Briefcase size={17} />} label="Jobs" value={String(jobs.length)} />
        <Metric icon={<Clock3 size={17} />} label="Time on site" value={duration(totalMinutes)} />
        <Metric icon={<PackageSearch size={17} />} label="Materials cost" value={money(totalMaterialCost)} />
        <Metric icon={<Images size={17} />} label="Photos" value={String(photos.length)} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Section title="Jobs at this address" icon={<Briefcase size={17} />}>
          <div className="space-y-2">
            {jobs.map((job) => <Link key={job.id} href={`/jobs/${job.id}`} className="block rounded-xl p-3" style={{ background: UI.panelAlt, border: `1px solid ${UI.borderSoft}` }}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold" style={{ color: UI.text }}>{job.title}</p>
                <span className="shrink-0 text-[10px] font-semibold" style={{ color: UI.cyan }}>{job.status.replaceAll("_", " ")}</span>
              </div>
              <p className="mt-1 text-xs" style={{ color: UI.mute }}>{job.client.name}{job.scheduledStart ? ` · ${job.scheduledStart.toLocaleDateString("en-AU")}` : ""}</p>
            </Link>)}
          </div>
        </Section>

        <Section title="People & time" icon={<Users size={17} />}>
          {people.size === 0 ? <Empty text="No employees recorded at this address yet." /> : <div className="space-y-2">
            {[...people].map(([id, name]) => {
              const tracked = employeeMinutes.get(id)?.minutes ?? 0;
              return <div key={id} className="flex items-center justify-between rounded-xl p-3" style={{ background: UI.panelAlt, border: `1px solid ${UI.borderSoft}` }}>
                <span className="text-sm font-semibold" style={{ color: UI.text }}>{name}</span>
                <span className="text-xs" style={{ color: UI.cyan }}>{tracked ? duration(tracked) : "Assigned / crew"}</span>
              </div>;
            })}
          </div>}
        </Section>

        <Section title="Materials used" icon={<PackageSearch size={17} />}>
          {materials.length === 0 ? <Empty text="No materials recorded at this address yet." /> : <div className="space-y-2">
            {materials.slice(0, 20).map((material) => <div key={material.name + material.unit} className="flex items-center justify-between gap-3 rounded-xl p-3" style={{ background: UI.panelAlt, border: `1px solid ${UI.borderSoft}` }}>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold" style={{ color: UI.text }}>{material.name}</p>
                <p className="mt-1 text-xs" style={{ color: UI.mute }}>{material.quantity} {material.unit}{material.supplier ? ` · ${material.supplier}` : ""}</p>
              </div>
              <span className="shrink-0 text-xs font-semibold" style={{ color: UI.cyan }}>{money(material.cost)}</span>
            </div>)}
          </div>}
        </Section>

        <Section title="Financial snapshot" icon={<Receipt size={17} />}>
          <div className="grid grid-cols-2 gap-2">
            <Mini label="Accepted quotes" value={money(acceptedQuoteValue)} />
            <Mini label="Invoices" value={money(invoiced)} />
            <Mini label="Material cost" value={money(totalMaterialCost)} />
            <Mini label="Recorded hours" value={duration(totalMinutes)} />
          </div>
        </Section>

        <Section title="Documents & plans" icon={<FileText size={17} />}>
          {documents.length === 0 ? <Empty text="No documents attached to jobs at this address yet." /> : <div className="space-y-2">
            {documents.slice(0, 20).map((document) => <a key={document.id} href={document.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl p-3" style={{ background: UI.panelAlt, border: `1px solid ${UI.borderSoft}`, color: UI.cyan }}>
              <FileText size={15} className="shrink-0" />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{document.name}</p><p className="mt-1 truncate text-xs" style={{ color: UI.mute }}>{document.kind ?? "Document"} · {document.jobTitle}</p></div>
            </a>)}
          </div>}
        </Section>

        <Section title="Certificates & inspections" icon={<ShieldCheck size={17} />}>
          {certificates.length === 0 && inspections.length === 0 ? <Empty text="No certificates or inspections recorded yet." /> : <div className="space-y-2">
            {certificates.map((certificate) => <div key={certificate.id} className="rounded-xl p-3" style={{ background: UI.panelAlt, border: `1px solid ${UI.borderSoft}` }}>
              <p className="text-sm font-semibold" style={{ color: UI.text }}>{certificate.type} · {certificate.certNumber}</p><p className="mt-1 text-xs" style={{ color: UI.mute }}>{certificate.jobTitle} · {certificate.status}</p>
            </div>)}
            {inspections.map((inspection) => <div key={inspection.id} className="rounded-xl p-3" style={{ background: UI.panelAlt, border: `1px solid ${UI.borderSoft}` }}>
              <p className="text-sm font-semibold" style={{ color: UI.text }}>{inspection.type}</p><p className="mt-1 text-xs" style={{ color: UI.mute }}>{inspection.jobTitle} · {inspection.status} · {inspection.date.toLocaleDateString("en-AU")}</p>
            </div>)}
          </div>}
        </Section>
      </div>

      <Section title="Job photos" icon={<Images size={17} />} className="mt-4">
        {photos.length === 0 ? <Empty text="No job photos at this address yet." /> : <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {photos.slice(0, 36).map((photo) => <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl" style={{ background: UI.panelAlt, border: `1px solid ${UI.borderSoft}` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt={photo.jobTitle} className="aspect-square w-full object-cover transition group-hover:scale-[1.02]" />
            <p className="truncate px-2 py-2 text-[10px]" style={{ color: UI.mute }}>{photo.jobTitle}</p>
          </a>)}
        </div>}
      </Section>
    </div>
  </div>;
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-2xl p-4" style={{ ...UI.raised, background: UI.panel, border: `1px solid ${UI.border}` }}>
    <div className="flex items-center gap-2 text-[11px]" style={{ color: UI.cyan }}>{icon}<span style={{ color: UI.mute }}>{label}</span></div>
    <p className="mt-2 text-lg font-bold md:text-xl" style={{ color: UI.text }}>{value}</p>
  </div>;
}

function Section({ title, icon, children, className = "" }: { title: string; icon: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl p-4 md:p-5 ${className}`} style={{ ...UI.raised, background: UI.panel, border: `1px solid ${UI.border}` }}>
    <div className="mb-3 flex items-center gap-2" style={{ color: UI.cyan }}>{icon}<h2 className="text-sm font-bold" style={{ color: UI.text }}>{title}</h2></div>
    {children}
  </section>;
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl p-3" style={{ background: UI.panelAlt, border: `1px solid ${UI.borderSoft}` }}>
    <p className="text-[10px]" style={{ color: UI.faint }}>{label}</p>
    <p className="mt-1 text-sm font-bold" style={{ color: UI.text }}>{value}</p>
  </div>;
}

function Empty({ text }: { text: string }) {
  return <p className="py-3 text-sm" style={{ color: UI.mute }}>{text}</p>;
}
