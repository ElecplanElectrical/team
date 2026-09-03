import { requireAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import InvoicesView, { type InvoiceRow } from "@/components/InvoicesView";

function invoiceRef(id:string, invoiceNumber:string|null){return invoiceNumber ?? "INV-"+id.slice(-4).toUpperCase();}
export default async function InvoicesPage(){
  const user=await requireAccess("invoices");
  const businessId=user.businessId ?? "__unassigned__";
  const [rows,clients,jobs]=await Promise.all([
    prisma.invoice.findMany({where:{businessId,supplier:null},include:{client:{select:{name:true}},job:{select:{title:true}},lineItems:{select:{id:true}}},orderBy:{createdAt:"desc"}}),
    prisma.client.findMany({where:{businessId},select:{id:true,name:true},orderBy:{name:"asc"}}),
    prisma.job.findMany({where:{businessId},select:{id:true,title:true,clientId:true},orderBy:{createdAt:"desc"}}),
  ]);
  const invoices:InvoiceRow[]=rows.map(row=>({id:row.id,ref:invoiceRef(row.id,row.invoiceNumber),client:row.client?.name??"No client",job:row.job?.title??null,amount:Number(row.amount),dueDate:row.dueDate.toISOString(),status:row.status,lineItemCount:row.lineItems.length}));
  return <InvoicesView invoices={invoices} clients={clients} jobs={jobs}/>;
}
