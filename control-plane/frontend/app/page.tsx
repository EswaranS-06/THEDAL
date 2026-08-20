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
  FileCode,
  Layers,
  GraduationCap,
} from "lucide-react";
import { operationsApi } from "../lib/api/operations";
import { awsApi } from "../lib/api/aws";
import { healthApi } from "../lib/api/health";
import { terraformApi } from "../lib/api/terraform";
import { learningApi } from "../lib/api/learning";
import {
  SystemStatus,
  EC2InstanceInfo,
  HealthCheckSummary,
  OperationLogMeta,
  CurriculumStats,
} from "../lib/types/api";
import { StatusBadge } from "../components/ui/StatusBadge";
import { StatusIndicator } from "../components/ui/StatusIndicator";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { LoadingSkeleton, CardSkeleton } from "../components/ui/LoadingSkeleton";
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

      // Fetch overview data in parallel
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
      description: "This will start all stopped THEDAL EC2 virtual machines via the AWS API.",
      action: async () => {
        setIsExecuting(true);
        try {
          const res = await awsApi.startInstances();
          success("EC2 Start Initiated", res.message || "Instances are transitioning to running.");
          setActionDialog((prev) => ({ ...prev, isOpen: false }));
          setTimeout(loadData, 3000);
        } catch (err: any) {
          error("Start Failed", err.message);
        } finally {
          setIsExecuting(false);
        }
      },
    });
  };

  const handleStopCompute = () => {
    setActionDialog({
      isOpen: true,
      title: "Stop EC2 Compute Fleet (Safe Pause)",
      description: "This will safely stop all running EC2 instances to halt compute charges. EBS storage and state are preserved.",
      action: async () => {
        setIsExecuting(true);
        try {
          const res = await awsApi.stopInstances();
          success("EC2 Stop Initiated", res.message || "Instances are transitioning to stopped.");
          setActionDialog((prev) => ({ ...prev, isOpen: false }));
          setTimeout(loadData, 3000);
        } catch (err: any) {
          error("Stop Failed", err.message);
        } finally {
          setIsExecuting(false);
        }
      },
    });
  };

  const handleQuickPlan = async () => {
    setIsExecuting(true);
    try {
      const res = await terraformApi.plan();
      success("Terraform Plan Finished", "View output in Operations Console.");
      if (res.log_file) {
        router.push(`/operations/${res.log_file}`);
      }
    } catch (err: any) {
      error("Plan Failed", err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleWazuhTunnel = async () => {
    try {
      const res = await operationsApi.startWazuhTunnel();
      if (res.success) {
        success("Wazuh Tunnel Active", "Forwarding localhost:8443 -> Wazuh Dashboard.");
        window.open("https://127.0.0.1:8443", "_blank");
      }
    } catch (err: any) {
      error("Tunnel Error", err.message);
    }
  };

  if (loading && !status) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <CardSkeleton className="h-64" />
      </div>
    );
  }

  if (errorMsg && !status) {
    return (
      <ErrorState
        title="Failed to Load Overview"
        message={errorMsg}
        isOffline={true}
        onRetry={loadData}
      />
    );
  }

  const runningCount = instances.filter((i) => i.state === "running").length;
  const totalCount = instances.length;

  return (
    <div className="space-y-6">
      {/* 1. Top Environment Status Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* AWS Status */}
        <div className="p-4 rounded border border-border-subtle bg-card/60">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>AWS Cloud</span>
            <span className="font-mono text-[11px] text-slate-500">{status?.aws_region}</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusIndicator
              status={status?.aws_connected ? "PASS" : "FAIL"}
              label={status?.aws_connected ? "Connected" : "Disconnected"}
            />
          </div>
        </div>

        {/* Terraform Status */}
        <div className="p-4 rounded border border-border-subtle bg-card/60">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Terraform State</span>
            <FileCode className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={status?.terraform_status || "UNKNOWN"} size="sm" />
          </div>
        </div>

        {/* Compute Fleet */}
        <div className="p-4 rounded border border-border-subtle bg-card/60">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Compute Fleet</span>
            <Server className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold font-mono text-slate-200">
              {runningCount} / {totalCount} Active
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {runningCount === totalCount && totalCount > 0 ? "100% Running" : "Partial / Stopped"}
            </span>
          </div>
        </div>

        {/* Overall Health */}
        <div className="p-4 rounded border border-border-subtle bg-card/60">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span>Environment Health</span>
            <Activity className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge
              status={healthSummary?.overall_status || status?.environment_health || "UNKNOWN"}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* 2. Quick Actions Bar */}
      <div className="p-4 rounded border border-border-subtle bg-surface/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Terminal className="w-4 h-4 text-primary" />
          <span>Quick Operator Controls</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleQuickPlan}
            disabled={isExecuting}
            className="px-3 py-1.5 rounded bg-muted hover:bg-slate-700 text-xs font-medium text-slate-200 border border-border-default transition-colors flex items-center gap-1.5"
          >
            <FileCode className="w-3.5 h-3.5 text-slate-400" />
            <span>Terraform Plan</span>
          </button>
          <button
            onClick={handleStartCompute}
            disabled={isExecuting}
            className="px-3 py-1.5 rounded bg-emerald-950/60 hover:bg-emerald-900/80 text-xs font-medium text-emerald-300 border border-emerald-800/40 transition-colors flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Start Fleet</span>
          </button>
          <button
            onClick={handleStopCompute}
            disabled={isExecuting}
            className="px-3 py-1.5 rounded bg-amber-950/60 hover:bg-amber-900/80 text-xs font-medium text-amber-300 border border-amber-800/40 transition-colors flex items-center gap-1.5"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Stop Fleet (Pause)</span>
          </button>
          <button
            onClick={handleWazuhTunnel}
            className="px-3 py-1.5 rounded bg-blue-950/60 hover:bg-blue-900/80 text-xs font-medium text-blue-300 border border-blue-800/40 transition-colors flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Wazuh Dashboard</span>
          </button>
          <Link
            href="/operations"
            className="px-3 py-1.5 rounded bg-primary hover:bg-primary-hover text-xs font-semibold text-white transition-colors flex items-center gap-1"
          >
            <span>Operations Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 3. Infrastructure Fleet Summary Table */}
      <div className="rounded border border-border-subtle bg-card/60 overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle bg-surface flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Compute Fleet Inventory
            </h3>
          </div>
          <Link
            href="/infrastructure"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <span>View Full Topology</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-subtle bg-surface/50 text-slate-400 uppercase text-[11px] font-semibold">
                <th className="py-2.5 px-4">Host Name</th>
                <th className="py-2.5 px-4">Role</th>
                <th className="py-2.5 px-4">State</th>
                <th className="py-2.5 px-4">Private IP</th>
                <th className="py-2.5 px-4">Public IP</th>
                <th className="py-2.5 px-4">Health</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/40">
              {instances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No instances found. Deploy infrastructure via Operations Console.
                  </td>
                </tr>
              ) : (
                instances.map((inst) => {
                  const hostKey = inst.name
                    .toLowerCase()
                    .replace("thedal-", "")
                    .replace("thedal_", "")
                    .replace("socforge-", "")
                    .replace("socforge_", "");

                  return (
                    <tr
                      key={inst.instance_id || inst.name}
                      className="hover:bg-card-hover/40 transition-colors"
                    >
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-200">
                        {inst.name}
                      </td>
                      <td className="py-2.5 px-4 text-slate-300">{inst.role}</td>
                      <td className="py-2.5 px-4">
                        <StatusBadge status={inst.state.toUpperCase()} size="sm" />
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-300">{inst.private_ip}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-400">
                        {inst.public_ip || "—"}
                      </td>
                      <td className="py-2.5 px-4">
                        <StatusBadge status={inst.health} size="sm" />
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <Link
                          href={`/infrastructure/${hostKey}`}
                          className="text-primary hover:underline text-xs"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Two-Column Split: System Health & Learning Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health Diagnostics */}
        <div className="rounded border border-border-subtle bg-card/60 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                System Diagnostics
              </h3>
            </div>
            <Link href="/health" className="text-xs text-primary hover:underline">
              All Diagnostics
            </Link>
          </div>

          <div className="space-y-2 text-xs">
            {healthSummary?.checks?.slice(0, 5).map((chk) => (
              <div
                key={chk.component}
                className="flex items-center justify-between p-2 rounded bg-surface/60 border border-border-subtle/50"
              >
                <div>
                  <span className="font-medium text-slate-200">{chk.component}</span>
                  <span className="text-slate-400 ml-2 text-[11px]">{chk.message}</span>
                </div>
                <StatusBadge status={chk.status} size="sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Learning Progress Overview */}
        <div className="rounded border border-border-subtle bg-card/60 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Curriculum Progress
              </h3>
            </div>
            <Link href="/learning" className="text-xs text-primary hover:underline">
              Learning Portal
            </Link>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded bg-surface/60 border border-border-subtle/50 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  {curriculum?.completed || 0} / {curriculum?.total_labs || 14} Labs Completed
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Level 1 ({curriculum?.level1?.completed || 0}/4) • Level 2 ({curriculum?.level2?.completed || 0}/4) • Level 3 ({curriculum?.level3?.completed || 0}/6)
                </div>
              </div>
              <span className="text-base font-bold font-mono text-primary">
                {curriculum?.percent_completed || 0}%
              </span>
            </div>

            {curriculum?.next_lab && (
              <div className="p-3 rounded bg-primary/10 border border-primary/30 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-primary tracking-wider">
                    Recommended Next Lab
                  </div>
                  <div className="text-xs font-semibold text-slate-100 mt-0.5">
                    {curriculum.next_lab.title}
                  </div>
                </div>
                <Link
                  href={`/learning/labs/${curriculum.next_lab.id}`}
                  className="px-3 py-1 rounded bg-primary hover:bg-primary-hover text-xs font-semibold text-white transition-colors"
                >
                  Continue
                </Link>
              </div>
            )}
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
