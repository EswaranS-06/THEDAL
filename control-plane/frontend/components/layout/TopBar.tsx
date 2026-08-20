"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  RefreshCw,
  Search,
  Shield,
  Terminal,
  Menu,
  Bell,
  Sliders,
  ChevronDown,
  User,
  Activity,
  Server,
} from "lucide-react";
import { SystemStatus } from "../../lib/types/api";

interface TopBarProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
  activeOperation?: string | null;
  status?: string;
  systemStatus?: SystemStatus;
  onToggleSidebar?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onRefresh,
  isRefreshing = false,
  activeOperation,
  status = "HEALTHY",
  systemStatus,
  onToggleSidebar,
}) => {
  const pathname = usePathname();
  const router = useRouter();

  const isHealthy = status === "HEALTHY" || status === "PASS" || status === "OPERATIONAL";

  return (
    <header className="h-12 bg-surface border-b border-border-subtle flex items-center justify-between px-4 z-20 flex-shrink-0 select-none">
      {/* Left: Brand & Sidebar Toggle */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1 rounded hover:bg-panel text-text-muted hover:text-text-primary transition-colors"
            title="Toggle Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <div
          onClick={() => router.push("/")}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-5 h-5 rounded bg-primary/15 border border-primary/40 flex items-center justify-center text-primary font-bold">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <span className="font-mono text-xs font-bold tracking-wider text-text-primary group-hover:text-primary transition-colors">
            SOCFORGE
          </span>
        </div>

        <div className="h-4 w-px bg-border-subtle hidden sm:block mx-1" />

        {/* Environment Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-panel border border-border-subtle text-[11px] font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              isHealthy ? "bg-primary animate-pulse" : "bg-accent-yellow"
            }`}
          />
          <span className="text-text-secondary font-medium">Lab Environment:</span>
          <span className={isHealthy ? "text-primary font-bold" : "text-accent-yellow font-bold"}>
            {isHealthy ? "All Systems Online" : "Degraded / Starting"}
          </span>
        </div>

        {activeOperation && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-accent-yellow/10 border border-accent-yellow/30 text-accent-yellow text-[10px] font-mono animate-pulse">
            <Terminal className="w-3 h-3" />
            <span>Active Op: {activeOperation}</span>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Live Node Telemetry Chips */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-panel border border-border-subtle text-text-muted">
            <Server className="w-3 h-3 text-accent-blue" />
            <span>SIEM: <strong className="text-text-primary">10.10.10.33</strong></span>
          </div>
        </div>

        {/* Global Search */}
        <button
          onClick={() => router.push("/learning")}
          className="flex items-center gap-2 px-2.5 py-1 rounded bg-panel hover:bg-panel-hover border border-border-subtle text-text-muted hover:text-text-primary text-[11px] transition-colors"
          title="Search curriculum and techniques"
        >
          <Search className="w-3 h-3" />
          <span className="hidden md:inline">Search...</span>
          <kbd className="hidden sm:inline font-mono text-[9px] bg-surface px-1 py-0.5 rounded border border-border-subtle text-text-muted">
            /
          </kbd>
        </button>

        {/* Refresh Action */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded bg-panel hover:bg-panel-hover border border-border-subtle text-text-muted hover:text-text-primary text-xs transition-colors disabled:opacity-50"
            title="Refresh Environment Telemetry"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`}
            />
          </button>
        )}

        <div className="h-4 w-px bg-border-subtle hidden sm:block" />

        {/* Analyst Profile Pill */}
        <div className="flex items-center gap-2 px-2 py-1 rounded bg-panel border border-border-subtle text-[11px]">
          <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[9px]">
            R
          </div>
          <span className="font-medium text-text-primary hidden sm:inline">
            Analyst Rex
          </span>
          <span className="text-[9px] font-mono text-primary px-1 py-0.2 rounded bg-primary/10 border border-primary/20">
            Lvl 1
          </span>
        </div>
      </div>
    </header>
  );
};
