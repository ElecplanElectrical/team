import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/lib/session";
import KpisView from "@/components/KpisView";
export default async function KpisPage(){await requireAccess("kpis");const[employees,kpis]=await Promise.all([prisma.user.findMany({where:{active:true},select:{id:true,name:true,role:true},orderBy:{name:"asc"}}),prisma.employeeKpi.findMany({orderBy:[{active:"desc"},{createdAt:"desc"}]})]);return <KpisView employees={employees} initialKpis={kpis.map(k=>({...k,createdAt:k.createdAt.toISOString(),updatedAt:k.updatedAt.toISOString()}))}/>;}
