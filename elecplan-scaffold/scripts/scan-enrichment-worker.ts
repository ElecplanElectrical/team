import { PrismaClient } from "@prisma/client";
import { createWorker } from "tesseract.js";
import { createDownloadUrl } from "../src/lib/storage";

const prisma = new PrismaClient();
const brands = ["Voltex","Clipsal","Hager","NHP","Legrand","Trader","HPM","Deta","Cabac","Schneider","NB Lights","SAL","Pierlite","Brilliant"];

function parse(text:string, barcode="") {
  const raw = text.split(/\n/).map(x=>x.replace(/[|_]+/g," ").replace(/\s+/g," ").trim()).filter(x=>x.length>1);
  const lines = [...raw, ...raw.slice(0,-1).map((x,i)=>`${x} ${raw[i+1]}`)];
  const supplier = brands.find(b=>text.toLowerCase().includes(b.toLowerCase())) || null;
  const compact = (x:string)=>x.replace(/[^A-Za-z0-9]/g,"");
  const tokens = text.match(/\b[A-Z]{1,6}[A-Z0-9-]{2,12}\b/gi) || [];
  const model = tokens.map(x=>x.toUpperCase()).find(x=>/[A-Z]/.test(x)&&/\d/.test(x)&&compact(x)!==compact(barcode).toUpperCase()&&!brands.some(b=>compact(b).toUpperCase()===compact(x).toUpperCase())) || null;

  const junk = (x:string)=>/barcode|batch|serial|www\.|\.com|made in|warning|voltage|wattage|pack\b|qty\b/i.test(x);
  const modelOnly = (x:string)=>{
    const c=compact(x).toUpperCase();
    if(!c) return true;
    if(model && c===compact(model).toUpperCase()) return true;
    if(c===compact(barcode).toUpperCase()) return true;
    return /^[A-Z]{1,6}\d[A-Z0-9-]{0,10}$/i.test(c) || /^\d{5,14}$/.test(c);
  };
  const productWords = /(mounting\s*block|socket|outlet|switch|plug|downlight|batten|power\s*point|junction\s*box|enclosure|dimmer|sensor|breaker|rcbo|rccb|isolator|transformer|driver|cable|conduit|coupler|adapter|connector|wall\s*plate|mechanism|smoke\s*alarm|pendant|floodlight|fan|light fitting)/i;

  const candidates = lines
    .filter(x=>!junk(x) && /[A-Za-z]{3,}/.test(x) && !modelOnly(x))
    .map(x=>x.replace(model ? new RegExp(`\\b${model.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\b`,`ig`) : /$^/,"")
      .replace(/\b\d{5,14}\b/g,"")
      .replace(/\s+/g," ").trim())
    .filter(x=>x.length>=4 && !modelOnly(x));

  let desc = candidates.find(x=>productWords.test(x)) || candidates.find(x=>x.split(/\s+/).length>=2) || "";
  if(desc && supplier && !desc.toLowerCase().includes(supplier.toLowerCase())) desc = `${supplier} ${desc}`;
  if(desc && modelOnly(desc)) desc = "";

  return { name: desc.slice(0,160), supplier, model };
}

function machineLike(name:string, barcode:string|null) {
  const n=name.replace(/\s+/g,"");
  return name===barcode || /^[A-Z]{1,6}[A-Z0-9-]{2,12}$/i.test(n) || /^\d{5,14}$/.test(n);
}

async function photoBytes(key:string) {
  if(key.startsWith("data:image/")) {
    const comma=key.indexOf(",");
    if(comma<0) throw new Error("invalid embedded photo");
    return Buffer.from(key.slice(comma+1),"base64");
  }
  const image=await fetch(createDownloadUrl(key));
  if(!image.ok) throw new Error(`photo download ${image.status}`);
  return Buffer.from(await image.arrayBuffer());
}

async function requeueModelNumberNames() {
  const done = await prisma.scanEnrichmentJob.findMany({
    where:{status:"DONE"},
    select:{id:true,stockItem:{select:{name:true,barcode:true}}},
    take:200
  });
  const ids = done.filter(j=>machineLike(j.stockItem.name,j.stockItem.barcode)).map(j=>j.id);
  if(ids.length) {
    await prisma.scanEnrichmentJob.updateMany({
      where:{id:{in:ids}},
      data:{status:"PENDING",attempts:0,lastError:null}
    });
    console.log(`Requeued ${ids.length} model-number material names`);
  }
}

async function main() {
  await prisma.scanEnrichmentJob.updateMany({where:{status:"PROCESSING",updatedAt:{lt:new Date(Date.now()-15*60*1000)}},data:{status:"PENDING",lastError:"Recovered stale processing job"}});
  await requeueModelNumberNames();

  const jobs=await prisma.scanEnrichmentJob.findMany({where:{status:"PENDING"},orderBy:{createdAt:"asc"},take:50,include:{stockItem:true}});
  if(!jobs.length){console.log("No pending scan enrichment jobs");return;}
  const worker=await createWorker("eng");
  try {
    for(const job of jobs) {
      await prisma.scanEnrichmentJob.update({where:{id:job.id},data:{status:"PROCESSING",attempts:{increment:1},lastError:null}});
      try {
        const out=await worker.recognize(await photoBytes(job.photoStorageKey));
        const p=parse(out.data.text||"",job.stockItem.barcode||"");
        if(!p.name&&!p.model) throw new Error("No product identity found");
        const target=job.stockItem;

        if(p.model) {
          const same=await prisma.stockItem.findFirst({where:{businessId:target.businessId,modelNumber:{equals:p.model,mode:"insensitive"},id:{not:target.id}}});
          if(same) {
            await prisma.$transaction(async tx=>{
              await tx.stockBarcode.updateMany({where:{stockItemId:target.id},data:{stockItemId:same.id}});
              await tx.stockItem.update({where:{id:same.id},data:{onHand:{increment:target.onHand},name:p.name||same.name,supplier:p.supplier||same.supplier,modelNumber:p.model,photoStorageKey:same.photoStorageKey||target.photoStorageKey}});
              await tx.stockItem.delete({where:{id:target.id}});
            });
            console.log(`Merged ${target.barcode||target.id} into ${p.model} as ${p.name||same.name}`);
            continue;
          }
        }

        await prisma.stockItem.update({where:{id:target.id},data:{name:p.name||target.name,supplier:p.supplier||target.supplier,modelNumber:p.model||target.modelNumber}});
        await prisma.scanEnrichmentJob.update({where:{id:job.id},data:{status:"DONE",lastError:null}});
        console.log(`Updated ${target.barcode||target.id}: ${p.name||target.name} [${p.model||"no model"}]`);
      } catch(e) {
        const msg=e instanceof Error?e.message:String(e);
        await prisma.scanEnrichmentJob.update({where:{id:job.id},data:{status:job.attempts+1>=3?"FAILED":"PENDING",lastError:msg.slice(0,500)}});
        console.error(`Failed ${job.id}: ${msg}`);
      }
    }
  } finally {
    await worker.terminate();
  }
}

main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>prisma.$disconnect());
