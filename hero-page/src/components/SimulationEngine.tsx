import React from 'react';
import {
  Zap,
  Play,
  Terminal,
  ShieldCheck,
  Cpu,
  Layers,
  Database,
  ArrowRight,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { CodeBlock } from './ui/CodeBlock';

export const SimulationEngine: React.FC = () => {
  const sampleCommand = `# 1-Click Non-Interactive Adversary Emulation (Proxied via Bastion)
ssh -i ~/.ssh/thedal_key -o ProxyJump=ubuntu@13.233.88.64 ubuntu@10.10.20.10 \\
  '/usr/local/bin/run-atomic-test --technique T1059.001 --confirm'`;

  return (
    <section id="simulations" className="py-20 lg:py-28 bg-[#030712] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Explanatory Content */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>CONTROL PLANE AUTOMATION</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold font-display text-white tracking-tight leading-tight">
              1-Click <span className="text-gradient-cyan">Adversary Simulation</span> Engine
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              No need to switch between SSH terminal windows. In the THEDAL Control Plane and Learning Labs, learners can dispatch curated MITRE ATT&CK techniques with a single click and watch telemetry populate OpenSearch in 5–10 seconds.
            </p>

            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold font-mono text-white">Non-Interactive ProxyJump Tunneling</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Commands automatically route securely through the Bastion jumpbox to the isolated Linux Attack Host.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold font-mono text-white">Full SQLite Audit Trail & Output Streaming</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Every simulation execution is timestamped, audited in SQLite (`learner_state.db`), and logged in `control-plane/logs/`.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold font-mono text-white">Safe Execution Interlocks</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Execution wrappers reject any targets outside the private VPC CIDR (`10.10.0.0/16`) and exclude destructive payloads.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="#install"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono text-xs transition-all shadow-[0_0_15px_rgba(0,242,254,0.3)]"
              >
                <span>TEST SIMULATION ENGINE</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Right Column: Code & Interactive UI Mockup */}
          <div className="lg:col-span-6 space-y-4">
            <div className="rounded-2xl border border-cyan-500/30 bg-[#060e1d] p-5 sm:p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold text-white">
                    Investigation Workspace Phase 2 Demo
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  Ready to Dispatch
                </span>
              </div>

              <CodeBlock
                code={sampleCommand}
                language="bash"
                title="Simulation Dispatch Pipeline"
              />

              <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Target Ingest Pattern:</span>
                  <span className="text-cyan-400 font-bold">socforge-powershell-*</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Expected Correlation:</span>
                  <span className="text-amber-400 font-bold">Sysmon EventID 1 + PowerShell 4104</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Est. Ingestion Transit Time:</span>
                  <span className="text-emerald-400 font-bold">5–10 Seconds</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
