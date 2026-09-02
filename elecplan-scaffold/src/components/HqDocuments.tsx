"use client";

import { useState } from "react";
import { Download, FileText, Trash2, Upload } from "lucide-react";

type BusinessOption={id:string;name:string};
export type HqDocumentRow={id:string;businessId:string;businessName:string;name:string;type:string;originalName:string|null;contentType:string|null;sizeBytes:number|null;notes:string|null;uploadedAt:string};
const UI={panel:"#07192b",alt:"#041525",border:"rgba(77,150,221,.24)",text:"#f5f9ff",mute:"#93a9c2",faint:"#617993",blue:"#168dff",cyan:"#25c7ff",green:"#18d3a0"};
const docTypes=["Onboarding","Agreement","Branding","Billing","Insurance","Other"];
const size=(bytes:number|null)=>bytes===null?"—":bytes<1024*1024?`${Math.ceil(bytes/1024)} KB`:`${(bytes/1024/1024).toFixed(1)} MB`;
const date=(value:string)=>new Intl.DateTimeFormat("en-AU",{dateStyle:"medium",timeZone:"Australia/Melbourne"}).format(new Date(value));

export default function HqDocuments({businesses,initialDocuments}:{businesses:BusinessOption[];initialDocuments:HqDocumentRow[]}){
 const[rows,setRows]=useState(initialDocuments);const[file,setFile]=useState<File|null>(null);
 const[form,setForm]=useState({businessId:businesses[0]?.id??"",name:"",type:"Onboarding",notes:""});
 const[busy,setBusy]=useState(false);const[error,setError]=useState("");const input="h-10 w-full rounded-lg px-3 text-sm outline-none";
 async function upload(){
  if(!file||!form.businessId)return setError("Choose a customer and file.");setBusy(true);setError("");
  const ticketRes=await fetch("/api/storage/upload-ticket",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({kind:"documents",fileName:file.name,contentType:file.type||"text/plain",sizeBytes:file.size})});
  const ticket=await ticketRes.json().catch(()=>null);
  if(!ticketRes.ok){setBusy(false);return setError(ticket?.error||"Could not prepare upload.");}
  const put=await fetch(ticket.uploadUrl,{method:"PUT",headers:ticket.uploadHeaders,body:file});
  if(!put.ok){setBusy(false);return setError(`Upload failed (${put.status}).`);}
  const res=await fetch("/api/platform/documents",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({businessId:form.businessId,name:form.name.trim()||file.name,type:form.type,notes:form.notes.trim()||null,commitToken:ticket.commitToken})});
  const body=await res.json().catch(()=>null);setBusy(false);
  if(!res.ok)return setError(body?.error||"Could not save document.");
  setRows(current=>[body,...current]);setFile(null);setForm(f=>({...f,name:"",notes:""}));
 }
 async function remove(row:HqDocumentRow){
  if(!window.confirm(`Delete ${row.name}? This cannot be undone.`))return;
  const res=await fetch("/api/platform/documents/"+row.id,{method:"DELETE"});const body=await res.json().catch(()=>null);
  if(!res.ok)return setError(body?.error||"Could not delete document.");setRows(current=>current.filter(d=>d.id!==row.id));
 }
 return <section id="documents" className="overflow-hidden rounded-xl" style={{background:UI.panel,border:`1px solid ${UI.border}`}}>
  <div className="flex items-center gap-2 border-b px-5 py-4" style={{borderColor:UI.border}}><FileText size={18} style={{color:UI.cyan}}/><div><h2 className="text-sm font-semibold" style={{color:UI.text}}>HQ documents</h2><p className="mt-1 text-xs" style={{color:UI.faint}}>Private customer onboarding, agreement, branding and billing files.</p></div></div>
  <div className="grid gap-3 border-b p-4 md:grid-cols-2 xl:grid-cols-4" style={{borderColor:UI.border}}>
   <select aria-label="Document customer" className={input} style={{background:UI.alt,border:`1px solid ${UI.border}`,color:UI.text}} value={form.businessId} onChange={e=>setForm(f=>({...f,businessId:e.target.value}))}>{businesses.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
   <input aria-label="Document name" placeholder="Document name" className={input} style={{background:UI.alt,border:`1px solid ${UI.border}`,color:UI.text}} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
   <select aria-label="Document type" className={input} style={{background:UI.alt,border:`1px solid ${UI.border}`,color:UI.text}} value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>{docTypes.map(t=><option key={t}>{t}</option>)}</select>
   <input aria-label="Document notes" placeholder="Notes" className={input} style={{background:UI.alt,border:`1px solid ${UI.border}`,color:UI.text}} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
   <label className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold md:col-span-2" style={{border:`1px solid ${UI.border}`,color:file?UI.green:UI.cyan}}><Upload size={15}/>{file?file.name:"Choose PDF, image or text file"}<input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt" className="hidden" onChange={e=>setFile(e.target.files?.[0]??null)}/></label>
   <button type="button" disabled={busy||!file||!businesses.length} onClick={upload} className="flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 md:col-span-2" style={{background:UI.blue}}><Upload size={15}/>{busy?"Uploading…":"Upload to HQ"}</button>
   {error&&<p className="text-xs text-rose-400 md:col-span-2 xl:col-span-4">{error}</p>}
  </div>
  {rows.length===0?<div className="px-5 py-10 text-center text-sm" style={{color:UI.mute}}>No HQ documents uploaded yet.</div>:<div className="divide-y" style={{borderColor:UI.border}}>{rows.map(row=><div key={row.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1.5fr_1fr_.7fr_auto] md:items-center" style={{borderColor:UI.border}}>
   <div><p className="text-sm font-semibold" style={{color:UI.text}}>{row.name}</p><p className="mt-1 text-xs" style={{color:UI.faint}}>{row.businessName} · {row.type}</p></div>
   <div><p className="text-xs" style={{color:UI.mute}}>{row.originalName||"Private file"}</p><p className="mt-1 text-[10px]" style={{color:UI.faint}}>{size(row.sizeBytes)}</p></div>
   <p className="text-xs" style={{color:UI.mute}}>{date(row.uploadedAt)}</p>
   <div className="flex gap-2"><a href={`/api/platform/documents/${row.id}/file`} className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold" style={{border:`1px solid ${UI.border}`,color:UI.cyan}}><Download size={14}/>Open</a><button type="button" onClick={()=>remove(row)} className="flex h-9 items-center rounded-lg px-3" style={{border:"1px solid rgba(255,94,114,.22)",color:"#ff5e72"}} aria-label={`Delete ${row.name}`}><Trash2 size={14}/></button></div>
  </div>)}</div>}
 </section>;
}
