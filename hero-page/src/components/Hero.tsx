import React, { useState } from 'react';
import {
  ArrowRight,
  Copy,
  Check,
  Server,
  Layers,
  Cpu,
  Lock,
  Terminal,
  ShieldAlert,
  Zap
} from 'lucide-react';
import { CyberRangeMap } from './hero/CyberRangeMap';

export const Hero: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const quickStartCmd = 'curl -fsSL https://raw.githubusercontent.com/EswaranS-06/THEDAL/main/install.sh | bash';

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(quickStartCmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section className="relative min-h-screen pt-24 pb-16 lg:pt-32 lg:pb-24 bg-infrastructure-grid flex flex-col justify-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Asymmetric Two-Column Hero Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Editorial Headline, Copy, Action Bar & Terminal Quickstart */}
          <div className="lg:col-span-6 space-y-6">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#12151a] border border-white/[0.08] text-[11px] font-mono tracking-wide-eyebrow text-[#8E959F] uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4F8CFF]" />
              <span>Cybersecurity Attack & SOC Range</span>
            </div>

            {/* Editorial Massive Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-[4rem] font-medium tracking-tight-title text-[#F5F7FA] leading-[1.08]">
              Train against the attack.{' '}
              <span className="text-[#8E959F]">Inspect the telemetry.</span>{' '}
              <span className="text-[#F5F7FA]">Master the investigation.</span>
            </h1>

            {/* Direct Technical Description */}
            <p className="text-base sm:text-lg text-[#8E959F] leading-relaxed max-w-xl">
              An authentic 5-node AWS cloud cyber range. Dispatch real-world adversary techniques with one click, stream Sysmon and auditd telemetry in real time, and investigate multi-stage intrusions in Wazuh SIEM.
            </p>

            {/* Actions & Terminal Quickstart */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="#install"
                  className="btn-electric px-5 py-2.5 rounded-md text-xs sm:text-sm inline-flex items-center gap-2"
                >
                  <span>Deploy Cyber Range</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <a
                  href="#curriculum"
                  className="btn-secondary px-4 py-2.5 rounded-md text-xs sm:text-sm inline-flex items-center gap-2"
                >
                  <span>Explore 14 Labs</span>
                </a>
              </div>

              {/* One-Line Quickstart Terminal Box */}
              <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-[#0d0f12] border border-white/[0.08] font-mono text-xs max-w-xl">
                <div className="flex items-center gap-2 overflow-x-auto text-[#8E959F]">
                  <span className="text-[#4F8CFF] select-none">$</span>
                  <code className="text-[#F5F7FA] text-[11px] whitespace-nowrap">
                    {quickStartCmd}
                  </code>
                </div>
                <button
                  onClick={handleCopyCmd}
                  className="p-1.5 rounded bg-[#181b21] hover:bg-[#222730] text-[#8E959F] hover:text-[#F5F7FA] shrink-0 transition-colors"
                  title="Copy installation command"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-[#4ADE80]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Infrastructure Trust Metrics */}
            <div className="pt-4 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div>
                <div className="text-[#F5F7FA] font-semibold text-sm">5 AWS Nodes</div>
                <div className="text-[#8E959F] text-[11px] mt-0.5">Static 10.10.0.0/16</div>
              </div>
              <div>
                <div className="text-[#F5F7FA] font-semibold text-sm">14 SOC Labs</div>
                <div className="text-[#8E959F] text-[11px] mt-0.5">MITRE ATT&CK Matrix</div>
              </div>
              <div>
                <div className="text-[#F5F7FA] font-semibold text-sm">100% Ingest</div>
                <div className="text-[#8E959F] text-[11px] mt-0.5">Sysmon v15 & Auditd</div>
              </div>
              <div>
                <div className="text-[#F5F7FA] font-semibold text-sm">$0 NAT Cost</div>
                <div className="text-[#8E959F] text-[11px] mt-0.5">Squid Proxy Gateway</div>
              </div>
            </div>
          </div>

          {/* Right Column: Centerpiece Live Cyber Range Map */}
          <div className="lg:col-span-6">
            <CyberRangeMap />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
