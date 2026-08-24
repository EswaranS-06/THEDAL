import React from 'react';
import {
  Zap,
  ArrowRight,
  Github,
  Shield,
  Sparkles,
  Terminal,
  Play,
  Flame
} from 'lucide-react';
import { CodeBlock } from './ui/CodeBlock';

export const CallToAction: React.FC = () => {
  const quickClone = 'git clone https://github.com/EswaranS-06/THEDAL.git && cd THEDAL && ./install.sh --mode native';

  return (
    <section className="py-20 lg:py-28 bg-[#030712] relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 radial-glow-cyan pointer-events-none opacity-40" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="rounded-3xl border border-cyan-500/40 bg-gradient-to-br from-[#081224] via-[#060e1d] to-[#040814] p-8 sm:p-12 lg:p-16 shadow-[0_0_60px_rgba(0,242,254,0.15)] text-center space-y-8 max-w-5xl mx-auto">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>START YOUR THREAT HUNTING JOURNEY TODAY</span>
          </div>

          {/* Heading */}
          <div className="space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-extrabold font-display text-white tracking-tight leading-tight">
              Ready to Hunt Real Adversaries with{' '}
              <span className="text-gradient-cyan">Live Telemetry?</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Deploy your own private 5-node AWS cyber range in minutes. No fake flags, no passive multiple-choice tests — just authentic SOC threat hunting and detection engineering.
            </p>
          </div>

          {/* Quick Clone Snippet */}
          <div className="max-w-2xl mx-auto">
            <CodeBlock
              code={quickClone}
              language="bash"
              title="One-Line Quickstart"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <a
              href="#install"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-black font-bold font-mono text-sm transition-all shadow-[0_0_25px_rgba(0,242,254,0.4)] hover:shadow-[0_0_35px_rgba(0,242,254,0.6)] active:scale-95"
            >
              <Zap className="w-4 h-4 fill-black" />
              <span>START LEARNING NOW</span>
            </a>

            <a
              href="https://github.com/EswaranS-06/THEDAL"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-mono text-sm font-semibold border border-slate-700 hover:border-slate-600 transition-all"
            >
              <Github className="w-4 h-4" />
              <span>Star on GitHub</span>
            </a>
          </div>

          {/* Final Philosophy Reminder */}
          <div className="pt-4 text-xs font-mono text-slate-400">
            Remember: <span className="text-cyan-300 font-bold">Try</span> • <span className="text-amber-300 font-bold">Break</span> • <span className="text-emerald-300 font-bold">Detect</span> • <span className="text-purple-300 font-bold">Repeat</span>. Hands-on practice makes the defender.
          </div>
        </div>
      </div>
    </section>
  );
};
