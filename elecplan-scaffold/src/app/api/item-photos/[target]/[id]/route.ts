import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { createDownloadUrl } from "@/lib/storage";
export async function GET(_req:Request,ctx:{params:Promise<{target:string;id:string}>}){const user=await getSessionUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});const{target,id}=await ctx.params;let key:string|null=null;if(target==="equipment")key=(await prisma.equipment.findUnique({where:{id},select:{photoStorageKey:true}}))?.photoStorageKey??null;else if(target==="material")key=(await prisma.stockItem.findUnique({where:{id},select:{photoStorageKey:true}}))?.photoStorageKey??null;else return NextResponse.json({error:"Not found"},{status:404});if(!key)return NextResponse.json({error:"No photo"},{status:404});return NextResponse.redirect(createDownloadUrl(key),302);}
