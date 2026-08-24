import React from 'react';
import { Layers, Activity, Zap } from 'lucide-react';
import { FlowMode } from './architectureData';

interface ArchitectureControlsProps {
  mode: FlowMode;
  onModeChange: (mode: FlowMode) => void;
}

export const ArchitectureControls: React.FC<ArchitectureControlsProps> = ({
  mode,
  onModeChange,
}) => {
  const modes: { id: FlowMode; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'architecture', label: 'Architecture', icon: Layers },
    { id: 'data', label: 'Data Flow', icon: Activity },
    { id: 'attack', label: 'Attack Flow', icon: Zap },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#090b0e] border-b border-white/[0.07]">
      {/* Mode Buttons */}
      <div className="flex items-center gap-1 p-0.5 rounded-md bg-[#12151a] border border-white/[0.08]">
        {modes.map((m) => {
          const isSelected = mode === m.id;
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              onClick={() => onModeChange(m.id)}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#181b21] text-[#F5F7FA] border border-white/[0.1] shadow-sm'
                  : 'text-[#8E959F] hover:text-[#F5F7FA]'
              }`}
            >
              <Icon className="w-3 h-3 text-[#4F8CFF]" />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mode Status Banner */}
      <div className="text-[11px] font-mono text-[#8E959F] flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#4F8CFF]" />
        {mode === 'architecture' && (
          <span>VPC CIDR <strong className="text-[#F5F7FA]">10.10.0.0/16</strong> • Static Private IPs</span>
        )}
        {mode === 'data' && (
          <span>Real-time Ingest Pipeline $\rightarrow$ <strong className="text-[#4ADE80]">Wazuh Agent :1514</strong></span>
        )}
        {mode === 'attack' && (
          <span>Attack Dispatch $\rightarrow$ <strong className="text-[#FF5A5F]">T1059.001 / T1190</strong> $\rightarrow$ Telemetry $\rightarrow$ Rule Alert</span>
        )}
      </div>
    </div>
  );
};
