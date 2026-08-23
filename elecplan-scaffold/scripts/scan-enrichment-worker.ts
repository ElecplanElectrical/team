import { PrismaClient } from "@prisma/client";
import { createWorker } from "tesseract.js";
import { createDownloadUrl } from "../src/lib/storage";
const prisma=new PrismaClient();
const brands=["Voltex","Clipsal","Hager","NHP","Legrand","Trader","HPM","Deta","Cabac","Schneider","NB Lights","SAL","Pierlite","Brilliant"];
function parse(text:string,barcode=""){
  const raw=text.split(/\n/).map(x=>x.replace(/[|_]+/g," ").replace(/\s+/g," ").trim()).filter(x=>x.length>1);
  const lines=[...raw,...raw.slice(0,-1).map((x,i)=>`${x} ${raw[i+1]}`)];
  const supplier=brands.find(b=>text.toLowerCase().includes(b.toLowerCase()))||null;
  const compact=(x:string)=>x.replace(/[^A-Za-z0-9]/g,"");
  const modelLike=(x:string)=>{const c=compact(x);return !!c&&(c.toLowerCase()===compact(barcode).toLowerCase()||/^[A-Z]{1,6}[A-Z0-9-]{2,12}$/i.test(c)||/^\d{5,14}$/.test(c))};
  const junk=(x:string)=>/barcode|batch|serial|www\.|\.com|made in|warning|voltage|wattage/i.test(x);
  const productWords=/(mounting\s*block|socket|outlet|switch|plug|downlight|batten|power\s*point|junction\s*box|enclosure|dimmer|sensor|breaker|rcbo|rccb|isolator|transformer|driver|cable|conduit|coupler|adapter|connector|wall\s*plate|mechanism|smoke\s*alarm|pendant|floodlight|fan|light fitting)/i;
  let candidates=lines.filter(x=>!junk(x)&&!modelLike(x)&&/[A-Za-z]{3,}/.test(x));
  candidates=candidates.map(x=>x.replace(new RegExp(`\\b${barcode.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\b`,`ig`),"").replace(/\b[A-Z]{1,6}\d[A-Z0-9-]{1,10}\b/gi,"").replace(/\s+/g," ").trim()).filter(Boolean);
  let desc=candidates.find(x=>productWords.test(x))||candidates.find(x=>x.split(/\s+/).length>=3)||candidates.find(x=>x.split(/\s+/).length>=2)||"";
  if(desc&&supplier&&!desc.toLowerCase().includes(supplier.toLowerCase()))desc=`${supplier} ${desc}`;
  return{name:desc.slice(0,160),supplier};
}
function machineLike(name:string,barcode:string|null){const n=name.replace(/\s+/g,"");return name===barcode||/^[A-Z]{1,6}[A-Z0-9-]{2,12}$/i.test(n)||/^\d{5,14}$/.test(n)}
async function photoBytes(key:string){if(key.startsWith("data:image/")){const comma=key.indexOf(",");if(comma<0)throw new Error("invalid embedded photo");return Buffer.from(key.slice(comma+1),"base64")}const url=createDownloadUrl(key);const image=await fetch(url);if(!image.ok)throw new Error(`photo download ${image.status}`);return Buffer.from(await image.arrayBuffer())}
async function main(){await prisma.scanEnrichmentJob.updateMany({where:{status:"PROCESSING",updatedAt:{lt:new Date(Date.now()-15*60*1000)}},data:{status:"PENDING",lastError:"Recovered stale processing job"}});const jobs=await prisma.scanEnrichmentJob.findMany({where:{status:"PENDING"},orderBy:{createdAt:"asc"},take:25,include:{stockItem:true}});if(!jobs.length){console.log("No pending scan enrichment jobs");return}const worker=await createWorker("eng");try{for(const job of jobs){await prisma.scanEnrichmentJob.update({where:{id:job.id},data:{status:"PROCESSING",attempts:{increment:1},lastError:null}});try{const bytes=await photoBytes(job.photoStorageKey);const out=await worker.recognize(bytes);const p=parse(out.data.text||"",job.stockItem.barcode||"");if(!p.name)throw new Error("No human-readable product description found");if(machineLike(job.stockItem.name,job.stockItem.barcode)){await prisma.stockItem.update({where:{id:job.stockItemId},data:{name:p.name,supplier:p.supplier||job.stockItem.supplier}})}await prisma.scanEnrichmentJob.update({where:{id:job.id},data:{status:"DONE",lastError:null}});console.log(`Done ${job.stockItem.barcode||job.stockItemId}: ${p.name}`)}catch(e){const msg=e instanceof Error?e.message:String(e);const attempts=job.attempts+1;await prisma.scanEnrichmentJob.update({where:{id:job.id},data:{status:attempts>=3?"FAILED":"PENDING",lastError:msg.slice(0,500)}});console.error(`Failed ${job.id}: ${msg}`)}}}finally{await worker.terminate()}}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>prisma.$disconnect());
