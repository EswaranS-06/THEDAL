import React from 'react';
import {
  ShieldAlert,
  GitBranch,
  Network,
  Cpu,
  CheckCircle,
  XCircle,
  Layers,
  ArrowRight,
  Search,
  Sparkles,
  Lock,
  Zap,
} from 'lucide-react';

export const ProjectOverview: React.FC = () => {
  const comparison = [
    {
      feature: 'Investigation Telemetry',
      ctf: 'Static pre-recorded PCAP or static CSV log dump',
      thedal: 'Live streaming endpoint & network events in OpenSearch',
    },
    {
      feature: 'Process Lineage Visibility',
      ctf: 'Opaque binary without parent/child PID tree',
      thedal: 'Full Sysmon EventID 1 parent-child process lineage & hashes',
    },
    {
      feature: 'Multi-Source Correlation',
      ctf: 'Single isolated log file without context',
      thedal: 'Correlates Windows EventLogs, Linux auditd, Nginx & Docker JSON',
    },
    {
      feature: 'Adversary Simulation',
      ctf: 'Pre-canned scripted answers (flag searching)',
      thedal: '1-Click live execution of real Atomic Red Team & web payloads',
    },
    {
      feature: 'Infrastructure Realism',
      ctf: 'Monolithic single container with fake ports',
      thedal: '5-node production-grade AWS VPC with isolated security tiers',
    },
  ];

  const pillars = [
    {
      title: 'Authentic Threat Hunting',
      description:
        'Hunt real adversary techniques across process creation trees (Sysmon EID 1), ScriptBlock de-obfuscation (EID 4104), and credential access safety hooks (EID 10).',
      icon: Search,
      badge: 'Endpoint Telemetry',
      gradient: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30',
      iconColor: 'text-cyan-400',
    },
    {
      title: 'Multi-Source Correlation',
      description:
        'Trace an attacker as they pivot from an Nginx web exploit (DVWA/Juice Shop) through Linux kernel syscalls (`auditd`) over to a Windows Server endpoint.',
      icon: Network,
      badge: 'Full Spectrum',
      gradient: 'from-purple-500/20 to-pink-500/10 border-purple-500/30',
      iconColor: 'text-purple-400',
    },
    {
      title: '1-Click Adversary Emulation',
      description:
        'Execute allowlisted Atomic Red Team MITRE ATT&CK techniques with 1 click directly from the Web Control Plane without touching SSH keys or terminals.',
      icon: Zap,
      badge: 'Automation',
      gradient: 'from-amber-500/20 to-yellow-500/10 border-amber-500/30',
      iconColor: 'text-amber-400',
    },
    {
      title: 'Zero NAT Gateway Cost',
      description:
        'Saves ~$32+/month in AWS managed NAT charges by channeling private subnet package management through an integrated forward proxy on the Bastion jumpbox.',
      icon: Lock,
      badge: 'Cloud Engineering',
      gradient: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30',
      iconColor: 'text-emerald-400',
    },
  ];

  return (
    <section id="overview" className="py-20 lg:py-28 bg-[#040814] relative border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PROJECT MISSION & FOUNDATIONS</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-white tracking-tight">
            Why We Built <span className="text-gradient-cyan">THEDAL</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Traditional cybersecurity education relies heavily on static capture-the-flag (CTF) flags and passive video lectures. THEDAL was designed to bridge the gap between theory and frontline SOC operations.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className={`p-6 sm:p-8 rounded-2xl bg-gradient-to-br ${pillar.gradient} border backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl space-y-4`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl bg-slate-950 border border-slate-800 ${pillar.iconColor}`}>
                  <pillar.icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300">
                  {pillar.badge}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold font-mono text-white">
                {pillar.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTF vs THEDAL Comparison Table */}
        <div className="mt-16 sm:mt-20">
          <div className="rounded-2xl border border-slate-800 bg-[#060e1d] overflow-hidden shadow-2xl">
            <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-bold font-mono text-white">
                  Traditional CTF / PCAP Dumps vs. THEDAL Live Range
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  How an authentic telemetry range fundamentally changes the threat hunting learning experience
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 px-3 py-1 rounded border border-cyan-800 self-start sm:self-auto">
                SOC Analyst Readiness
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/70 font-mono text-slate-400 text-xs">
                    <th className="py-3.5 px-4 sm:px-6">Investigation Dimension</th>
                    <th className="py-3.5 px-4 sm:px-6 text-rose-400 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-rose-500" />
                      <span>Traditional CTFs & Static Logs</span>
                    </th>
                    <th className="py-3.5 px-4 sm:px-6 text-emerald-400">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span>THEDAL Cloud Cyber Range</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {comparison.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-4 px-4 sm:px-6 font-semibold font-mono text-slate-200">
                        {item.feature}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-slate-400 leading-relaxed">
                        {item.ctf}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-emerald-300 font-medium leading-relaxed bg-emerald-950/10">
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
