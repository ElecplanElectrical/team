"use client";

import type { Role } from "@prisma/client";
import CarbonNavigation from "@/components/CarbonNavigation";

export default function Sidebar({ role, name }: { role: Role; name: string }) {
  return <aside className="ep-carbon-sidebar" data-elecplan-theme="recessed-carbon-10">
    <CarbonNavigation role={role} name={name} />
  </aside>;
}
