import React from 'react';

export const ArchitectureLegend: React.FC = () => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#090b0e] border-t border-white/[0.07] text-[11px] font-mono text-[#8E959F]">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#6ED6FF]" />
          <span>Public Edge</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#FF5A5F]" />
          <span>Adversary Host</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#4F8CFF]" />
          <span>Windows Sysmon</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#FBBF24]" />
          <span>Web & Auditd</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#4ADE80]" />
          <span>Wazuh SIEM</span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-[10px] text-[#525866]">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-[#4F8CFF]" />
          <span>Telemetry Ingest (:1514)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 border-t border-dashed border-[#FF5A5F]" />
          <span>Attack Emulation</span>
        </div>
      </div>
    </div>
  );
};
