"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckSquare, FileText, History, PackagePlus, Paperclip, Trash2 } from "lucide-react";

const UI = { panel:"var(--brand-panel, #07192b)", alt:"var(--brand-panel-alt, #09213a)", border:"var(--brand-border, rgba(77,150,221,.24))", text:"#f5f9ff", mute:"var(--brand-muted, #93a9c2)", cyan:"var(--brand-accent, #25c7ff)", green:"#18d3a0", red:"#ff6673" };
type Data = {
  tasks:{id:string;title:string;completed:boolean}[];
  materials:{id:string;name:string;quantity:string;unit:string|null;unitCost:string;unitSell:string}[];
  documents:{id:string;name:string;type:string;fileUrl:string;originalName:string|null}[];
  history:{id:string;title:string;address:string;status:string;createdAt:string}[];
  profitability:{revenue:number;materialCost:number;materialSell:number;labourHours:number;grossAfterMaterials:number};
};

export default function JobOperationsPanel({ jobId, canManage }: { jobId:string; canManage:boolean }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [data,setData] = useState<Data|null>(null);
  const [busy,setBusy] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch(`/api/jobs/${jobId}/operations`, { cache:"no-store" });
    if (response.ok) setData(await response.json());
  }, [jobId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function post(body:object) {
    setBusy(true);
    const response = await fetch(`/api/jobs/${jobId}/operations`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
    setBusy(false);
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      window.alert(result?.error || "Could not save");
      return;
    }
    await load();
  }

  async function addTask() {
    const title = window.prompt("Checklist item");
    if (title) await post({ type:"TASK", title });
  }

  async function addMaterial() {
    const name = window.prompt("Material used");
    if (!name) return;
    const quantity = Number(window.prompt("Quantity", "1") || 0);
    if (!quantity) return;
    const unit = window.prompt("Unit (each, m, box)", "each") || "each";
    const unitCost = Number(window.prompt("Cost per unit ($)", "0") || 0);
    const unitSell = Number(window.prompt("Sell price per unit ($)", "0") || 0);
    await post({ type:"MATERIAL", name, quantity, unit, unitCost, unitSell });
  }

  async function addReminder() {
    const title = window.prompt("Reminder", "Follow up job");
    if (title) await post({ type:"REMINDER", title });
  }

  async function toggleTask(id:string,completed:boolean) {
    await fetch(`/api/jobs/${jobId}/operations`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({taskId:id,completed}) });
    await load();
  }

  async function remove(kind:"taskId"|"materialId",id:string) {
    if (!window.confirm("Remove this item?")) return;
    await fetch(`/api/jobs/${jobId}/operations?${kind}=${encodeURIComponent(id)}`, { method:"DELETE" });
    await load();
  }

  async function upload(files:FileList|null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.set("name", file.name);
        form.set("type", "JOB_ATTACHMENT");
        form.set("jobId", jobId);
        form.set("file", file);
        const response = await fetch("/api/documents", { method:"POST", body:form });
        if (!response.ok) {
          const result = await response.json().catch(() => null);
          throw new Error(result?.error || "Could not attach file");
        }
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
      await load();
    }
  }

  if (!data) return <div className="mt-3 rounded-xl p-4 text-sm" style={{background:UI.panel,color:UI.mute,border:`1px solid ${UI.border}`}}>Loading job controls…</div>;
  const money = (value:number) => new Intl.NumberFormat("en-AU", { style:"currency", currency:"AUD" }).format(value);

  return <div className="mt-3 space-y-3">
    <Box title="Checklist" icon={<CheckSquare size={17}/>} action={canManage?<button onClick={() => void addTask()}>+ Add</button>:null}>
      {data.tasks.length ? data.tasks.map((task) => <div key={task.id} className="flex items-center gap-3 py-2"><input type="checkbox" checked={task.completed} onChange={(event) => void toggleTask(task.id,event.target.checked)} className="h-5 w-5"/><span className="flex-1 text-sm" style={{color:task.completed?UI.mute:UI.text,textDecoration:task.completed?"line-through":"none"}}>{task.title}</span>{canManage&&<button onClick={() => void remove("taskId",task.id)} style={{color:UI.red}} aria-label={`Remove ${task.title}`}><Trash2 size={15}/></button>}</div>) : <Empty text="No checklist items yet."/>}
    </Box>
    <Box title="Materials used" icon={<PackagePlus size={17}/>} action={<button onClick={() => void addMaterial()}>+ Add</button>}>
      {data.materials.length ? data.materials.map((material) => <div key={material.id} className="flex items-center gap-2 border-b py-2 last:border-0" style={{borderColor:UI.border}}><div className="flex-1"><p className="text-sm" style={{color:UI.text}}>{material.name}</p><p className="text-xs" style={{color:UI.mute}}>{Number(material.quantity)} {material.unit||""} · cost {money(Number(material.unitCost))} ea</p></div>{canManage&&<button onClick={() => void remove("materialId",material.id)} style={{color:UI.red}} aria-label={`Remove ${material.name}`}><Trash2 size={15}/></button>}</div>) : <Empty text="No materials recorded."/>}
    </Box>
    {canManage && <Box title="Job profitability" icon={<FileText size={17}/>}>
      <div className="grid grid-cols-2 gap-2 text-sm"><Stat label="Revenue / job value" value={money(data.profitability.revenue)}/><Stat label="Material cost" value={money(data.profitability.materialCost)}/><Stat label="Field labour tracked" value={`${data.profitability.labourHours} h`}/><Stat label="After materials" value={money(data.profitability.grossAfterMaterials)} good={data.profitability.grossAfterMaterials>=0}/></div>
      <p className="mt-2 text-[10px]" style={{color:UI.mute}}>Labour hours are shown separately until an employee labour-cost rate is configured.</p>
    </Box>}
    <Box title="Attachments" icon={<Paperclip size={17}/>} action={<button disabled={busy} onClick={() => fileInput.current?.click()}>+ Upload</button>}>
      <input ref={fileInput} type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp,text/plain" className="hidden" onChange={(event) => void upload(event.target.files)}/>
      {data.documents.length ? data.documents.map((document) => <a key={document.id} href={document.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 py-2 text-sm" style={{color:UI.cyan}}><FileText size={15}/><span className="truncate">{document.name}</span></a>) : <Empty text="No files attached."/>}
    </Box>
    {canManage && <Box title="Job reminders" icon={<Bell size={17}/>} action={<button onClick={() => void addReminder()}>+ Add reminder</button>}><p className="text-xs" style={{color:UI.mute}}>Use reminders for certificates, invoicing, revisits or client follow-ups. They appear in Reminders and on the dashboard.</p></Box>}
    <Box title="Client / property history" icon={<History size={17}/>}>
      <div className="space-y-2">{data.history.length ? data.history.map((history) => <button key={history.id} onClick={() => router.push(`/jobs/${history.id}`)} className="w-full rounded-lg p-3 text-left" style={{background:UI.alt,border:`1px solid ${UI.border}`}}><p className="text-sm font-semibold" style={{color:UI.text}}>{history.title}</p><p className="mt-1 text-xs" style={{color:UI.mute}}>{history.address} · {history.status.replaceAll("_"," ")}</p></button>) : <Empty text="No previous jobs for this client or property."/>}</div>
    </Box>
  </div>;
}

function Box({title,icon,action,children}:{title:string;icon:ReactNode;action?:ReactNode;children:ReactNode}) {
  return <section className="rounded-2xl p-4" style={{background:UI.panel,border:`1px solid ${UI.border}`}}><div className="mb-3 flex items-center gap-2" style={{color:UI.cyan}}>{icon}<h3 className="flex-1 text-sm font-bold" style={{color:UI.text}}>{title}</h3>{action&&<div className="text-xs font-semibold" style={{color:UI.cyan}}>{action}</div>}</div>{children}</section>;
}
function Empty({text}:{text:string}) { return <p className="py-2 text-xs" style={{color:UI.mute}}>{text}</p>; }
function Stat({label,value,good}:{label:string;value:string;good?:boolean}) { return <div className="rounded-xl p-3" style={{background:UI.alt}}><p className="text-[10px]" style={{color:UI.mute}}>{label}</p><p className="mt-1 font-bold" style={{color:good===false?UI.red:UI.text}}>{value}</p></div>; }
