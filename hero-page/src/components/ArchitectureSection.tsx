import React, { useState } from 'react';
import {
  Server,
  Shield,
  Terminal,
  Globe,
  Database,
  Cpu,
  Layers,
  ArrowRight,
  Check,
  Lock,
  ExternalLink,
  Code
} from 'lucide-react';

export const ArchitectureSection: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<'bastion' | 'wazuh' | 'windows' | 'web' | 'attack'>('wazuh');

  const nodes = {
    bastion: {
      id: 'bastion',
      name: 'THEDAL-bastion',
      role: 'Public Bastion & Forward Proxy',
      type: 't3.micro (Ubuntu 22.04 LTS)',
      subnet: 'Management Tier (10.10.1.0/24)',
      staticIp: '10.10.1.10',
      publicIp: 'Allocated Elastic IPv4',
      ports: ['22 (SSH Ingress)', '3128 (Squid Proxy)'],
      services: [
        'Hardened SSH Daemon with Public Key Auth',
        'Tinyproxy / Squid Forward Proxy (:3128) for zero NAT Gateway costs',
        'ProxyJump Gateway for all private internal VPC traffic',
      ],
      telemetry: 'SSH Authentication Logs (`auth.log`) & Proxy Access Logs',
      badge: 'Public Edge Ingress',
      badgeColor: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10',
    },
    wazuh: {
      id: 'wazuh',
      name: 'THEDAL-wazuh',
      role: 'Wazuh SIEM Core & OpenSearch Indexer',
      type: 't3.xlarge (Ubuntu 22.04 LTS)',
      subnet: 'SOC Operations Tier (10.10.10.0/24)',
      staticIp: '10.10.10.10',
      publicIp: 'None (Private Ingress via Bastion)',
      ports: ['1514 (Agent Telemetry)', '1515 (Auth)', '55000 (API)', '9200 (OpenSearch)', '443 (Dashboard)'],
      services: [
        'Wazuh 4.14.7 Manager Engine (Decoders & Detection Rules)',
        'OpenSearch 2.x Indexer (Dedicated time-series indices)',
        'OpenSearch Dashboards with direct `/app/wz-home` routing',
        'Filebeat Ingest Pipeline with source-routed event mapping',
      ],
      telemetry: 'Aggregated `wazuh-alerts-*`, Sysmon, Nginx, Auditd indices',
      badge: 'SIEM Core',
      badgeColor: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    },
    windows: {
      id: 'windows',
      name: 'THEDAL-windows',
      role: 'Instrumented Windows Server Endpoint',
      type: 't3.small (Windows Server 2022 Datacenter)',
      subnet: 'SOC Operations Tier (10.10.10.0/24)',
      staticIp: '10.10.10.20',
      publicIp: 'None (Private Ingress via Bastion)',
      ports: ['5985 (WinRM Tunnel)', '3389 (RDP Tunnel)', '1514 (Wazuh Outbound)'],
      services: [
        'Microsoft Sysmon v15.15 with customized high-fidelity XML config',
        'PowerShell ScriptBlock Logging (Event ID 4104) & Module Logging',
        'Enhanced Windows Security Auditing (auditpol Process Creation with CLI)',
        'Wazuh Windows Agent v4.14.7 (Agent ID 001/003)',
      ],
      telemetry: '`socforge-sysmon-*`, `socforge-powershell-*`, `socforge-windows-security-*`',
      badge: 'Endpoint Target',
      badgeColor: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
    },
    web: {
      id: 'web',
      name: 'THEDAL-web',
      role: 'Vulnerable Linux Web Target & Containers',
      type: 't3.micro (Ubuntu 22.04 LTS)',
      subnet: 'Web Target Tier (10.10.30.0/24)',
      staticIp: '10.10.30.10',
      publicIp: 'None (Private Ingress via Bastion)',
      ports: ['8000 (DVWA Web App)', '3000 (OWASP Juice Shop)', '1514 (Wazuh Outbound)'],
      services: [
        'Nginx Reverse Proxy with detailed HTTP header & access logging',
        'Damn Vulnerable Web Application (DVWA on port 8000: SQLi, Command Injection, LFI)',
        'OWASP Juice Shop containerized in Docker on port 3000',
        'Linux Kernel `auditd` with execve syscall monitoring',
      ],
      telemetry: '`socforge-nginx-access-*`, `socforge-auditd-*`, `socforge-juice-shop-*`',
      badge: 'Web Target',
      badgeColor: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
    },
    attack: {
      id: 'attack',
      name: 'THEDAL-attack',
      role: 'Adversary Simulation Launchpad',
      type: 't3.micro (Ubuntu 22.04 LTS)',
      subnet: 'Attack Subnet Tier (10.10.20.0/24)',
      staticIp: '10.10.20.10',
      publicIp: 'None (Private Ingress via Bastion)',
      ports: ['22 (SSH Ingress via ProxyJump)'],
      services: [
        'Atomic Red Team Framework (`Invoke-AtomicRedTeam`) with curated atomics',
        'Automated Python & Curl web exploit testing harness',
        'Controlled wrapper CLI `/usr/local/bin/run-atomic-test` & `run-web-test`',
        'Safety interlocks restricting emulation strictly to internal VPC nodes',
      ],
      telemetry: 'Adversary execution audit logs in SQLite & `/var/log/socforge/`',
      badge: 'Red Team Engine',
      badgeColor: 'border-rose-500/40 text-rose-400 bg-rose-500/10',
    },
  };

  const active = nodes[selectedNode];

  return (
    <section id="architecture" className="py-20 lg:py-28 bg-[#030712] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
            <Layers className="w-3.5 h-3.5" />
            <span>CLOUD TOPOLOGY & INFRASTRUCTURE</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-white tracking-tight">
            Deterministic 5-Node <span className="text-gradient-emerald">AWS Range Architecture</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            All nodes are isolated within private subnets in an AWS Virtual Private Cloud (`10.10.0.0/16`) with guaranteed, deterministic static internal private IPs.
          </p>
        </div>

        {/* Interactive Node Selector Grid */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {Object.values(nodes).map((node) => {
            const isSelected = selectedNode === node.id;
            return (
              <button
                key={node.id}
                onClick={() => setSelectedNode(node.id as any)}
                className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                  isSelected
                    ? 'bg-[#0b172e] border-cyan-400 shadow-[0_0_20px_rgba(0,242,254,0.25)] scale-[1.02]'
                    : 'bg-[#060e1d] border-slate-800 hover:border-slate-700 hover:bg-[#081326]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${node.badgeColor}`}>
                    {node.badge}
                  </span>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />}
                </div>
                <div className="mt-3 font-mono font-bold text-sm sm:text-base text-white truncate">
                  {node.name}
                </div>
                <div className="mt-1 text-[11px] font-mono text-cyan-300 font-semibold">
                  {node.staticIp}
                </div>
                <div className="mt-1 text-[10px] text-slate-400 line-clamp-1">
                  {node.role}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Selected Node Card */}
        <div className="mt-8 rounded-2xl border border-slate-800 bg-[#060e1f] p-6 sm:p-8 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Info Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl sm:text-2xl font-bold font-mono text-white">
                      {active.name}
                    </h3>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${active.badgeColor}`}>
                      {active.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono mt-1">
                    {active.role}
                  </p>
                </div>
                <div className="text-right font-mono text-xs">
                  <div className="text-slate-400 text-[10px] uppercase">Static Private IP</div>
                  <div className="text-cyan-400 font-bold text-sm">{active.staticIp}</div>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Instance Sizing & OS:</span>
                  <strong className="text-slate-200">{active.type}</strong>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">VPC Subnet Tier:</span>
                  <strong className="text-slate-200">{active.subnet}</strong>
                </div>
              </div>

              {/* Key Services & Capabilities */}
              <div className="space-y-2">
                <div className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                  Configured Services & Tooling:
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  {active.services.map((svc, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{svc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Telemetry & Ports Column */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="text-slate-300 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Network Ports & Protocols</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {active.ports.map((port, i) => (
                    <span key={i} className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-[11px] text-cyan-300 font-medium">
                      {port}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 font-mono text-xs">
                <div className="text-slate-300 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ingested Telemetry Stream</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {active.telemetry}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-cyan-200 space-y-1">
                <div className="font-bold font-mono text-[11px] text-cyan-300">
                  🔒 Zero Secret Exposure Guarantee
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  All nodes route non-interactively via SSH ProxyJump through the Bastion jumpbox. Secrets are injected at runtime and never committed to source control.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
