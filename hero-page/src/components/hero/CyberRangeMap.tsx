import React, { useState } from 'react';
import {
  Play,
  Server,
  Shield,
  Zap,
  Globe,
  Database,
  Terminal,
  Activity,
  Layers,
  CheckCircle,
  X,
  Radio,
  Cpu
} from 'lucide-react';
import { SCENARIOS, TOPOLOGY_NODES, NetworkNode, AttackScenario } from './scenariosData';
import { useScenarioSimulation } from '../../hooks/useScenarioSimulation';
import { ScenarioTelemetry } from './ScenarioTelemetry';

export const CyberRangeMap: React.FC = () => {
  const simulation = useScenarioSimulation();
  const [inspectedNode, setInspectedNode] = useState<NetworkNode | null>(null);

  // SVG coordinate definitions for the 800x480 coordinate space
  const nodeCoords: Record<string, { x: number; y: number; label: string; ip: string; tierColor: string }> = {
    'node-attack': { x: 95, y: 145, label: 'THEDAL-attack', ip: '10.10.20.10', tierColor: '#FF5A5F' },
    'node-bastion': { x: 265, y: 85, label: 'THEDAL-bastion', ip: '10.10.0.10', tierColor: '#6ED6FF' },
    'node-windows': { x: 425, y: 185, label: 'THEDAL-windows', ip: '10.10.10.20', tierColor: '#4F8CFF' },
    'node-web': { x: 395, y: 345, label: 'THEDAL-web', ip: '10.10.30.10', tierColor: '#FBBF24' },
    'node-linux': { x: 205, y: 365, label: 'THEDAL-linux', ip: '10.10.30.20', tierColor: '#4ADE80' },
    'node-siem': { x: 635, y: 195, label: 'WAZUH-SIEM', ip: '10.10.0.20', tierColor: '#4F8CFF' },
    'node-opensearch': { x: 705, y: 355, label: 'OpenSearch', ip: '10.10.0.20:9200', tierColor: '#A78BFA' },
  };

  const activeTargetKey = simulation.scenario.targetNode;
  const attackSource = nodeCoords['node-attack'];
  const targetCoord = nodeCoords[activeTargetKey] || nodeCoords['node-windows'];
  const siemCoord = nodeCoords['node-siem'];
  const opensearchCoord = nodeCoords['node-opensearch'];

  // Calculate packet position based on phase and progress
  let packetPos: { x: number; y: number; visible: boolean; color: string } = { x: 0, y: 0, visible: false, color: '#4F8CFF' };
  
  if (simulation.phase === 'attack') {
    // Progress 0 -> 0.4 mapped to 0 -> 1
    const p = Math.min(simulation.progress / 0.4, 1);
    packetPos = {
      x: attackSource.x + (targetCoord.x - attackSource.x) * p,
      y: attackSource.y + (targetCoord.y - attackSource.y) * p,
      visible: true,
      color: '#FF5A5F',
    };
  } else if (simulation.phase === 'ingest') {
    // Progress 0.4 -> 0.75 mapped to 0 -> 1
    const p = Math.min((simulation.progress - 0.4) / 0.35, 1);
    packetPos = {
      x: targetCoord.x + (siemCoord.x - targetCoord.x) * p,
      y: targetCoord.y + (siemCoord.y - targetCoord.y) * p,
      visible: true,
      color: '#4ADE80',
    };
  } else if (simulation.phase === 'detected') {
    // Pulse to OpenSearch
    const p = Math.min((simulation.progress - 0.75) / 0.25, 1);
    packetPos = {
      x: siemCoord.x + (opensearchCoord.x - siemCoord.x) * p,
      y: siemCoord.y + (opensearchCoord.y - siemCoord.y) * p,
      visible: true,
      color: '#4F8CFF',
    };
  }

  const isAttacking = simulation.phase === 'attack';
  const isIngesting = simulation.phase === 'ingest';
  const isDetected = simulation.phase === 'detected';

  return (
    <div className="rounded-xl bg-[#0d0f12] border border-white/[0.08] overflow-hidden shadow-2xl flex flex-col relative">
      {/* Top Controls Bar */}
      <div className="p-3 sm:p-4 border-b border-white/[0.07] bg-[#090b0e] flex flex-wrap items-center justify-between gap-3">
        {/* Left: Infrastructure Status Indicator */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#12151a] border border-white/[0.08] text-[11px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
            <span className="text-[#F5F7FA] font-medium">LIVE AWS RANGE</span>
            <span className="text-[#525866]">|</span>
            <span className="text-[#8E959F]">10.10.0.0/16</span>
          </div>
        </div>

        {/* Right: Scenario Selector Tabs */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-[#525866] uppercase hidden sm:inline">Scenario:</span>
          {Object.values(SCENARIOS).map((sc) => {
            const isSelected = simulation.selectedScenarioId === sc.id;
            return (
              <button
                key={sc.id}
                onClick={() => simulation.selectScenario(sc.id)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#181b21] text-[#F5F7FA] border border-[#4F8CFF]/50 shadow-sm'
                    : 'text-[#8E959F] hover:text-[#F5F7FA] hover:bg-[#12151a]'
                }`}
              >
                <span className="text-[10px] text-[#4F8CFF] font-semibold">{sc.mitreCode}</span>
                <span className="hidden md:inline text-[11px]">{sc.title.split(' ')[0]}</span>
              </button>
            );
          })}

          <button
            onClick={() => simulation.triggerSimulation()}
            disabled={simulation.phase !== 'idle'}
            className={`ml-1 px-3 py-1 rounded text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
              simulation.phase !== 'idle'
                ? 'bg-[#181b21] text-[#8E959F] border border-white/[0.06] cursor-not-allowed'
                : 'bg-[#4F8CFF] hover:bg-[#6EA0FF] text-[#08090B] shadow-sm'
            }`}
            title="Dispatch Attack Emulation"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>{simulation.phase !== 'idle' ? 'Emulating...' : 'Dispatch'}</span>
          </button>
        </div>
      </div>

      {/* SVG Topology Visualizer */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-[#08090b] select-none">
        <svg
          viewBox="0 0 800 450"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Subtle background grid pattern */}
            <pattern id="dotGrid" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="16" cy="16" r="0.8" fill="rgba(255,255,255,0.06)" />
            </pattern>

            {/* Linear gradients for telemetry conduits */}
            <linearGradient id="attackPathGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF5A5F" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FF5A5F" stopOpacity="0.2" />
            </linearGradient>

            <linearGradient id="ingestPathGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4ADE80" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#4F8CFF" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Background Grid */}
          <rect width="800" height="450" fill="url(#dotGrid)" />

          {/* VPC Subnet Zone Boundaries (Architectural Hairlines) */}
          <g className="opacity-30">
            {/* External Tier Zone */}
            <rect x="30" y="30" width="140" height="390" rx="8" fill="none" stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
            <text x="42" y="52" fill="#8E959F" fontSize="9" fontFamily="monospace" letterSpacing="0.1em">ATTACK ZONE (10.10.20.0)</text>

            {/* Perimeter & Internal Tier Zone */}
            <rect x="180" y="30" width="350" height="390" rx="8" fill="none" stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
            <text x="192" y="52" fill="#8E959F" fontSize="9" fontFamily="monospace" letterSpacing="0.1em">INTERNAL VPC TARGETS (10.10.0.0/16)</text>

            {/* SOC Tier Zone */}
            <rect x="540" y="30" width="230" height="390" rx="8" fill="none" stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
            <text x="552" y="52" fill="#8E959F" fontSize="9" fontFamily="monospace" letterSpacing="0.1em">SOC DETECTION ENGINE (10.10.10.0)</text>
          </g>

          {/* Architectural Network Connections (Edges) */}
          <g strokeLinecap="round">
            {/* Bastion Proxy Tunnel to Internal Nodes */}
            <line x1={nodeCoords['node-bastion'].x} y1={nodeCoords['node-bastion'].y} x2={nodeCoords['node-windows'].x} y2={nodeCoords['node-windows'].y} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
            <line x1={nodeCoords['node-bastion'].x} y1={nodeCoords['node-bastion'].y} x2={nodeCoords['node-web'].x} y2={nodeCoords['node-web'].y} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
            <line x1={nodeCoords['node-bastion'].x} y1={nodeCoords['node-bastion'].y} x2={nodeCoords['node-linux'].x} y2={nodeCoords['node-linux'].y} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />

            {/* Attack Emulation Vector Line */}
            <line
              x1={attackSource.x}
              y1={attackSource.y}
              x2={targetCoord.x}
              y2={targetCoord.y}
              stroke={isAttacking ? '#FF5A5F' : 'rgba(255,90,95,0.2)'}
              strokeWidth={isAttacking ? 2 : 1}
              strokeDasharray={isAttacking ? 'none' : '4 4'}
              className="transition-colors duration-300"
            />

            {/* Telemetry Stream Lines to SIEM */}
            <line
              x1={nodeCoords['node-windows'].x}
              y1={nodeCoords['node-windows'].y}
              x2={siemCoord.x}
              y2={siemCoord.y}
              stroke={isIngesting && activeTargetKey === 'node-windows' ? '#4ADE80' : 'rgba(79,140,255,0.18)'}
              strokeWidth={isIngesting && activeTargetKey === 'node-windows' ? 2 : 1}
            />
            <line
              x1={nodeCoords['node-web'].x}
              y1={nodeCoords['node-web'].y}
              x2={siemCoord.x}
              y2={siemCoord.y}
              stroke={isIngesting && activeTargetKey === 'node-web' ? '#4ADE80' : 'rgba(79,140,255,0.18)'}
              strokeWidth={isIngesting && activeTargetKey === 'node-web' ? 2 : 1}
            />
            <line
              x1={nodeCoords['node-linux'].x}
              y1={nodeCoords['node-linux'].y}
              x2={siemCoord.x}
              y2={siemCoord.y}
              stroke="rgba(79,140,255,0.12)"
              strokeWidth="1"
            />

            {/* SIEM to OpenSearch Indexing */}
            <line
              x1={siemCoord.x}
              y1={siemCoord.y}
              x2={opensearchCoord.x}
              y2={opensearchCoord.y}
              stroke={isDetected ? '#4F8CFF' : 'rgba(167,139,250,0.2)'}
              strokeWidth={isDetected ? 2 : 1}
            />
          </g>

          {/* Traveling Telemetry Packet Animation */}
          {packetPos.visible && (
            <g>
              <circle
                cx={packetPos.x}
                cy={packetPos.y}
                r="4.5"
                fill={packetPos.color}
                className="transition-all"
              />
              <circle
                cx={packetPos.x}
                cy={packetPos.y}
                r="9"
                fill="none"
                stroke={packetPos.color}
                strokeWidth="1"
                opacity="0.6"
              />
            </g>
          )}

          {/* Render Topology Nodes */}
          {Object.entries(nodeCoords).map(([id, coord]) => {
            const isSource = id === 'node-attack' && isAttacking;
            const isTarget = id === activeTargetKey && (isAttacking || isIngesting);
            const isSiemActive = id === 'node-siem' && (isIngesting || isDetected);
            const isOpensearchActive = id === 'node-opensearch' && isDetected;

            const isHighlighted = isSource || isTarget || isSiemActive || isOpensearchActive;
            const nodeData = TOPOLOGY_NODES.find((n) => n.id === id);

            return (
              <g
                key={id}
                className="cursor-pointer group"
                onClick={() => nodeData && setInspectedNode(nodeData)}
              >
                {/* Outer Ring on Hover / Active State */}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r="20"
                  fill="#08090b"
                  stroke={isHighlighted ? coord.tierColor : 'rgba(255,255,255,0.1)'}
                  strokeWidth={isHighlighted ? 2 : 1}
                  className="transition-all duration-200 group-hover:stroke-white/[0.4]"
                />

                {/* Inner Core Node */}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r="6"
                  fill={coord.tierColor}
                  className="transition-transform duration-200 group-hover:scale-125 origin-center"
                />

                {/* Status Dot */}
                <circle
                  cx={coord.x + 13}
                  cy={coord.y - 13}
                  r="2.5"
                  fill="#4ADE80"
                />

                {/* Node Text Labels */}
                <text
                  x={coord.x}
                  y={coord.y + 34}
                  textAnchor="middle"
                  fill="#F5F7FA"
                  fontSize="11"
                  fontFamily="monospace"
                  fontWeight="600"
                  className="transition-colors group-hover:fill-[#4F8CFF]"
                >
                  {coord.label}
                </text>
                <text
                  x={coord.x}
                  y={coord.y + 47}
                  textAnchor="middle"
                  fill="#8E959F"
                  fontSize="9.5"
                  fontFamily="monospace"
                >
                  {coord.ip}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Node Inspection Inline Drawer Modal */}
        {inspectedNode && (
          <div className="absolute inset-0 bg-[#08090b]/95 backdrop-blur-md p-4 sm:p-6 flex flex-col justify-between animate-in fade-in duration-150">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-[#12151a] border border-white/[0.1] flex items-center justify-center text-[#4F8CFF]">
                    <Server className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold font-mono text-[#F5F7FA]">
                      {inspectedNode.name}
                    </h4>
                    <p className="text-[11px] text-[#8E959F] font-mono">
                      Static IP: <span className="text-[#4F8CFF]">{inspectedNode.ip}</span> • Tier: <span className="text-[#F5F7FA] uppercase">{inspectedNode.tier}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setInspectedNode(null)}
                  className="p-1 rounded bg-[#12151a] hover:bg-[#181b21] text-[#8E959F] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded bg-[#0d0f12] border border-white/[0.06] space-y-1">
                  <div className="text-[10px] text-[#525866] uppercase">Operating System & Role</div>
                  <div className="text-[#F5F7FA] font-medium">{inspectedNode.os}</div>
                  <div className="text-[11px] text-[#8E959F]">{inspectedNode.role}</div>
                </div>

                <div className="p-3 rounded bg-[#0d0f12] border border-white/[0.06] space-y-1">
                  <div className="text-[10px] text-[#525866] uppercase">Telemetry Channel</div>
                  <div className="text-[#6ED6FF] font-medium">{inspectedNode.telemetrySource}</div>
                </div>
              </div>

              <div className="space-y-1.5 font-mono text-xs">
                <div className="text-[10px] text-[#525866] uppercase">Installed Tooling & Services</div>
                <div className="flex flex-wrap gap-1.5">
                  {inspectedNode.specs.map((spec, i) => (
                    <span key={i} className="px-2 py-1 rounded bg-[#12151a] border border-white/[0.06] text-[11px] text-[#F5F7FA]">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-[#8E959F]">
              <span>Click outside to return to network topology</span>
              <button
                onClick={() => setInspectedNode(null)}
                className="px-3 py-1 rounded bg-[#181b21] hover:bg-[#222730] text-[#F5F7FA]"
              >
                Close Inspector
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Live Telemetry Drawer */}
      <ScenarioTelemetry
        scenario={simulation.scenario}
        phase={simulation.phase}
        progress={simulation.progress}
      />
    </div>
  );
};
