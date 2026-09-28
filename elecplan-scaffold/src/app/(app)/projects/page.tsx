import { prisma } from "@/lib/prisma";
import { requireAccess } from "@/lib/session";
import { storageConfigured } from "@/lib/storage";
import ProjectsView from "@/components/ProjectsView";

export default async function ProjectsPage() {
  const user = await requireAccess("projects");
  const [projects, completedJobs] = await Promise.all([
    prisma.project.findMany({
      orderBy: [{ completedAt:"desc" },{ createdAt:"desc" }],
      include: {
        job:{select:{title:true,address:true,client:{select:{name:true}}}},
        photos:{orderBy:{createdAt:"desc"}},
        documents:{orderBy:{createdAt:"desc"}},
      },
    }),
    prisma.job.findMany({
      where:{status:{in:["COMPLETE","INVOICED"]},pastProject:null},
      orderBy:{scheduledEnd:"desc"},
      select:{id:true,title:true,address:true,scheduledEnd:true,client:{select:{name:true}}},
    }),
  ]);
  return <ProjectsView
    projects={projects.map(project=>({
      id:project.id,name:project.name,description:project.description??"",address:project.address??project.job?.address??"",
      client:project.job?.client.name??"",completedAt:(project.completedAt??project.createdAt).toISOString(),
      photos:project.photos.map(photo=>({id:photo.id,url:photo.url,createdAt:photo.createdAt.toISOString()})),
      documents:project.documents.map(document=>({id:document.id,name:document.name,url:document.url,mimeType:document.mimeType??"",createdAt:document.createdAt.toISOString()})),
    }))}
    completedJobs={completedJobs.map(job=>({id:job.id,title:job.title,address:job.address,client:job.client.name,completedAt:job.scheduledEnd?.toISOString()??null}))}
    canManage={user.role!=="EMPLOYEE"} storageReady={storageConfigured()} canConfigureStorage={user.role==="ADMIN"}
  />;
}
