"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { RefreshCw, Search, ShieldCheck, Terminal } from "lucide-react";
import { StatusBadge } from "../ui/StatusBadge";

interface TopBarProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
  activeOperation?: string | null;
  status?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  onRefresh,
  isRefreshing = false,
  activeOperation,
  status = "PASS",
}) => {
  const pathname = usePathname();
  const router = useRouter();

  const getPageTitle = () => {
    if (pathname === "/") return "Environment Overview";
    if (pathname === "/infrastructure") return "Cloud Fleet & Topology";
    if (pathname.startsWith("/infrastructure/commands")) return "Dynamic Command Center";
    if (pathname.startsWith("/infrastructure/")) return "Host Telemetry & Services";
    if (pathname === "/operations") return "Operations Control Center";
    if (pathname.startsWith("/operations/")) return "Operation Log Stream";
    if (pathname === "/learning") return "SOC Learning Portal";
    if (pathname.startsWith("/learning/challenges")) return "Mystery Investigation Challenges";
    if (pathname.startsWith("/learning/labs/")) return "Lab Investigation Workspace";
    if (pathname === "/health") return "Comprehensive Health Diagnostics";
    if (pathname === "/logs") return "Operational Audit Logs";
    if (pathname === "/settings") return "Configuration & Credentials";
    return "Control Plane";
  };

  return (
    <header className="h-14 bg-surface border-b border-border-subtle flex items-center justify-between px-6 z-20 flex-shrink-0">
      {/* Contextual Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-sm font-semibold text-slate-100 tracking-tight">
          {getPageTitle()}
        </h1>
        {activeOperation && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-950/40 border border-amber-600/40 text-amber-300 text-[11px] font-mono animate-pulse">
            <Terminal className="w-3 h-3 text-amber-400" />
            <span>Operation Active: {activeOperation}</span>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Global Search Shortcut */}
        <button
          onClick={() => router.push("/learning")}
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-card hover:bg-card-hover border border-border-subtle text-slate-400 text-xs transition-colors"
          title="Search labs, runbooks, and techniques"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="text-slate-400">Search curriculum...</span>
          <kbd className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border-default text-slate-400">
            /
          </kbd>
        </button>

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-card hover:bg-card-hover border border-border-subtle text-slate-300 text-xs font-medium transition-colors"
            title="Refresh current view telemetry"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`}
            />
            <span>Refresh</span>
          </button>
        )}
      </div>
    </header>
  );
};
