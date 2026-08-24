import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
  Server,
  ShieldAlert,
  Terminal,
  Globe,
  Database,
  Cpu,
} from 'lucide-react';
import { ArchitectureNodeData } from './architectureData';

const iconMap = {
  bastion: Globe,
  attack: ShieldAlert,
  windows: Cpu,
  web: Terminal,
  wazuh: Database,
};

export const ArchitectureNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as unknown as ArchitectureNodeData;
  const IconComponent = iconMap[nodeData.id] || Server;

  return (
    <div
      className={`w-[210px] rounded-lg bg-[#0d0f12] border transition-all duration-200 p-3 text-xs font-mono select-none cursor-pointer shadow-lg ${
        selected
          ? 'border-[#4F8CFF] ring-1 ring-[#4F8CFF]/50 bg-[#12151a]'
          : 'border-white/[0.09] hover:border-white/[0.22] hover:bg-[#12151a]'
      }`}
    >
      {/* Invisible Handles positioned for clean orthogonal routing */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-1.5 !h-1.5 !bg-transparent !border-none !min-w-0 !min-h-0 pointer-events-none"
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-1.5 !h-1.5 !bg-transparent !border-none !min-w-0 !min-h-0 pointer-events-none"
        isConnectable={false}
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!w-1.5 !h-1.5 !bg-transparent !border-none !min-w-0 !min-h-0 pointer-events-none"
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-1.5 !h-1.5 !bg-transparent !border-none !min-w-0 !min-h-0 pointer-events-none"
        isConnectable={false}
      />

      {/* Node Header */}
      <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className="w-5 h-5 rounded flex items-center justify-center shrink-0"
            style={{
              backgroundColor: `${nodeData.badgeColor}15`,
              color: nodeData.badgeColor,
            }}
          >
            <IconComponent className="w-3 h-3" />
          </div>
          <span className="font-semibold text-xs text-[#F5F7FA] truncate">
            {nodeData.name}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
        </div>
      </div>

      {/* Role & Specs */}
      <div className="pt-2 space-y-1.5">
        <div className="text-[11px] text-[#8E959F] leading-tight line-clamp-1">
          {nodeData.role}
        </div>
        <div className="flex items-center justify-between text-[10px] text-[#525866] pt-0.5">
          <span className="text-[#4F8CFF] font-medium">{nodeData.ip}</span>
          <span className="text-[#8E959F] px-1 rounded bg-[#08090b] border border-white/[0.06]">
            {nodeData.subnet}
          </span>
        </div>
      </div>
    </div>
  );
});

ArchitectureNode.displayName = 'ArchitectureNode';
