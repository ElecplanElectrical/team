import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/lib/session";

const schema=z.object({userId:z.string().cuid(),title:z.string().trim().min(1).max(120),target:z.string().trim().min(1).max(120),notes:z.string().trim().max(1000).optional().nullable()});
export async function POST(req:Request){await requireAccess("kpis");const parsed=schema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Enter an employee, KPI and target."},{status:400});const kpi=await prisma.employeeKpi.create({data:{...parsed.data,notes:parsed.data.notes||null}});return NextResponse.json(kpi,{status:201});}
export async function PATCH(req:Request){await requireAccess("kpis");const body=await req.json().catch(()=>null);const id=typeof body?.id==="string"?body.id:"";if(!id)return NextResponse.json({error:"KPI required"},{status:400});const kpi=await prisma.employeeKpi.update({where:{id},data:{active:Boolean(body.active)}});return NextResponse.json(kpi);}
