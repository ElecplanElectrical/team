import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

const schema=z.object({name:z.string().trim().min(1).max(120),category:z.string().trim().min(1).max(60).default("Other"),amount:z.number().positive().max(10000000),frequency:z.enum(["WEEKLY","FORTNIGHTLY","MONTHLY","QUARTERLY","YEARLY"]),nextDue:z.iso.date(),notes:z.string().max(2000).optional().nullable()});
function safeDate(iso:string){const d=new Date(iso+"T00:00:00.000Z");return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===iso?d:null;}
async function admin(){const u=await getSessionUser();return u?.role==="ADMIN";}
export async function GET(){if(!await admin())return NextResponse.json({error:"Forbidden"},{status:403});const rows=await prisma.recurringExpense.findMany({orderBy:[{active:"desc"},{nextDue:"asc"}],include:{payments:{orderBy:{dueDate:"desc"},take:12}}});return NextResponse.json(rows.map(r=>({...r,amount:Number(r.amount),payments:r.payments.map(p=>({...p,amount:Number(p.amount)}))})));}
export async function POST(req:Request){if(!await admin())return NextResponse.json({error:"Forbidden"},{status:403});const parsed=schema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Check the bill details."},{status:400});const d=parsed.data;const nextDue=safeDate(d.nextDue);if(!nextDue)return NextResponse.json({error:"Invalid due date."},{status:400});const row=await prisma.recurringExpense.create({data:{...d,nextDue,notes:d.notes||null}});return NextResponse.json({id:row.id},{status:201});}