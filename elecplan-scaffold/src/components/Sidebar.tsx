"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import type { Role } from "@prisma/client";
import { COLORS, FONTS } from "@/lib/theme";
import { SCREEN_PATH } from "@/lib/access";
import { navGroupsFor, ROLE_TITLE, initialsOf } from "@/lib/nav";
import { LOGO_WORDMARK } from "@/lib/logo";

export default function Sidebar({
  role,
  name,
}: {
  role: Role;
  name: string;
}) {
  const pathname = usePathname();
  const groups = navGroupsFor(role);

  return (
    <aside
      className="hidden md:flex shrink-0 flex-col py-5 px-3"
      style={{
        width: 188,
        background: COLORS.sidebar,
        borderRight: `1px solid ${COLORS.borderSoft}`,
      }}
    >
      {/* Wordmark */}
      <div className="px-2 mb-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={LOGO_WORDMARK}
          alt="elecplan"
          style={{
            width: "100%",
            height: "auto",
            objectFit: "contain",
            display: "block",
          }}
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto flex flex-col gap-4">
        {groups.map((group, gi) => (
          <div key={group.heading ?? gi} className="flex flex-col gap-0.5">
            {group.heading && (
              <p
                className="text-xs font-semibold tracking-wider px-2.5 mb-1"
                style={{ color: COLORS.textFaint }}
              >
                {group.heading.toUpperCase()}
              </p>
            )}
            {group.items.map((item) => {
              const href = SCREEN_PATH[item.screen];
              const active =
                pathname === href || pathname.startsWith(href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.screen}
                  href={href}
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium"
                  style={{
                    background: active ? COLORS.accentDim : "transparent",
                    color: active ? COLORS.accent : COLORS.textMute,
                  }}
                >
                  <Icon size={16} strokeWidth={active ? 2.4 : 2} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Identity + logout */}
      <div
        className="mt-4 pt-3"
        style={{ borderTop: `1px solid ${COLORS.borderSoft}` }}
      >
        <div className="flex items-center gap-2 px-2.5 py-1.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
            style={{
              background: "#1A2530",
              border: `1px solid ${COLORS.accentGlow}`,
            }}
          >
            {initialsOf(name)}
          </div>
          <div className="leading-tight flex-1 min-w-0">
            <p
              className="text-white text-xs font-medium truncate"
              style={{ fontFamily: FONTS.body }}
            >
              {name}
            </p>
            <p className="text-xs truncate" style={{ color: COLORS.textFaint }}>
              {ROLE_TITLE[role]}
            </p>
          </div>
          <button
            type="button"
            aria-label="Sign out"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-1 rounded hover:opacity-80"
            style={{ color: COLORS.textFaint }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
