import{NextResponse}from"next/server";
import{z}from"zod";
import{prisma}from"@/lib/prisma";
import{getPlatformAdmin}from"@/lib/platform-admin";
import{DEFAULT_EMPIRE_BUILDER_CONFIG,normaliseEmpireBuilderConfig}from"@/lib/empire-builder";

const pageSchema=z.object({id:z.string().min(1).max(80),label:z.string().trim().min(1).max(60),slug:z.string().regex(/^[a-z0-9-]*$/).max(60),group:z.string().trim().min(1).max(40),enabled:z.boolean(),kind:z.enum(["system","custom"])});
const moduleSchema=z.object({id:z.string().min(1).max(80),label:z.string().trim().min(1).max(80),enabled:z.boolean()});
const roleSchema=z.object({id:z.string().min(1).max(80),label:z.string().trim().min(1).max(80),view:z.array(z.string().max(80)),edit:z.array(z.string().max(80))});
const configSchema=z.object({
 version:z.number().int().min(1).max(10),
 portalName:z.string().trim().min(2).max(80),
 portalSubtitle:z.string().trim().max(120),
 theme:z.object({
  accent:z.string().regex(/^#[0-9a-fA-F]{6}$/),
  background:z.string().regex(/^#[0-9a-fA-F]{6}$/),
  panel:z.string().regex(/^#[0-9a-fA-F]{6}$/),
  border:z.string().regex(/^#[0-9a-fA-F]{6}$/)
 }),
 pages:z.array(pageSchema).min(1).max(40),
 modules:z.array(moduleSchema).max(40),
 roles:z.array(roleSchema).max(20),
 updatedAt:z.string().optional(),
 publishedAt:z.string().nullable().optional()
});
const bodySchema=z.object({config:configSchema,publish:z.boolean().optional()});

async function latest(){
 const row=await prisma.auditLog.findFirst({
  where:{entityType:"DemoPortal",entityId:"empire",action:{in:["DEMO_PORTAL_CONFIG_SAVED","DEMO_PORTAL_CONFIG_PUBLISHED"]}},
  orderBy:{createdAt:"desc"},
  select:{action:true,details:true,createdAt:true}
 });
 if(!row)return DEFAULT_EMPIRE_BUILDER_CONFIG;
 const details=row.details as{config?:unknown}|null;
 return normaliseEmpireBuilderConfig(details?.config);
}
export async function GET(){
 const admin=await getPlatformAdmin();
 if(!admin)return NextResponse.json({error:"Platform owner access required"},{status:403});
 return NextResponse.json({config:await latest()});
}
export async function PUT(req:Request){
 const admin=await getPlatformAdmin();
 if(!admin)return NextResponse.json({error:"Platform owner access required"},{status:403});
 const parsed=bodySchema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:"Invalid portal builder configuration"},{status:400});
 const now=new Date().toISOString();
 const config={...parsed.data.config,updatedAt:now,...(parsed.data.publish?{publishedAt:now}:{})};
 await prisma.auditLog.create({data:{
  actorId:admin.id,
  actorEmail:admin.email,
  action:parsed.data.publish?"DEMO_PORTAL_CONFIG_PUBLISHED":"DEMO_PORTAL_CONFIG_SAVED",
  entityType:"DemoPortal",
  entityId:"empire",
  details:{config}
 }});
 return NextResponse.json({ok:true,config});
}
