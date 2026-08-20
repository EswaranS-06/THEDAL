"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Server,
  ArrowLeft,
  Activity,
  Layers,
  Terminal,
} from "lucide-react";
import { awsApi } from "../../../lib/api/aws";
import { settingsApi } from "../../../lib/api/settings";
import { HostDetailInfo, DynamicCommand } from "../../../lib/types/api";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { CommandBlock } from "../../../components/ui/CommandBlock";
import { CardSkeleton } from "../../../components/ui/LoadingSkeleton";
import { ErrorState } from "../../../components/ui/ErrorState";

export default function HostDetailPage() {
  const params = useParams();
  const hostKey = (params?.host as string) || "";

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [host, setHost] = useState<HostDetailInfo | null>(null);
  const [commands, setCommands] = useState<DynamicCommand[]>([]);

  const loadHostData = useCallback(async () => {
    if (!hostKey) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const [hostRes, cmdRes] = await Promise.all([
        awsApi.getHostDetail(hostKey),
        settingsApi.getDynamicCommands().catch(() => []),
      ]);
      setHost(hostRes);

      // Normalize commands list (handle flat array or grouped format)
      let flatCmds: DynamicCommand[] = [];
      if (Array.isArray(cmdRes)) {
        if (cmdRes.length > 0 && "commands" in cmdRes[0] && Array.isArray((cmdRes[0] as any).commands)) {
          flatCmds = (cmdRes as any).flatMap((g: any) => g.commands || []);
        } else {
          flatCmds = (cmdRes as DynamicCommand[]).map((c) => ({
            ...c,
            title: c.title || c.target || c.id || "Command",
          }));
        }
      }
      setCommands(flatCmds);
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to load details for host '${hostKey}'.`);
    } finally {
      setLoading(false);
    }
  }, [hostKey]);

  useEffect(() => {
    loadHostData();
  }, [loadHostData]);

  if (loading && !host) {
    return (
      <div className="space-y-6">
        <CardSkeleton className="h-24" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton className="h-64" />
          <CardSkeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (errorMsg || !host) {
    return (
      <div className="space-y-4">
        <Link
          href="/infrastructure"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Fleet Inventory</span>
        </Link>
        <ErrorState
          title={`Host '${hostKey}' Not Found`}
          message={errorMsg || "Unable to retrieve telemetry for this host."}
          onRetry={loadHostData}
        />
      </div>
    );
  }

  // Filter commands relevant to this host
  const relevantCommands = commands.filter((c) => {
    const hostLower = host.key.toLowerCase();
    const targetHostLower = (c.target_host || "").toLowerCase();
    const titleLower = (c.title || "").toLowerCase();
    const targetLower = (c.target || "").toLowerCase();
    const descLower = (c.description || "").toLowerCase();
    const idLower = (c.id || "").toLowerCase();

    return (
      targetHostLower === hostLower ||
      targetHostLower.includes(hostLower) ||
      titleLower.includes(hostLower) ||
      targetLower.includes(hostLower) ||
      descLower.includes(hostLower) ||
      idLower.includes(hostLower) ||
      (hostLower === "bastion" && (idLower.includes("bastion") || titleLower.includes("bastion"))) ||
      (hostLower === "wazuh" && (idLower.includes("wazuh") || titleLower.includes("wazuh") || titleLower.includes("siem"))) ||
      (hostLower === "windows" && (idLower.includes("windows") || idLower.includes("winrm") || titleLower.includes("winrm"))) ||
      (hostLower === "web" && (idLower.includes("web") || titleLower.includes("web") || descLower.includes("dvwa") || descLower.includes("juice"))) ||
      (hostLower === "attack" && (idLower.includes("attack") || titleLower.includes("attack") || descLower.includes("atomic")))
    );
  });

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="space-y-2">
        <Link
          href="/infrastructure"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Fleet Inventory</span>
        </Link>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-card border border-border-default flex items-center justify-center text-primary font-mono text-base font-bold">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100 font-mono">{host.name}</h2>
                <StatusBadge status={host.state.toUpperCase()} size="sm" />
                <StatusBadge status={host.health} size="sm" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{host.role}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-surface px-3 py-1.5 rounded border border-border-subtle">
            <span>ID:</span>
            <span className="text-slate-200 font-semibold">{host.instance_id}</span>
          </div>
        </div>
      </div>

      {/* 2-Column Split: Host Identity & Network / Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identity & Network */}
        <div className="rounded border border-border-subtle bg-card/60 p-4 space-y-4">
          <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
            <Layers className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Host Specification & Networking
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded bg-surface/60 border border-border-subtle/50">
              <div className="text-[11px] text-slate-500">Instance Type</div>
              <div className="font-mono text-slate-200 font-medium mt-0.5">{host.instance_type}</div>
            </div>
            <div className="p-2.5 rounded bg-surface/60 border border-border-subtle/50">
              <div className="text-[11px] text-slate-500">Availability Zone</div>
              <div className="font-mono text-slate-200 font-medium mt-0.5">{host.availability_zone || "ap-south-1a"}</div>
            </div>
            <div className="p-2.5 rounded bg-surface/60 border border-border-subtle/50">
              <div className="text-[11px] text-slate-500">Private IP</div>
              <div className="font-mono text-emerald-400 font-medium mt-0.5">{host.private_ip}</div>
            </div>
            <div className="p-2.5 rounded bg-surface/60 border border-border-subtle/50">
              <div className="text-[11px] text-slate-500">Public IP</div>
              <div className="font-mono text-blue-400 font-medium mt-0.5">{host.public_ip || "None (Private Subnet)"}</div>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="text-[11px] text-slate-400 font-medium">Operating System & Purpose</div>
            <div className="p-2.5 rounded bg-surface/60 border border-border-subtle/50 text-slate-300 leading-relaxed text-xs">
              <div className="font-semibold text-slate-200">{host.os}</div>
              <div className="text-slate-400 mt-1 text-[11px]">{host.purpose}</div>
            </div>
          </div>
        </div>

        {/* Running Services & Security Telemetry */}
        <div className="rounded border border-border-subtle bg-card/60 p-4 space-y-4">
          <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Running Services & Telemetry Ingest
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            {host.services.length === 0 ? (
              <div className="text-xs text-slate-500 italic p-4 text-center">
                No telemetry services configured.
              </div>
            ) : (
              host.services.map((svc) => (
                <div
                  key={svc.name}
                  className="flex items-center justify-between p-2.5 rounded bg-surface/60 border border-border-subtle/50"
                >
                  <div>
                    <div className="font-medium text-slate-200">{svc.name}</div>
                    <div className="text-[11px] text-slate-400">
                      Port: <span className="font-mono text-slate-300">{svc.port}</span> • Type: {svc.type}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                    {svc.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Relevant Operator Connection Commands */}
      <div className="rounded border border-border-subtle bg-card/60 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Operator Connection Commands for {host.name}
            </h3>
          </div>
          <Link
            href="/infrastructure/commands"
            className="text-xs text-primary hover:underline"
          >
            All Dynamic Commands
          </Link>
        </div>

        <div className="space-y-3">
          {relevantCommands.length === 0 ? (
            <div className="text-xs text-slate-400 italic">
              Use standard ProxyJump command from Dynamic Command Center.
            </div>
          ) : (
            relevantCommands.map((cmd) => (
              <CommandBlock
                key={cmd.title || cmd.command}
                title={cmd.title || cmd.target || "Command"}
                description={cmd.description}
                command={cmd.command}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
