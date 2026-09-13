"use client";
import type{ReactNode}from"react";import{usePathname}from"next/navigation";import EmpireDemoNav from"@/components/EmpireDemoNav";
export default function EmpireDemoShell({children}:{children:ReactNode}){const path=usePathname();const login=path==="/hq/demos/empire/login";if(login)return <div className="min-h-screen bg-[#080a0b] text-white">{children}</div>;return <div className="min-h-screen bg-[#0b0d0e] text-white"><EmpireDemoNav/><div className="lg:pl-[244px]">{children}</div></div>}
