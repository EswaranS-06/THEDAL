"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Server,
  Terminal,
  GraduationCap,
  ScrollText,
  Settings,
  HelpCircle,
  Code2,
  FileCheck2,
  Sparkles,
  Award,
  BookOpen,
} from "lucide-react";
import { SystemStatus } from "../../lib/types/api";

interface SidebarProps {
  systemStatus?: SystemStatus;
}

export const Sidebar: React.FC<SidebarProps> = ({ systemStatus }) => {
  const pathname = usePathname();

  const isRouteActive = (href: string, exact: boolean = false) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navSections = [
    {
      label: "OPERATIONS",
      items: [
        { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
        { href: "/infrastructure", label: "AWS Resources", icon: Server },
        { href: "/operations", label: "Operations", icon: Terminal },
        { href: "/logs", label: "Logs", icon: ScrollText },
      ],
    },
    {
      label: "LEARNING",
      items: [
        { href: "/learning", label: "Curriculum", icon: GraduationCap, exact: true },
        { href: "/learning?tab=all", label: "All Labs (14)", icon: BookOpen },
        { href: "/learning/challenges", label: "Mystery Challenges", icon: Sparkles },
        { href: "/learning?tab=progress", label: "My Progress", icon: Award },
      ],
    },
    {
      label: "TOOLS & SYSTEM",
      items: [
        { href: "/infrastructure/commands", label: "Dynamic Commands", icon: Code2 },
        { href: "/health", label: "System Health", icon: FileCheck2 },
        { href: "/settings", label: "Settings", icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-52 bg-surface border-r border-border-subtle flex flex-col h-full select-none flex-shrink-0 text-xs">
      {/* Navigation Sections */}
      <nav className="flex-1 px-2.5 py-3 space-y-4 overflow-y-auto scrollbar-thin">
        {navSections.map((section) => (
          <div key={section.label} className="space-y-1">
            <div className="text-[9px] font-bold font-mono tracking-widest text-text-muted px-2 py-0.5 uppercase">
              {section.label}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isRouteActive(item.href, item.exact);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded text-xs transition-all ${
                      active
                        ? "bg-primary/12 text-primary font-semibold border-l-2 border-primary"
                        : "text-text-secondary hover:text-text-primary hover:bg-panel"
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 ${
                        active ? "text-primary" : "text-text-muted"
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Live Environment Status Sub-panel */}
      <div className="p-2.5 border-t border-border-subtle bg-panel/60 space-y-2">
        <div className="text-[9px] font-bold font-mono tracking-wider text-text-muted uppercase px-1">
          ENVIRONMENT STATUS
        </div>

        <div className="space-y-1 font-mono text-[10px]">
          <div className="flex items-center justify-between px-1.5 py-1 rounded bg-surface/70 border border-border-subtle/50">
            <span className="text-text-secondary">Attack Host</span>
            <div className="flex items-center gap-1 text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Online</span>
            </div>
          </div>

          <div className="flex items-center justify-between px-1.5 py-1 rounded bg-surface/70 border border-border-subtle/50">
            <span className="text-text-secondary">Windows Host</span>
            <div className="flex items-center gap-1 text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Online</span>
            </div>
          </div>

          <div className="flex items-center justify-between px-1.5 py-1 rounded bg-surface/70 border border-border-subtle/50">
            <span className="text-text-secondary">Wazuh SIEM</span>
            <div className="flex items-center gap-1 text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Online</span>
            </div>
          </div>

          <div className="flex items-center justify-between px-1.5 py-1 rounded bg-surface/70 border border-border-subtle/50">
            <span className="text-text-secondary">Web Target</span>
            <div className="flex items-center gap-1 text-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>Online</span>
            </div>
          </div>
        </div>

        <Link
          href="/health"
          className="w-full flex items-center justify-center gap-1 py-1 rounded bg-surface hover:bg-panel text-text-muted hover:text-text-primary text-[10px] font-mono border border-border-subtle transition-colors"
        >
          <HelpCircle className="w-3 h-3" />
          <span>Health Diagnostics</span>
        </Link>
      </div>
    </aside>
  );
};
