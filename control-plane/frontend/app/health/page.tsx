"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  HelpCircle,
  Shield,
  Layers,
  Wrench,
} from "lucide-react";
import { healthApi } from "../../lib/api/health";
import { wazuhApi } from "../../lib/api/wazuh";
import { HealthCheckSummary, HealthCheckItem, WazuhDetailedHealth } from "../../lib/types/api";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { CardSkeleton } from "../../components/ui/LoadingSkeleton";
import { ErrorState } from "../../components/ui/ErrorState";
import { useToast } from "../../components/ui/Toast";
import { WazuhHealthCard } from "../../components/health/WazuhHealthCard";

export default function HealthPage() {
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [summary, setSummary] = useState<HealthCheckSummary | null>(null);
  const [wazuhHealth, setWazuhHealth] = useState<WazuhDetailedHealth | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  const loadHealthData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [res, wzRes] = await Promise.all([
        healthApi.getSummary(),
        wazuhApi.getDetailedHealth().catch(() => null),
      ]);
      setSummary(res);
      if (wzRes) setWazuhHealth(wzRes);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load health summary.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealthData();
  }, []);

  const handleRunHealthCheck = async () => {
    setIsChecking(true);
    try {
      const res = await healthApi.runCheck();
      setSummary(res.health);
      success("Health Diagnostics Complete", `Overall status: ${res.health.overall_status}`);
    } catch (err: any) {
      error("Health Check Failed", err.message);
    } finally {
      setIsChecking(false);
    }
  };

  if (loading && !summary) {
    return (
      <div className="space-y-6">
        <CardSkeleton className="h-32" />
        <CardSkeleton className="h-96" />
      </div>
    );
  }

  if (errorMsg && !summary) {
    return (
      <ErrorState
        title="Failed to Load Health Center"
        message={errorMsg}
        isOffline={true}
        onRetry={loadHealthData}
      />
    );
  }

  const checks = summary?.checks || [];
  const categories = ["ALL", ...Array.from(new Set(checks.map((c) => {
    if (c.component.startsWith("Node:")) return "COMPUTE";
    if (c.component.includes("AWS") || c.component.includes("Terraform")) return "INFRASTRUCTURE";
    return "SYSTEM";
  })))];

  const filteredChecks =
    filterCategory === "ALL"
      ? checks
      : checks.filter((c) => {
          let cat = "SYSTEM";
          if (c.component.startsWith("Node:")) cat = "COMPUTE";
          else if (c.component.includes("AWS") || c.component.includes("Terraform")) cat = "INFRASTRUCTURE";
          return cat === filterCategory;
        });

  const passCount = checks.filter((c) => c.status === "PASS").length;
  const warnCount = checks.filter((c) => c.status === "WARNING" || c.status === "DEGRADED").length;
  const failCount = checks.filter((c) => c.status === "FAIL").length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span>Comprehensive System Health & Service Diagnostics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time probing of AWS IAM, compute nodes, Wazuh cluster APIs, SIEM agents, and web applications.
          </p>
        </div>

        <button
          onClick={handleRunHealthCheck}
          disabled={isChecking}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-primary hover:bg-primary-hover text-xs font-semibold text-white transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? "animate-spin" : ""}`} />
          <span>{isChecking ? "Running Diagnostics..." : "Run Health Probes"}</span>
        </button>
      </div>

      {/* Summary Scoreboard */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded border border-border-subtle bg-card/60 space-y-1">
          <div className="text-xs text-slate-400">Overall Status</div>
          <div className="flex items-center gap-2 pt-1">
            <StatusBadge status={summary?.overall_status || "UNKNOWN"} />
          </div>
        </div>

        <div className="p-4 rounded border border-emerald-900/30 bg-emerald-950/20 space-y-1">
          <div className="text-xs text-emerald-400">Checks Passing</div>
          <div className="text-lg font-bold font-mono text-emerald-300">{passCount}</div>
        </div>

        <div className="p-4 rounded border border-amber-900/30 bg-amber-950/20 space-y-1">
          <div className="text-xs text-amber-400">Warnings / Degraded</div>
          <div className="text-lg font-bold font-mono text-amber-300">{warnCount}</div>
        </div>

        <div className="p-4 rounded border border-rose-900/30 bg-rose-950/20 space-y-1">
          <div className="text-xs text-rose-400">Failures / Offline</div>
          <div className="text-lg font-bold font-mono text-rose-300">{failCount}</div>
        </div>
      </div>

      {/* Wazuh SIEM Component Health & Credential Synchronization Card */}
      {wazuhHealth && (
        <WazuhHealthCard
          health={wazuhHealth}
          onRefresh={loadHealthData}
          isLoading={loading}
        />
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle pb-3">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              filterCategory === cat
                ? "bg-primary text-white font-semibold"
                : "bg-surface hover:bg-card text-slate-400 hover:text-slate-200 border border-border-subtle"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Diagnostic Checks List */}
      <div className="space-y-3">
        {filteredChecks.map((chk) => {
          let cat = "SYSTEM";
          if (chk.component.startsWith("Node:")) cat = "COMPUTE";
          else if (chk.component.includes("AWS") || chk.component.includes("Terraform")) cat = "INFRASTRUCTURE";
          
          return (
            <div
              key={chk.component}
              className="p-4 rounded border border-border-subtle bg-card/60 space-y-2 hover:border-border-default transition-colors shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-semibold text-slate-200">{chk.component}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-muted text-slate-400 border border-border-subtle">
                    {cat}
                  </span>
                </div>
                <StatusBadge status={chk.status} size="sm" />
              </div>

              <div className="text-xs text-slate-300 leading-relaxed font-mono text-[11px] bg-surface/80 p-2.5 rounded border border-border-subtle/50">
                {chk.message}
              </div>

              {chk.details && chk.status !== "PASS" && (
                <div className="text-xs text-amber-300/90 flex items-start gap-1.5 pt-1">
                  <Wrench className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Details:</strong> {chk.details}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
