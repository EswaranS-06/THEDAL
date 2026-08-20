"use client";

import React, { useState } from "react";
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Wrench,
  KeyRound,
  Server,
  Activity,
  ExternalLink,
} from "lucide-react";
import { wazuhApi } from "../../lib/api/wazuh";
import { WazuhDetailedHealth } from "../../lib/types/api";
import { StatusBadge } from "../ui/StatusBadge";
import { useToast } from "../ui/Toast";

interface WazuhHealthCardProps {
  health: WazuhDetailedHealth | null;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const WazuhHealthCard: React.FC<WazuhHealthCardProps> = ({
  health,
  onRefresh,
  isLoading = false,
}) => {
  const { success, error, info } = useToast();
  const [isRepairing, setIsRepairing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const res = await wazuhApi.verifyAuth();
      if (res.success) {
        success("Authentication Verified", "Centralized credentials authenticated successfully with Wazuh API.");
      } else {
        error("Authentication Failed", res.message || "Wazuh API rejected credentials (HTTP 401).");
      }
      onRefresh();
    } catch (err: any) {
      error("Verification Error", err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRepair = async () => {
    setIsRepairing(true);
    try {
      const res = await wazuhApi.repairConfiguration();
      if (res.success) {
        success("Repair Complete", res.message);
      } else {
        error("Repair Incomplete", res.message);
      }
      onRefresh();
    } catch (err: any) {
      error("Repair Failed", err.message);
    } finally {
      setIsRepairing(false);
    }
  };

  const handleRotate = async () => {
    if (!window.confirm("Are you sure you want to rotate the centralized Wazuh API credentials? This will generate a new strong password and update Manager & Dashboard.")) {
      return;
    }
    setIsRotating(true);
    try {
      const res = await wazuhApi.rotateCredentials();
      if (res.success) {
        success("Credentials Rotated", "New password generated and synchronized across Manager and Dashboard.");
      } else {
        error("Rotation Warning", res.message);
      }
      onRefresh();
    } catch (err: any) {
      error("Rotation Failed", err.message);
    } finally {
      setIsRotating(false);
    }
  };

  if (!health) return null;

  const comps = health.components;
  const isAuthFailed = health.overall_status === "AUTHENTICATION_FAILED" ||
    comps?.api_authentication?.status === "AUTHENTICATION_FAILED" ||
    comps?.dashboard_api_sync?.status === "MISMATCH";

  return (
    <div className="p-4 rounded-md bg-panel border border-border-subtle space-y-4 text-xs font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary/15 border border-primary/40 flex items-center justify-center text-primary font-bold">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold font-mono text-text-primary tracking-wide">
              WAZUH SIEM COMPONENT HEALTH & CREDENTIAL SYNCHRONIZATION
            </h3>
            <p className="text-[10px] text-text-muted">
              Live service status, API connectivity, and Dashboard ↔ API credential alignment.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status={health.overall_status} size="sm" />
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1 rounded hover:bg-surface text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
            title="Refresh Wazuh Diagnostics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mismatch Alert Banner */}
      {isAuthFailed && (
        <div className="p-3 rounded bg-accent-red/10 border border-accent-red/30 space-y-2 text-accent-red text-[11px]">
          <div className="flex items-center gap-2 font-bold font-mono">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>WAZUH CREDENTIAL SYNCHRONIZATION MISMATCH (401 UNAUTHORIZED)</span>
          </div>
          <p className="text-[10px] text-text-secondary leading-relaxed">
            The Wazuh Dashboard plugin credentials in <code className="bg-surface px-1 py-0.5 rounded text-text-primary">wazuh.yml</code> do not match the active Wazuh API password on the Manager. Click <strong>Repair Credential Sync</strong> to synchronize them automatically.
          </p>
          <div className="pt-1 flex items-center gap-2">
            <button
              onClick={handleRepair}
              disabled={isRepairing}
              className="soc-btn-primary flex items-center gap-1.5 text-[10px] py-1 px-2.5"
            >
              <Wrench className={`w-3 h-3 ${isRepairing ? "animate-spin" : ""}`} />
              <span>{isRepairing ? "Synchronizing..." : "Repair Credential Sync"}</span>
            </button>
          </div>
        </div>
      )}

      {/* 6-Grid Component Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 font-mono text-[11px]">
        {/* Manager */}
        <div className="p-2.5 rounded bg-surface border border-border-subtle space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-muted">WAZUH MANAGER</span>
            <StatusBadge status={comps?.wazuh_manager?.status || "UNKNOWN"} size="sm" />
          </div>
          <p className="text-[10px] text-text-secondary font-sans truncate">
            {comps?.wazuh_manager?.message || "Service active"}
          </p>
        </div>

        {/* Indexer */}
        <div className="p-2.5 rounded bg-surface border border-border-subtle space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-muted">WAZUH INDEXER</span>
            <StatusBadge status={comps?.wazuh_indexer?.status || "UNKNOWN"} size="sm" />
          </div>
          <p className="text-[10px] text-text-secondary font-sans truncate">
            {comps?.wazuh_indexer?.message || "OpenSearch port 9200 active"}
          </p>
        </div>

        {/* Dashboard */}
        <div className="p-2.5 rounded bg-surface border border-border-subtle space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-muted">WAZUH DASHBOARD</span>
            <StatusBadge status={comps?.wazuh_dashboard?.status || "UNKNOWN"} size="sm" />
          </div>
          <p className="text-[10px] text-text-secondary font-sans truncate">
            {comps?.wazuh_dashboard?.message || "HTTPS port 443 active"}
          </p>
        </div>

        {/* API Connection */}
        <div className="p-2.5 rounded bg-surface border border-border-subtle space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-muted">API CONNECTION</span>
            <StatusBadge status={comps?.api_connectivity?.status || "UNKNOWN"} size="sm" />
          </div>
          <p className="text-[10px] text-text-secondary font-sans truncate">
            {comps?.api_connectivity?.message || "TCP port 55000 reachable"}
          </p>
        </div>

        {/* API Auth */}
        <div className="p-2.5 rounded bg-surface border border-border-subtle space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-muted">API AUTHENTICATION</span>
            <StatusBadge status={comps?.api_authentication?.status || "UNKNOWN"} size="sm" />
          </div>
          <p className="text-[10px] text-text-secondary font-sans truncate">
            {comps?.api_authentication?.message || "Token verification"}
          </p>
        </div>

        {/* Dashboard Sync */}
        <div className="p-2.5 rounded bg-surface border border-border-subtle space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-text-muted">DASHBOARD SYNC</span>
            <StatusBadge status={comps?.dashboard_api_sync?.status || "UNKNOWN"} size="sm" />
          </div>
          <p className="text-[10px] text-text-secondary font-sans truncate">
            {comps?.dashboard_api_sync?.message || "Credentials alignment"}
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-border-subtle">
        <button
          onClick={handleVerify}
          disabled={isVerifying || isRepairing || isRotating}
          className="soc-btn-secondary flex items-center gap-1.5 text-[11px] py-1 px-3"
        >
          <Activity className={`w-3.5 h-3.5 ${isVerifying ? "animate-spin" : ""}`} />
          <span>{isVerifying ? "Verifying..." : "Verify Authentication"}</span>
        </button>

        <button
          onClick={handleRepair}
          disabled={isRepairing || isVerifying || isRotating}
          className="soc-btn-secondary flex items-center gap-1.5 text-[11px] py-1 px-3 text-primary border-primary/30 hover:border-primary"
        >
          <Wrench className={`w-3.5 h-3.5 ${isRepairing ? "animate-spin" : ""}`} />
          <span>{isRepairing ? "Repairing..." : "Repair Credential Sync"}</span>
        </button>

        <button
          onClick={handleRotate}
          disabled={isRotating || isRepairing || isVerifying}
          className="soc-btn-secondary flex items-center gap-1.5 text-[11px] py-1 px-3 text-text-muted hover:text-text-primary"
        >
          <KeyRound className={`w-3.5 h-3.5 ${isRotating ? "animate-spin" : ""}`} />
          <span>{isRotating ? "Rotating..." : "Rotate API Credentials"}</span>
        </button>
      </div>
    </div>
  );
};
