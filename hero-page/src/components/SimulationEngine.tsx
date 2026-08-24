import React from 'react';
import {
  Zap,
  Terminal,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { CodeBlock } from './ui/CodeBlock';

export const SimulationEngine: React.FC = () => {
  const sampleCommand = `# 1-Click Non-Interactive Adversary Emulation (Proxied via Bastion)
ssh -i ~/.ssh/thedal_key -o ProxyJump=ubuntu@13.233.88.64 ubuntu@10.10.20.10 \\
  '/usr/local/bin/run-atomic-test --technique T1059.001 --confirm'`;

  return (
    <section id="simulations" className="py-20 lg:py-28 bg-[#08090b] relative border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Explanatory Content */}
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#12151a] border border-white/[0.08] text-[11px] font-mono tracking-wide-eyebrow text-[#8E959F] uppercase">
              <span>Control Plane Automation</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium tracking-tight-title text-[#F5F7FA]">
              1-Click Adversary Simulation Engine
            </h2>

            <p className="text-sm sm:text-base text-[#8E959F] leading-relaxed">
              No need to switch between SSH terminal windows. In the THEDAL Control Plane and Learning Labs, learners can dispatch curated MITRE ATT&CK techniques with a single click and watch telemetry populate OpenSearch in 5–10 seconds.
            </p>

            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3">
                <div className="p-1 rounded bg-[#12151a] border border-white/[0.08] text-[#4ADE80] mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold font-mono text-[#F5F7FA]">Non-Interactive ProxyJump Tunneling</h4>
                  <p className="text-xs text-[#8E959F] leading-relaxed">
                    Commands automatically route securely through the Bastion jumpbox to the isolated Linux Attack Host.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 rounded bg-[#12151a] border border-white/[0.08] text-[#4F8CFF] mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold font-mono text-[#F5F7FA]">Full SQLite Audit Trail & Output Streaming</h4>
                  <p className="text-xs text-[#8E959F] leading-relaxed">
                    Every simulation execution is timestamped, audited in SQLite (`learner_state.db`), and logged in `control-plane/logs/`.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1 rounded bg-[#12151a] border border-white/[0.08] text-[#FBBF24] mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold font-mono text-[#F5F7FA]">Safe Execution Interlocks</h4>
                  <p className="text-xs text-[#8E959F] leading-relaxed">
                    Execution wrappers reject any targets outside the private VPC CIDR (`10.10.0.0/16`) and exclude destructive payloads.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="#install"
                className="btn-electric px-4 py-2 rounded-md text-xs inline-flex items-center gap-2"
              >
                <span>Test Simulation Engine</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Right Column: Code Block */}
          <div className="lg:col-span-6 space-y-3">
            <div className="rounded-xl border border-white/[0.08] bg-[#0d0f12] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-[#4F8CFF]" />
                  <span className="text-xs font-mono font-medium text-[#F5F7FA]">
                    Investigation Workspace Dispatch
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#4ADE80] px-2 py-0.5 rounded bg-[#12151a] border border-white/[0.06]">
                  Ready to Dispatch
                </span>
              </div>

              <CodeBlock
                code={sampleCommand}
                language="bash"
                title="Simulation Pipeline"
              />

              <div className="p-3.5 rounded-lg bg-[#08090b] border border-white/[0.06] space-y-1.5 font-mono text-xs">
                <div className="flex items-center justify-between text-[#8E959F] text-[11px]">
                  <span>Target Ingest Pattern:</span>
                  <span className="text-[#4F8CFF]">socforge-powershell-*</span>
                </div>
                <div className="flex items-center justify-between text-[#8E959F] text-[11px]">
                  <span>Expected Correlation:</span>
                  <span className="text-[#F5F7FA]">Sysmon EID 1 + PowerShell 4104</span>
                </div>
                <div className="flex items-center justify-between text-[#8E959F] text-[11px]">
                  <span>Est. Ingestion Transit Time:</span>
                  <span className="text-[#4ADE80]">~240ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
