"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Server,
  Terminal,
  GraduationCap,
  Activity,
  ScrollText,
  Settings,
  Shield,
  ExternalLink,
} from "lucide-react";
import { StatusIndicator } from "../ui/StatusIndicator";

interface SidebarProps {
  systemStatus?: {
    aws_region: string;
    environment_health: string;
    aws_connected: boolean;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({ systemStatus }) => {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/infrastructure", label: "Infrastructure", icon: Server },
    { href: "/operations", label: "Operations", icon: Terminal },
    { href: "/learning", label: "Learning", icon: GraduationCap },
    { href: "/health", label: "Health", icon: Activity },
    { href: "/logs", label: "Logs", icon: ScrollText },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const isActive = (item: typeof navItems[0]) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <aside className="w-64 bg-surface border-r border-border-subtle flex flex-col h-screen select-none flex-shrink-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-xs">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold tracking-tight text-slate-100 uppercase">
              THEDAL
            </div>
            <div className="text-[10px] text-slate-400">Control Plane</div>
          </div>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-slate-400 border border-border-subtle">
          v1.0.0
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-3 mb-2">
          Management
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition-all ${
                active
                  ? "bg-primary/15 text-primary border border-primary/30 font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-card/60"
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? "text-primary" : "text-slate-400"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Environment Widget */}
      <div className="p-3.5 border-t border-border-subtle bg-card/30">
        <div className="p-2.5 rounded bg-surface border border-border-subtle space-y-2 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Environment</span>
            <StatusIndicator
              status={systemStatus?.environment_health || "UNKNOWN"}
              label={systemStatus?.environment_health || "UNKNOWN"}
            />
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-slate-500">Region</span>
            <span className="font-mono text-slate-300">
              {systemStatus?.aws_region || "ap-south-1"}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-slate-500">AWS</span>
            <span className={systemStatus?.aws_connected ? "text-emerald-400" : "text-rose-400"}>
              {systemStatus?.aws_connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
