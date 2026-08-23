import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/lib/session";
function cleanBarcode(value: unknown){return String(value??"").replace(/[^0-9A-Za-z-]/g,"").slice(0,64)}
function cleanPhotoStorageKey(value: unknown){const v=String(value??"").trim().slice(0,512);return v||null}
function cleanPhotoContentType(value: unknown){const v=String(value??"").trim().slice(0,120);return v||null}
async function createEnrichmentJob(stockItemId:string,photoStorageKey:string|null){if(!photoStorageKey)return null;const job=await prisma.scanEnrichmentJob.create({data:{stockItemId,photoStorageKey,status:"PENDING"}});return job.id}
export async function POST(req:Request){
  await requireAccess("materials");
  const body=await req.json().catch(()=>({}));
  const barcode=cleanBarcode(body.barcode);
  if(!barcode)return NextResponse.json({error:"Barcode is required"},{status:400});
  const photoStorageKey=cleanPhotoStorageKey(body.photoStorageKey);
  cleanPhotoContentType(body.photoContentType);
  const found=await prisma.$queryRaw<Array<{id:string;name:string;unit:string;onHand:number;parLevel:number;supplier:string|null;barcode:string|null}>>`SELECT "id","name","unit","onHand","parLevel","supplier","barcode" FROM "StockItem" WHERE "barcode"=${barcode} LIMIT 1`;
  if(found[0]){
    const rows=await prisma.$queryRaw<any[]>`UPDATE "StockItem" SET "onHand"="onHand"+1 WHERE "id"=${found[0].id} RETURNING "id","name","unit","onHand","parLevel","supplier","barcode"`;
    const jobId=await createEnrichmentJob(rows[0].id,photoStorageKey);
    return NextResponse.json({status:"saved",action:"incremented",item:rows[0],jobId});
  }
  const name=String(body.name??barcode).trim().slice(0,160)||barcode,unit=String(body.unit??"each").trim().slice(0,40)||"each",supplier=String(body.supplier??"").trim().slice(0,100)||null,quantity=Math.max(1,Math.min(9999,Number(body.quantity)||1));
  const id=`cmat_${crypto.randomUUID().replace(/-/g,"")}`;
  try{
    const rows=await prisma.$queryRaw<any[]>`INSERT INTO "StockItem" ("id","name","unit","onHand","parLevel","supplier","barcode") VALUES (${id},${name},${unit},${quantity},0,${supplier},${barcode}) RETURNING "id","name","unit","onHand","parLevel","supplier","barcode"`;
    const jobId=await createEnrichmentJob(rows[0].id,photoStorageKey);
    return NextResponse.json({status:"saved",action:"created",item:rows[0],jobId},{status:201});
  }catch{
    const rows=await prisma.$queryRaw<any[]>`UPDATE "StockItem" SET "onHand"="onHand"+1 WHERE "barcode"=${barcode} RETURNING "id","name","unit","onHand","parLevel","supplier","barcode"`;
    if(rows[0]){
      const jobId=await createEnrichmentJob(rows[0].id,photoStorageKey);
      return NextResponse.json({status:"saved",action:"incremented",item:rows[0],jobId});
    }
    return NextResponse.json({error:"Could not save barcode"},{status:500});
  }
}
