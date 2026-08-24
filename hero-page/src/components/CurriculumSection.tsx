import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Shield,
  Search,
  Flame,
  Terminal,
  ExternalLink,
  ChevronRight,
  Sparkles,
  HelpCircle
} from 'lucide-react';

export const CurriculumSection: React.FC = () => {
  const [activeLevel, setActiveLevel] = useState<number>(1);

  const levels = [
    {
      level: 1,
      name: 'Level 1: SOC Foundations',
      subtitle: 'Log Anatomy & Endpoint Baseline Telemetry',
      badge: 'Beginner to Intermediate',
      color: 'cyan',
      description: 'Master the fundamental anatomy of security logs, process creation parent-child trees, PowerShell ScriptBlock logging, and authentication anomalies.',
      labs: [
        {
          id: '01',
          title: 'First Alert Triage & Log Anatomy',
          technique: 'Baseline / EventLog Anatomy',
          source: 'socforge-sysmon-*',
          time: '20 min',
          objective: 'Distinguish raw EventLogs from aggregated SIEM alerts and inspect Sysmon fields.',
        },
        {
          id: '02',
          title: 'Windows Process Creation & Parent Lineage',
          technique: 'T1059 / Process Trees',
          source: 'socforge-sysmon-*',
          time: '25 min',
          objective: 'Trace parent-child process relationships (Sysmon EventID 1) and command-line arguments.',
        },
        {
          id: '03',
          title: 'PowerShell ScriptBlock Investigation',
          technique: 'T1059.001',
          source: 'socforge-powershell-*',
          time: '30 min',
          objective: 'Reconstruct de-obfuscated script code from PowerShell ScriptBlock logs (EventID 4104).',
        },
        {
          id: '04',
          title: 'Failed Authentication & Password Spraying',
          technique: 'T1110.001',
          source: 'socforge-windows-security-*',
          time: '25 min',
          objective: 'Distinguish routine administrative typos from distributed brute-force attacks (EventID 4625).',
        },
      ],
    },
    {
      level: 2,
      name: 'Level 2: Investigation Workflows',
      subtitle: 'Web Application Attacks & Linux Kernel Auditing',
      badge: 'Intermediate',
      color: 'amber',
      description: 'Pivot into web-tier exploits, SQL injection payload decoding, OS command injection tracing via Linux `auditd`, and containerized API probing.',
      labs: [
        {
          id: '05',
          title: 'DVWA SQL Injection Triage',
          technique: 'T1190 / Web Exploitation',
          source: 'socforge-nginx-access-*',
          time: '30 min',
          objective: 'Analyze HTTP GET URI parameters containing Boolean and UNION SQLi syntax payloads.',
        },
        {
          id: '06',
          title: 'Remote OS Command Injection & Auditd',
          technique: 'T1059.004',
          source: 'socforge-auditd-*',
          time: '35 min',
          objective: 'Correlate web-tier semicolon chaining with Linux kernel execve syscalls targeting `/bin/cat /etc/passwd`.',
        },
        {
          id: '07',
          title: 'Local File Inclusion (LFI) Investigation',
          technique: 'T1083 / File Discovery',
          source: 'socforge-nginx-access-*',
          time: '25 min',
          objective: 'Detect directory path traversal attempts (`../../`) probing sensitive configuration assets.',
        },
        {
          id: '08',
          title: 'OWASP Juice Shop API Authentication Bypass',
          technique: 'T1595 / API Probing',
          source: 'socforge-juice-shop-*',
          time: '30 min',
          objective: 'Inspect Docker JSON container logs capturing SQLi payload injection against `/rest/user/login`.',
        },
      ],
    },
    {
      level: 3,
      name: 'Level 3: Attack Correlation',
      subtitle: 'Adversary Emulation & Multi-Source Timelines',
      badge: 'Advanced SOC Specialist',
      color: 'emerald',
      description: 'Execute multi-stage attack simulations with Atomic Red Team, reconstruct cross-host incident timelines, and eliminate false positives.',
      labs: [
        {
          id: '09',
          title: 'Atomic Red Team Reconnaissance',
          technique: 'T1082',
          source: 'socforge-sysmon-*',
          time: '30 min',
          objective: 'Emulate discovery commands (`systeminfo`, `net config`) and analyze burst frequency in SIEM.',
        },
        {
          id: '10',
          title: 'PowerShell Obfuscation & Bypass Flags',
          technique: 'T1027 / T1059.001',
          source: 'socforge-powershell-*',
          time: '35 min',
          objective: 'Decode Base64 encoded commands and identify execution bypass flags.',
        },
        {
          id: '11',
          title: 'Scheduled Task Persistence Creation',
          technique: 'T1053.005',
          source: 'socforge-sysmon-*',
          time: '30 min',
          objective: 'Track `schtasks.exe /create` persistence registration and audit task triggers.',
        },
        {
          id: '12',
          title: 'Multi-Source Incident Correlation',
          technique: 'DET-COR-001',
          source: 'Multi-Index Stream',
          time: '45 min',
          objective: 'Correlate simultaneous web intrusion, kernel execve, and Windows lateral movement.',
        },
        {
          id: '13',
          title: 'True Positive vs. False Positive Discrimination',
          technique: 'SOC Triage Practice',
          source: 'wazuh-alerts-*',
          time: '35 min',
          objective: 'Evaluate realistic IT administrative maintenance noise vs malicious adversary activity.',
        },
        {
          id: '14',
          title: 'Full Incident Timeline Reconstruction',
          technique: 'Full Spectrum Timeline',
          source: 'All Indices',
          time: '50 min',
          objective: 'Build an end-to-end incident timeline report from initial access to objective execution.',
        },
      ],
    },
    {
      level: 4,
      name: 'Challenge Mode',
      subtitle: 'Blind Mystery Incident Investigations',
      badge: 'Proving Ground',
      color: 'purple',
      description: 'Put your threat hunting skills to the ultimate test with unassisted blind scenarios. No guided questions or hints — just raw evidence.',
      labs: [
        {
          id: 'C1',
          title: 'Mystery Challenge 01: Web Tampering & Webshell',
          technique: 'T1505.003',
          source: 'socforge-nginx-access-* & auditd',
          time: '45 min',
          objective: 'Unassisted investigation of an unauthorized web application modification.',
        },
        {
          id: 'C2',
          title: 'Mystery Challenge 02: Suspicious Admin Elevation',
          technique: 'T1078 / Privilege Escalation',
          source: 'socforge-windows-security-*',
          time: '45 min',
          objective: 'Detect rogue administrator account creation and unauthorized group membership changes.',
        },
        {
          id: 'C3',
          title: 'Mystery Challenge 03: Stealth Host Enumeration',
          technique: 'T1046 / Port Scanning',
          source: 'socforge-auditd-* & wazuh',
          time: '45 min',
          objective: 'Hunt low-and-slow internal subnet port scanning and service discovery.',
        },
      ],
    },
  ];

  const currentLevel = levels.find((l) => l.level === activeLevel) || levels[0];

  return (
    <section id="curriculum" className="py-20 lg:py-28 bg-[#040916] relative border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>PROGRESSIVE SOC MASTERY CURRICULUM</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-white tracking-tight">
            14 Guided Labs & <span className="text-gradient-cyan">3 Mystery Challenges</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Step through a structured 3-tier curriculum designed to take you from foundational log anatomy to advanced adversary timeline correlation.
          </p>
        </div>

        {/* Level Switcher Navigation */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {levels.map((lvl) => {
            const isCurrent = activeLevel === lvl.level;
            return (
              <button
                key={lvl.level}
                onClick={() => setActiveLevel(lvl.level)}
                className={`px-4 sm:px-5 py-2.5 rounded-xl font-mono text-xs sm:text-sm font-bold transition-all ${
                  isCurrent
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-[0_0_20px_rgba(0,242,254,0.35)] scale-105'
                    : 'bg-[#081326] text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
                }`}
              >
                {lvl.name.split(':')[0]}
                {lvl.level === 4 && ' 🔥'}
              </button>
            );
          })}
        </div>

        {/* Current Level Overview Banner */}
        <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-[#081224] border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                {currentLevel.name}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                {currentLevel.badge}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold font-mono text-white mt-1">
              {currentLevel.subtitle}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              {currentLevel.description}
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-3.5 py-1.5 rounded-lg border border-emerald-800 shrink-0 self-start sm:self-auto">
            {currentLevel.labs.length} Investigation Modules
          </span>
        </div>

        {/* Labs Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentLevel.labs.map((lab) => (
            <div
              key={lab.id}
              className="p-5 sm:p-6 rounded-xl bg-[#060e1d] border border-slate-800 hover:border-cyan-500/40 transition-all duration-200 hover:shadow-xl space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 font-mono text-cyan-400 font-bold text-xs flex items-center justify-center">
                    {lab.id}
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900">
                    {lab.technique}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{lab.time}</span>
                </div>
              </div>

              <h4 className="text-sm sm:text-base font-bold font-mono text-white group-hover:text-cyan-300 transition-colors">
                {lab.title}
              </h4>

              <p className="text-xs text-slate-300 leading-relaxed">
                {lab.objective}
              </p>

              <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 text-[11px] font-mono">
                <span className="text-slate-400">
                  Target Index: <code className="text-emerald-400">{lab.source}</code>
                </span>
                <span className="text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 text-[10px]">
                  <span>Explore Lab</span>
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
