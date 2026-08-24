import React from 'react';
import {
  ShieldCheck,
  Terminal,
  Activity,
  Award,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const LearningOpportunities: React.FC = () => {
  const roles = [
    {
      title: 'SOC Analyst Tier 1 / 2',
      badge: 'Incident Triaging',
      skills: [
        'Alert triage across Wazuh SIEM and OpenSearch time-series indices',
        'Distinguishing false positive admin noise from real adversary activity',
        'Constructing end-to-end incident timelines with evidence artifacts',
        'Extracting MITRE ATT&CK tactics, techniques, and procedures (TTPs)',
      ],
      icon: ShieldCheck,
    },
    {
      title: 'Detection Engineer',
      badge: 'Rule Engineering',
      skills: [
        'Authoring custom Wazuh XML decoders and correlation rules',
        'Fine-tuning Sysmon configuration schemas for high-signal telemetry',
        'Validating detection fidelity against Atomic Red Team attack vectors',
        'Minimizing ingestion noise and optimizing index shard retention',
      ],
      icon: Terminal,
    },
    {
      title: 'Threat Hunter',
      badge: 'Proactive Discovery',
      skills: [
        'Hunting in-memory PowerShell ScriptBlock de-obfuscation events (4104)',
        'Investigating persistence mechanisms (Scheduled Tasks, Registry Run keys)',
        'Detecting lateral movement and SSH ProxyJump tunneling anomalies',
        'Formulating hypothesis-driven threat hunting inquiries',
      ],
      icon: Activity,
    },
    {
      title: 'Cloud Security Architect',
      badge: 'DevSecOps & Range Eng',
      skills: [
        'Infrastructure-as-Code with automated Terraform VPC provisioning',
        'Idempotent multi-node security telemetry configuration with Ansible',
        'Cost optimization strategies (Squid Forward Proxy eliminating AWS NAT costs)',
        'Secure multi-tier network segregation and bastion jumpbox architectures',
      ],
      icon: Layers,
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-[#08090b] relative border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#12151a] border border-white/[0.08] text-[11px] font-mono tracking-wide-eyebrow text-[#8E959F] uppercase">
            <span>Career Advancement</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium tracking-tight-title text-[#F5F7FA]">
            Job-Ready Skills Built on Real Frontline Telemetry
          </h2>
          <p className="text-sm sm:text-base text-[#8E959F] leading-relaxed">
            By building and defending THEDAL, you develop concrete, resume-ready competencies aligned with standard cybersecurity industry roles.
          </p>
        </div>

        {/* Roles Grid */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => (
            <div
              key={role.title}
              className="p-6 rounded-xl bg-[#0d0f12] border border-white/[0.08] hover:border-white/[0.14] transition-all space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded bg-[#12151a] border border-white/[0.08] flex items-center justify-center text-[#4F8CFF]">
                  <role.icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#12151a] border border-white/[0.06] text-[#8E959F]">
                  {role.badge}
                </span>
              </div>

              <div>
                <h3 className="text-base font-semibold text-[#F5F7FA]">
                  {role.title}
                </h3>
              </div>

              <ul className="space-y-2 text-xs text-[#8E959F] border-t border-white/[0.06] pt-3">
                {role.skills.map((skill, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-[#4F8CFF] mt-1.5 shrink-0" />
                    <span className="leading-relaxed">{skill}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
