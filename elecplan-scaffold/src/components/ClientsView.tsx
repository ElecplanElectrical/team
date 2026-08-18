"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { Building2, ChevronDown, ChevronRight, FolderOpen, Mail, MapPin, Pencil, Phone, Plus, Search } from "lucide-react";
import TopBar from "@/components/TopBar";
import NewClientModal from "@/components/NewClientModal";
import EditClientModal from "@/components/EditClientModal";
import NewJobModal, { type JobCrewOption } from "@/components/NewJobModal";

export type SiteJob = { id: string; title: string; status: string; scheduledStart: string | null; createdAt: string };
export type ClientSite = { address: string; jobs: SiteJob[] };
export type ClientRow = {
  id: string; name: string; contactName: string | null; phone: string | null; email: string | null; address: string | null; billingNotes: string | null;
  jobs: number; billed: number; lastJob: string | null; sites: ClientSite[];
};

const UI = { panel: "#07192b", panelAlt: "#09213a", border: "rgba(77,150,221,.24)", borderSoft: "rgba(77,150,221,.12)", text: "#f5f9ff", mute: "#93a9c2", faint: "#617993", blue: "#168dff", cyan: "#25c7ff" };
function money(n: number) { return "$" + Math.round(n).toLocaleString("en-AU"); }
function lastJobLabel(iso: string | null) { return iso ? formatDistanceToNow(parseISO(iso), { addSuffix: true }) : "No jobs yet"; }

export default function ClientsView({ clients, totalBilled, crew, currentUserRole }: { clients: ClientRow[]; totalBilled: number; crew: JobCrewOption[]; currentUserRole: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<ClientRow | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openSites, setOpenSites] = useState<Record<string, boolean>>({});
  const [newJobFor, setNewJobFor] = useState<{ clientId: string; address: string } | null>(null);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return clients;
    return clients.filter((c) => [c.name, c.contactName ?? "", c.email ?? "", c.phone ?? "", c.address ?? "", ...c.sites.map((s) => s.address), ...c.sites.flatMap((s) => s.jobs.map((j) => j.title))].join(" ").toLowerCase().includes(query));
  }, [clients, q]);
  const selected = filtered.find((client) => client.id === selectedId) ?? filtered[0] ?? null;
  const canCreateJobs = currentUserRole !== "EMPLOYEE";
  const clientOptions = clients.map((c) => ({ id: c.id, name: c.name, address: c.address }));

  function toggleSite(clientId: string, address: string) {
    const key = `${clientId}:${address}`;
    setOpenSites((current) => ({ ...current, [key]: !current[key] }));
  }

  return <>
    <TopBar title="Clients & Sites" subtitle="Find work by client name or site address" rightSlot={<button type="button" onClick={() => setShowNew(true)} className="flex h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold" style={{ background: UI.blue, color: "white" }}><Plus size={16} /> New client</button>} />
    <div className="flex-1 overflow-auto p-3 md:p-4 xl:p-5" style={{ background: "#03101f" }}>
      <div className="mx-auto w-full max-w-[1700px] space-y-3">
        <div className="grid gap-3 sm:grid-cols-3"><Metric label="Clients" value={String(clients.length)} /><Metric label="Sites / addresses" value={String(clients.reduce((n,c)=>n+c.sites.length,0))} /><Metric label="Total billed" value={money(totalBilled)} /></div>
        <section className="overflow-hidden rounded-xl" style={{ background: UI.panel, border: `1px solid ${UI.border}` }}>
          <div className="border-b p-3" style={{ borderColor: UI.borderSoft }}><div className="relative max-w-2xl"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: UI.faint }} /><input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search client, address, phone, email or job…" className="h-11 w-full rounded-lg pl-10 pr-3 text-sm outline-none" style={{ background: "#041323", color: UI.text, border: `1px solid ${UI.border}` }} /></div></div>
          <div className="grid min-h-[540px] xl:grid-cols-[minmax(0,1fr)_330px]">
            <div className="min-w-0 xl:border-r" style={{ borderColor: UI.borderSoft }}>
              <div className="space-y-3 p-3">
                {filtered.map((client) => <div key={client.id} className="overflow-hidden rounded-xl" style={{ background: UI.panelAlt, border: `1px solid ${UI.borderSoft}` }}>
                  <div className="flex items-start gap-3 p-3 md:p-4">
                    <button type="button" onClick={()=>setSelectedId(client.id)} className="flex min-w-0 flex-1 items-start gap-3 text-left"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background:"rgba(22,141,255,.11)",color:UI.cyan }}><Building2 size={18}/></span><span className="min-w-0"><strong className="block truncate text-sm" style={{color:UI.text}}>{client.name}</strong><span className="mt-1 block text-[11px]" style={{color:UI.mute}}>{client.sites.length} site{client.sites.length===1?"":"s"} · {client.jobs} job{client.jobs===1?"":"s"} · {lastJobLabel(client.lastJob)}</span></span></button>
                    <button type="button" onClick={()=>setEditing(client)} className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold" style={{background:"rgba(22,141,255,.1)",border:`1px solid ${UI.border}`,color:UI.cyan}}><Pencil size={13}/> Edit</button>
                  </div>
                  <div className="border-t" style={{borderColor:UI.borderSoft}}>
                    {client.sites.length===0 && <div className="px-4 py-3 text-xs" style={{color:UI.faint}}>No site addresses yet. Create a job with an address to start a site folder.</div>}
                    {client.sites.map((site) => {
                      const key=`${client.id}:${site.address}`; const open=Boolean(openSites[key]);
                      return <div key={site.address} className="border-b last:border-b-0" style={{borderColor:UI.borderSoft}}>
                        <div className="flex items-center gap-2 px-3 py-3 md:px-4">
                          <button type="button" onClick={()=>toggleSite(client.id,site.address)} className="flex min-w-0 flex-1 items-center gap-2 text-left"><span style={{color:UI.cyan}}>{open?<ChevronDown size={16}/>:<ChevronRight size={16}/>}</span><MapPin size={15} style={{color:UI.cyan}}/><span className="min-w-0"><strong className="block truncate text-xs" style={{color:UI.text}}>{site.address}</strong><span className="block text-[10px]" style={{color:UI.faint}}>{site.jobs.length} job{site.jobs.length===1?"":"s"}</span></span></button>
                          {canCreateJobs && <button type="button" onClick={()=>setNewJobFor({clientId:client.id,address:site.address})} className="shrink-0 rounded-lg px-3 py-2 text-xs font-semibold" style={{background:UI.blue,color:"white"}}><Plus size={13} className="inline mr-1"/>Job</button>}
                        </div>
                        {open && <div className="px-3 pb-3 md:px-4"><div className="overflow-hidden rounded-lg" style={{background:"#041323",border:`1px solid ${UI.borderSoft}`}}>{site.jobs.length===0?<p className="p-3 text-xs" style={{color:UI.faint}}>No jobs at this address yet.</p>:site.jobs.map((job)=><div key={job.id} className="flex items-center gap-3 border-b px-3 py-2.5 last:border-b-0" style={{borderColor:UI.borderSoft}}><FolderOpen size={14} style={{color:UI.cyan}}/><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold" style={{color:UI.text}}>{job.title}</p><p className="mt-0.5 text-[10px]" style={{color:UI.faint}}>{job.status.replaceAll("_"," ")} · {format(parseISO(job.scheduledStart??job.createdAt),"d MMM yyyy")}</p></div></div>)}</div></div>}
                      </div>;
                    })}
                  </div>
                </div>)}
                {filtered.length===0 && <div className="flex min-h-[320px] flex-col items-center justify-center text-center"><Search size={28} style={{color:UI.faint}}/><p className="mt-3 text-sm font-semibold" style={{color:UI.text}}>Nothing found</p><p className="mt-1 text-xs" style={{color:UI.mute}}>Try the street name, suburb, client, phone number or job description.</p></div>}
              </div>
            </div>
            <aside className="hidden p-4 xl:block">{selected?<><p className="text-[10px] font-semibold uppercase tracking-[.12em]" style={{color:UI.faint}}>Client</p><h2 className="mt-2 text-base font-semibold" style={{color:UI.text}}>{selected.name}</h2><p className="mt-1 text-xs" style={{color:UI.mute}}>{selected.contactName??"No contact name"}</p><div className="mt-5 space-y-3 text-xs">{selected.phone&&<Detail icon={<Phone size={14}/>} label="Phone" value={selected.phone}/>} {selected.email&&<Detail icon={<Mail size={14}/>} label="Email" value={selected.email}/>} {selected.sites.map(site=><Detail key={site.address} icon={<MapPin size={14}/>} label="Site" value={site.address}/>)}</div><div className="mt-5 grid grid-cols-2 gap-2"><SmallMetric label="Sites" value={String(selected.sites.length)}/><SmallMetric label="Jobs" value={String(selected.jobs)}/></div></>:<p style={{color:UI.faint}}>Select a client</p>}</aside>
          </div>
        </section>
      </div>
    </div>
    {showNew&&<NewClientModal onClose={()=>setShowNew(false)} onDone={()=>{setShowNew(false);router.refresh();}}/>}
    {editing&&<EditClientModal client={editing} onClose={()=>setEditing(null)} onDone={()=>{setEditing(null);router.refresh();}}/>}
    {newJobFor&&<NewJobModal clients={clientOptions} crew={crew} initialClientId={newJobFor.clientId} initialAddress={newJobFor.address} onClose={()=>setNewJobFor(null)} onDone={()=>{setNewJobFor(null);router.refresh();}}/>}
  </>;
}

function Metric({label,value}:{label:string;value:string}){return <div className="rounded-xl p-4" style={{background:UI.panel,border:`1px solid ${UI.border}`}}><p className="text-[11px]" style={{color:UI.faint}}>{label}</p><p className="mt-1 text-xl font-semibold" style={{color:UI.text}}>{value}</p></div>}
function SmallMetric({label,value}:{label:string;value:string}){return <div className="rounded-lg p-3" style={{background:UI.panelAlt,border:`1px solid ${UI.borderSoft}`}}><p className="text-[10px]" style={{color:UI.faint}}>{label}</p><p className="mt-1 text-sm font-semibold" style={{color:UI.text}}>{value}</p></div>}
function Detail({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <div className="flex gap-3"><span className="mt-0.5" style={{color:UI.cyan}}>{icon}</span><div className="min-w-0"><p style={{color:UI.faint}}>{label}</p><p className="mt-0.5 break-words leading-5" style={{color:UI.text}}>{value}</p></div></div>}
