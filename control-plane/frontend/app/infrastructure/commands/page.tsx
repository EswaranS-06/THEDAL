"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Terminal, ArrowLeft, Shield, Info, RefreshCw } from "lucide-react";
import { settingsApi } from "../../../lib/api/settings";
import { DynamicCommandGroup } from "../../../lib/types/api";
import { CommandBlock } from "../../../components/ui/CommandBlock";
import { CardSkeleton } from "../../../components/ui/LoadingSkeleton";
import { ErrorState } from "../../../components/ui/ErrorState";

export default function CommandsPage() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [commandGroups, setCommandGroups] = useState<DynamicCommandGroup[]>([]);

  const loadCommands = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await settingsApi.getDynamicCommands();
      setCommandGroups(res || []);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load dynamic operator commands.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommands();
  }, []);

  if (loading && commandGroups.length === 0) {
    return (
      <div className="space-y-6">
        <CardSkeleton className="h-32" />
        <CardSkeleton className="h-64" />
        <CardSkeleton className="h-64" />
      </div>
    );
  }

  if (errorMsg && commandGroups.length === 0) {
    return (
      <ErrorState
        title="Failed to Load Dynamic Commands"
        message={errorMsg}
        onRetry={loadCommands}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Link
          href="/infrastructure"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Fleet Inventory</span>
        </Link>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-primary" />
              <span>Dynamic Operator Command Center</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              All commands dynamically derive live Bastion and private subnet IP addresses from current Terraform/AWS state.
            </p>
          </div>

          <button
            onClick={loadCommands}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-muted hover:bg-slate-700 text-xs font-medium text-slate-200 border border-border-default transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
            <span>Refresh IPs</span>
          </button>
        </div>
      </div>

      {/* Info Notice */}
      <div className="p-3.5 rounded bg-surface border border-border-subtle flex items-start gap-3 text-xs text-slate-300">
        <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Secure SSH ProxyJump Ingress:</strong> Private nodes (Wazuh, Web Target, Windows, Attack) do not have public IPs. All commands route through the Bastion jumpbox using <code className="font-mono text-slate-200">~/.ssh/thedal_key</code>.
        </div>
      </div>

      {/* Categorized Command Groups */}
      <div className="space-y-6">
        {commandGroups.map((group) => (
          <div
            key={group.category}
            className="rounded border border-border-subtle bg-card/60 p-5 space-y-4 shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                {group.category}
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                {group.commands.length} Commands
              </span>
            </div>

            <div className="space-y-3">
              {group.commands.map((cmd) => (
                <CommandBlock
                  key={cmd.title}
                  title={cmd.title}
                  description={cmd.description}
                  command={cmd.command}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
