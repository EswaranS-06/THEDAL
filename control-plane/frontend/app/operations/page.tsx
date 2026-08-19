"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Terminal,
  FileCode,
  Play,
  Square,
  Activity,
  Layers,
  ShieldAlert,
  Clock,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  Server,
  Zap,
} from "lucide-react";
import { terraformApi } from "../../lib/api/terraform";
import { ansibleApi } from "../../lib/api/ansible";
import { awsApi } from "../../lib/api/aws";
import { healthApi } from "../../lib/api/health";
import { operationsApi } from "../../lib/api/operations";
import { OperationLogMeta } from "../../lib/types/api";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { DangerDialog } from "../../components/ui/DangerDialog";
import { CardSkeleton } from "../../components/ui/LoadingSkeleton";
import { ErrorState } from "../../components/ui/ErrorState";
import { useToast } from "../../components/ui/Toast";

export default function OperationsPage() {
  const router = useRouter();
  const { success, error, info } = useToast();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeOp, setActiveOp] = useState<string | null>(null);
  const [recentLogs, setRecentLogs] = useState<OperationLogMeta[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  // Dialog States
  const [confirmDialog, setConfirmDialog] = useState<{
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

  const [dangerDialogOpen, setDangerDialogOpen] = useState(false);

  const loadOpsData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await operationsApi.listOperations();
      setActiveOp(res.active_operation || null);
      setRecentLogs(res.logs || []);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load operations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpsData();
    const interval = setInterval(loadOpsData, 10000);
    return () => clearInterval(interval);
  }, []);

  const triggerOperation = (title: string, description: string, opFunc: () => Promise<any>) => {
    setConfirmDialog({
      isOpen: true,
      title,
      description,
      action: async () => {
        setIsExecuting(true);
        try {
          const res = await opFunc();
          success("Operation Started / Completed", res.message || "Action finished successfully.");
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          if (res.log_file) {
            router.push(`/operations/${res.log_file}`);
          } else {
            loadOpsData();
          }
        } catch (err: any) {
          error("Operation Failed", err.message);
        } finally {
          setIsExecuting(false);
        }
      },
    });
  };

  const handleTerraformPlan = () => {
    triggerOperation(
      "Execute Terraform Plan",
      "Performs a dry-run state evaluation of AWS resources against Terraform configuration files.",
      () => terraformApi.plan()
    );
  };

  const handleTerraformApply = () => {
    triggerOperation(
      "Execute Terraform Apply (Deploy)",
      "Provisions or updates all live AWS infrastructure resources (VPC, Subnets, Security Groups, EC2).",
      () => terraformApi.apply(true)
    );
  };

  const handleAnsiblePlaybook = (key: string, name: string) => {
    triggerOperation(
      `Run Ansible Playbook: ${name}`,
      `Executes playbook '${key}.yml' against configured hosts via Bastion ProxyJump.`,
      () => ansibleApi.runPlaybook(key, true)
    );
  };

  const handleFullProvision = () => {
    triggerOperation(
      "Execute Full Ansible Provisioning",
      "Sequentially runs all configuration playbooks (Linux, Windows, Wazuh, Web, Juice Shop, Atomic Red Team).",
      () => ansibleApi.runFullProvision(true)
    );
  };

  const handleGenerateInventory = () => {
    triggerOperation(
      "Generate Ansible Inventory",
      "Dynamically reads Terraform outputs and generates ansible/inventory/hosts.ini with live IP addresses.",
      () => ansibleApi.generateInventory()
    );
  };

  const handleHealthCheck = () => {
    triggerOperation(
      "Run System Health Diagnostics",
      "Probes AWS API, Bastion SSH connectivity, Wazuh API, Indexer, and Target web application health.",
      () => healthApi.runCheck()
    );
  };

  const handleStartFleet = () => {
    triggerOperation(
      "Start Compute Fleet",
      "Sends EC2 start API calls to all stopped lab instances.",
      () => awsApi.startInstances()
    );
  };

  const handleStopFleet = () => {
    triggerOperation(
      "Stop Compute Fleet (Pause)",
      "Safely halts EC2 instances to eliminate compute billing. EBS storage and lab progress are preserved.",
      () => awsApi.stopInstances()
    );
  };

  const handleWazuhTunnel = async () => {
    try {
      const res = await operationsApi.startWazuhTunnel();
      if (res.success) {
        success("Wazuh Tunnel Started", "Forwarding localhost:8443 -> Wazuh Dashboard.");
        window.open("https://127.0.0.1:8443", "_blank");
      }
    } catch (err: any) {
      error("Tunnel Error", err.message);
    }
  };

  const handleDestroyConfirm = async () => {
    setIsExecuting(true);
    try {
      const res = await terraformApi.destroy(true, "DESTROY THEDAL");
      success("Infrastructure Destroyed", res.message || "All AWS resources have been terminated.");
      setDangerDialogOpen(false);
      if (res.log_file) {
        router.push(`/operations/${res.log_file}`);
      } else {
        loadOpsData();
      }
    } catch (err: any) {
      error("Destroy Failed", err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  const playbooks = [
    { key: "bootstrap", name: "1. Bootstrap Environment", desc: "Initial package & dependency baseline" },
    { key: "linux-base", name: "2. Linux Base Hardening", desc: "Sysctl, auditd, and telemetry agents" },
    { key: "windows-base", name: "3. Windows Base Config", desc: "WinRM, Sysmon v14+, and auditing" },
    { key: "wazuh", name: "4. Wazuh SIEM All-in-One", desc: "Manager, Indexer, and Dashboard" },
    { key: "windows-agent", name: "5. Windows Wazuh Agent", desc: "Shipper registration and Sysmon channel" },
    { key: "web-target", name: "6. Linux Web Target (DVWA)", desc: "Nginx, PHP-FPM, MariaDB, and DVWA" },
    { key: "juice-shop", name: "7. OWASP Juice Shop (Docker)", desc: "Containerized modern vulnerable app" },
    { key: "atomic-red-team", name: "8. Atomic Red Team", desc: "Invoke-Atomic adversary simulation runner" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-primary" />
            <span>Operations & Orchestration Console</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Allowlisted operator workflows for Terraform lifecycle, Ansible automation, and system diagnostics.
          </p>
        </div>

        <button
          onClick={loadOpsData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-muted hover:bg-slate-700 text-xs font-medium text-slate-200 border border-border-default transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Active Operation Alert */}
      {activeOp && (
        <div className="p-3.5 rounded bg-amber-950/40 border border-amber-600/40 text-amber-300 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>
              <strong>Operation in Progress:</strong> <code className="font-mono text-amber-200">{activeOp}</code>
            </span>
          </div>
          <span className="text-[11px] font-mono uppercase bg-amber-900/60 px-2 py-0.5 rounded border border-amber-700/50">
            Running
          </span>
        </div>
      )}

      {/* 1. Terraform & Compute Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Terraform Controls */}
        <div className="rounded border border-border-subtle bg-card/60 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Terraform Infrastructure Lifecycle
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">IaC Authority</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Manage declarative AWS VPC, subnet topology, security boundaries, and virtual machine provisioning.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleTerraformPlan}
              disabled={isExecuting || !!activeOp}
              className="p-3 rounded bg-surface hover:bg-card-hover border border-border-subtle text-left transition-colors group"
            >
              <div className="text-xs font-semibold text-slate-200 group-hover:text-primary transition-colors">
                Terraform Plan
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Dry-run drift & changes</div>
            </button>

            <button
              onClick={handleTerraformApply}
              disabled={isExecuting || !!activeOp}
              className="p-3 rounded bg-primary/10 hover:bg-primary/20 border border-primary/30 text-left transition-colors group"
            >
              <div className="text-xs font-semibold text-primary">
                Terraform Apply
              </div>
              <div className="text-[11px] text-slate-300 mt-1">Deploy / Update AWS</div>
            </button>
          </div>
        </div>

        {/* Compute & Access Controls */}
        <div className="rounded border border-border-subtle bg-card/60 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Compute State & Diagnostics
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Safe Controls</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Safe non-destructive EC2 pause/resume, health check diagnostics, and Wazuh port forwarding.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleStartFleet}
              disabled={isExecuting || !!activeOp}
              className="p-3 rounded bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-800/40 text-left transition-colors group"
            >
              <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <Play className="w-3 h-3" />
                <span>Start Compute</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Resume all stopped VMs</div>
            </button>

            <button
              onClick={handleStopFleet}
              disabled={isExecuting || !!activeOp}
              className="p-3 rounded bg-amber-950/30 hover:bg-amber-950/50 border border-amber-800/40 text-left transition-colors group"
            >
              <div className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                <Square className="w-3 h-3" />
                <span>Stop Compute</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Pause fleet (save $)</div>
            </button>

            <button
              onClick={handleHealthCheck}
              disabled={isExecuting || !!activeOp}
              className="p-3 rounded bg-surface hover:bg-card-hover border border-border-subtle text-left transition-colors group"
            >
              <div className="text-xs font-semibold text-slate-200 group-hover:text-primary transition-colors flex items-center gap-1">
                <Activity className="w-3 h-3 text-emerald-400" />
                <span>Health Diagnostics</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Run all system checks</div>
            </button>

            <button
              onClick={handleWazuhTunnel}
              className="p-3 rounded bg-blue-950/30 hover:bg-blue-950/50 border border-blue-800/40 text-left transition-colors group"
            >
              <div className="text-xs font-semibold text-blue-400 flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                <span>Wazuh Dashboard</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Open localhost:8443</div>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Ansible Playbooks Section */}
      <div className="rounded border border-border-subtle bg-card/60 p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Ansible Provisioning & Configuration
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateInventory}
              disabled={isExecuting || !!activeOp}
              className="px-3 py-1.5 rounded bg-muted hover:bg-slate-700 text-xs font-medium text-slate-200 border border-border-default transition-colors"
            >
              Generate Inventory
            </button>
            <button
              onClick={handleFullProvision}
              disabled={isExecuting || !!activeOp}
              className="px-3.5 py-1.5 rounded bg-primary hover:bg-primary-hover text-xs font-semibold text-white transition-colors flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Full System Provision</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {playbooks.map((pb) => (
            <button
              key={pb.key}
              onClick={() => handleAnsiblePlaybook(pb.key, pb.name)}
              disabled={isExecuting || !!activeOp}
              className="p-3 rounded bg-surface hover:bg-card-hover border border-border-subtle text-left transition-all group"
            >
              <div className="text-xs font-semibold text-slate-200 group-hover:text-primary transition-colors">
                {pb.name}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 leading-snug">
                {pb.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Recent Operations Log Stream */}
      <div className="rounded border border-border-subtle bg-card/60 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-border-subtle bg-surface flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Recent Operational Logs
            </h3>
          </div>
          <Link href="/logs" className="text-xs text-primary hover:underline flex items-center gap-1">
            <span>View All Logs</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-subtle bg-surface/50 text-slate-400 uppercase text-[10px]">
                <th className="py-2.5 px-4">Log File</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">View Output</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/40">
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    No operation logs recorded yet.
                  </td>
                </tr>
              ) : (
                recentLogs.map((log) => (
                  <tr key={log.filename} className="hover:bg-card-hover/40 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-200">
                      {log.filename}
                    </td>
                    <td className="py-2.5 px-4 text-slate-300 font-mono text-[11px]">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-400 text-[11px]">
                      {log.timestamp}
                    </td>
                    <td className="py-2.5 px-4">
                      <StatusBadge status={log.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <Link
                        href={`/operations/${log.filename}`}
                        className="text-primary hover:underline text-xs"
                      >
                        Inspect Output
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Visually Separated Destructive Actions Section */}
      <div className="p-5 rounded border border-rose-900/40 bg-rose-950/20 space-y-3">
        <div className="flex items-center gap-2 text-rose-400">
          <ShieldAlert className="w-5 h-5" />
          <h3 className="text-xs font-bold uppercase tracking-wider">
            Destructive Teardown Zone
          </h3>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          Permanently destroy all AWS lab infrastructure via Terraform. This action cannot be undone and will terminate all virtual machines, subnets, and VPC resources.
        </p>

        <div className="pt-2">
          <button
            onClick={() => setDangerDialogOpen(true)}
            disabled={isExecuting || !!activeOp}
            className="px-4 py-2 rounded bg-rose-700 hover:bg-rose-600 text-xs font-semibold text-white transition-colors"
          >
            Destroy Lab Infrastructure...
          </button>
        </div>
      </div>

      {/* Standard Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        isLoading={isExecuting}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Strict Danger Destroy Dialog */}
      <DangerDialog
        isOpen={dangerDialogOpen}
        title="Destroy THEDAL Infrastructure"
        requiredPhrase="DESTROY THEDAL"
        isLoading={isExecuting}
        onConfirm={handleDestroyConfirm}
        onCancel={() => setDangerDialogOpen(false)}
      />
    </div>
  );
}
