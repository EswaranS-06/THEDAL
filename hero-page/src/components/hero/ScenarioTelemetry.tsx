import React, { useState } from 'react';
import { Copy, Check, Terminal, ShieldAlert, Cpu, Activity, Clock } from 'lucide-react';
import { AttackScenario } from './scenariosData';
import { SimulationPhase } from '../../hooks/useScenarioSimulation';

interface ScenarioTelemetryProps {
  scenario: AttackScenario;
  phase: SimulationPhase;
  progress: number;
}

export const ScenarioTelemetry: React.FC<ScenarioTelemetryProps> = ({
  scenario,
  phase,
  progress,
}) => {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<'command' | 'event' | 'detection'>('command');

  const handleCopy = () => {
    navigator.clipboard.writeText(scenario.command);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const isSimulating = phase !== 'idle';

  return (
    <div className="bg-[#090b0e] border-t border-white/[0.07] p-3.5 sm:p-4 text-xs font-mono">
      {/* Header bar with tabs and telemetry latency indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTab('command')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
              tab === 'command'
                ? 'bg-[#181b21] text-[#F5F7FA] border border-white/[0.1]'
                : 'text-[#8E959F] hover:text-[#F5F7FA]'
            }`}
          >
            1. Emulation Payload
          </button>
          <button
            onClick={() => setTab('event')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
              tab === 'event'
                ? 'bg-[#181b21] text-[#F5F7FA] border border-white/[0.1]'
                : 'text-[#8E959F] hover:text-[#F5F7FA]'
            }`}
          >
            2. Raw Telemetry
          </button>
          <button
            onClick={() => setTab('detection')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
              tab === 'detection'
                ? 'bg-[#181b21] text-[#F5F7FA] border border-white/[0.1]'
                : 'text-[#8E959F] hover:text-[#F5F7FA]'
            }`}
          >
            3. Wazuh SIEM Alert
          </button>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-[#8E959F]">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#4F8CFF]" />
            <span>Transit: <strong className="text-[#F5F7FA]">{scenario.metrics.transitLatencyMs}ms</strong></span>
          </div>
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-[#4ADE80]" />
            <span>Confidence: <strong className="text-[#F5F7FA]">{scenario.metrics.confidence}%</strong></span>
          </div>
        </div>
      </div>

      {/* Content panel */}
      <div className="rounded bg-[#040507] border border-white/[0.06] p-2.5 sm:p-3 relative overflow-hidden">
        {/* Simulation phase banner */}
        {isSimulating && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#181b21] overflow-hidden">
            <div
              className="h-full bg-[#4F8CFF] transition-all duration-75"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        )}

        {tab === 'command' && (
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 overflow-x-auto">
              <div className="text-[10px] text-[#525866] uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-[#FF5A5F]" />
                <span>Adversary Vector — {scenario.mitreCode} ({scenario.category})</span>
              </div>
              <code className="text-[#F5F7FA] text-[11px] block whitespace-pre-wrap break-all leading-relaxed font-mono">
                {scenario.command}
              </code>
            </div>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded bg-[#12151a] hover:bg-[#181b21] border border-white/[0.08] text-[#8E959F] hover:text-[#F5F7FA] shrink-0"
              title="Copy Command"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#4ADE80]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

        {tab === 'event' && (
          <div className="space-y-1 overflow-x-auto">
            <div className="text-[10px] text-[#525866] uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3 h-3 text-[#4F8CFF]" />
                <span>Log Source: {scenario.logSource}</span>
              </span>
              <span className="text-[#8E959F]">Agent ID: {scenario.rawEvent.agentId}</span>
            </div>
            <div className="text-[#8E959F] text-[11px] space-y-0.5 pt-1">
              <div><strong className="text-[#F5F7FA]">Event ID:</strong> {scenario.rawEvent.eventId}</div>
              <div><strong className="text-[#F5F7FA]">Payload:</strong> <span className="text-[#6ED6FF]">{scenario.rawEvent.details}</span></div>
              {scenario.rawEvent.parentProcess && (
                <div><strong className="text-[#F5F7FA]">Lineage:</strong> {scenario.rawEvent.parentProcess}</div>
              )}
            </div>
          </div>
        )}

        {tab === 'detection' && (
          <div className="space-y-1">
            <div className="text-[10px] text-[#525866] uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-3 h-3 text-[#FF5A5F]" />
                <span>Correlation Engine: Wazuh 4.7 Core</span>
              </span>
              <span className="text-[#FF5A5F] font-bold">{scenario.severity}</span>
            </div>
            <div className="text-[#F5F7FA] text-[11px] pt-1">
              <div className="font-semibold text-[#4F8CFF]">{scenario.ruleName}</div>
              <div className="text-[10px] text-[#8E959F] mt-0.5">
                Rule ID <strong className="text-[#F5F7FA]">{scenario.ruleId}</strong> • Index: <code className="text-[#6ED6FF]">wazuh-alerts-*</code> • Action: Correlated & Displayed in SOC Triage
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
