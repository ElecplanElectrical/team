"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Camera, MapPin, MessageSquareText, Navigation, UserRound } from "lucide-react";
import FieldJobModal from "@/components/FieldJobModal";
import ClientSmsPanel from "@/components/ClientSmsPanel";

const UI={panel:"#07192b",alt:"#09213a",border:"rgba(77,150,221,.24)",text:"#f5f9ff",mute:"#93a9c2",faint:"#617993",cyan:"#25c7ff",blue:"#168dff",green:"#18d3a0"};
type Job={id:string;title:string;address:string;notes:string|null;status:string;scheduledStart:string|null;scheduledEnd:string|null;client:{name:string;contactName:string|null;phone:string|null};assignedTo:{id:string;name:string}|null;photoCount:number};

function toLocalDateTimeInput(value:string|null){
 if(!value)return "";
 const d=new Date(value);
 const pad=(n:number)=>String(n).padStart(2,"0");
 return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function JobDetailView({job}:{job:Job}){
 const router=useRouter();
 const[workflow,setWorkflow]=useState(false);
 const[smsOpen,setSmsOpen]=useState(false);
 const[start,setStart]=useState(job.scheduledStart);
 const[end,setEnd]=useState(job.scheduledEnd);
 const[scheduleSaving,setScheduleSaving]=useState(false);
 const maps=`https://maps.apple.com/?q=${encodeURIComponent(job.address)}`;
 const phone=(job.client.phone||"").replace(/[^+\d]/g,"");

 async function changeSchedule(value:string){
  if(!value||scheduleSaving)return;
  const oldStart=start?new Date(start):null;
  const oldEnd=end?new Date(end):null;
  const nextStart=new Date(value);
  if(Number.isNaN(nextStart.getTime()))return;
  const duration=oldStart&&oldEnd&&oldEnd>oldStart?oldEnd.getTime()-oldStart.getTime():60*60*1000;
  const nextEnd=new Date(nextStart.getTime()+duration);
  const prevStart=start,prevEnd=end;
  setStart(nextStart.toISOString());setEnd(nextEnd.toISOString());setScheduleSaving(true);
  try{
   const res=await fetch(`/api/jobs/${job.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({scheduledStart:nextStart.toISOString(),scheduledEnd:nextEnd.toISOString()})});
   if(!res.ok){
    const body=await res.json().catch(()=>null);
    throw new Error(body?.error||"Could not update job date");
   }
   router.refresh();
  }catch(err){
   setStart(prevStart);setEnd(prevEnd);
   alert(err instanceof Error?err.message:"Could not update job date");
  }finally{setScheduleSaving(false);}
 }

 return <><div className="flex-1 overflow-auto p-3 md:p-5" style={{background:"#03101f"}}><div className="mx-auto max-w-2xl"><button onClick={()=>router.push("/jobs")} className="mb-3 flex items-center gap-2 text-sm" style={{color:UI.cyan}}><ArrowLeft size={17}/>Jobs</button><section className="rounded-2xl p-4 md:p-5" style={{background:UI.panel,border:`1px solid ${UI.border}`}}><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-semibold uppercase tracking-[.12em]" style={{color:UI.cyan}}>Job</p><h1 className="mt-1 text-xl font-bold" style={{color:UI.text}}>{job.title}</h1><p className="mt-1 text-sm" style={{color:UI.mute}}>{job.client.name}</p></div><span className="rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{background:"rgba(22,141,255,.12)",color:UI.cyan,border:"1px solid rgba(37,199,255,.25)"}}>{job.status.replaceAll("_"," ")}</span></div><a href={maps} target="_blank" rel="noreferrer" className="mt-4 flex items-center gap-3 rounded-xl p-3" style={{background:UI.alt,border:`1px solid ${UI.border}`,color:UI.text}}><MapPin size={18} style={{color:UI.cyan}}/><span className="min-w-0 flex-1 text-sm">{job.address}</span><Navigation size={17} style={{color:UI.cyan}}/></a><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div className="relative rounded-xl p-3" style={{background:UI.alt,color:UI.mute}}><CalendarDays size={14} style={{color:UI.cyan}}/><p className="mt-2">{scheduleSaving?"Saving...":start?new Date(start).toLocaleString("en-AU",{weekday:"short",day:"numeric",month:"short",hour:"numeric",minute:"2-digit"}):"Not scheduled"}</p><input aria-label="Change job date and time" title="Change job date and time" type="datetime-local" value={toLocalDateTimeInput(start)} onChange={e=>changeSchedule(e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" disabled={scheduleSaving}/></div><div className="rounded-xl p-3" style={{background:UI.alt,color:UI.mute}}><UserRound size={14} style={{color:UI.cyan}}/><p className="mt-2">{job.assignedTo?.name??"Unassigned"}</p></div></div><div className="mt-4 rounded-xl p-4" style={{background:UI.alt,border:`1px solid ${UI.border}`}}><p className="text-xs font-semibold uppercase tracking-[.1em]" style={{color:UI.cyan}}>Job notes</p>{job.notes?<p className="mt-3 whitespace-pre-wrap text-sm leading-6" style={{color:UI.text}}>{job.notes}</p>:<p className="mt-3 text-sm" style={{color:UI.mute}}>No job notes have been added yet.</p>}</div><div className="mt-3 flex items-center gap-2 text-xs" style={{color:UI.mute}}><Camera size={14}/>{job.photoCount} job photo{job.photoCount===1?"":"s"}</div>{phone?<button type="button" onClick={()=>setSmsOpen(true)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold" style={{background:"rgba(37,199,255,.10)",border:"1px solid rgba(37,199,255,.38)",color:UI.cyan}}><MessageSquareText size={18}/>SMS client</button>:<div className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm" style={{background:"rgba(147,169,194,.06)",border:`1px solid ${UI.border}`,color:UI.mute}}><MessageSquareText size={18}/>No client mobile number</div>}<button type="button" onClick={()=>setWorkflow(true)} className="mt-3 w-full rounded-xl py-4 text-base font-bold" style={{background:UI.green,color:"#03101f"}}>{job.status==="IN_PROGRESS"?"Open current job":"Arrived / open job"}</button></section></div></div><ClientSmsPanel jobId={job.id} open={smsOpen} onClose={()=>setSmsOpen(false)}/>{workflow&&<FieldJobModal jobId={job.id} onClose={()=>setWorkflow(false)} onDone={()=>router.refresh()}/>}</>;
}
