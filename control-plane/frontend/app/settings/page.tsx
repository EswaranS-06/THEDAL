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
} from "lucide-react";
import { settingsApi } from "../../lib/api/settings";
import { SettingsConfig, AWSProfile, AutoStopStatus } from "../../lib/types/api";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { CardSkeleton } from "../../components/ui/LoadingSkeleton";
import { ErrorState } from "../../components/ui/ErrorState";
import { useToast } from "../../components/ui/Toast";

export default function SettingsPage() {
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [config, setConfig] = useState<SettingsConfig | null>(null);

  // Auto-stop form
  const [autoStopEnabled, setAutoStopEnabled] = useState(false);
  const [gracePeriod, setGracePeriod] = useState(15);
  const [isUpdatingAutoStop, setIsUpdatingAutoStop] = useState(false);

  // New AWS Profile form
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [profileRegion, setProfileRegion] = useState("ap-south-1");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // SSH Key Ensure
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await settingsApi.getConfig();
      setConfig(res);
      if (res.autostop) {
        setAutoStopEnabled(res.autostop.enabled);
        setGracePeriod(res.autostop.grace_period_minutes);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

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
      success("SSH Keypair Ready", res.message || "Ed25519 key verified at ~/.ssh/thedal_key.");
      loadSettings();
    } catch (err: any) {
      error("SSH Key Check Failed", err.message);
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName || !accessKey || !secretKey) {
      error("Missing Fields", "Profile name, access key ID, and secret access key are required.");
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await settingsApi.createProfile({
        profile_name: profileName,
        access_key_id: accessKey,
        secret_access_key: secretKey,
        region: profileRegion,
      });
      success("AWS Profile Saved", res.message || `Profile '${profileName}' saved to ~/.aws/credentials.`);
      setProfileName("");
      setAccessKey("");
      setSecretKey("");
      setIsAddingProfile(false);
      loadSettings();
    } catch (err: any) {
      error("Failed to Save Profile", err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (loading && !config) {
    return (
      <div className="space-y-6">
        <CardSkeleton className="h-32" />
        <CardSkeleton className="h-64" />
        <CardSkeleton className="h-64" />
      </div>
    );
  }

  if (errorMsg && !config) {
    return (
      <ErrorState
        title="Failed to Load Settings"
        message={errorMsg}
        isOffline={true}
        onRetry={loadSettings}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          <span>Control Plane Settings & Credential Profiles</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Local runtime configuration, AWS credential chain verification, SSH key lifecycle, and safety auto-stop.
        </p>
      </div>

      {/* 1. Environment & Paths */}
      <div className="rounded border border-border-subtle bg-card/60 p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
          <Folder className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Environment & Filesystem Paths
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded bg-surface/60 border border-border-subtle/50 space-y-1">
            <div className="text-[11px] text-slate-500">Application Version</div>
            <div className="font-mono text-slate-200 font-medium">
              {config?.app_name} {config?.app_version}
            </div>
          </div>

          <div className="p-3 rounded bg-surface/60 border border-border-subtle/50 space-y-1">
            <div className="text-[11px] text-slate-500">Default AWS Region</div>
            <div className="font-mono text-slate-200 font-medium">
              {config?.aws_region}
            </div>
          </div>

          <div className="p-3 rounded bg-surface/60 border border-border-subtle/50 space-y-1">
            <div className="text-[11px] text-slate-500">Terraform Root</div>
            <div className="font-mono text-slate-300 text-[11px] truncate">
              {config?.terraform_dir}
            </div>
          </div>

          <div className="p-3 rounded bg-surface/60 border border-border-subtle/50 space-y-1">
            <div className="text-[11px] text-slate-500">Ansible Root</div>
            <div className="font-mono text-slate-300 text-[11px] truncate">
              {config?.ansible_dir}
            </div>
          </div>

          <div className="p-3 rounded bg-surface/60 border border-border-subtle/50 space-y-1 md:col-span-2">
            <div className="text-[11px] text-slate-500">Operation Audit Logs Directory</div>
            <div className="font-mono text-slate-300 text-[11px] truncate">
              {config?.logs_dir}
            </div>
          </div>
        </div>
      </div>

      {/* 2. SSH Keypair Lifecycle */}
      <div className="rounded border border-border-subtle bg-card/60 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              SSH Keypair Lifecycle
            </h3>
          </div>
          <button
            onClick={handleEnsureKey}
            disabled={isGeneratingKey}
            className="px-3 py-1.5 rounded bg-muted hover:bg-slate-700 text-xs font-medium text-slate-200 border border-border-default transition-colors"
          >
            {isGeneratingKey ? "Verifying..." : "Verify / Generate Key"}
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-3 rounded bg-surface/60 border border-border-subtle/50">
            <div>
              <div className="font-semibold text-slate-200">Local Ed25519 Private Key</div>
              <div className="font-mono text-slate-400 text-[11px] mt-0.5">
                {config?.ssh_key_path}
              </div>
            </div>
            <StatusBadge
              status={config?.ssh_info?.key_exists ? "VALID" : "UNCHECKED"}
              size="sm"
            />
          </div>

          {config?.ssh_info?.public_key_preview && (
            <div className="p-3 rounded bg-surface/60 border border-border-subtle/50 space-y-1">
              <div className="text-[11px] text-slate-500">Public Key Preview</div>
              <pre className="font-mono text-[11px] text-slate-300 overflow-x-auto">
                <code>{config.ssh_info.public_key_preview}</code>
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* 3. Safety Auto-Stop Configuration */}
      <div className="rounded border border-border-subtle bg-card/60 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <Power className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Safety Auto-Stop Protection
            </h3>
          </div>
          <StatusBadge
            status={config?.autostop?.enabled ? "ACTIVE" : "DISABLED"}
            size="sm"
          />
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Automatically stops EC2 instances when critical services remain unresponsive past the grace period. Halts compute charges while preserving EBS volumes.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          <label className="flex items-center gap-3 p-3 rounded bg-surface/60 border border-border-subtle cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoStopEnabled}
              onChange={(e) => setAutoStopEnabled(e.target.checked)}
              className="rounded border-border-default bg-surface text-primary focus:ring-primary h-4 w-4"
            />
            <div>
              <div className="font-semibold text-slate-200">Enable Automatic EC2 Stop</div>
              <div className="text-[11px] text-slate-400">Trigger safe stop during persistent downtime</div>
            </div>
          </label>

          <div className="p-3 rounded bg-surface/60 border border-border-subtle space-y-1">
            <div className="text-[11px] text-slate-400 font-medium">Grace Period (Minutes)</div>
            <select
              value={gracePeriod}
              onChange={(e) => setGracePeriod(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded bg-card border border-border-default text-xs font-mono text-slate-200 focus:outline-none focus:border-primary"
            >
              <option value={15}>15 Minutes</option>
              <option value={30}>30 Minutes</option>
              <option value={60}>60 Minutes</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSaveAutoStop}
            disabled={isUpdatingAutoStop}
            className="px-3.5 py-1.5 rounded bg-primary hover:bg-primary-hover text-xs font-semibold text-white transition-colors"
          >
            {isUpdatingAutoStop ? "Saving..." : "Save Auto-Stop Policy"}
          </button>
        </div>
      </div>

      {/* 4. AWS Profile Management */}
      <div className="rounded border border-border-subtle bg-card/60 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              AWS Credential Profiles
            </h3>
          </div>
          <button
            onClick={() => setIsAddingProfile(!isAddingProfile)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-muted hover:bg-slate-700 text-xs font-medium text-slate-200 border border-border-default transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAddingProfile ? "Cancel" : "Add Profile"}</span>
          </button>
        </div>

        <div className="space-y-2 text-xs">
          {config?.profiles?.map((prof) => (
            <div
              key={prof.name}
              className="flex items-center justify-between p-3 rounded bg-surface/60 border border-border-subtle/50"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200 font-mono">[{prof.name}]</span>
                  {prof.is_active && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Region: <span className="font-mono text-slate-300">{prof.region}</span>
                  {prof.account_id && (
                    <span> • Account: <span className="font-mono text-slate-300">{prof.account_id}</span></span>
                  )}
                </div>
              </div>
              <StatusBadge status={prof.status} size="sm" />
            </div>
          ))}
        </div>

        {/* Add Profile Drawer */}
        {isAddingProfile && (
          <form
            onSubmit={handleCreateProfile}
            className="p-4 rounded bg-surface border border-border-default space-y-3 animate-in fade-in duration-150"
          >
            <div className="text-xs font-semibold text-slate-200">
              Configure New AWS Profile (~/.aws/credentials)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Profile Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="default"
                  required
                  className="w-full px-3 py-1.5 rounded bg-card border border-border-subtle focus:border-primary focus:outline-none text-slate-100 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">AWS Region</label>
                <input
                  type="text"
                  value={profileRegion}
                  onChange={(e) => setProfileRegion(e.target.value)}
                  placeholder="ap-south-1"
                  required
                  className="w-full px-3 py-1.5 rounded bg-card border border-border-subtle focus:border-primary focus:outline-none text-slate-100 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">AWS Access Key ID</label>
                <input
                  type="text"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  placeholder="AKIA..."
                  required
                  className="w-full px-3 py-1.5 rounded bg-card border border-border-subtle focus:border-primary focus:outline-none text-slate-100 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">AWS Secret Access Key</label>
                <input
                  type="password"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="••••••••••••••••••••"
                  required
                  className="w-full px-3 py-1.5 rounded bg-card border border-border-subtle focus:border-primary focus:outline-none text-slate-100 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Secrets are written to ~/.aws/credentials and never stored in databases.
              </span>
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-4 py-1.5 rounded bg-primary hover:bg-primary-hover text-xs font-semibold text-white transition-colors"
              >
                {isSavingProfile ? "Saving..." : "Validate & Save"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 5. Security Guardrails & Safety Boundaries */}
      <div className="rounded border border-border-subtle bg-card/60 p-5 space-y-3 shadow-sm">
        <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
          <Shield className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Active Security Guardrails
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded bg-surface/60 border border-border-subtle/50 space-y-1">
            <div className="font-semibold text-slate-200">Localhost Default Binding</div>
            <p className="text-[11px] text-slate-400">
              FastAPI and Next.js bind strictly to <code className="text-slate-300 font-mono">127.0.0.1</code> to prevent network exposure.
            </p>
          </div>

          <div className="p-3 rounded bg-surface/60 border border-border-subtle/50 space-y-1">
            <div className="font-semibold text-slate-200">Allowlisted Operations Only</div>
            <p className="text-[11px] text-slate-400">
              Arbitrary command execution is impossible. Only validated Terraform, Ansible, and health check actions execute.
            </p>
          </div>

          <div className="p-3 rounded bg-surface/60 border border-border-subtle/50 space-y-1">
            <div className="font-semibold text-slate-200">Double-Confirmed Destroy</div>
            <p className="text-[11px] text-slate-400">
              Infrastructure teardown requires an explicit acknowledgement checkbox and typed phrase confirmation: <code className="text-rose-400 font-mono">DESTROY THEDAL</code>.
            </p>
          </div>

          <div className="p-3 rounded bg-surface/60 border border-border-subtle/50 space-y-1">
            <div className="font-semibold text-slate-200">Zero Secret Leaks</div>
            <p className="text-[11px] text-slate-400">
              AWS secret access keys and private SSH keys are never written to SQLite, browser localStorage, or operational log outputs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
