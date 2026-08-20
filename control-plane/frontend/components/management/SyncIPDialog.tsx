"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  FileCode,
  ArrowRight,
  Terminal,
  Radio,
  Wifi,
  Lock,
} from "lucide-react";
import { managementIpApi } from "../../lib/api/managementIp";
import { ManagementIPStatus, ManagementIPPreviewResult, ManagementIPSyncResult } from "../../lib/types/api";
import { useToast } from "../ui/Toast";

interface SyncIPDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialStatus?: ManagementIPStatus | null;
}

export const SyncIPDialog: React.FC<SyncIPDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialStatus,
}) => {
  const { success, error } = useToast();

  const [step, setStep] = useState<"configure" | "preview" | "applying" | "complete">("configure");
  const [ipStatus, setIpStatus] = useState<ManagementIPStatus | null>(initialStatus || null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Form State
  const [mode, setMode] = useState<"automatic" | "custom" | "open">("automatic");
  const [suffix, setSuffix] = useState<"32" | "24" | "custom">("32");
  const [customCidr, setCustomCidr] = useState("");
  const [openConfirmed, setOpenConfirmed] = useState(false);

  // Preview & Apply State
  const [previewResult, setPreviewResult] = useState<ManagementIPPreviewResult | null>(null);
  const [applyResult, setApplyResult] = useState<ManagementIPSyncResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoadingStatus(true);
    setErrorMsg(null);
    try {
      const res = await managementIpApi.getStatus();
      setIpStatus(res);
      if (res.detected_ip) {
        setCustomCidr(`${res.detected_ip}/32`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to query IP status.");
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setStep("configure");
      setPreviewResult(null);
      setApplyResult(null);
      setErrorMsg(null);
      fetchStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const detectedIp = ipStatus?.detected_ip || "";

  const computeProposedCidr = (): string => {
    if (mode === "open") return "0.0.0.0/0";
    if (mode === "custom") return customCidr.trim();
    if (!detectedIp) return "127.0.0.1/32";
    if (suffix === "24") {
      const parts = detectedIp.split(".");
      return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
    }
    return `${detectedIp}/32`;
  };

  const proposedCidr = computeProposedCidr();

  const handleGeneratePreview = async () => {
    setErrorMsg(null);
    setIsProcessing(true);
    try {
      const res = await managementIpApi.previewSync(proposedCidr);
      setPreviewResult(res);
      setStep("preview");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to generate Terraform execution plan.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = async () => {
    setErrorMsg(null);
    setStep("applying");
    setIsProcessing(true);
    try {
      const res = await managementIpApi.applySync(proposedCidr, mode, openConfirmed);
      setApplyResult(res);
      setStep("complete");
      success("Management IP Synchronized", `Updated allowed SSH CIDR to ${proposedCidr}`);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to apply Terraform update.");
      setStep("preview");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div
        className="w-full max-w-xl bg-panel border border-border-default rounded-md shadow-2xl overflow-hidden font-sans text-xs"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-surface">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/15 border border-primary/40 flex items-center justify-center text-primary font-bold">
              <Wifi className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold font-mono text-text-primary tracking-wide">
                SSH MANAGEMENT ACCESS SYNCHRONIZATION
              </h3>
              <p className="text-[10px] text-text-muted">
                Terraform Security Group Dynamic Public IP Reconciliation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-text-muted hover:text-text-primary p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4">
          {errorMsg && (
            <div className="p-2.5 rounded bg-accent-red/10 border border-accent-red/30 text-accent-red flex items-start gap-2 text-[11px]">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: CONFIGURE MODE & SUFFIX */}
          {step === "configure" && (
            <div className="space-y-3.5">
              {/* Detection Summary Card */}
              <div className="p-3 rounded bg-surface border border-border-subtle space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="space-y-0.5">
                    <span className="text-text-muted font-mono text-[10px] uppercase">Detected Public IP</span>
                    <div className="font-mono text-xs font-bold text-text-primary flex items-center gap-1.5">
                      <span>{detectedIp || "Detecting..."}</span>
                      {loadingStatus && <RefreshCw className="w-3 h-3 animate-spin text-primary" />}
                    </div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="text-text-muted font-mono text-[10px] uppercase">Current Terraform CIDR</span>
                    <div className="font-mono text-xs font-semibold text-text-secondary">
                      {ipStatus?.configured_cidr || "Loading..."}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border-subtle/60 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-text-muted">Status:</span>
                  <span
                    className={`font-bold ${
                      ipStatus?.status === "READY"
                        ? "text-primary"
                        : ipStatus?.status === "MISMATCH"
                        ? "text-accent-yellow"
                        : "text-accent-red"
                    }`}
                  >
                    {ipStatus?.status === "READY"
                      ? "● CURRENT IP AUTHORIZED"
                      : ipStatus?.status === "MISMATCH"
                      ? "⚠ IP MISMATCH (Action Required)"
                      : ipStatus?.status === "OPEN_ACCESS"
                      ? "⚠ OPEN ACCESS (0.0.0.0/0)"
                      : "● STATUS UNKNOWN"}
                  </span>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="space-y-2">
                <label className="text-[11px] font-mono font-bold text-text-muted uppercase">
                  Management Access Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("automatic")}
                    className={`p-2 rounded border text-left transition-all ${
                      mode === "automatic"
                        ? "bg-primary/12 border-primary text-primary font-semibold"
                        : "bg-surface border-border-subtle text-text-secondary hover:border-border-default"
                    }`}
                  >
                    <div className="font-bold text-[11px]">Automatic IP</div>
                    <div className="text-[10px] text-text-muted mt-0.5">Auto-detect public IPv4</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode("custom")}
                    className={`p-2 rounded border text-left transition-all ${
                      mode === "custom"
                        ? "bg-primary/12 border-primary text-primary font-semibold"
                        : "bg-surface border-border-subtle text-text-secondary hover:border-border-default"
                    }`}
                  >
                    <div className="font-bold text-[11px]">Custom CIDR</div>
                    <div className="text-[10px] text-text-muted mt-0.5">Enter custom range</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode("open")}
                    className={`p-2 rounded border text-left transition-all ${
                      mode === "open"
                        ? "bg-accent-red/15 border-accent-red text-accent-red font-semibold"
                        : "bg-surface border-border-subtle text-text-secondary hover:border-border-default"
                    }`}
                  >
                    <div className="font-bold text-[11px]">Open Access</div>
                    <div className="text-[10px] text-text-muted mt-0.5">0.0.0.0/0 (Testing)</div>
                  </button>
                </div>
              </div>

              {/* Mode Specific Inputs */}
              {mode === "automatic" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-text-muted uppercase">
                    CIDR Suffix
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSuffix("32")}
                      className={`px-3 py-1.5 rounded font-mono text-[11px] border transition-all ${
                        suffix === "32"
                          ? "bg-primary/20 border-primary text-primary font-bold"
                          : "bg-surface border-border-subtle text-text-secondary hover:bg-panel"
                      }`}
                    >
                      /32 (Single IP — Recommended)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSuffix("24")}
                      className={`px-3 py-1.5 rounded font-mono text-[11px] border transition-all ${
                        suffix === "24"
                          ? "bg-accent-yellow/20 border-accent-yellow text-accent-yellow font-bold"
                          : "bg-surface border-border-subtle text-text-secondary hover:bg-panel"
                      }`}
                    >
                      /24 (Subnet / ISP Range)
                    </button>
                  </div>
                  {suffix === "24" && (
                    <p className="text-[10px] text-accent-yellow leading-relaxed">
                      ⚠️ Note: /24 authorizes all 256 addresses in your subnet to attempt SSH authentication.
                    </p>
                  )}
                </div>
              )}

              {mode === "custom" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-text-muted uppercase">
                    Enter Custom IPv4 CIDR
                  </label>
                  <input
                    type="text"
                    value={customCidr}
                    onChange={(e) => setCustomCidr(e.target.value)}
                    placeholder="e.g. 203.0.113.10/32 or 192.168.1.0/24"
                    className="w-full px-3 py-1.5 rounded bg-surface border border-border-subtle font-mono text-xs text-text-primary focus:border-primary focus:outline-none"
                  />
                </div>
              )}

              {mode === "open" && (
                <div className="p-3 rounded bg-accent-red/10 border border-accent-red/30 space-y-2 text-[11px]">
                  <div className="font-bold text-accent-red flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>SECURITY WARNING: 0.0.0.0/0</span>
                  </div>
                  <p className="text-text-secondary leading-relaxed text-[10px]">
                    This allows SSH connection attempts from <strong>any IPv4 address on the internet</strong>.
                    Use strictly for temporary learning environments. Never use in production.
                  </p>
                  <label className="flex items-center gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={openConfirmed}
                      onChange={(e) => setOpenConfirmed(e.target.checked)}
                      className="rounded border-border-subtle text-accent-red focus:ring-accent-red"
                    />
                    <span className="font-medium text-text-primary text-[10px]">
                      I understand and accept the security risk for temporary lab usage.
                    </span>
                  </label>
                </div>
              )}

              {/* Proposed Result Banner */}
              <div className="p-2.5 rounded bg-panel border border-border-subtle flex items-center justify-between text-xs">
                <span className="text-text-muted font-mono">Proposed Ingress Rule:</span>
                <span className="font-mono font-bold text-primary">{proposedCidr}</span>
              </div>
            </div>
          )}

          {/* STEP 2: TERRAFORM PLAN PREVIEW */}
          {step === "preview" && previewResult && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-text-muted font-mono text-[11px]">
                  Terraform Execution Plan Preview ({proposedCidr}):
                </span>
                <span className="text-[10px] font-mono text-primary font-bold">1 to update in AWS</span>
              </div>

              <div className="p-3 rounded bg-[#071017] border border-border-subtle max-h-56 overflow-y-auto font-mono text-[10px] text-text-secondary leading-relaxed scrollbar-thin">
                <pre className="whitespace-pre-wrap select-all">
                  {previewResult.plan_output || "Plan generated successfully with 0 destructive changes."}
                </pre>
              </div>

              <p className="text-[10px] text-text-muted italic">
                Terraform will update <code className="text-primary font-mono">aws_security_group_rule.mgmt_ingress_ssh</code> and persist to <code className="text-text-primary font-mono">admin_ip.auto.tfvars</code>.
              </p>
            </div>
          )}

          {/* STEP 3: APPLYING PROGRESS */}
          {step === "applying" && (
            <div className="py-8 text-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto" />
              <div className="font-mono text-xs font-bold text-text-primary">
                Applying Terraform Configuration...
              </div>
              <p className="text-[11px] text-text-muted">
                Updating AWS Security Group and verifying TCP port 22 connectivity.
              </p>
            </div>
          )}

          {/* STEP 4: COMPLETE & VERIFIED */}
          {step === "complete" && applyResult && (
            <div className="space-y-3">
              <div className="p-3 rounded bg-primary/10 border border-primary/30 flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-text-primary">
                    Management SSH Access Synchronized!
                  </div>
                  <div className="text-[11px] text-text-secondary">
                    Your active public IP is now authorized in the AWS Security Group.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded bg-surface border border-border-subtle space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">New Allowed CIDR:</span>
                  <span className="font-bold text-primary">{applyResult.applied_cidr}</span>
                </div>
                {applyResult.live_bastion_ip && (
                  <div className="flex items-center justify-between">
                    <span className="text-text-muted">Bastion Public IP:</span>
                    <span className="text-accent-blue">{applyResult.live_bastion_ip}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Port 22 Reachability:</span>
                  <span className={applyResult.port_22_reachable ? "text-primary font-bold" : "text-accent-yellow"}>
                    {applyResult.port_22_reachable ? "● REACHABLE (Ready to Connect)" : "UNVERIFIED (Host offline)"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border-subtle bg-surface/50">
          {step === "configure" && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="soc-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGeneratePreview}
                disabled={isProcessing || (mode === "open" && !openConfirmed)}
                className="soc-btn-primary flex items-center gap-1.5 disabled:opacity-50"
              >
                {isProcessing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <FileCode className="w-3 h-3" />}
                <span>Preview Terraform Changes</span>
              </button>
            </>
          )}

          {step === "preview" && (
            <>
              <button
                type="button"
                onClick={() => setStep("configure")}
                disabled={isProcessing}
                className="soc-btn-secondary"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={isProcessing}
                className="soc-btn-primary flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Apply SSH Access Update</span>
              </button>
            </>
          )}

          {step === "complete" && (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="soc-btn-primary"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
