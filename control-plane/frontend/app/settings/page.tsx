"use client";

import React, { useEffect, useState } from "react";
import {
  Settings,
  Shield,
  Key,
  Folder,
  Power,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Lock,
  Wifi,
  ChevronDown,
  ChevronUp,
  FileCode,
  Terminal,
  HelpCircle,
  Clock,
  Radio,
} from "lucide-react";
import { settingsApi } from "../../lib/api/settings";
import { managementIpApi } from "../../lib/api/managementIp";
import { runtimeApi } from "../../lib/api/runtime";
import {
  SettingsConfig,
  AWSProfile,
  AutoStopStatus,
  ManagementIPStatus,
  ManagementIPPreviewResult,
  ManagementIPHistoryItem,
  RuntimeStatus,
} from "../../lib/types/api";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { CardSkeleton } from "../../components/ui/LoadingSkeleton";
import { ErrorState } from "../../components/ui/ErrorState";
import { useToast } from "../../components/ui/Toast";
import { AWSProfilesManager } from "../../components/settings/AWSProfilesManager";

export default function SettingsPage() {
  const { success, error, info } = useToast();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [config, setConfig] = useState<SettingsConfig | null>(null);
  const [runtime, setRuntime] = useState<RuntimeStatus | null>(null);

  // Management IP State
  const [ipStatus, setIpStatus] = useState<ManagementIPStatus | null>(null);
  const [ipHistory, setIpHistory] = useState<ManagementIPHistoryItem[]>([]);
  const [accessMode, setAccessMode] = useState<"automatic" | "custom" | "open">("automatic");
  const [cidrSuffix, setCidrSuffix] = useState<"32" | "24" | "custom">("32");
  const [customCidrInput, setCustomCidrInput] = useState("");
  const [openConfirmed, setOpenConfirmed] = useState(false);
  const [previewPlan, setPreviewPlan] = useState<ManagementIPPreviewResult | null>(null);
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [connTestResult, setConnTestResult] = useState<{ reachable: boolean; message: string } | null>(null);
  const [isApplyingIp, setIsApplyingIp] = useState(false);
  const [isPreviewingIp, setIsPreviewingIp] = useState(false);
  const [isEducationOpen, setIsEducationOpen] = useState(false);

  // Auto-stop form
  const [autoStopEnabled, setAutoStopEnabled] = useState(false);
  const [gracePeriod, setGracePeriod] = useState(15);
  const [isUpdatingAutoStop, setIsUpdatingAutoStop] = useState(false);

  // SSH Key Ensure
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const [res, ipRes, histRes, runRes] = await Promise.all([
        settingsApi.getConfig().catch(() => null),
        managementIpApi.getStatus().catch(() => null),
        managementIpApi.getHistory(3).catch(() => []),
        runtimeApi.getStatus().catch(() => null),
      ]);

      if (runRes) setRuntime(runRes);

      if (res) {
        setConfig(res);
        if (res.autostop) {
          setAutoStopEnabled(res.autostop.enabled);
          setGracePeriod(res.autostop.grace_period_minutes);
        }
      }

      if (ipRes) {
        setIpStatus(ipRes);
        setAccessMode(ipRes.access_mode || "automatic");
        if (ipRes.detected_ip) {
          setCustomCidrInput(ipRes.configured_cidr || `${ipRes.detected_ip}/32`);
        }
      }

      setIpHistory(histRes);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const getEffectiveProposedCidr = (): string => {
    if (accessMode === "open") return "0.0.0.0/0";
    if (accessMode === "custom") return customCidrInput.trim();
    const det = ipStatus?.detected_ip;
    if (!det) return "127.0.0.1/32";
    if (cidrSuffix === "24") {
      const p = det.split(".");
      return `${p[0]}.${p[1]}.${p[2]}.0/24`;
    }
    return `${det}/32`;
  };

  const effectiveCidr = getEffectiveProposedCidr();

  const handleTestConnectivity = async () => {
    setIsTestingConn(true);
    setConnTestResult(null);
    try {
      const res = await managementIpApi.checkConnectivity();
      setConnTestResult({
        reachable: res.reachable,
        message: res.message || (res.reachable ? "Port 22 is reachable" : "Unreachable"),
      });
      if (res.reachable) {
        success("Bastion Reachable", "TCP Port 22 connection successful.");
      } else {
        error("Port 22 Unreachable", res.message || "Connection failed.");
      }
    } catch (err: any) {
      setConnTestResult({ reachable: false, message: err.message });
      error("Connectivity Check Failed", err.message);
    } finally {
      setIsTestingConn(false);
    }
  };

  const handlePreviewIpChanges = async () => {
    setIsPreviewingIp(true);
    setPreviewPlan(null);
    try {
      const res = await managementIpApi.previewSync(effectiveCidr);
      setPreviewPlan(res);
      success("Plan Generated", `Terraform plan preview ready for ${effectiveCidr}`);
    } catch (err: any) {
      error("Preview Failed", err.message);
    } finally {
      setIsPreviewingIp(false);
    }
  };

  const handleApplyIpSync = async () => {
    setIsApplyingIp(true);
    try {
      const res = await managementIpApi.applySync(effectiveCidr, accessMode, openConfirmed);
      if (res.success) {
        success("Management Access Updated", `Applied ${res.applied_cidr} via Terraform.`);
        setPreviewPlan(null);
        loadSettings();
      } else {
        error("Apply Failed", "Terraform reported non-zero exit code.");
      }
    } catch (err: any) {
      error("Sync Failed", err.message);
    } finally {
      setIsApplyingIp(false);
    }
  };

  const handleSaveAutoStop = async () => {
    setIsUpdatingAutoStop(true);
    try {
      const res = await settingsApi.configureAutoStop({
        enabled: autoStopEnabled,
        grace_period_minutes: Number(gracePeriod),
      });
      success("Auto-Stop Updated", res.message || "Safety configuration saved.");
      loadSettings();
    } catch (err: any) {
      error("Failed to update auto-stop", err.message);
    } finally {
      setIsUpdatingAutoStop(false);
    }
  };

  const handleEnsureKey = async () => {
    setIsGeneratingKey(true);
    try {
      const res = await settingsApi.ensureSshKey();
      success("SSH Keypair Ready", res.message || "SSH key verified.");
      loadSettings();
    } catch (err: any) {
      error("SSH Key Check Failed", err.message);
    } finally {
      setIsGeneratingKey(false);
    }
  };

  if (loading && !config) {
    return (
      <div className="space-y-4">
        <CardSkeleton className="h-14" />
        <CardSkeleton className="h-48" />
        <CardSkeleton className="h-48" />
      </div>
    );
  }

  if (errorMsg && !config) {
    return (
      <ErrorState
        title="Failed to Load Settings"
        message={errorMsg}
        onRetry={loadSettings}
      />
    );
  }

  const isIpMismatch = ipStatus?.status === "MISMATCH";
  const isIpReady = ipStatus?.status === "READY";

  return (
    <div className="space-y-5 text-xs font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold font-mono text-text-primary flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            <span>CONTROL PLANE & AWS CONFIGURATION</span>
          </h2>
          <p className="text-[11px] text-text-muted mt-0.5">
            Manage runtime modes, operator toolchains, dynamic management access, AWS credentials, and safety controls.
          </p>
        </div>
      </div>

      {/* 0. RUNTIME MODE & OPERATOR TOOLCHAIN STATUS */}
      <div className="p-4 rounded-md bg-panel border border-border-subtle space-y-3">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <div>
              <h3 className="text-xs font-bold font-mono text-text-primary uppercase tracking-wider">
                Runtime Environment & Operator Toolchain
              </h3>
              <p className="text-[10px] text-text-muted">
                Active execution adapter, tool binaries, and host networking status.
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded font-bold bg-primary/10 text-primary border border-primary/30">
            ● {runtime?.display_name || "Native Linux"}
          </span>
        </div>

        {runtime?.network?.warning && (
          <div className="p-2.5 rounded bg-accent-yellow/10 border border-accent-yellow/30 text-accent-yellow text-[10px] flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{runtime.network.warning}</span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-[11px]">
          {/* Terraform */}
          <div className="p-2.5 rounded bg-surface border border-border-subtle space-y-1">
            <div className="flex items-center justify-between text-[10px] text-text-muted">
              <span>TERRAFORM</span>
              {runtime?.tools?.terraform?.available ? (
                <CheckCircle2 className="w-3 h-3 text-primary" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-accent-red" />
              )}
            </div>
            <div className="text-text-primary font-bold">
              {runtime?.tools?.terraform?.available ? "Installed" : "Missing"}
            </div>
            <div className="text-[9px] text-text-muted truncate">
              {runtime?.tools?.terraform?.version || "Not found in PATH"}
            </div>
          </div>

          {/* Ansible */}
          <div className="p-2.5 rounded bg-surface border border-border-subtle space-y-1">
            <div className="flex items-center justify-between text-[10px] text-text-muted">
              <span>ANSIBLE</span>
              {runtime?.tools?.ansible?.available ? (
                <CheckCircle2 className="w-3 h-3 text-primary" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-accent-red" />
              )}
            </div>
            <div className="text-text-primary font-bold">
              {runtime?.tools?.ansible?.available ? "Installed" : "Missing"}
            </div>
            <div className="text-[9px] text-text-muted truncate">
              {runtime?.tools?.ansible?.version || "Not found in PATH"}
            </div>
          </div>

          {/* AWS CLI */}
          <div className="p-2.5 rounded bg-surface border border-border-subtle space-y-1">
            <div className="flex items-center justify-between text-[10px] text-text-muted">
              <span>AWS CLI</span>
              {runtime?.tools?.aws_cli?.available ? (
                <CheckCircle2 className="w-3 h-3 text-primary" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-accent-red" />
              )}
            </div>
            <div className="text-text-primary font-bold">
              {runtime?.tools?.aws_cli?.available ? "Installed" : "Missing"}
            </div>
            <div className="text-[9px] text-text-muted truncate">
              {runtime?.tools?.aws_cli?.version || "Not found in PATH"}
            </div>
          </div>

          {/* OpenSSH */}
          <div className="p-2.5 rounded bg-surface border border-border-subtle space-y-1">
            <div className="flex items-center justify-between text-[10px] text-text-muted">
              <span>OPENSSH</span>
              {runtime?.tools?.ssh?.available ? (
                <CheckCircle2 className="w-3 h-3 text-primary" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-accent-red" />
              )}
            </div>
            <div className="text-text-primary font-bold">
              {runtime?.tools?.ssh?.available ? "Installed" : "Missing"}
            </div>
            <div className="text-[9px] text-text-muted truncate">
              {runtime?.tools?.ssh?.version || "Not found in PATH"}
            </div>
          </div>
        </div>
      </div>

      {/* 1. AWS MANAGEMENT ACCESS (Dynamic SSH Ingress Automation) */}
      <div id="management-access" className="p-4 rounded-md bg-panel border border-border-subtle space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-primary" />
            <div>
              <h3 className="text-xs font-bold font-mono text-text-primary uppercase tracking-wider">
                AWS Management Access (Dynamic SSH CIDR)
              </h3>
              <p className="text-[10px] text-text-muted">
                Terraform Security Group configuration for Bastion administrative ingress.
              </p>
            </div>
          </div>

          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
              isIpReady
                ? "bg-primary/10 text-primary border-primary/30"
                : isIpMismatch
                ? "bg-accent-yellow/15 text-accent-yellow border-accent-yellow/40"
                : "bg-accent-blue/10 text-accent-blue border-accent-blue/30"
            }`}
          >
            {isIpReady ? "● NETWORK AUTHORIZED" : isIpMismatch ? "⚠ IP MISMATCH" : "● STATUS ACTIVE"}
          </span>
        </div>

        {/* Current State Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px]">
          <div className="p-2.5 rounded bg-surface border border-border-subtle space-y-1">
            <span className="text-[10px] text-text-muted uppercase">Detected Public IPv4</span>
            <div className="text-text-primary font-bold">{ipStatus?.detected_ip || "Unknown"}</div>
          </div>

          <div className="p-2.5 rounded bg-surface border border-border-subtle space-y-1">
            <span className="text-[10px] text-text-muted uppercase">Terraform Allowed CIDR</span>
            <div className="text-text-secondary font-bold">{ipStatus?.configured_cidr || "127.0.0.1/32"}</div>
          </div>

          <div className="p-2.5 rounded bg-surface border border-border-subtle space-y-1">
            <span className="text-[10px] text-text-muted uppercase">Bastion TCP Port 22</span>
            <div className={ipStatus?.port_22_reachable ? "text-primary font-bold" : "text-text-muted"}>
              {ipStatus?.port_22_reachable ? "● Reachable" : "Unverified / Offline"}
            </div>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="space-y-2">
          <label className="text-[11px] font-mono font-bold text-text-muted uppercase">
            Management Access Mode
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setAccessMode("automatic")}
              className={`p-2.5 rounded border text-left transition-all ${
                accessMode === "automatic"
                  ? "bg-primary/12 border-primary text-primary font-semibold"
                  : "bg-surface border-border-subtle text-text-secondary hover:border-border-default"
              }`}
            >
              <div className="font-bold text-[11px]">Automatic Current IP</div>
              <div className="text-[10px] text-text-muted mt-0.5">Auto-synchronize detected public IPv4</div>
            </button>

            <button
              type="button"
              onClick={() => setAccessMode("custom")}
              className={`p-2.5 rounded border text-left transition-all ${
                accessMode === "custom"
                  ? "bg-primary/12 border-primary text-primary font-semibold"
                  : "bg-surface border-border-subtle text-text-secondary hover:border-border-default"
              }`}
            >
              <div className="font-bold text-[11px]">Custom CIDR</div>
              <div className="text-[10px] text-text-muted mt-0.5">Manually specify CIDR block</div>
            </button>

            <button
              type="button"
              onClick={() => setAccessMode("open")}
              className={`p-2.5 rounded border text-left transition-all ${
                accessMode === "open"
                  ? "bg-accent-red/15 border-accent-red text-accent-red font-semibold"
                  : "bg-surface border-border-subtle text-text-secondary hover:border-border-default"
              }`}
            >
              <div className="font-bold text-[11px]">Open Access</div>
              <div className="text-[10px] text-text-muted mt-0.5">0.0.0.0/0 (Temporary Lab Use)</div>
            </button>
          </div>
        </div>

        {/* Mode Specific Inputs */}
        {accessMode === "automatic" && (
          <div className="space-y-2">
            <label className="text-[10px] font-mono text-text-muted uppercase">
              CIDR Suffix
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCidrSuffix("32")}
                className={`px-3 py-1 rounded font-mono text-[11px] border transition-all ${
                  cidrSuffix === "32"
                    ? "bg-primary/20 border-primary text-primary font-bold"
                    : "bg-surface border-border-subtle text-text-secondary hover:bg-panel"
                }`}
              >
                /32 (Exact Host — Recommended)
              </button>
              <button
                type="button"
                onClick={() => setCidrSuffix("24")}
                className={`px-3 py-1 rounded font-mono text-[11px] border transition-all ${
                  cidrSuffix === "24"
                    ? "bg-accent-yellow/20 border-accent-yellow text-accent-yellow font-bold"
                    : "bg-surface border-border-subtle text-text-secondary hover:bg-panel"
                }`}
              >
                /24 (Class C Subnet / ISP Block)
              </button>
            </div>
          </div>
        )}

        {accessMode === "custom" && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-text-muted uppercase">
              Custom IPv4 CIDR Block
            </label>
            <input
              type="text"
              value={customCidrInput}
              onChange={(e) => setCustomCidrInput(e.target.value)}
              placeholder="e.g. 203.0.113.10/32"
              className="w-full max-w-md px-3 py-1.5 rounded bg-surface border border-border-subtle font-mono text-xs text-text-primary focus:border-primary focus:outline-none"
            />
          </div>
        )}

        {accessMode === "open" && (
          <div className="p-3 rounded bg-accent-red/10 border border-accent-red/30 space-y-2 text-[11px]">
            <div className="font-bold text-accent-red flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>SECURITY RISK WARNING</span>
            </div>
            <p className="text-text-secondary leading-relaxed text-[10px]">
              Authorizing 0.0.0.0/0 exposes port 22 on the Bastion jumpbox to the public internet. Use strictly for temporary lab troubleshooting.
            </p>
            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={openConfirmed}
                onChange={(e) => setOpenConfirmed(e.target.checked)}
                className="rounded border-border-subtle text-accent-red focus:ring-accent-red"
              />
              <span className="font-medium text-text-primary text-[10px]">
                I understand the security risk.
              </span>
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle/60">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="text-text-muted">Effective Target CIDR:</span>
            <strong className="text-primary">{effectiveCidr}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnectivity}
              disabled={isTestingConn}
              className="soc-btn-secondary flex items-center gap-1.5"
            >
              <Radio className={`w-3.5 h-3.5 ${isTestingConn ? "animate-spin text-primary" : ""}`} />
              <span>Test Connectivity</span>
            </button>

            <button
              type="button"
              onClick={handlePreviewIpChanges}
              disabled={isPreviewingIp}
              className="soc-btn-secondary flex items-center gap-1.5"
            >
              <FileCode className="w-3.5 h-3.5 text-accent-blue" />
              <span>Preview Changes</span>
            </button>

            <button
              type="button"
              onClick={handleApplyIpSync}
              disabled={isApplyingIp || (accessMode === "open" && !openConfirmed)}
              className="soc-btn-primary flex items-center gap-1.5 disabled:opacity-50"
            >
              {isApplyingIp ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Apply CIDR Update</span>
            </button>
          </div>
        </div>

        {/* Plan Preview Box */}
        {previewPlan && (
          <div className="p-3 rounded bg-[#071017] border border-border-subtle space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-primary font-bold">Terraform Plan Preview:</span>
              <span className="text-text-muted">{previewPlan.proposed_cidr}</span>
            </div>
            <pre className="p-2 rounded bg-surface font-mono text-[10px] text-text-secondary max-h-48 overflow-y-auto whitespace-pre-wrap select-all scrollbar-thin">
              {previewPlan.plan_output}
            </pre>
          </div>
        )}

        {/* Last Sync History */}
        {ipHistory.length > 0 && (
          <div className="pt-2 text-[10px] font-mono text-text-muted flex items-center gap-3">
            <Clock className="w-3 h-3" />
            <span>
              Last Updated: <strong className="text-text-primary">{ipHistory[0].timestamp}</strong>
            </span>
            <span>
              Previous CIDR: <strong className="text-text-secondary">{ipHistory[0].previous_cidr}</strong>
            </span>
          </div>
        )}

        {/* Collapsible Educational Guide */}
        <div className="pt-2 border-t border-border-subtle/50">
          <button
            type="button"
            onClick={() => setIsEducationOpen(!isEducationOpen)}
            className="w-full flex items-center justify-between p-2 rounded bg-surface/60 hover:bg-surface border border-border-subtle text-left transition-colors"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5 text-accent-blue" />
              <span className="font-mono font-bold text-[11px] text-text-primary">
                WHY DID MY SSH ACCESS STOP WORKING?
              </span>
            </div>
            {isEducationOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {isEducationOpen && (
            <div className="p-3 mt-2 rounded bg-surface border border-border-subtle space-y-2 text-[11px] text-text-secondary leading-relaxed">
              <p>
                • <strong>Public IP changes:</strong> Residential ISPs and mobile hotspots assign dynamic IPv4 addresses that change periodically when restarting your router or switching networks.
              </p>
              <p>
                • <strong>/32 CIDR restriction:</strong> A <code className="text-primary font-mono">/32</code> suffix restricts access to exactly one single IPv4 address. When your public IP changes, AWS Security Groups block incoming packets.
              </p>
              <p>
                • <strong>Hypervisor stateful firewall:</strong> AWS Security Groups operate at the hypervisor network layer. The EC2 instance and OpenSSH daemon remain completely healthy while incoming connection attempts simply time out.
              </p>
              <p>
                • <strong>Terraform single source of truth:</strong> Clicking <em>Apply CIDR Update</em> modifies the Terraform configuration state and updates AWS through controlled Terraform execution without creating unmanaged infrastructure drift.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 2. AUTO-STOP IDLE PROTECTION */}
      <div className="p-4 rounded-md bg-panel border border-border-subtle space-y-3">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <Power className="w-4 h-4 text-accent-yellow" />
            <div>
              <h3 className="text-xs font-bold font-mono text-text-primary uppercase tracking-wider">
                EC2 Auto-Stop & Cost Protection
              </h3>
              <p className="text-[10px] text-text-muted">
                Background daemon that halts idle EC2 compute instances to minimize AWS charges.
              </p>
            </div>
          </div>

          <StatusBadge
            status={autoStopEnabled ? "ENABLED" : "DISABLED"}
            variant="state"
            size="sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoStopEnabled}
                onChange={(e) => setAutoStopEnabled(e.target.checked)}
                className="rounded border-border-subtle text-primary focus:ring-primary"
              />
              <span className="font-medium text-text-primary text-xs">
                Enable automatic idle instance stop
              </span>
            </label>
            <p className="text-[11px] text-text-muted">
              Safely stops running EC2 virtual machines when no activity is detected. Preserves EBS disk state and Ansible deployments.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-text-muted uppercase">
              Idle Grace Period (Minutes)
            </label>
            <input
              type="number"
              min="5"
              max="120"
              value={gracePeriod}
              onChange={(e) => setGracePeriod(Number(e.target.value))}
              className="w-full max-w-xs px-3 py-1.5 rounded bg-surface border border-border-subtle font-mono text-xs text-text-primary focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleSaveAutoStop}
            disabled={isUpdatingAutoStop}
            className="soc-btn-primary flex items-center gap-1.5"
          >
            {isUpdatingAutoStop ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>Save Auto-Stop Policy</span>
          </button>
        </div>
      </div>

      {/* 3. SSH KEYPAIR MANAGEMENT */}
      <div className="p-4 rounded-md bg-panel border border-border-subtle space-y-3">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" />
            <div>
              <h3 className="text-xs font-bold font-mono text-text-primary uppercase tracking-wider">
                Operator SSH Keypair
              </h3>
              <p className="text-[10px] text-text-muted">
                Local private key used for Bastion authentication and jumpbox proxying.
              </p>
            </div>
          </div>

          <StatusBadge
            status={config?.ssh_info?.key_exists ? "PRESENT" : "MISSING"}
            variant="state"
            size="sm"
          />
        </div>

        <div className="space-y-2 font-mono text-[11px]">
          <div className="p-2.5 rounded bg-surface border border-border-subtle flex items-center justify-between">
            <span className="text-text-muted">Key Location:</span>
            <span className="text-text-primary">{config?.ssh_info?.key_path || "~/.ssh/socforge_key"}</span>
          </div>

          {config?.ssh_info?.public_key_preview && (
            <div className="p-2.5 rounded bg-[#071017] border border-border-subtle space-y-1">
              <span className="text-[10px] text-text-muted uppercase">Public Key Preview:</span>
              <pre className="text-[10px] text-text-secondary overflow-x-auto whitespace-pre-wrap select-all">
                {config.ssh_info.public_key_preview}
              </pre>
            </div>
          )}
        </div>

        <div className="pt-1 flex justify-end">
          <button
            type="button"
            onClick={handleEnsureKey}
            disabled={isGeneratingKey}
            className="soc-btn-secondary flex items-center gap-1.5"
          >
            {isGeneratingKey ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
            <span>Verify / Ensure SSH Key</span>
          </button>
        </div>
      </div>

      {/* 4. AWS PROFILES & CREDENTIALS (Live Validation, Edit, Delete, Options Menu) */}
      <AWSProfilesManager
        profiles={config?.profiles || []}
        onRefresh={loadSettings}
      />
    </div>
  );
}
