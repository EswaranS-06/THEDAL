import React from 'react';
import { ShieldAlert, Activity, Cpu, Network, ArrowRight } from 'lucide-react';

interface FloatingTelemetryCardProps {
  type: 'alert' | 'network' | 'detection' | 'chain';
  pointerX?: number;
  pointerY?: number;
  className?: string;
}

export const FloatingTelemetryCard: React.FC<FloatingTelemetryCardProps> = ({
  type,
  pointerX = 0,
  pointerY = 0,
  className = '',
}) => {
  if (type === 'alert') {
    return (
      <div
        className={`hidden xl:block absolute left-[3%] top-[34%] z-20 transition-transform duration-700 ease-out pointer-events-none select-none ${className}`}
        style={{
          transform: `translate(${pointerX * -20}px, ${pointerY * -16}px)`,
        }}
      >
        <div className="p-3.5 rounded-xl bg-[#040a16]/85 backdrop-blur-md border border-rose-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.6)] shadow-rose-950/20 max-w-[240px] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-[10px] font-mono font-bold text-rose-300">WAZUH ALERT // 00421</span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
              LVL 12
            </span>
          </div>
          <div className="text-[11px] font-mono font-bold text-slate-200">
            T1059.001 Encoded ScriptBlock
          </div>
          <div className="text-[9px] font-mono text-slate-400 border-t border-slate-800/80 pt-1.5 flex items-center justify-between">
            <span>Rule: 91802</span>
            <span className="text-emerald-400 font-semibold">MATCH CONFIRMED</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'network') {
    return (
      <div
        className={`hidden xl:block absolute right-[3%] top-[30%] z-20 transition-transform duration-700 ease-out pointer-events-none select-none ${className}`}
        style={{
          transform: `translate(${pointerX * 24}px, ${pointerY * 18}px)`,
        }}
      >
        <div className="p-3.5 rounded-xl bg-[#040a16]/85 backdrop-blur-md border border-cyan-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.6)] shadow-cyan-950/20 max-w-[250px] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-mono font-bold text-cyan-300">TELEMETRY INGESTION</span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
              LIVE
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-200 flex items-center gap-1.5">
            <span className="text-rose-400 font-bold">10.10.20.10</span>
            <ArrowRight className="w-3 h-3 text-slate-500" />
            <span className="text-cyan-300 font-bold">10.10.10.20</span>
          </div>
          <div className="text-[9px] font-mono text-slate-400 border-t border-slate-800/80 pt-1.5 flex items-center justify-between">
            <span>Proto: TCP/443 (Sysmon)</span>
            <span className="text-cyan-400">8.4 KB/s</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'detection') {
    return (
      <div
        className={`hidden 2xl:block absolute left-[5%] bottom-[12%] z-20 transition-transform duration-700 ease-out pointer-events-none select-none ${className}`}
        style={{
          transform: `translate(${pointerX * -15}px, ${pointerY * -12}px)`,
        }}
      >
        <div className="p-3.5 rounded-xl bg-[#040a16]/85 backdrop-blur-md border border-purple-500/30 shadow-[0_8px_32px_rgba(0,0,0,0.6)] shadow-purple-950/20 max-w-[240px] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[10px] font-mono font-bold text-purple-300">DETECTION ENGINE</span>
            </div>
            <span className="text-[9px] font-mono text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/30">
              CORRELATED
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-200">
            Sysmon Event ID 1 Process Creation
          </div>
          <div className="text-[9px] font-mono text-slate-400 border-t border-slate-800/80 pt-1.5">
            Parent: <code className="text-amber-400">explorer.exe (PID 3412)</code>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'chain') {
    return (
      <div
        className={`hidden 2xl:block absolute right-[5%] bottom-[12%] z-20 transition-transform duration-700 ease-out pointer-events-none select-none ${className}`}
        style={{
          transform: `translate(${pointerX * 18}px, ${pointerY * 14}px)`,
        }}
      >
        <div className="p-3.5 rounded-xl bg-[#040a16]/85 backdrop-blur-md border border-slate-700/60 shadow-[0_8px_32px_rgba(0,0,0,0.6)] max-w-[260px] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-mono font-bold text-emerald-300">ATTACK CHAIN PIPELINE</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[9px] font-mono text-slate-300">
            <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-rose-300">ACCESS</span>
            <span>→</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300">EXEC</span>
            <span>→</span>
            <span className="px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800 text-cyan-300 font-bold">DETECT</span>
          </div>
          <div className="text-[9px] font-mono text-slate-400 border-t border-slate-800/80 pt-1.5 flex justify-between">
            <span>Pipeline Ingest Latency</span>
            <span className="text-emerald-400 font-bold">340ms</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
