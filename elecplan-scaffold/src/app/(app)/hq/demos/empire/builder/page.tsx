import{notFound}from"next/navigation";
import{prisma}from"@/lib/prisma";
import{getPlatformAdmin}from"@/lib/platform-admin";
import EmpirePortalBuilder from"@/components/EmpirePortalBuilder";
import{DEFAULT_EMPIRE_BUILDER_CONFIG,normaliseEmpireBuilderConfig}from"@/lib/empire-builder";

export default async function EmpireBuilderPage(){
 const admin=await getPlatformAdmin();if(!admin)notFound();
 const row=await prisma.auditLog.findFirst({
  where:{entityType:"DemoPortal",entityId:"empire",action:{in:["DEMO_PORTAL_CONFIG_SAVED","DEMO_PORTAL_CONFIG_PUBLISHED"]}},
  orderBy:{createdAt:"desc"},
  select:{details:true}
 });
 const details=row?.details as{config?:unknown}|undefined;
 const config=details?.config?normaliseEmpireBuilderConfig(details.config):DEFAULT_EMPIRE_BUILDER_CONFIG;
 return <EmpirePortalBuilder initial={config}/>;
}
