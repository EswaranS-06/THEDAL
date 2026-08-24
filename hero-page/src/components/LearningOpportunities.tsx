import React from 'react';
import {
  Search,
  ShieldCheck,
  Terminal,
  Cpu,
  FileCode,
  Layers,
  Sparkles,
  Award,
  ArrowRight,
  Database,
  Flame,
  Binary
} from 'lucide-react';

export const LearningOpportunities: React.FC = () => {
  const skills = [
    {
      title: 'Hypothesis-Driven Threat Hunting',
      domain: 'Threat Hunting',
      icon: Search,
      color: 'text-cyan-400',
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-500/10',
      description:
        'Formulate hunting hypotheses mapped to MITRE ATT&CK tactics, execute targeted Lucene/DQL search queries in OpenSearch, and uncover stealthy adversaries.',
      takeaways: ['MITRE ATT&CK Matrix mapping', 'Lucene / KQL syntax mastery', 'Baseline deviation analysis'],
    },
    {
      title: 'Detection Engineering & Rule Writing',
      domain: 'Detection Engineering',
      icon: ShieldCheck,
      color: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/10',
      description:
        'Craft custom Wazuh XML decoders, parent-child process correlation rules, and Sigma signatures with zero false positives.',
      takeaways: ['Custom Wazuh rules & decoders', 'Rule hierarchy & level tuning', 'False-positive elimination'],
    },
    {
      title: 'Microsoft Sysmon v15 Endpoint Forensics',
      domain: 'Endpoint Security',
      icon: Cpu,
      color: 'text-purple-400',
      border: 'border-purple-500/30',
      bg: 'bg-purple-500/10',
      description:
        'Analyze parent-child process lineages (EventID 1), network socket connections (EventID 3), memory access to LSASS (EventID 10), and persistence task triggers.',
      takeaways: ['Sysmon schema & XML filters', 'Process injection triage', 'Parent PID tracking'],
    },
    {
      title: 'PowerShell De-obfuscation & Auditing',
      domain: 'Payload Analysis',
      icon: Terminal,
      color: 'text-amber-400',
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/10',
      description:
        'Extract, decode, and analyze obfuscated PowerShell commands from ScriptBlock logging (EventID 4104), identifying bypass flags and encoded payloads.',
      takeaways: ['EventID 4104 reconstruction', 'Base64 / XOR payload decoding', 'Execution policy bypass detection'],
    },
    {
      title: 'Web Application Attack Investigation',
      domain: 'Application Security',
      icon: Database,
      color: 'text-rose-400',
      border: 'border-rose-500/30',
      bg: 'bg-rose-500/10',
      description:
        'Investigate SQL injection queries, remote command execution chained through web endpoints, directory traversal (LFI), and REST API authentication bypasses.',
      takeaways: ['Nginx HTTP log parsing', 'Linux kernel auditd correlation', 'OWASP Top 10 attack detection'],
    },
    {
      title: 'Cloud Infrastructure & SecOps Automation',
      domain: 'DevSecOps',
      icon: Layers,
      color: 'text-blue-400',
      border: 'border-blue-500/30',
      bg: 'bg-blue-500/10',
      description:
        'Deploy, manage, and automate multi-tier AWS environments using Terraform Infrastructure as Code, Ansible playbooks, and secure SSH ProxyJump topologies.',
      takeaways: ['Terraform VPC orchestration', 'Ansible role provisioning', 'Bastion forward proxying'],
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-[#030712] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold">
            <Award className="w-3.5 h-3.5" />
            <span>LEARNING OUTCOMES & PRACTICAL SKILLS</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-white tracking-tight">
            Skills That Truly Make You <span className="text-gradient-cyan">Job-Ready</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Gain the exact hands-on telemetry skills, investigation intuition, and detection engineering experience demanded by top Security Operations Centers (SOCs).
          </p>
        </div>

        {/* Skills Cards Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((skill) => (
            <div
              key={skill.title}
              className="p-6 sm:p-7 rounded-2xl bg-[#060e1d] border border-slate-800 hover:border-cyan-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl border ${skill.bg} ${skill.border} ${skill.color}`}>
                    <skill.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                    {skill.domain}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold font-mono text-white">
                  {skill.title}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {skill.description}
                </p>
              </div>

              {/* Takeaways List */}
              <div className="pt-3 border-t border-slate-800/80 space-y-1.5 font-mono text-[11px]">
                {skill.takeaways.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
