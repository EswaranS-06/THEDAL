import React from 'react';
import { Terminal, Shield, Sparkles } from 'lucide-react';

export const HeroHeadline: React.FC = () => {
  return (
    <div className="text-center max-w-5xl mx-auto space-y-6 select-none">
      {/* 1. System Status Eyebrow Badge */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#040b17]/90 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium shadow-[0_0_20px_rgba(0,242,254,0.15)] backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
          </span>
          <span className="tracking-wider text-[11px] font-semibold text-slate-200">
            THEDAL <span className="text-cyan-400 font-bold">//</span> CYBER RANGE ONLINE
          </span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-[10px] text-emerald-400 font-mono font-bold tracking-tight">
            5 NODES ACTIVE
          </span>
        </div>
      </div>

      {/* 2. Primary Dramatic Cinematic Statement */}
      <div className="space-y-2">
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter font-display leading-[1.02] text-white">
          <span className="block tracking-tight text-slate-100 drop-shadow-[0_2px_15px_rgba(255,255,255,0.15)]">
            BUILD. ATTACK. DETECT.
          </span>
          <span className="block text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mt-2 text-slate-300">
            Master the SOC attack lifecycle with{' '}
            <span className="text-gradient-cyan drop-shadow-[0_0_35px_rgba(0,242,254,0.35)]">
              Live Threat Telemetry
            </span>
          </span>
        </h1>
      </div>

      {/* 3. Engineered Micro-Copy */}
      <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl sm:max-w-3xl mx-auto leading-relaxed font-sans font-normal">
        An authentic, open-source cloud laboratory engineered with Terraform, Ansible, Wazuh SIEM, Sysmon v15, and Atomic Red Team. Deploy in one command, execute real attack techniques, and investigate telemetry in OpenSearch.
      </p>

      {/* 4. Defender Philosophy Strip */}
      <div className="pt-1">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-[#030914]/80 border border-slate-800 shadow-inner backdrop-blur-sm">
          <span className="text-[11px] font-mono font-bold tracking-widest text-cyan-400 uppercase flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>BLUE TEAM CORE</span>
          </span>
          <span className="text-slate-700">/</span>
          <span className="text-[11px] sm:text-xs font-mono font-bold text-slate-200 tracking-wider">
            TRY <span className="text-cyan-400 font-black">•</span> BREAK <span className="text-amber-400 font-black">•</span> DETECT <span className="text-emerald-400 font-black">•</span> REPEAT
          </span>
        </div>
      </div>
    </div>
  );
};
