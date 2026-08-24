import React from 'react';
import {
  Search,
  Network,
  Zap,
  Lock,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export const ProjectOverview: React.FC = () => {
  const comparison = [
    {
      dimension: 'Investigation Telemetry',
      ctf: 'Static pre-recorded PCAP dump or CSV log file',
      thedal: 'Live streaming endpoint & network telemetry indexed in OpenSearch',
    },
    {
      dimension: 'Process Lineage Visibility',
      ctf: 'Opaque binary without parent/child process tree',
      thedal: 'Full Sysmon EventID 1 parent-child process tree, hashes & CLI args',
    },
    {
      dimension: 'Multi-Source Correlation',
      ctf: 'Single isolated log file without cross-host context',
      thedal: 'Correlates Windows EventLogs, Linux auditd, Nginx & Docker JSON in Wazuh',
    },
    {
      dimension: 'Adversary Simulation',
      ctf: 'Static scripted flags (flag searching)',
      thedal: '1-Click live execution of real Atomic Red Team & web payloads',
    },
    {
      dimension: 'Infrastructure Realism',
      ctf: 'Monolithic single container with mocked network',
      thedal: '5-node production-grade AWS VPC with deterministic static subnets',
    },
  ];

  const pillars = [
    {
      title: 'Authentic Threat Hunting',
      description:
        'Hunt real adversary techniques across process creation trees (Sysmon EID 1), ScriptBlock de-obfuscation (EID 4104), and credential access hooks (EID 10).',
      icon: Search,
      tag: 'Endpoint Telemetry',
    },
    {
      title: 'Multi-Source Correlation',
      description:
        'Trace an attacker as they pivot from an Nginx web exploit (DVWA/Juice Shop) through Linux kernel syscalls (`auditd`) over to a Windows Server endpoint.',
      icon: Network,
      tag: 'Full Spectrum',
    },
    {
      title: '1-Click Adversary Emulation',
      description:
        'Execute allowlisted Atomic Red Team MITRE ATT&CK techniques with 1 click directly from the Web Control Plane without touching SSH keys or manual scripts.',
      icon: Zap,
      tag: 'Automation',
    },
    {
      title: 'Zero NAT Gateway Cost',
      description:
        'Saves ~$32+/month in AWS managed NAT charges by channeling private subnet package management through an integrated forward proxy on the Bastion jumpbox.',
      icon: Lock,
      tag: 'Cloud Engineering',
    },
  ];

  return (
    <section id="overview" className="py-20 lg:py-28 bg-[#08090b] relative border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#12151a] border border-white/[0.08] text-[11px] font-mono tracking-wide-eyebrow text-[#8E959F] uppercase">
            <span>Project Mission</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium tracking-tight-title text-[#F5F7FA]">
            Built for realistic frontline SOC operations.
          </h2>
          <p className="text-sm sm:text-base text-[#8E959F] leading-relaxed">
            Traditional cybersecurity education relies heavily on static CTF flags and passive multiple-choice tests. THEDAL creates an authentic, observable enterprise environment where defenders hunt live intrusions.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="p-6 rounded-xl bg-[#0d0f12] border border-white/[0.08] hover:border-white/[0.14] transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded bg-[#12151a] border border-white/[0.08] flex items-center justify-center text-[#4F8CFF]">
                  <pillar.icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#12151a] border border-white/[0.06] text-[#8E959F]">
                  {pillar.tag}
                </span>
              </div>
              <h3 className="text-base font-semibold text-[#F5F7FA]">
                {pillar.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#8E959F] leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTF vs THEDAL Comparison Table */}
        <div className="mt-14 sm:mt-16">
          <div className="rounded-xl border border-white/[0.08] bg-[#0d0f12] overflow-hidden">
            <div className="p-5 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-[#F5F7FA]">
                  Static CTFs vs. THEDAL Live Range
                </h3>
                <p className="text-xs text-[#8E959F] mt-0.5">
                  How an authentic telemetry range fundamentally changes the threat hunting learning experience
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#4F8CFF] px-2 py-0.5 rounded bg-[#12151a] border border-white/[0.08] self-start sm:self-auto">
                SOC Readiness
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-[#090b0e] font-mono text-[#8E959F] text-[11px]">
                    <th className="py-3 px-4 sm:px-6 font-medium">Dimension</th>
                    <th className="py-3 px-4 sm:px-6 font-medium text-[#FF5A5F]">
                      Traditional CTFs & Static Logs
                    </th>
                    <th className="py-3 px-4 sm:px-6 font-medium text-[#4ADE80]">
                      THEDAL Cloud Range
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {comparison.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#12151a]/50 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-medium text-[#F5F7FA]">
                        {item.dimension}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-[#8E959F] leading-relaxed">
                        {item.ctf}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-[#F5F7FA] leading-relaxed">
                        {item.thedal}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
