import { PrismaClient } from "@prisma/client";
import { createWorker, PSM } from "tesseract.js";
import { createDownloadUrl } from "../src/lib/storage";

const prisma = new PrismaClient();
const brands = ["Voltex","Clipsal","Hager","NHP","Legrand","Trader","HPM","Deta","Cabac","Schneider","NB Lights","SAL","Pierlite","Brilliant"];

const knownProducts: Record<string,string> = {
  "VMB16B": "Voltex Mounting Block 16mm Black"
};

function humanNameFromModel(model:string|null, supplier:string|null, text:string){
  if(!model) return "";
  const clean=model.replace(/[^A-Za-z0-9]/g,"").toUpperCase();
  if(knownProducts[clean]) return knownProducts[clean];

  if((supplier||"").toLowerCase()==="voltex"){
    const m=clean.match(/^VMB(\d{1,3})([A-Z])$/);
    if(m){
      const colour:Record<string,string>={B:"Black",W:"White",G:"Grey"};
      return `Voltex Mounting Block ${m[1]}mm ${colour[m[2]]||m[2]}`;
    }
  }

  const lines=text.split(/\n/).map(x=>x.replace(/[^\x20-\x7E]/g," ").replace(/\s+/g," ").trim()).filter(Boolean);
  const productWords=/(mounting\s*block|socket|outlet|switch|plug|downlight|batten|power\s*point|junction\s*box|enclosure|dimmer|sensor|breaker|rcbo|rccb|isolator|transformer|driver|cable|conduit|coupler|adapter|connector|wall\s*plate|mechanism|smoke\s*alarm|pendant|floodlight|fan|light fitting)/i;
  const line=lines.find(x=>productWords.test(x) && /[A-Za-z]{4,}/.test(x));
  if(line){
    const stripped=line.replace(model," ").replace(/\b(model|cat(?:alogue)?|catalog|part|item|code|sku)\b/gi," ").replace(/\s+/g," ").trim();
    if(stripped.length>=6){
      const pref=supplier&&!stripped.toLowerCase().includes(supplier.toLowerCase())?`${supplier} `:"";
      return `${pref}${stripped}`.slice(0,160);
    }
  }
  return "";
}

function parse(text:string, barcode="") {
  const compact=(x:string)=>x.replace(/[^A-Za-z0-9]/g,"").toUpperCase();
  const raw=text.split(/\n/).map(x=>x.replace(/[|_]+/g," ").replace(/\s+/g," ").trim()).filter(x=>x.length>1);
  const supplier=brands.find(b=>text.toLowerCase().includes(b.toLowerCase()))||null;
  const barcodeCompact=compact(barcode);
  const brandCompacts=new Set(brands.map(compact));

  const labelled:string[]=[];
  for(const line of raw){
    if(/\b(model|cat(?:alogue)?|catalog|part|item|code|sku)\b/i.test(line)){
      labelled.push(...(line.match(/[A-Z0-9][A-Z0-9._\/-]{2,18}/gi)||[]));
    }
  }
  const allTokens=text.match(/\b[A-Z0-9][A-Z0-9._\/-]{2,18}\b/gi)||[];
  const candidates=[...labelled,...allTokens]
    .map(x=>x.replace(/^[^A-Z0-9]+|[^A-Z0-9]+$/gi,"").toUpperCase())
    .filter(Boolean)
    .filter(x=>/[A-Z]/.test(x)&&/\d/.test(x))
    .filter(x=>compact(x)!==barcodeCompact)
    .filter(x=>!brandCompacts.has(compact(x)))
    .filter(x=>!/^\d{5,14}$/.test(compact(x)))
    .filter(x=>compact(x).length>=4&&compact(x).length<=18)
    .filter(x=>!/(240V|230V|220V|50HZ|60HZ|IP\d\d|WATT|VOLT|AMP|BATCH|SERIAL|QTY|PACK)/i.test(x));

  const score=(x:string)=>{
    let s=0; const c=compact(x);
    if(/[A-Z]{1,5}\d/.test(c)) s+=4;
    if(/\d[A-Z]/.test(c)) s+=2;
    if(c.length>=5&&c.length<=12) s+=2;
    if(labelled.some(v=>compact(v)===c)) s+=5;
    if(/^[A-Z]{1,6}\d[A-Z0-9-]{2,12}$/.test(c)) s+=4;
    if(knownProducts[c]) s+=10;
    return s;
  };
  const model=candidates.sort((a,b)=>score(b)-score(a))[0]||null;
  const name=humanNameFromModel(model,supplier,text);
  return {name,supplier,model};
}

function machineLike(name:string,barcode:string|null){const n=name.replace(/\s+/g,"");return name===barcode||/^[A-Z]{1,6}[A-Z0-9-]{2,12}$/i.test(n)||/^\d{5,14}$/.test(n);}
async function photoBytes(key:string){if(key.startsWith("data:image/")){const comma=key.indexOf(",");if(comma<0)throw new Error("invalid embedded photo");return Buffer.from(key.slice(comma+1),"base64");}const image=await fetch(createDownloadUrl(key));if(!image.ok)throw new Error(`photo download ${image.status}`);return Buffer.from(await image.arrayBuffer());}

async function requeueModelNumberNames(){
  const done=await prisma.scanEnrichmentJob.findMany({where:{status:"DONE",attempts:{lt:3}},select:{id:true,attempts:true,stockItem:{select:{name:true,barcode:true}}},take:200});
  const ids=done.filter(j=>machineLike(j.stockItem.name,j.stockItem.barcode)).map(j=>j.id);
  if(ids.length){await prisma.scanEnrichmentJob.updateMany({where:{id:{in:ids},attempts:{lt:3}},data:{status:"PENDING",lastError:null}});console.log(`Requeued ${ids.length} model-number material names with attempts remaining`);}
}

async function main(){
  await prisma.scanEnrichmentJob.updateMany({where:{status:"PROCESSING",updatedAt:{lt:new Date(Date.now()-15*60*1000)}},data:{status:"PENDING",lastError:"Recovered stale processing job"}});
  await requeueModelNumberNames();
  const jobs=await prisma.scanEnrichmentJob.findMany({where:{status:"PENDING",attempts:{lt:3}},orderBy:{createdAt:"asc"},take:50,include:{stockItem:true}});
  if(!jobs.length){console.log("No pending scan enrichment jobs");return;}
  const worker=await createWorker("eng");
  await worker.setParameters({tessedit_pageseg_mode:PSM.AUTO});
  try{
    for(const job of jobs){
      await prisma.scanEnrichmentJob.update({where:{id:job.id},data:{status:"PROCESSING",attempts:{increment:1},lastError:null}});
      try{
        const bytes=await photoBytes(job.photoStorageKey);
        if(bytes.length<500) throw new Error(`Photo too small for reliable OCR (${bytes.length} bytes)`);
        const out=await worker.recognize(bytes);
        const p=parse(out.data.text||"",job.stockItem.barcode||"");
        if(!p.model) throw new Error("No reliable model number found");
        if(!p.name) throw new Error(`Model ${p.model} found but no reliable human product name resolved`);
        const target=job.stockItem;
        const same=await prisma.stockItem.findFirst({where:{modelNumber:{equals:p.model,mode:"insensitive"},id:{not:target.id}}});
        if(same){
          await prisma.$transaction(async tx=>{
            await tx.stockBarcode.updateMany({where:{stockItemId:target.id},data:{stockItemId:same.id}});
            if(target.barcode)await tx.stockBarcode.upsert({where:{barcode:target.barcode},create:{barcode:target.barcode,stockItemId:same.id},update:{stockItemId:same.id}});
            await tx.stockItem.update({where:{id:same.id},data:{onHand:{increment:target.onHand},name:p.name,supplier:p.supplier||same.supplier,modelNumber:p.model,photoStorageKey:same.photoStorageKey||target.photoStorageKey}});
            await tx.stockItem.delete({where:{id:target.id}});
            await tx.scanEnrichmentJob.update({where:{id:job.id},data:{status:"DONE",lastError:null}});
          });
          console.log(`Merged ${target.barcode||target.id} into ${p.model} as ${p.name}`);
          continue;
        }
        await prisma.stockItem.update({where:{id:target.id},data:{name:p.name,supplier:p.supplier||target.supplier,modelNumber:p.model}});
        if(target.barcode)await prisma.stockBarcode.upsert({where:{barcode:target.barcode},create:{barcode:target.barcode,stockItemId:target.id},update:{stockItemId:target.id}});
        await prisma.scanEnrichmentJob.update({where:{id:job.id},data:{status:"DONE",lastError:null}});
        console.log(`Updated ${target.barcode||target.id}: ${p.name} [${p.model}]`);
      }catch(e){const msg=e instanceof Error?e.message:String(e);const attempts=job.attempts+1;await prisma.scanEnrichmentJob.update({where:{id:job.id},data:{status:attempts>=3?"FAILED":"PENDING",lastError:msg.slice(0,500)}});console.error(`Failed ${job.id} attempt ${attempts}/3: ${msg}`);}
    }
  }finally{await worker.terminate();}
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>prisma.$disconnect());
