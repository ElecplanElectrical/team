import { BRAND, DEFAULT_MODULES, type YourPlanModule } from "@/lib/brand";
export type BusinessPortalConfig = { id:string; name:string; slug:string; logoUrl?:string; primaryColor:string; accentColor:string; modules:YourPlanModule[]; active:boolean; industry?:string };
export const YOUR_PLAN_DEFAULT: BusinessPortalConfig = { id:"your-plan", name:BRAND.name, slug:"your-plan", primaryColor:BRAND.primary, accentColor:BRAND.accent, modules:[...DEFAULT_MODULES], active:true, industry:"Business Management" };
export function hasModule(config:BusinessPortalConfig,module:YourPlanModule){return config.active&&config.modules.includes(module)}
