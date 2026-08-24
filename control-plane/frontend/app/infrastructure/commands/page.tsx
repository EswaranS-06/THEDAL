"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Terminal, ArrowLeft, Info, RefreshCw } from "lucide-react";
import { settingsApi } from "../../../lib/api/settings";
import { DynamicCommand, DynamicCommandGroup } from "../../../lib/types/api";
import { CommandBlock } from "../../../components/ui/CommandBlock";
import { CardSkeleton } from "../../../components/ui/LoadingSkeleton";
import { ErrorState } from "../../../components/ui/ErrorState";

import { simulationsApi } from "../../../lib/api/simulations";
import { useToast } from "../../../components/ui/Toast";

export default function CommandsPage() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [commandGroups, setCommandGroups] = useState<DynamicCommandGroup[]>([]);
  const [runningCmd, setRunningCmd] = useState<string | null>(null);
  const { success, error } = useToast();

  const loadCommands = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await settingsApi.getDynamicCommands();
      
      // Handle both grouped format and flat array format
      if (Array.isArray(res)) {
        if (res.length > 0 && "commands" in res[0] && Array.isArray((res[0] as any).commands)) {
          setCommandGroups(res as unknown as DynamicCommandGroup[]);
        } else {
          // Group flat list of commands by category
          const groupedMap: Record<string, DynamicCommand[]> = {};
          (res as DynamicCommand[]).forEach((cmd) => {
            const cat = cmd.category || "General";
            if (!groupedMap[cat]) groupedMap[cat] = [];
            groupedMap[cat].push({
              ...cmd,
              title: cmd.title || cmd.target || cmd.id || "Command",
            });
          });

          const groups: DynamicCommandGroup[] = Object.keys(groupedMap).map((cat) => ({
            category: cat,
            commands: groupedMap[cat],
          }));
          setCommandGroups(groups);
        }
      } else {
        setCommandGroups([]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load dynamic operator commands.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommands();
  }, []);

  const handleExecuteSimulation = async (cmdStr: string, title?: string) => {
    try {
      setRunningCmd(cmdStr);
      let simType: "atomic" | "web" | "baseline" = "atomic";
      let simId = "T1082";

      if (cmdStr.includes("--technique")) {
        const match = cmdStr.match(/--technique\s+([A-Za-z0-9.]+)/);
        if (match) simId = match[1];
        simType = "atomic";
      } else if (cmdStr.includes("--scenario")) {
        const match = cmdStr.match(/--scenario\s+([A-Za-z0-9-]+)/);
        if (match) simId = match[1];
        simType = "web";
      } else if (cmdStr.includes("--baseline")) {
        simType = "baseline";
        simId = "BASELINE-AUTH";
      }

      const res = await simulationsApi.runSimulation(simType, simId, true);
      if (res.status === "COMPLETED") {
        success("Execution Succeeded", `${res.name || simId} triggered on Attack host.`);
      } else {
        error("Execution Notice", `Command exited with code ${res.exit_code}`);
      }
    } catch (err: any) {
      error("Execution Failed", err.message || "Could not execute command.");
    } finally {
      setRunningCmd(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <CardSkeleton />
        </div>
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorState
          title="Command Loading Error"
          message={errorMsg}
          onRetry={loadCommands}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/infrastructure"
            className="p-2 rounded bg-surface hover:bg-panel text-text-secondary hover:text-text-primary transition-colors border border-border-subtle"
            title="Back to Infrastructure"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-primary" />
              <h1 className="text-lg sm:text-xl font-bold text-text-primary font-mono">
                Operator Command Matrix
              </h1>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Live, dynamically-generated SSH, WinRM, and adversary simulation command strings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
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
          <strong>Secure SSH ProxyJump Ingress:</strong> Private nodes (Wazuh, Web Target, Windows, Attack) do not have public IPs. All commands route through the Bastion jumpbox using <code className="font-mono text-slate-200">~/.ssh/thedal_key</code>. Use the <strong>RUN</strong> button to trigger simulations instantly from the control plane or <strong>COPY</strong> to execute manually.
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
              {group.commands.map((cmd) => {
                const isSim = cmd.command.includes("run-atomic-test") || cmd.command.includes("run-web-test");
                return (
                  <CommandBlock
                    key={cmd.title || cmd.command}
                    title={cmd.title || cmd.target || "Command"}
                    description={cmd.description}
                    command={cmd.command}
                    onRun={isSim ? () => handleExecuteSimulation(cmd.command, cmd.title) : undefined}
                    isRunning={runningCmd === cmd.command}
                    runLabel="RUN"
                    runTitle="Execute this simulation directly on the Attack host"
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
