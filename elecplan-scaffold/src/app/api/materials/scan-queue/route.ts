import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const selectionSchema=z.object({left:z.number().min(0),top:z.number().min(0),width:z.number().positive(),height:z.number().positive(),imageWidth:z.number().positive(),imageHeight:z.number().positive()}).optional();
const schema=z.object({barcode:z.string().min(1).max(64),dataUrl:z.string().startsWith("data:image/jpeg;base64,").max(1800000),selection:selectionSchema});
function cleanBarcode(v:string){return v.replace(/[^0-9A-Za-z-]/g,"").slice(0,64)}

export async function POST(req:Request){
  const user=await getSessionUser();
  if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const parsed=schema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid queued scan"},{status:400});
  const barcode=cleanBarcode(parsed.data.barcode);
  if(!barcode)return NextResponse.json({error:"Barcode is required"},{status:400});
  const key=parsed.data.dataUrl;

  let alias=await prisma.stockBarcode.findUnique({where:{barcode},include:{stockItem:true}});
  let item=alias?.stockItem||await prisma.stockItem.findUnique({where:{barcode}});
  if(!item){
    item=await prisma.stockItem.create({data:{name:barcode,unit:"each",onHand:0,parLevel:0,barcode,barcodes:{create:{barcode}}}});
  }else if(!alias){
    await prisma.stockBarcode.upsert({where:{barcode},create:{barcode,stockItemId:item.id},update:{stockItemId:item.id}});
  }

  const job=await prisma.$transaction(async tx=>{
    await tx.stockItem.update({where:{id:item!.id},data:{photoStorageKey:key,photoOriginalName:`scan-${Date.now()}.jpg`,photoContentType:"image/jpeg",photoSizeBytes:Math.floor(key.length*0.75)}});
    return tx.scanEnrichmentJob.create({data:{stockItemId:item!.id,photoStorageKey:key}});
  });

  await prisma.auditLog.create({data:{action:"STOCK_SCAN_QUEUED",entityType:"ScanEnrichmentJob",entityId:job.id,details:{barcode,selection:parsed.data.selection??null}}});
  return NextResponse.json({ok:true,queued:true,jobId:job.id,itemId:item.id,knownName:item.name!==barcode?item.name:null});
}
