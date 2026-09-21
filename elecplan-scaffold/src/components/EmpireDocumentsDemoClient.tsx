"use client";
import {useMemo,useRef,useState} from "react";
import {Download,Eye,FileText,FolderOpen,Search,Upload,X} from "lucide-react";
const g="#69be28",d="#080a0b",p="#111416",b="#2a3033",m="#9aa3a7";
type Doc={folder:string;name:string;type:string;updated:string;url?:string};
const seed:Doc[]=[
{folder:"Race Weekend",name:"Round 1 run sheet",type:"PDF",updated:"Updated today"},
{folder:"Race Weekend",name:"Track map & paddock info",type:"PDF",updated:"Event file"},
{folder:"Team",name:"Team procedures",type:"PDF",updated:"Current"},
{folder:"Riders",name:"#100 setup export",type:"PDF",updated:"Practice"},
{folder:"Riders",name:"#111 setup export",type:"PDF",updated:"Qualifying"},
{folder:"Riders",name:"#63 setup export",type:"PDF",updated:"Practice"},
{folder:"Media",name:"Sponsor & media guide",type:"PDF",updated:"Season"},
{folder:"Admin",name:"Event information",type:"PDF",updated:"Round 1"}
];
export default function EmpireDocumentsDemoClient(){
 const[docs,setDocs]=useState(seed);const[q,setQ]=useState("");const[selected,setSelected]=useState<Doc|null>(null);const input=useRef<HTMLInputElement>(null);
 const filtered=useMemo(()=>{const n=q.trim().toLowerCase();return n?docs.filter(x=>[x.folder,x.name,x.type,x.updated].join(" ").toLowerCase().includes(n)):docs},[docs,q]);
 function upload(files:FileList|null){const f=files?.[0];if(!f)return;const url=URL.createObjectURL(f);setDocs(v=>[{folder:"Uploaded",name:f.name,type:(f.type.split("/")[1]||"FILE").toUpperCase(),updated:"Just now",url},...v]);if(input.current)input.current.value=""}
 function open(doc:Doc){if(doc.url){window.open(doc.url,"_blank","noopener,noreferrer");return}setSelected(doc)}
 function download(doc:Doc){const text="Empire HQ demo file\n\n"+doc.name+"\nFolder: "+doc.folder+"\nStatus: "+doc.updated+"\n";const blob=new Blob([text],{type:"text/plain"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=doc.name.replace(/[^a-z0-9]+/gi,"-").toLowerCase()+".txt";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 return <main className="min-h-screen text-white" style={{background:d}}><div className="mx-auto max-w-6xl p-4 md:p-6">
  <section className="rounded-2xl border p-5 md:p-8" style={{background:"linear-gradient(125deg,#111416,#0b0d0e 70%,#15220e)",borderColor:b}}>
   <div className="flex items-center gap-3"><FolderOpen style={{color:g}}/><div><p className="text-xs font-bold uppercase tracking-[.25em]" style={{color:g}}>Team files</p><h1 className="mt-1 text-3xl font-black uppercase md:text-4xl">Documents</h1></div></div>
   <p className="mt-4 max-w-2xl text-sm leading-6" style={{color:m}}>Event files, team procedures, setup exports and shared resources with role-based access.</p>
   <div className="mt-5 flex flex-col gap-2 sm:flex-row"><label className="flex flex-1 items-center gap-2 rounded-lg border px-3" style={{borderColor:b,background:"#0c0f10"}}><Search size={15} style={{color:m}}/><input value={q} onChange={e=>setQ(e.target.value)} className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Search team files…"/></label><button onClick={()=>input.current?.click()} className="flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-xs font-bold" style={{background:g,color:"#061008"}}><Upload size={15}/>Upload document</button><input ref={input} type="file" className="hidden" onChange={e=>upload(e.target.files)}/></div>
  </section>
  <section className="mt-4 overflow-hidden rounded-xl border" style={{background:p,borderColor:b}}>
   <div className="hidden grid-cols-[160px_1fr_80px_130px_130px] gap-3 border-b px-4 py-3 text-[10px] font-bold uppercase tracking-wider md:grid" style={{borderColor:b,color:m}}><span>Folder</span><span>File</span><span>Type</span><span>Status</span><span>Actions</span></div>
   {filtered.map((doc,i)=><div key={doc.folder+doc.name+i} className="grid gap-3 border-b p-4 md:grid-cols-[160px_1fr_80px_130px_130px] md:items-center" style={{borderColor:b}}><span className="text-xs font-bold uppercase tracking-wider" style={{color:g}}>{doc.folder}</span><span className="flex items-center gap-2 text-sm font-semibold"><FileText size={15} style={{color:m}}/>{doc.name}</span><span className="text-xs" style={{color:m}}>{doc.type}</span><span className="text-xs" style={{color:m}}>{doc.updated}</span><div className="flex gap-2"><button onClick={()=>open(doc)} className="flex items-center gap-1 rounded-lg border px-2 py-2 text-[10px] font-bold" style={{borderColor:b,color:g}}><Eye size={12}/>Open</button><button onClick={()=>download(doc)} className="flex items-center gap-1 rounded-lg border px-2 py-2 text-[10px] font-bold" style={{borderColor:b,color:m}}><Download size={12}/>Save</button></div></div>)}
   {filtered.length===0&&<div className="p-12 text-center text-sm" style={{color:m}}>No documents match that search.</div>}
  </section>
 </div>
 {selected&&<div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"><div className="w-full max-w-lg rounded-2xl border p-5" style={{background:p,borderColor:b}}><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-widest" style={{color:g}}>{selected.folder}</p><h2 className="mt-2 text-xl font-black">{selected.name}</h2></div><button onClick={()=>setSelected(null)} className="rounded-lg border p-2" style={{borderColor:b,color:m}} aria-label="Close preview"><X size={16}/></button></div><div className="mt-5 rounded-xl border p-5" style={{borderColor:b,background:"#0c0f10"}}><FileText size={28} style={{color:g}}/><p className="mt-4 text-sm leading-6" style={{color:m}}>This is the client-facing document preview state. In the live customer portal, this area opens the tenant-protected uploaded file.</p></div><button onClick={()=>download(selected)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-bold" style={{background:g,color:"#061008"}}><Download size={15}/>Download demo file</button></div></div>}
 </main>
}
