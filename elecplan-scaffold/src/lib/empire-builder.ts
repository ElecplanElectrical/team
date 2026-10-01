export type EmpireBuilderPage={id:string;label:string;slug:string;group:string;enabled:boolean;kind:"system"|"custom"};
export type EmpireBuilderModule={id:string;label:string;enabled:boolean};
export type EmpireBuilderRole={id:string;label:string;view:string[];edit:string[]};
export type EmpireBuilderConfig={
  version:number;
  portalName:string;
  portalSubtitle:string;
  theme:{accent:string;background:string;panel:string;border:string};
  pages:EmpireBuilderPage[];
  modules:EmpireBuilderModule[];
  roles:EmpireBuilderRole[];
  updatedAt?:string;
  publishedAt?:string|null;
};
export const EMPIRE_SYSTEM_PAGES:EmpireBuilderPage[]=[
{id:"dashboard",label:"Dashboard",slug:"",group:"Race HQ",enabled:true,kind:"system"},
{id:"overview",label:"Operations Overview",slug:"overview",group:"Race HQ",enabled:true,kind:"system"},
{id:"calendar",label:"Calendar",slug:"calendar",group:"Race HQ",enabled:true,kind:"system"},
{id:"weekend",label:"Race Weekend",slug:"weekend",group:"Race HQ",enabled:true,kind:"system"},
{id:"riders",label:"Riders",slug:"riders",group:"Performance",enabled:true,kind:"system"},
{id:"timings",label:"Race Timings",slug:"timings",group:"Performance",enabled:true,kind:"system"},
{id:"notes",label:"Race Notes",slug:"notes",group:"Performance",enabled:true,kind:"system"},
{id:"setup",label:"Bike Setup",slug:"setup",group:"Performance",enabled:true,kind:"system"},
{id:"workshop",label:"Workshop",slug:"workshop",group:"Workshop",enabled:true,kind:"system"},
{id:"parts",label:"Parts & Inventory",slug:"parts",group:"Workshop",enabled:true,kind:"system"},
{id:"equipment",label:"Equipment",slug:"equipment",group:"Workshop",enabled:true,kind:"system"},
{id:"team",label:"Team",slug:"team",group:"Team",enabled:true,kind:"system"},
{id:"chat",label:"Team Chat",slug:"chat",group:"Team",enabled:true,kind:"system"},
{id:"documents",label:"Documents",slug:"documents",group:"Team",enabled:true,kind:"system"}
];
export const DEFAULT_EMPIRE_BUILDER_CONFIG:EmpireBuilderConfig={
version:1,
portalName:"Empire HQ",
portalSubtitle:"Penrite Racing Empire Kawasaki",
theme:{accent:"#69be28",background:"#0b0d0e",panel:"#111416",border:"#2a3033"},
pages:EMPIRE_SYSTEM_PAGES,
modules:[
{id:"race-ops",label:"Race operations",enabled:true},
{id:"riders",label:"Riders & profiles",enabled:true},
{id:"timings",label:"Race timings",enabled:true},
{id:"bike-setup",label:"Bike setup",enabled:true},
{id:"workshop",label:"Workshop",enabled:true},
{id:"parts",label:"Parts & inventory",enabled:true},
{id:"equipment",label:"Equipment",enabled:true},
{id:"documents",label:"Documents",enabled:true},
{id:"team-chat",label:"Team chat",enabled:true}
],
roles:[
{id:"admin",label:"Team Admin",view:EMPIRE_SYSTEM_PAGES.map(p=>p.id),edit:EMPIRE_SYSTEM_PAGES.map(p=>p.id)},
{id:"crew",label:"Race Crew",view:EMPIRE_SYSTEM_PAGES.map(p=>p.id),edit:["calendar","weekend","riders","timings","notes","setup","workshop","parts","equipment","chat"]},
{id:"rider",label:"Rider",view:["dashboard","calendar","weekend","riders","timings","notes","setup","chat","documents"],edit:["notes","setup","chat"]}
],
publishedAt:null
};
export function normaliseEmpireBuilderConfig(value:unknown):EmpireBuilderConfig{
 if(!value||typeof value!=="object")return DEFAULT_EMPIRE_BUILDER_CONFIG;
 const v=value as Partial<EmpireBuilderConfig>;
 return {
  ...DEFAULT_EMPIRE_BUILDER_CONFIG,
  ...v,
  theme:{...DEFAULT_EMPIRE_BUILDER_CONFIG.theme,...(v.theme||{})},
  pages:Array.isArray(v.pages)?v.pages:DEFAULT_EMPIRE_BUILDER_CONFIG.pages,
  modules:Array.isArray(v.modules)?v.modules:DEFAULT_EMPIRE_BUILDER_CONFIG.modules,
  roles:Array.isArray(v.roles)?v.roles:DEFAULT_EMPIRE_BUILDER_CONFIG.roles
 };
}
