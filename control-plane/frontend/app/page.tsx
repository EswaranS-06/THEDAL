"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Server,
  Terminal,
  Activity,
  Play,
  Square,
  Shield,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  Layers,
  GraduationCap,
  Radio,
  FileCheck,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { operationsApi } from "../lib/api/operations";
import { awsApi } from "../lib/api/aws";
import { healthApi } from "../lib/api/health";
import { learningApi } from "../lib/api/learning";
import {
  SystemStatus,
  EC2InstanceInfo,
  HealthCheckSummary,
  OperationLogMeta,
  CurriculumStats,
} from "../lib/types/api";
import { StatusBadge } from "../components/ui/StatusBadge";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { CardSkeleton } from "../components/ui/LoadingSkeleton";
import { ErrorState } from "../components/ui/ErrorState";
import { useToast } from "../components/ui/Toast";

export default function OverviewPage() {
  const router = useRouter();
  const { success, error, info } = useToast();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [instances, setInstances] = useState<EC2InstanceInfo[]>([]);
  const [healthSummary, setHealthSummary] = useState<HealthCheckSummary | null>(null);
  const [recentLogs, setRecentLogs] = useState<OperationLogMeta[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumStats | null>(null);
  const [isStartingTunnel, setIsStartingTunnel] = useState(false);

  // Dialog state
  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    description: "",
    action: async () => {},
  });
  const [isExecuting, setIsExecuting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const [statusRes, resRes, healthRes, opsRes, learnRes] = await Promise.all([
        operationsApi.getSystemStatus().catch(() => null),
        awsApi.getResources().catch(() => ({ instances: [], network: null })),
        healthApi.getSummary().catch(() => null),
        operationsApi.listOperations().catch(() => ({ active_operation: null, logs: [] })),
        learningApi.getStats().catch(() => null),
      ]);

      if (statusRes) setStatus(statusRes);
      if (resRes?.instances) setInstances(resRes.instances);
      if (healthRes) setHealthSummary(healthRes);
      if (opsRes?.logs) setRecentLogs(opsRes.logs.slice(0, 5));
      if (learnRes) setCurriculum(learnRes);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load overview data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartCompute = () => {
    setActionDialog({
      isOpen: true,
      title: "Start EC2 Compute Fleet",
      description: "Start all stopped THEDAL EC2 virtual machines via the AWS API.",
      action: async () => {
        try {
          setIsExecuting(true);
          await awsApi.startInstances();
          success("Compute Fleet Starting", "AWS EC2 start request dispatched.");
          loadData();
        } catch (err: any) {
          error("Start Failed", err.message);
        } finally {
          setIsExecuting(false);
          setActionDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleStartTunnel = async () => {
    try {
      setIsStartingTunnel(true);
      const res = await operationsApi.startWazuhTunnel();
      success("Wazuh Tunnel Active", "SSH port forward established on 127.0.0.1:8443");
      window.open("https://127.0.0.1:8443", "_blank");
    } catch (err: any) {
      error("Tunnel Error", err.message || "Failed to establish tunnel.");
    } finally {
      setIsStartingTunnel(false);
    }
  };

  const runningCount = instances.filter((i) => i.state === "running").length;
  const stoppedCount = instances.length - runningCount;

  if (loading && !status) {
    return (
      <div className="space-y-4">
        <CardSkeleton className="h-16" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <CardSkeleton className="h-20" />
          <CardSkeleton className="h-20" />
          <CardSkeleton className="h-20" />
          <CardSkeleton className="h-20" />
        </div>
        <CardSkeleton className="h-64" />
      </div>
    );
  }

  if (errorMsg && !status) {
    return (
      <ErrorState
        title="Failed to Load Dashboard"
        message={errorMsg}
        onRetry={loadData}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Top Section: SOCForge Environment Header & Status */}
      <div className="p-3.5 rounded-md bg-panel border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary/12 border border-primary/40 flex items-center justify-center text-primary font-bold">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold font-mono text-text-primary tracking-wide">
                SOCFORGE ENVIRONMENT
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface text-primary border border-border-subtle">
                ● Operational
              </span>
            </div>
            <p className="text-[11px] text-text-secondary">
              Cybersecurity Cyber Range & Threat Investigation Control Console
            </p>
          </div>
        </div>

        {/* Quick Operational Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {stoppedCount > 0 && (
            <button
              onClick={handleStartCompute}
              className="soc-btn-primary flex items-center gap-1.5"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Start Lab Fleet</span>
            </button>
          )}

          <button
            onClick={handleStartTunnel}
            disabled={isStartingTunnel}
            className="soc-btn-secondary flex items-center gap-1.5"
          >
            <ExternalLink className="w-3 h-3 text-primary" />
            <span>{isStartingTunnel ? "Connecting..." : "Open Wazuh SIEM"}</span>
          </button>

          <Link
            href="/infrastructure/commands"
            className="soc-btn-secondary flex items-center gap-1.5"
          >
            <Terminal className="w-3 h-3 text-accent-blue" />
            <span>Dynamic Commands</span>
          </Link>

          <Link
            href="/health"
            className="soc-btn-secondary flex items-center gap-1.5"
          >
            <Activity className="w-3 h-3 text-accent-yellow" />
            <span>Health Check</span>
          </Link>
        </div>
      </div>

      {/* 2. 4 Compact Metric Chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
        <div className="p-3 rounded-md bg-panel border border-border-subtle space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-text-muted uppercase">
            <span>AWS COMPUTE</span>
            <Server className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-base font-bold font-mono text-text-primary">
            {runningCount} <span className="text-xs font-normal text-text-muted">Running</span>
            {stoppedCount > 0 && (
              <span className="text-xs font-normal text-accent-yellow ml-2">/ {stoppedCount} Stopped</span>
            )}
          </div>
        </div>

        <div className="p-3 rounded-md bg-panel border border-border-subtle space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-text-muted uppercase">
            <span>WAZUH SIEM</span>
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-base font-bold font-mono text-primary flex items-center gap-1.5">
            <span>Healthy</span>
            <span className="text-[10px] text-text-muted font-normal font-mono">• 10.10.10.33</span>
          </div>
        </div>

        <div className="p-3 rounded-md bg-panel border border-border-subtle space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-text-muted uppercase">
            <span>TELEMETRY INGEST</span>
            <Radio className="w-3.5 h-3.5 text-accent-blue" />
          </div>
          <div className="text-base font-bold font-mono text-accent-blue flex items-center gap-1.5">
            <span>Active</span>
            <span className="text-[10px] text-text-muted font-normal font-mono">• 4 Agents</span>
          </div>
        </div>

        <div className="p-3 rounded-md bg-panel border border-border-subtle space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-text-muted uppercase">
            <span>LEARNING PROGRESS</span>
            <GraduationCap className="w-3.5 h-3.5 text-accent-yellow" />
          </div>
          <div className="text-base font-bold font-mono text-text-primary flex items-center gap-1.5">
            <span>{curriculum?.completed || 0} / 14</span>
            <span className="text-[10px] text-primary font-normal font-mono">
              ({curriculum?.percent_completed || 0}%)
            </span>
          </div>
        </div>
      </div>

      {/* 3. System Fleet Health Overview (Compact Rows) */}
      <div className="rounded-md bg-panel border border-border-subtle overflow-hidden">
        <div className="p-3 border-b border-border-subtle flex items-center justify-between bg-surface/50">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-primary" />
            <h3 className="text-xs font-bold font-mono text-text-primary uppercase tracking-wider">
              System Fleet Health Overview
            </h3>
          </div>
          <Link
            href="/infrastructure"
            className="text-[11px] font-mono text-primary hover:underline flex items-center gap-1"
          >
            <span>Full Inventory</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="divide-y divide-border-subtle/60 text-xs">
          {instances.length === 0 ? (
            <div className="p-6 text-center text-text-muted text-xs">
              No EC2 nodes discovered. Run Terraform Apply or refresh status.
            </div>
          ) : (
            instances.map((inst) => {
              const isRunning = inst.state === "running";
              return (
                <div
                  key={inst.instance_id}
                  className="p-2.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-surface/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isRunning ? "bg-primary" : "bg-accent-red"
                      }`}
                    />
                    <div>
                      <Link
                        href={`/infrastructure/${inst.role.toLowerCase() || "bastion"}`}
                        className="font-mono text-xs font-bold text-text-primary hover:text-primary transition-colors"
                      >
                        {inst.name}
                      </Link>
                      <div className="text-[10px] text-text-muted font-mono">{inst.role}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] font-mono">
                    <div>
                      <span className="text-text-muted">Private: </span>
                      <span className="text-text-primary">{inst.private_ip}</span>
                    </div>

                    {inst.public_ip && (
                      <div>
                        <span className="text-text-muted">Public: </span>
                        <span className="text-accent-blue">{inst.public_ip}</span>
                      </div>
                    )}

                    <StatusBadge status={inst.state.toUpperCase()} size="sm" />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/infrastructure/${inst.role.toLowerCase() || "bastion"}`}
                      className="px-2 py-0.5 rounded bg-surface hover:bg-panel border border-border-subtle text-text-secondary hover:text-text-primary text-[10px] font-mono transition-colors"
                    >
                      Inspect
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. Bottom Grid: Learning Next Step & Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Next Recommended Investigation */}
        <div className="p-3.5 rounded-md bg-panel border border-border-subtle space-y-2.5 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-primary font-mono text-[10px] font-bold uppercase tracking-wider">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>NEXT INVESTIGATION</span>
              </div>
              <span className="text-[10px] font-mono text-text-muted">
                {curriculum?.next_lab?.level || "Level 1"}
              </span>
            </div>

            <h4 className="text-sm font-bold font-mono text-text-primary">
              {curriculum?.next_lab?.title || "Lab 03: PowerShell Telemetry & ScriptBlock Logging"}
            </h4>

            <p className="text-[11px] text-text-secondary leading-relaxed">
              Analyze in-memory ScriptBlock execution events (EID 4104) and evaluate execution policy bypass flags.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="font-mono text-[10px] text-text-muted">
              MITRE: <strong className="text-text-primary">{curriculum?.next_lab?.mitre || "T1059.001"}</strong>
            </span>
            <Link
              href={`/learning/labs/${curriculum?.next_lab?.id || "03-powershell-investigation"}`}
              className="soc-btn-primary inline-flex items-center gap-1 text-[11px]"
            >
              <span>Launch Workspace</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Recent Operations & Audit Logs */}
        <div className="p-3.5 rounded-md bg-panel border border-border-subtle space-y-2.5 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-accent-blue font-mono text-[10px] font-bold uppercase tracking-wider">
                <FileCheck className="w-3.5 h-3.5" />
                <span>RECENT AUDIT LOGS</span>
              </div>
              <Link
                href="/logs"
                className="text-[10px] font-mono text-primary hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="space-y-1 font-mono text-[11px]">
              {recentLogs.length === 0 ? (
                <div className="text-text-muted italic py-2">No recent operation logs found.</div>
              ) : (
                recentLogs.slice(0, 3).map((log) => (
                  <div
                    key={log.filename}
                    className="flex items-center justify-between p-1.5 rounded bg-surface/70 border border-border-subtle/50"
                  >
                    <span className="truncate max-w-[200px] text-text-primary">{log.action || log.filename}</span>
                    <span className="text-[10px] text-text-muted shrink-0">{log.timestamp ? log.timestamp.substring(11, 19) : ""}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-[10px] font-mono text-text-muted">
            <span>Security audit trail active</span>
            <Link href="/operations" className="text-text-secondary hover:text-text-primary">
              Operations Center →
            </Link>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={actionDialog.isOpen}
        title={actionDialog.title}
        description={actionDialog.description}
        isLoading={isExecuting}
        onConfirm={actionDialog.action}
        onCancel={() => setActionDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
