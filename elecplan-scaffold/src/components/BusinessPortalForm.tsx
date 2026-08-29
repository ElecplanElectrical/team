"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { DEFAULT_MODULES } from "@/lib/brand";

const UI={panel:"#07192b",alt:"#041323",border:"rgba(77,150,221,.24)",text:"#f5f9ff",mute:"#93a9c2",cyan:"#25c7ff",blue:"#168dff"};
const LABEL:Record<string,string>={dashboard:"Dashboard",jobs:"Jobs",calendar:"Calendar",clients:"Clients",leads:"Leads",quotes:"Quotes",invoices:"Invoices",employees:"Employees",timesheets:"Timesheets",inspections:"Inspections",documents:"Documents",materials:"Materials",reminders:"Reminders",analytics:"Reports"};
type Created={business:{name:string;slug:string};owner:{name:string;email:string};inviteUrl:string;portalPath:string};

export default function BusinessPortalForm(){
 const router=useRouter();
 const[name,setName]=useState("");const[industry,setIndustry]=useState("");const[contactName,setContactName]=useState("");const[contactEmail,setContactEmail]=useState("");const[price,setPrice]=useState("");
 const[logoUrl,setLogoUrl]=useState("");const[primaryColor,setPrimaryColor]=useState("#168dff");const[accentColor,setAccentColor]=useState("#25c7ff");const[plan,setPlan]=useState("CUSTOM");
 const[modules,setModules]=useState<string[]>([...DEFAULT_MODULES]);const[saving,setSaving]=useState(false);const[error,setError]=useState("");const[created,setCreated]=useState<Created|null>(null);
 function toggle(m:string){setModules(x=>x.includes(m)?x.filter(v=>v!==m):[...x,m])}
 async function submit(){
  setError("");setCreated(null);
  if(!name.trim()||!contactName.trim()||!contactEmail.trim()){setError("Business name, owner name and owner email are required.");return}
  if(modules.length===0){setError("Enable at least one module.");return}
  setSaving(true);
  const r=await fetch("/api/platform/businesses",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,industry,contactName,contactEmail,monthlyPrice:price,modules,logoUrl,primaryColor,accentColor,plan})});
  const b=await r.json().catch(()=>null);setSaving(false);
  if(!r.ok){setError(b?.error||"Could not create business portal.");return}
  setCreated(b);setName("");setIndustry("");setContactName("");setContactEmail("");setPrice("");setLogoUrl("");setPlan("CUSTOM");setModules([...DEFAULT_MODULES]);router.refresh();
 }
 return <section className="rounded-xl p-5" style={{background:UI.panel,border:`1px solid ${UI.border}`}}>
  <div className="flex items-center gap-2"><Plus size={18} style={{color:UI.cyan}}/><div><h2 className="text-sm font-semibold" style={{color:UI.text}}>Create customer business</h2><p className="mt-1 text-xs" style={{color:UI.mute}}>Create the portal, branding, modules and first customer admin in one step.</p></div></div>
  <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5"><Field label="Business name" value={name} set={setName} placeholder="Quality Landscape Solutions"/><Field label="Industry" value={industry} set={setIndustry} placeholder="Landscaping"/><Field label="Owner / admin" value={contactName} set={setContactName} placeholder="Business owner"/><Field label="Owner email" value={contactEmail} set={setContactEmail} placeholder="owner@business.com.au" type="email"/><Field label="Monthly subscription (AUD)" value={price} set={setPrice} placeholder="299" type="number"/></div>
  <p className="mt-5 text-xs font-semibold" style={{color:UI.mute}}>Portal branding</p>
  <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-4"><Field label="Logo URL (optional)" value={logoUrl} set={setLogoUrl} placeholder="https://…/logo.png"/><Field label="Primary colour" value={primaryColor} set={setPrimaryColor} placeholder="#168dff"/><Field label="Accent colour" value={accentColor} set={setAccentColor} placeholder="#25c7ff"/><Field label="Plan" value={plan} set={setPlan} placeholder="CUSTOM"/></div>
  <p className="mt-5 text-xs font-semibold" style={{color:UI.mute}}>Enabled modules</p><div className="mt-2 flex flex-wrap gap-2">{DEFAULT_MODULES.map(m=><button type="button" key={m} onClick={()=>toggle(m)} className="rounded-full px-3 py-1.5 text-xs font-medium" style={{background:modules.includes(m)?"rgba(22,141,255,.18)":UI.alt,border:`1px solid ${modules.includes(m)?UI.blue:UI.border}`,color:modules.includes(m)?"#fff":UI.mute}}>{LABEL[m]||m}</button>)}</div>
  {error&&<p className="mt-4 text-xs text-red-400">{error}</p>}
  {created&&<div className="mt-4 rounded-lg p-4 text-xs" style={{background:UI.alt,border:`1px solid ${UI.border}`,color:UI.text}}><p className="font-semibold">{created.business.name} is ready.</p><p className="mt-1" style={{color:UI.mute}}>Admin: {created.owner.name} · {created.owner.email}</p><div className="mt-3 flex flex-wrap gap-2"><a href={created.inviteUrl} target="_blank" rel="noreferrer" className="rounded-lg px-3 py-2 font-semibold text-white" style={{background:UI.blue}}>Open password setup</a><button type="button" onClick={()=>navigator.clipboard.writeText(created.inviteUrl)} className="rounded-lg px-3 py-2 font-semibold" style={{border:`1px solid ${UI.border}`,color:UI.text}}>Copy invite link</button></div></div>}
  <div className="mt-5 flex justify-end"><button type="button" disabled={saving} onClick={submit} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60" style={{background:UI.blue}}>{saving?"Creating portal + admin…":"Create customer portal"}</button></div>
 </section>
}
function Field({label,value,set,placeholder,type="text"}:{label:string;value:string;set:(v:string)=>void;placeholder:string;type?:string}){return <label className="text-xs" style={{color:UI.mute}}>{label}<input type={type} value={value} onChange={e=>set(e.target.value)} placeholder={placeholder} className="mt-1 h-11 w-full rounded-lg px-3 text-sm outline-none" style={{background:UI.alt,border:`1px solid ${UI.border}`,color:UI.text}}/></label>}
