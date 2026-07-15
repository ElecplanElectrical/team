"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import { COLORS } from "@/lib/theme";
import { SCREEN_PATH } from "@/lib/access";
import { mobileNavFor } from "@/lib/nav";

export default function MobileNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = mobileNavFor(role);

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-stretch"
      style={{
        background: "rgba(7,9,12,0.95)",
        borderTop: `1px solid ${COLORS.borderSoft}`,
        paddingBottom: 6,
        backdropFilter: "blur(8px)",
      }}
    >
      {items.map((item) => {
        const href = SCREEN_PATH[item.screen];
        const active = pathname === href || pathname.startsWith(href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.screen}
            href={href}
            className="flex-1 flex flex-col items-center gap-1 py-2"
            style={{ color: active ? COLORS.accent : COLORS.textFaint }}
          >
            <Icon size={20} strokeWidth={active ? 2.4 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
