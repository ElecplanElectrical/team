import { notFound, redirect } from "next/navigation";
import { Clock3 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import JobDetailView from "@/components/JobDetailView";
import JobTasksPanel from "@/components/JobTasksPanel";
import JobOperationsPanel from "@/components/JobOperationsPanel";

export const dynamic = "force-dynamic";

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours && minutes) return `${hours}h ${minutes}m`;
  if (hours) return `${hours}h`;
  return `${minutes}m`;
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const job = await prisma.job.findUnique({ where:{id}, include:{ client:{select:{id:true,name:true,contactName:true,phone:true,email:true,address:true}}, assignedTo:{select:{id:true,name:true}}, photos:{orderBy:{uploadedAt:"desc"},select:{id:true,fileUrl:true,originalName:true,uploadedAt:true}} } });
  if (!job) notFound();
  if (user.role === "EMPLOYEE" && job.assignedToId !== user.id) notFound();

  const activity = await prisma.jobEvent.findMany({
    where:{jobId:id,type:{in:["field-arrived","field-complete","field-revisit"]}},
    orderBy:{startsAt:"asc"},
    select:{type:true,startsAt:true},
  });
  let totalMinutes = 0;
  for (let i = 0; i < activity.length; i++) {
    const arrival = activity[i];
    if (arrival.type !== "field-arrived") continue;
    const stop = activity.slice(i + 1).find(e => (e.type === "field-complete" || e.type === "field-revisit") && e.startsAt >= arrival.startsAt);
    if (stop) totalMinutes += Math.max(0, Math.round((stop.startsAt.getTime() - arrival.startsAt.getTime()) / 60000));
  }

  const [crew,clients]=user.role==="EMPLOYEE"?[[],[]]:await Promise.all([prisma.user.findMany({where:{active:true},orderBy:{name:"asc"},select:{id:true,name:true}}),prisma.client.findMany({orderBy:{name:"asc"},select:{id:true,name:true}})]);
  return <div className="flex-1 overflow-auto" style={{background:"#03101f"}}><JobDetailView canEdit={user.role!=="EMPLOYEE"} canDelete={user.role==="ADMIN"} canArchive={user.role!=="EMPLOYEE"} crew={crew} clients={clients} job={{id:job.id,title:job.title,address:job.address,notes:job.notes,status:job.status,scheduledStart:job.scheduledStart?.toISOString()??null,scheduledEnd:job.scheduledEnd?.toISOString()??null,client:job.client,assignedTo:job.assignedTo,photos:job.photos.map(p=>({id:p.id,fileUrl:p.fileUrl,originalName:p.originalName,uploadedAt:p.uploadedAt.toISOString()}))}}/><div className="relative z-10 mx-auto -mt-24 max-w-2xl px-3 pb-3 md:px-5">{totalMinutes>0&&<div className="mb-3 flex items-center gap-3 rounded-2xl p-4" style={{background:"#09213a",border:"1px solid rgba(77,150,221,.24)"}}><Clock3 size={20} style={{color:"#25c7ff"}}/><div><p className="text-[11px] font-semibold uppercase tracking-[.12em]" style={{color:"#25c7ff"}}>Time on job</p><p className="mt-1 text-xl font-bold" style={{color:"#f5f9ff"}}>{formatDuration(totalMinutes)}</p></div></div>}<JobTasksPanel jobId={job.id} canManage={user.role!=="EMPLOYEE"}/><JobOperationsPanel jobId={job.id} canManage={user.role!=="EMPLOYEE"}/></div></div>;
}
