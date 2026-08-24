import { PrismaClient } from "@prisma/client";
import { createWorker, PSM } from "tesseract.js";
import { createDownloadUrl } from "../src/lib/storage";

const prisma = new PrismaClient();
const brands = ["Voltex","Clipsal","Hager","NHP","Legrand","Trader","HPM","Deta","Cabac","Schneider","NB Lights","SAL","Pierlite","Brilliant"];
const knownProducts: Record<string,string> = { VMB16B: "Voltex Mounting Block 16mm Black" };

function compact(x:string){ return x.replace(/[^A-Za-z0-9]/g,"").toUpperCase(); }
function resolveName(model:string|null,supplier:string|null,text:string){
  if(!model) return "";
  const c=compact(model);
  if(knownProducts[c]) return knownProducts[c];
  if((supplier||"").toLowerCase()==="voltex"){
    const m=c.match(/^VMB(\d{1,3})([A-Z])$/);
    if(m){ const colours:Record<string,string>={B:"Black",W:"White",G:"Grey"}; return `Voltex Mounting Block ${m[1]}mm ${colours[m[2]]||m[2]}`; }
  }
  const line=text.split(/\n/).map(x=>x.replace(/[^\x20-\x7E]/g," ").replace(/\s+/g," ").trim()).find(x=>/(mounting\s*block|socket|outlet|switch|plug|downlight|batten|power\s*point|junction\s*box|enclosure|dimmer|sensor|breaker|rcbo|rccb|isolator|transformer|driver|cable|conduit|coupler|adapter|connector|wall\s*plate|mechanism|smoke\s*alarm|pendant|floodlight|fan|light fitting)/i.test(x));
  if(!line) return "";
  const cleaned=line.replace(new RegExp(model.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"ig")," ").replace(/\s+/g," ").trim();
  return `${supplier&&!cleaned.toLowerCase().includes(supplier.toLowerCase())?supplier+" ":""}${cleaned}`.trim();
}
function parse(text:string,barcode=""){
  const supplier=brands.find(b=>text.toLowerCase().includes(b.toLowerCase()))||null;
  const barcodeC=compact(barcode);
  const candidates=(text.match(/\b[A-Z0-9][A-Z0-9._\/-]{2,18}\b/gi)||[])
    .map(x=>x.toUpperCase()).filter(x=>/[A-Z]/.test(x)&&/\d/.test(x))
    .filter(x=>compact(x)!==barcodeC && !brands.some(b=>compact(b)===compact(x)))
    .filter(x=>compact(x).length>=4&&compact(x).length<=18)
    .filter(x=>!/(240V|230V|220V|50HZ|60HZ|IP\d\d|WATT|VOLT|AMP|BATCH|SERIAL|QTY|PACK)/i.test(x));
  const score=(x:string)=>{let s=0;const c=compact(x);if(knownProducts[c])s+=20;if(/^[A-Z]{1,6}\d[A-Z0-9-]{2,12}$/.test(c))s+=6;if(/[A-Z]{1,5}\d/.test(c))s+=4;if(/\d[A-Z]/.test(c))s+=2;if(c.length>=5&&c.length<=12)s+=2;return s};
  const model=candidates.sort((a,b)=>score(b)-score(a))[0]||null;
  return {supplier,model,name:resolveName(model,supplier,text)};
}
async function bytes(key:string){ if(key.startsWith("data:image/")){const i=key.indexOf(",");return Buffer.from(key.slice(i+1),"base64");} const r=await fetch(createDownloadUrl(key)); if(!r.ok) throw new Error(`download ${r.status}`); return Buffer.from(await r.arrayBuffer()); }

async function main(){
  const items=await prisma.stockItem.findMany({where:{photoStorageKey:{not:null}},orderBy:{id:"desc"},take:20,select:{id:true,name:true,barcode:true,modelNumber:true,supplier:true,photoStorageKey:true}});
  const worker=await createWorker("eng"); await worker.setParameters({tessedit_pageseg_mode:PSM.AUTO});
  try{
    for(const item of items){
      try{
        const b=await bytes(item.photoStorageKey!); const out=await worker.recognize(b); const p=parse(out.data.text||"",item.barcode||"");
        console.log(JSON.stringify({id:item.id,before:{name:item.name,model:item.modelNumber,supplier:item.supplier,barcode:item.barcode},proof:{ocrModel:p.model,resolvedName:p.name,resolvedSupplier:p.supplier,confidence:out.data.confidence}}));
      }catch(e){ console.log(JSON.stringify({id:item.id,before:{name:item.name,barcode:item.barcode},error:e instanceof Error?e.message:String(e)})); }
    }
  } finally { await worker.terminate(); await prisma.$disconnect(); }
}
main().catch(async e=>{console.error(e);await prisma.$disconnect();process.exit(1)});
