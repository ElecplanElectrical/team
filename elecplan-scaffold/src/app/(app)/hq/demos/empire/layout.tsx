import type{ReactNode}from"react";import EmpireDemoNav from"@/components/EmpireDemoNav";
export default function EmpireDemoLayout({children}:{children:ReactNode}){return <div className="min-h-screen bg-[#0b0d0e] text-white"><EmpireDemoNav/><div className="lg:pl-[230px]">{children}</div></div>}
