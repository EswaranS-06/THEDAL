"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Server,
  Network,
  Terminal,
  Play,
  Square,
  DollarSign,
  Shield,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { awsApi } from "../../lib/api/aws";
import { EC2InstanceInfo, NetworkTopology } from "../../lib/types/api";
import { DataTable, Column } from "../../components/ui/DataTable";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { CardSkeleton } from "../../components/ui/LoadingSkeleton";
import { ErrorState } from "../../components/ui/ErrorState";
import { useToast } from "../../components/ui/Toast";

export default function InfrastructurePage() {
  const router = useRouter();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [instances, setInstances] = useState<EC2InstanceInfo[]>([]);
  const [network, setNetwork] = useState<NetworkTopology | null>(null);

  const [dialog, setDialog] = useState<{
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
      const res = await awsApi.getResources();
      setInstances(res.instances || []);
      setNetwork(res.network || null);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load infrastructure data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartFleet = () => {
    setDialog({
      isOpen: true,
      title: "Start EC2 Fleet",
      description: "This will start all stopped THEDAL EC2 virtual machines via the AWS API.",
      action: async () => {
        setIsExecuting(true);
        try {
          const res = await awsApi.startInstances();
          success("Fleet Start Initiated", res.message);
          setDialog((prev) => ({ ...prev, isOpen: false }));
          setTimeout(loadData, 3000);
        } catch (err: any) {
          error("Start Failed", err.message);
        } finally {
          setIsExecuting(false);
        }
      },
    });
  };

  const handleStopFleet = () => {
    setDialog({
      isOpen: true,
      title: "Stop EC2 Fleet (Safe Pause)",
      description: "This will safely stop all running EC2 instances to halt compute charges. EBS storage and state are preserved.",
      action: async () => {
        setIsExecuting(true);
        try {
          const res = await awsApi.stopInstances();
          success("Fleet Stop Initiated", res.message);
          setDialog((prev) => ({ ...prev, isOpen: false }));
          setTimeout(loadData, 3000);
        } catch (err: any) {
          error("Stop Failed", err.message);
        } finally {
          setIsExecuting(false);
        }
      },
    });
  };

  const columns: Column<EC2InstanceInfo>[] = [
    {
      key: "name",
      header: "Host Name",
      sortable: true,
      render: (i) => (
        <span className="font-mono font-medium text-slate-200">{i.name}</span>
      ),
    },
    {
      key: "role",
      header: "Role / Workload",
      sortable: true,
      render: (i) => <span className="text-slate-300">{i.role}</span>,
    },
    {
      key: "state",
      header: "State",
      sortable: true,
      render: (i) => <StatusBadge status={i.state.toUpperCase()} size="sm" />,
    },
    {
      key: "instance_type",
      header: "Type",
      sortable: true,
      render: (i) => <span className="font-mono text-slate-400">{i.instance_type}</span>,
    },
    {
      key: "private_ip",
      header: "Private IP",
      sortable: true,
      render: (i) => <span className="font-mono text-slate-300">{i.private_ip}</span>,
    },
    {
      key: "public_ip",
      header: "Public IP",
      sortable: true,
      render: (i) => (
        <span className="font-mono text-slate-400">{i.public_ip || "—"}</span>
      ),
    },
    {
      key: "health",
      header: "Health",
      sortable: true,
      render: (i) => <StatusBadge status={i.health} size="sm" />,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (i) => {
        const hostKey = i.name
          .toLowerCase()
          .replace("thedal-", "")
          .replace("thedal_", "")
          .replace("socforge-", "")
          .replace("socforge_", "");
        return (
          <Link
            href={`/infrastructure/${hostKey}`}
            className="text-primary hover:underline text-xs"
          >
            Details
          </Link>
        );
      },
    },
  ];

  if (loading && instances.length === 0) {
    return (
      <div className="space-y-6">
        <CardSkeleton className="h-48" />
        <CardSkeleton className="h-64" />
      </div>
    );
  }

  if (errorMsg && instances.length === 0) {
    return (
      <ErrorState
        title="Failed to Load Infrastructure"
        message={errorMsg}
        isOffline={true}
        onRetry={loadData}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Commands */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100">
            Cloud Compute Fleet & VPC Topology
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time AWS EC2 instances, subnet routing boundaries, and dynamic connection credentials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/infrastructure/commands"
            className="px-3 py-1.5 rounded bg-muted hover:bg-slate-700 text-xs font-medium text-slate-200 border border-border-default transition-colors flex items-center gap-1.5"
          >
            <Terminal className="w-3.5 h-3.5 text-primary" />
            <span>Dynamic Commands</span>
          </Link>
          <button
            onClick={handleStartFleet}
            disabled={isExecuting}
            className="px-3 py-1.5 rounded bg-emerald-950/60 hover:bg-emerald-900/80 text-xs font-medium text-emerald-300 border border-emerald-800/40 transition-colors flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Start Fleet</span>
          </button>
          <button
            onClick={handleStopFleet}
            disabled={isExecuting}
            className="px-3 py-1.5 rounded bg-amber-950/60 hover:bg-amber-900/80 text-xs font-medium text-amber-300 border border-amber-800/40 transition-colors flex items-center gap-1.5"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Stop Fleet (Pause)</span>
          </button>
        </div>
      </div>

      {/* EC2 Inventory Data Table */}
      <div className="space-y-3">
        <DataTable
          data={instances}
          columns={columns}
          keyExtractor={(i) => i.instance_id || i.name}
          searchPlaceholder="Filter hosts by name, role, IP, or state..."
          searchFilter={(item, q) =>
            item.name.toLowerCase().includes(q) ||
            item.role.toLowerCase().includes(q) ||
            item.private_ip.toLowerCase().includes(q) ||
            (item.public_ip && item.public_ip.toLowerCase().includes(q)) ||
            item.state.toLowerCase().includes(q)
          }
          onRowClick={(item) => {
            const hostKey = item.name
              .toLowerCase()
              .replace("thedal-", "")
              .replace("thedal_", "")
              .replace("socforge-", "")
              .replace("socforge_", "");
            router.push(`/infrastructure/${hostKey}`);
          }}
        />
      </div>

      {/* 2-Column Split: VPC Subnets & Cost Advisory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* VPC & Subnet Routing */}
        <div className="rounded border border-border-subtle bg-card/60 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <Network className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                VPC Network Segments
              </h3>
            </div>
            <span className="font-mono text-[11px] text-slate-400">
              VPC: {network?.vpc_id || "vpc-configured"} ({network?.vpc_cidr || "10.10.0.0/16"})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border-subtle bg-surface/50 text-slate-400 uppercase text-[10px]">
                  <th className="py-2 px-3">Subnet Name</th>
                  <th className="py-2 px-3">CIDR Block</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Zone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/40">
                {network?.subnets && network.subnets.length > 0 ? (
                  network.subnets.map((s) => (
                    <tr key={s.id || s.name} className="hover:bg-card-hover/40">
                      <td className="py-2 px-3 font-medium text-slate-200">{s.name}</td>
                      <td className="py-2 px-3 font-mono text-slate-300">{s.cidr}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            s.is_public
                              ? "bg-blue-950/60 text-blue-300 border border-blue-800/40"
                              : "bg-muted text-slate-400 border border-border-subtle"
                          }`}
                        >
                          {s.is_public ? "PUBLIC" : "PRIVATE"}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-400 text-[11px]">{s.az}</td>
                    </tr>
                  ))
                ) : (
                  <>
                    <tr className="hover:bg-card-hover/40">
                      <td className="py-2 px-3 font-medium text-slate-200">Management (Bastion)</td>
                      <td className="py-2 px-3 font-mono text-slate-300">10.10.1.0/24</td>
                      <td className="py-2 px-3">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40">
                          PUBLIC
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-400 text-[11px]">ap-south-1a</td>
                    </tr>
                    <tr className="hover:bg-card-hover/40">
                      <td className="py-2 px-3 font-medium text-slate-200">SOC Subnet (Wazuh)</td>
                      <td className="py-2 px-3 font-mono text-slate-300">10.10.10.0/24</td>
                      <td className="py-2 px-3">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-slate-400 border border-border-subtle">
                          PRIVATE
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-400 text-[11px]">ap-south-1a</td>
                    </tr>
                    <tr className="hover:bg-card-hover/40">
                      <td className="py-2 px-3 font-medium text-slate-200">Target Subnet (Web / Win)</td>
                      <td className="py-2 px-3 font-mono text-slate-300">10.10.20.0/24</td>
                      <td className="py-2 px-3">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-slate-400 border border-border-subtle">
                          PRIVATE
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-400 text-[11px]">ap-south-1a</td>
                    </tr>
                    <tr className="hover:bg-card-hover/40">
                      <td className="py-2 px-3 font-medium text-slate-200">Attack Subnet</td>
                      <td className="py-2 px-3 font-mono text-slate-300">10.10.30.0/24</td>
                      <td className="py-2 px-3">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-slate-400 border border-border-subtle">
                          PRIVATE
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-400 text-[11px]">ap-south-1a</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cloud Cost & Architecture Policy */}
        <div className="rounded border border-border-subtle bg-card/60 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Cost & Safety Architecture
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
              Zero NAT Gateway
            </span>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
            <div className="p-2.5 rounded bg-surface/60 border border-border-subtle/50 space-y-1">
              <div className="font-semibold text-slate-200">Zero NAT Gateway Policy</div>
              <p className="text-[11px] text-slate-400">
                Eliminates the ~$32+/month AWS managed NAT Gateway charge. Private subnets egress package downloads through the Bastion Squid proxy.
              </p>
            </div>
            <div className="p-2.5 rounded bg-surface/60 border border-border-subtle/50 space-y-1">
              <div className="font-semibold text-slate-200">Single Public IPv4</div>
              <p className="text-[11px] text-slate-400">
                Only the Bastion host receives a public IP. All other VMs are isolated in private subnets and accessed via SSH ProxyJump.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={dialog.isOpen}
        title={dialog.title}
        description={dialog.description}
        isLoading={isExecuting}
        onConfirm={dialog.action}
        onCancel={() => setDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
