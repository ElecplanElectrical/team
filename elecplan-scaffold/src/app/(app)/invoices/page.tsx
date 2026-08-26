import { requireAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/TopBar";

function invoiceRef(id:string, invoiceNumber:string|null){return invoiceNumber ?? "INV-"+id.slice(-4).toUpperCase();}
function money(value:number){return new Intl.NumberFormat("en-AU",{style:"currency",currency:"AUD"}).format(value);}

export default async function InvoicesPage(){
  const user=await requireAccess("invoices");
  const businessId=user.businessId ?? "__unassigned__";
  const rows=await prisma.invoice.findMany({where:{businessId,supplier:null},include:{client:{select:{name:true}},job:{select:{title:true}}},orderBy:{createdAt:"desc"}});
  const total=rows.reduce((sum,row)=>sum+Number(row.amount),0);
  const outstanding=rows.filter(row=>row.status!=="PAID").reduce((sum,row)=>sum+Number(row.amount),0);
  return <>
    <TopBar title="Invoices" subtitle="Customer invoices and payment status" />
    <div className="flex-1 overflow-y-auto p-4 md:p-6" style={{background:"#03101f"}}>
      <div className="mx-auto w-full max-w-[1500px] space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-4" style={{background:"#081b30",border:"1px solid rgba(77,150,221,.23)"}}><p className="text-xs text-slate-400">Total invoiced</p><p className="mt-1 text-xl font-semibold text-white">{money(total)}</p></div>
          <div className="rounded-xl p-4" style={{background:"#081b30",border:"1px solid rgba(77,150,221,.23)"}}><p className="text-xs text-slate-400">Outstanding</p><p className="mt-1 text-xl font-semibold text-white">{money(outstanding)}</p></div>
        </div>
        <div className="overflow-hidden rounded-xl" style={{background:"#081b30",border:"1px solid rgba(77,150,221,.23)"}}>
          {rows.length===0?<div className="p-8 text-center text-sm text-slate-400">No customer invoices yet.</div>:rows.map((row,i)=><div key={row.id} className="grid grid-cols-[1fr_auto] gap-3 p-4" style={{borderTop:i?"1px solid rgba(77,150,221,.18)":"none"}}><div className="min-w-0"><p className="font-semibold text-white">{invoiceRef(row.id,row.invoiceNumber)}</p><p className="truncate text-sm text-slate-300">{row.client?.name ?? "No client"}{row.job?.title?` · ${row.job.title}`:""}</p><p className="mt-1 text-xs text-slate-500">Due {row.dueDate.toLocaleDateString("en-AU")}</p></div><div className="text-right"><p className="font-semibold text-white">{money(Number(row.amount))}</p><p className="mt-1 text-xs" style={{color:row.status==="PAID"?"#35d399":row.status==="OVERDUE"?"#fb7185":"#fbbf24"}}>{row.status}</p></div></div>)}
        </div>
      </div>
    </div>
  </>;
}
