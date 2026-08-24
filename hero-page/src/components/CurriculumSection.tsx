import React, { useState } from 'react';
import {
  BookOpen,
  Clock,
  ChevronRight,
} from 'lucide-react';

export const CurriculumSection: React.FC = () => {
  const [activeLevel, setActiveLevel] = useState<number>(1);

  const levels = [
    {
      level: 1,
      name: 'Level 1: SOC Foundations',
      subtitle: 'Log Anatomy & Endpoint Baseline Telemetry',
      badge: 'Tier 1 Analyst',
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
      badge: 'Tier 2 Specialist',
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
      badge: 'Advanced Incident Responder',
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
      description: 'Put your threat hunting skills to the ultimate test with unassisted blind scenarios. No guided hints — just raw evidence.',
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
    <section id="curriculum" className="py-20 lg:py-28 bg-[#08090b] relative border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#12151a] border border-white/[0.08] text-[11px] font-mono tracking-wide-eyebrow text-[#8E959F] uppercase">
            <span>SOC Mastery Curriculum</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium tracking-tight-title text-[#F5F7FA]">
            14 Guided Labs & 3 Mystery Challenges
          </h2>
          <p className="text-sm sm:text-base text-[#8E959F] leading-relaxed">
            Step through a structured 3-tier curriculum designed to take you from foundational log anatomy to advanced multi-source adversary timeline correlation.
          </p>
        </div>

        {/* Level Switcher Navigation */}
        <div className="mt-10 flex flex-wrap items-center gap-2">
          {levels.map((lvl) => {
            const isCurrent = activeLevel === lvl.level;
            return (
              <button
                key={lvl.level}
                onClick={() => setActiveLevel(lvl.level)}
                className={`px-3.5 py-1.5 rounded-md font-mono text-xs transition-all ${
                  isCurrent
                    ? 'bg-[#181b21] text-[#F5F7FA] border border-[#4F8CFF]/50 shadow-sm'
                    : 'bg-[#0d0f12] text-[#8E959F] hover:text-[#F5F7FA] border border-white/[0.08]'
                }`}
              >
                {lvl.name.split(':')[0]}
                {lvl.level === 4 && ' (Challenges)'}
              </button>
            );
          })}
        </div>

        {/* Current Level Overview Card */}
        <div className="mt-6 p-5 sm:p-6 rounded-xl bg-[#0d0f12] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-[#4F8CFF] uppercase">
                {currentLevel.name}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#12151a] text-[#8E959F] border border-white/[0.06]">
                {currentLevel.badge}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-[#F5F7FA] mt-1">
              {currentLevel.subtitle}
            </h3>
            <p className="text-xs sm:text-sm text-[#8E959F] mt-1 max-w-3xl leading-relaxed">
              {currentLevel.description}
            </p>
          </div>
          <span className="text-xs font-mono text-[#F5F7FA] px-3 py-1 rounded bg-[#12151a] border border-white/[0.08] shrink-0 self-start sm:self-auto">
            {currentLevel.labs.length} Investigation Modules
          </span>
        </div>

        {/* Labs Grid */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {currentLevel.labs.map((lab) => (
            <div
              key={lab.id}
              className="p-5 rounded-lg bg-[#0d0f12] border border-white/[0.08] hover:border-white/[0.14] transition-all space-y-2.5 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-[#12151a] border border-white/[0.08] font-mono text-[#4F8CFF] font-semibold text-xs flex items-center justify-center">
                    {lab.id}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#12151a] border border-white/[0.06] text-[#8E959F]">
                    {lab.technique}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-[#525866] font-mono">
                  <Clock className="w-3 h-3 text-[#525866]" />
                  <span>{lab.time}</span>
                </div>
              </div>

              <h4 className="text-sm font-semibold text-[#F5F7FA] group-hover:text-[#4F8CFF] transition-colors">
                {lab.title}
              </h4>

              <p className="text-xs text-[#8E959F] leading-relaxed">
                {lab.objective}
              </p>

              <div className="pt-2 flex items-center justify-between border-t border-white/[0.06] text-[11px] font-mono">
                <span className="text-[#525866]">
                  Index: <code className="text-[#8E959F]">{lab.source}</code>
                </span>
                <span className="text-[#8E959F] group-hover:text-[#F5F7FA] flex items-center gap-0.5 text-[11px]">
                  <span>Lab Details</span>
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
