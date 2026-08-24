import React, { useState } from 'react';
import {
  ArrowRight,
  Github,
  Copy,
  Check,
} from 'lucide-react';

export const CallToAction: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const quickClone = 'git clone https://github.com/EswaranS-06/THEDAL.git && cd THEDAL && ./install.sh --mode native';

  const handleCopy = () => {
    navigator.clipboard.writeText(quickClone);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section className="py-20 lg:py-28 bg-[#08090b] relative border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/[0.08] bg-[#0d0f12] p-8 sm:p-12 lg:p-14 text-center space-y-6 max-w-4xl mx-auto">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#12151a] border border-white/[0.08] text-[11px] font-mono tracking-wide-eyebrow text-[#8E959F] uppercase">
            <span>Start Your Threat Hunting Journey</span>
          </div>

          {/* Heading */}
          <div className="space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-medium tracking-tight-title text-[#F5F7FA]">
              Ready to hunt real adversaries with live telemetry?
            </h2>
            <p className="text-sm sm:text-base text-[#8E959F] leading-relaxed">
              Deploy your own private 5-node AWS cyber range in minutes. No fake flags, no passive tests — just authentic SOC threat hunting and detection engineering.
            </p>
          </div>

          {/* Quick Clone Snippet */}
          <div className="max-w-xl mx-auto p-2 rounded-md bg-[#08090b] border border-white/[0.08] flex items-center justify-between gap-2 font-mono text-xs text-left">
            <div className="overflow-x-auto text-[#F5F7FA] text-[11px] whitespace-nowrap pl-1">
              {quickClone}
            </div>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded bg-[#12151a] hover:bg-[#181b21] border border-white/[0.08] text-[#8E959F] hover:text-[#F5F7FA] shrink-0"
              title="Copy Command"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#4ADE80]" /> : <Copy className="w-3.5 h-3.5 text-[#8E959F]" />}
            </button>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="#install"
              className="btn-electric px-6 py-2.5 rounded-md text-xs sm:text-sm inline-flex items-center gap-2"
            >
              <span>Deploy Cyber Range</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href="https://github.com/EswaranS-06/THEDAL"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary px-5 py-2.5 rounded-md text-xs sm:text-sm inline-flex items-center gap-2"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          </div>

          {/* Philosophy */}
          <div className="pt-4 text-xs font-mono text-[#525866]">
            Try • Break • Detect • Repeat
          </div>
        </div>
      </div>
    </section>
  );
};
