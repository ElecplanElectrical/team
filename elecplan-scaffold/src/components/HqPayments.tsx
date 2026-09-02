"use client";

import { useMemo, useState } from "react";
import { CircleDollarSign, Plus, ReceiptText } from "lucide-react";

type BusinessOption = { id: string; name: string };
export type HqPaymentRow = {
  id: string; businessId: string; businessName: string; amount: number; status: string;
  dueDate: string | null; paymentDate: string | null; method: string | null;
  reference: string | null; notes: string | null; createdAt: string;
};
const UI={panel:"#07192b",alt:"#041525",border:"rgba(77,150,221,.24)",text:"#f5f9ff",mute:"#93a9c2",faint:"#617993",blue:"#168dff",cyan:"#25c7ff",green:"#18d3a0",red:"#ff5e72"};
const statuses=["PENDING","PAID","OVERDUE","REFUNDED","VOID"] as const;
const money=(value:number)=>new Intl.NumberFormat("en-AU",{style:"currency",currency:"AUD"}).format(value);
const date=(value:string|null)=>value?new Intl.DateTimeFormat("en-AU",{dateStyle:"medium",timeZone:"Australia/Melbourne"}).format(new Date(value)):"—";
const isoDate=(value:string)=>value?new Date(value+"T12:00:00+10:00").toISOString():null;

export default function HqPayments({businesses,initialPayments}:{businesses:BusinessOption[];initialPayments:HqPaymentRow[]}){
 const [rows,setRows]=useState(initialPayments);
 const [form,setForm]=useState({businessId:businesses[0]?.id??"",amount:"",status:"PENDING",dueDate:"",method:"",reference:"",notes:""});
 const [busy,setBusy]=useState(false);const[error,setError]=useState("");
 const totals=useMemo(()=>({
  paid:rows.filter(r=>r.status==="PAID").reduce((s,r)=>s+Number(r.amount),0),
  outstanding:rows.filter(r=>r.status==="PENDING"||r.status==="OVERDUE").reduce((s,r)=>s+Number(r.amount),0),
 }),[rows]);
 async function create(){
  const amount=Number(form.amount);if(!form.businessId||!Number.isFinite(amount)||amount<0)return setError("Choose a customer and enter a valid amount.");
  setBusy(true);setError("");
  const res=await fetch("/api/platform/payments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,amount,dueDate:isoDate(form.dueDate),method:form.method||null,reference:form.reference||null,notes:form.notes||null})});
  const body=await res.json().catch(()=>null);setBusy(false);
  if(!res.ok)return setError(body?.error||"Could not record payment.");
  setRows(current=>[{...body,amount:Number(body.amount)},...current]);setForm(f=>({...f,amount:"",status:"PENDING",dueDate:"",method:"",reference:"",notes:""}));
 }
 async function setStatus(id:string,status:string){
  const res=await fetch("/api/platform/payments/"+id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});
  const body=await res.json().catch(()=>null);if(!res.ok)return setError(body?.error||"Could not update payment.");
  setRows(current=>current.map(row=>row.id===id?{...body,amount:Number(body.amount)}:row));
 }
 const input="h-10 w-full rounded-lg px-3 text-sm outline-none";
 return <section id="payments" className="overflow-hidden rounded-xl" style={{background:UI.panel,border:`1px solid ${UI.border}`}}>
  <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between" style={{borderColor:UI.border}}>
   <div><div className="flex items-center gap-2"><CircleDollarSign size={18} style={{color:UI.cyan}}/><h2 className="text-sm font-semibold" style={{color:UI.text}}>Customer payments</h2></div><p className="mt-1 text-xs" style={{color:UI.faint}}>Record subscription payments, due dates and payment status.</p></div>
   <div className="flex gap-2 text-xs"><span className="rounded-lg px-3 py-2" style={{background:UI.alt,color:UI.green}}>Paid {money(totals.paid)}</span><span className="rounded-lg px-3 py-2" style={{background:UI.alt,color:UI.red}}>Outstanding {money(totals.outstanding)}</span></div>
  </div>
  <div className="grid gap-3 border-b p-4 md:grid-cols-2 xl:grid-cols-4" style={{borderColor:UI.border}}>
   <select aria-label="Payment customer" className={input} style={{background:UI.alt,border:`1px solid ${UI.border}`,color:UI.text}} value={form.businessId} onChange={e=>setForm(f=>({...f,businessId:e.target.value}))}>{businesses.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
   <input aria-label="Payment amount" type="number" min="0" step="0.01" placeholder="Amount ($)" className={input} style={{background:UI.alt,border:`1px solid ${UI.border}`,color:UI.text}} value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/>
   <select aria-label="Payment status" className={input} style={{background:UI.alt,border:`1px solid ${UI.border}`,color:UI.text}} value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>{statuses.map(s=><option key={s}>{s}</option>)}</select>
   <input aria-label="Payment due date" type="date" className={input} style={{background:UI.alt,border:`1px solid ${UI.border}`,color:UI.text}} value={form.dueDate} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))}/>
   <input aria-label="Payment method" placeholder="Method (card, transfer…)" className={input} style={{background:UI.alt,border:`1px solid ${UI.border}`,color:UI.text}} value={form.method} onChange={e=>setForm(f=>({...f,method:e.target.value}))}/>
   <input aria-label="Payment reference" placeholder="Reference" className={input} style={{background:UI.alt,border:`1px solid ${UI.border}`,color:UI.text}} value={form.reference} onChange={e=>setForm(f=>({...f,reference:e.target.value}))}/>
   <input aria-label="Payment notes" placeholder="Notes" className={input} style={{background:UI.alt,border:`1px solid ${UI.border}`,color:UI.text}} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/>
   <button type="button" disabled={busy||!businesses.length} onClick={create} className="flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50" style={{background:UI.blue}}><Plus size={15}/>{busy?"Saving…":"Record payment"}</button>
   {error&&<p className="text-xs text-rose-400 md:col-span-2 xl:col-span-4">{error}</p>}
  </div>
  {rows.length===0?<div className="px-5 py-10 text-center text-sm" style={{color:UI.mute}}>No payments recorded yet.</div>:<div className="divide-y" style={{borderColor:UI.border}}>{rows.map(row=><div key={row.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[1.2fr_.7fr_.7fr_1fr_auto] lg:items-center" style={{borderColor:UI.border}}>
   <div><div className="flex items-center gap-2"><ReceiptText size={15} style={{color:UI.cyan}}/><p className="text-sm font-semibold" style={{color:UI.text}}>{row.businessName}</p></div><p className="mt-1 text-xs" style={{color:UI.faint}}>{row.reference||row.method||"Subscription payment"}</p></div>
   <div><p className="text-[10px] uppercase" style={{color:UI.faint}}>Amount</p><p className="mt-1 text-sm font-semibold" style={{color:UI.text}}>{money(Number(row.amount))}</p></div>
   <div><p className="text-[10px] uppercase" style={{color:UI.faint}}>Due</p><p className="mt-1 text-xs" style={{color:UI.mute}}>{date(row.dueDate)}</p></div>
   <div><p className="text-[10px] uppercase" style={{color:UI.faint}}>Paid</p><p className="mt-1 text-xs" style={{color:UI.mute}}>{date(row.paymentDate)}</p></div>
   <select aria-label={`Status for ${row.businessName}`} className="h-9 rounded-lg px-2 text-xs" style={{background:UI.alt,border:`1px solid ${UI.border}`,color:row.status==="PAID"?UI.green:row.status==="OVERDUE"?UI.red:UI.cyan}} value={row.status} onChange={e=>setStatus(row.id,e.target.value)}>{statuses.map(s=><option key={s}>{s}</option>)}</select>
  </div>)}</div>}
 </section>;
}
