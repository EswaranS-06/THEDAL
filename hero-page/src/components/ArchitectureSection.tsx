import React, { useState } from 'react';
import {
  Server,
  Terminal,
  Database,
  Check,
  Lock,
  Layers,
} from 'lucide-react';
import { RangeArchitecture } from './architecture/RangeArchitecture';

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
        'Squid Forward Proxy (:3128) for zero NAT Gateway costs',
        'ProxyJump Gateway for all private internal VPC traffic',
      ],
      telemetry: 'SSH Authentication Logs (`auth.log`) & Proxy Access Logs',
      badge: 'Public Edge',
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
        'Wazuh 4.7 Manager Engine (Decoders & Detection Rules)',
        'OpenSearch 2.x Indexer (Dedicated time-series indices)',
        'OpenSearch Dashboards with direct `/app/wz-home` routing',
        'Filebeat Ingest Pipeline with source-routed event mapping',
      ],
      telemetry: 'Aggregated `wazuh-alerts-*`, Sysmon, Nginx, Auditd indices',
      badge: 'SIEM Core',
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
        'Enhanced Windows Security Auditing (Process Creation with Command Lines)',
        'Wazuh Windows Agent v4.7',
      ],
      telemetry: '`socforge-sysmon-*`, `socforge-powershell-*`, `socforge-windows-security-*`',
      badge: 'Endpoint Target',
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
        'Damn Vulnerable Web Application (DVWA: SQLi, Command Injection, LFI)',
        'OWASP Juice Shop containerized in Docker on port 3000',
        'Linux Kernel `auditd` with execve syscall monitoring',
      ],
      telemetry: '`socforge-nginx-access-*`, `socforge-auditd-*`, `socforge-juice-shop-*`',
      badge: 'Web Target',
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
    },
  };

  const active = nodes[selectedNode];

  return (
    <section id="architecture" className="py-20 lg:py-28 bg-[#08090b] relative border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#12151a] border border-white/[0.08] text-[11px] font-mono tracking-wide-eyebrow text-[#8E959F] uppercase">
            <span>Cloud Infrastructure</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium tracking-tight-title text-[#F5F7FA]">
            Deterministic 5-Node AWS Range Architecture
          </h2>
          <p className="text-sm sm:text-base text-[#8E959F] leading-relaxed">
            All nodes are isolated within private subnets in an AWS Virtual Private Cloud (`10.10.0.0/16`) with guaranteed, deterministic static internal private IPs.
          </p>
        </div>

        {/* 1. New Interactive Architecture & Data Flow Visualization */}
        <div className="mt-10">
          <RangeArchitecture
            selectedNodeId={selectedNode}
            onSelectNode={setSelectedNode}
          />
        </div>

        {/* 2. Interactive Node Selector Bar (Existing Five Node Cards) */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.values(nodes).map((node) => {
            const isSelected = selectedNode === node.id;
            return (
              <button
                key={node.id}
                onClick={() => setSelectedNode(node.id as any)}
                className={`p-3.5 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'bg-[#12151a] border-[#4F8CFF]/60 text-[#F5F7FA] shadow-sm'
                    : 'bg-[#0d0f12] border-white/[0.08] hover:border-white/[0.14] text-[#8E959F]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#08090b] border border-white/[0.06]">
                    {node.badge}
                  </span>
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#4F8CFF]" />}
                </div>
                <div className="mt-2.5 font-mono font-medium text-xs sm:text-sm text-[#F5F7FA] truncate">
                  {node.name}
                </div>
                <div className="mt-0.5 text-[11px] font-mono text-[#4F8CFF]">
                  {node.staticIp}
                </div>
              </button>
            );
          })}
        </div>

        {/* 3. Detailed Selected Node View (Existing Node Details) */}
        <div className="mt-6 rounded-xl border border-white/[0.08] bg-[#0d0f12] p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Info Column */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-semibold font-mono text-[#F5F7FA]">
                      {active.name}
                    </h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#12151a] border border-white/[0.08] text-[#8E959F]">
                      {active.badge}
                    </span>
                  </div>
                  <p className="text-xs text-[#8E959F] font-mono mt-1">
                    {active.role}
                  </p>
                </div>
                <div className="text-right font-mono text-xs">
                  <div className="text-[#525866] text-[10px] uppercase">Static Private IP</div>
                  <div className="text-[#4F8CFF] font-semibold text-sm">{active.staticIp}</div>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded bg-[#12151a] border border-white/[0.06]">
                  <span className="text-[#525866] block text-[10px]">Instance Sizing & OS</span>
                  <strong className="text-[#F5F7FA]">{active.type}</strong>
                </div>
                <div className="p-3 rounded bg-[#12151a] border border-white/[0.06]">
                  <span className="text-[#525866] block text-[10px]">VPC Subnet Tier</span>
                  <strong className="text-[#F5F7FA]">{active.subnet}</strong>
                </div>
              </div>

              {/* Configured Services */}
              <div className="space-y-2 font-mono text-xs">
                <div className="text-[10px] uppercase tracking-wider text-[#525866] font-semibold">
                  Configured Services & Tooling:
                </div>
                <ul className="space-y-1.5 text-xs text-[#8E959F]">
                  {active.services.map((svc, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#4ADE80] shrink-0 mt-0.5" />
                      <span className="text-[#F5F7FA]">{svc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Telemetry & Ports Column */}
            <div className="lg:col-span-5 space-y-3 font-mono text-xs">
              <div className="p-4 rounded-lg bg-[#08090b] border border-white/[0.06] space-y-2">
                <div className="text-[#525866] font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3 h-3 text-[#4F8CFF]" />
                  <span>Network Ports</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {active.ports.map((port, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-[#12151a] border border-white/[0.06] text-[11px] text-[#F5F7FA]">
                      {port}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#08090b] border border-white/[0.06] space-y-1.5">
                <div className="text-[#525866] font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3 h-3 text-[#4ADE80]" />
                  <span>Telemetry Stream</span>
                </div>
                <p className="text-[#8E959F] text-xs leading-relaxed">
                  {active.telemetry}
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#12151a] border border-white/[0.06] text-xs space-y-1">
                <div className="font-semibold text-[11px] text-[#4F8CFF] flex items-center gap-1.5">
                  <Lock className="w-3 h-3" />
                  <span>Zero Secret Exposure</span>
                </div>
                <p className="text-[11px] text-[#8E959F] leading-relaxed">
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
