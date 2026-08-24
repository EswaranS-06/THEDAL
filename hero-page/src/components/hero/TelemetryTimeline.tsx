import React from 'react';
import {
  Terminal,
  Play,
  CheckCircle2,
  Database,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Server,
  Layers,
  Code2
} from 'lucide-react';
import { AttackScenarioId, SimulationPhase } from './types';
import { SCENARIOS } from './scenariosData';
import { TelemetryChart } from './TelemetryChart';

interface TelemetryTimelineProps {
  selectedScenario: AttackScenarioId;
  onSelectScenario: (id: AttackScenarioId) => void;
  phase: SimulationPhase;
  progress: number;
  eventsPerSec: number;
  epsHistory: number[];
  onTriggerSimulation: () => void;
}

export const TelemetryTimeline: React.FC<TelemetryTimelineProps> = ({
  selectedScenario,
  onSelectScenario,
  phase,
  progress,
  eventsPerSec,
  epsHistory,
  onTriggerSimulation,
}) => {
  const current = SCENARIOS[selectedScenario] || SCENARIOS.powershell;
  const isRunning = phase !== 'idle';
  const isCompleted = phase === 'alert_generated';

  const pipelineSteps = [
    { id: 'firing', label: '1. Exploit Fired', active: phase !== 'idle' },
    {
      id: 'transit',
      label: '2. Vector Transit',
      active: phase === 'packet_in_transit' || phase === 'endpoint_hit' || phase === 'siem_ingesting' || phase === 'rule_evaluated' || phase === 'alert_generated',
    },
    {
      id: 'hit',
      label: '3. Host Sysmon / Log',
      active: phase === 'endpoint_hit' || phase === 'siem_ingesting' || phase === 'rule_evaluated' || phase === 'alert_generated',
    },
    {
      id: 'siem',
      label: '4. Wazuh Ingest',
      active: phase === 'siem_ingesting' || phase === 'rule_evaluated' || phase === 'alert_generated',
    },
    {
      id: 'alert',
      label: '5. Rule Triggered',
      active: phase === 'rule_evaluated' || phase === 'alert_generated',
    },
  ];

  return (
    <div className="rounded-2xl border border-cyan-500/30 bg-[#040915]/90 backdrop-blur-xl shadow-[0_0_50px_rgba(0,242,254,0.15)] overflow-hidden font-mono">
      {/* 1. Header Toolbar */}
      <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
        {/* Terminal Title & Window Dots */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5" aria-hidden="true">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>THEDAL SOC ADVERSARY EMULATION CONSOLE</span>
          </div>
        </div>

        {/* MITRE Technique Selector Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-black/60 border border-slate-800 text-xs">
          <button
            onClick={() => onSelectScenario('powershell')}
            disabled={isRunning}
            className={`px-3 py-1 rounded transition-all duration-150 text-[11px] font-bold ${
              selectedScenario === 'powershell'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(0,242,254,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            T1059.001 PowerShell
          </button>
          <button
            onClick={() => onSelectScenario('sqli')}
            disabled={isRunning}
            className={`px-3 py-1 rounded transition-all duration-150 text-[11px] font-bold ${
              selectedScenario === 'sqli'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(0,242,254,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            T1190 Web SQLi
          </button>
          <button
            onClick={() => onSelectScenario('task')}
            disabled={isRunning}
            className={`px-3 py-1 rounded transition-all duration-150 text-[11px] font-bold ${
              selectedScenario === 'task'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_12px_rgba(0,242,254,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            T1053.005 Persistence
          </button>
        </div>
      </div>

      {/* 2. Attack Lifecycle Pipeline Tracker */}
      <div className="px-4 py-2.5 bg-[#02050e] border-b border-slate-900 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[580px] text-[10px]">
          {pipelineSteps.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all ${
                  step.active
                    ? 'bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-bold'
                    : 'text-slate-500'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    step.active ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'
                  }`}
                />
                <span>{step.label}</span>
              </div>
              {idx < pipelineSteps.length - 1 && (
                <ArrowRight
                  className={`w-3 h-3 ${
                    step.active ? 'text-cyan-500' : 'text-slate-800'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 3. Main Console Grid */}
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#030713]">
        {/* Left Column: Exploit Dispatcher */}
        <div className="lg:col-span-6 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider">
                {current.category}
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Target: {current.targetHost} ({current.targetIp})
              </span>
            </div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{current.title}</span>
            </h3>
            <p className="text-xs text-slate-400 font-sans">{current.subtitle}</p>
          </div>

          {/* Terminal Command Snippet */}
          <div className="p-3.5 rounded-xl bg-[#01040a] border border-slate-800/90 text-xs text-slate-300 space-y-2">
            <div className="text-[10px] text-slate-400 flex items-center justify-between border-b border-slate-900 pb-1.5">
              <span>Kali Infiltration Payload (Node 10.10.20.10):</span>
              <span className="text-emerald-400 font-bold">1-COMMAND DISPATCH</span>
            </div>
            <pre className="text-cyan-300 text-[11px] leading-relaxed whitespace-pre-wrap break-all selection:bg-cyan-500 selection:text-black">
              <code>{current.command}</code>
            </pre>
          </div>

          {/* Fire Simulation Action Button */}
          <div className="space-y-2">
            <button
              onClick={onTriggerSimulation}
              disabled={isRunning}
              className={`w-full inline-flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl text-xs font-bold font-mono tracking-wide transition-all duration-200 ${
                isRunning
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 cursor-wait shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                  : isCompleted
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.35)]'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black shadow-[0_0_25px_rgba(16,185,129,0.4)] active:scale-[0.99]'
              }`}
            >
              {isRunning ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                  <span>TRANSMITTING ADVERSARY PAYLOAD & CAPTURING TELEMETRY...</span>
                </>
              ) : isCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>DETECTION CONFIRMED IN OPENSEARCH DASHBOARDS</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-black text-black" />
                  <span>FIRE 1-CLICK ATTACK SIMULATION</span>
                </>
              )}
            </button>
          </div>

          {/* Live Mini Charts */}
          <TelemetryChart
            eventsPerSec={eventsPerSec}
            historyEps={epsHistory}
            severityLevel={current.severityLevel}
            severityColor={current.severityColor}
            isSimulating={isRunning}
            latencyMs={current.metrics.detectionLatencyMs}
            confidence={current.metrics.confidence}
          />
        </div>

        {/* Right Column: Wazuh & OpenSearch Telemetry Stream */}
        <div className="lg:col-span-6 rounded-xl bg-[#010409] border border-slate-800/90 p-4 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-300 font-semibold text-[11px]">
                Wazuh SIEM Ingest Stream
              </span>
            </div>
            <span className="text-[10px] text-cyan-300 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/80">
              Index: {current.index}
            </span>
          </div>

          <div className="space-y-2.5 text-[11px]">
            {/* Rule Name Banner */}
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-[9px] text-slate-400 uppercase tracking-wide">
                  Triggered Detection Rule:
                </div>
                <div className="text-slate-200 font-semibold text-[11px]">
                  {current.ruleName}
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                  current.severityColor === 'rose'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                {current.severity}
              </span>
            </div>

            {/* Normalized JSON Document View */}
            <div className="p-3 rounded-lg bg-black/80 border border-slate-800/80 text-[10px] space-y-1.5 overflow-x-auto">
              <div className="flex items-center justify-between text-slate-400 font-semibold text-[9px] uppercase tracking-wider border-b border-slate-900 pb-1">
                <span className="flex items-center gap-1">
                  <Code2 className="w-3 h-3 text-emerald-400" />
                  <span>Normalized OpenSearch JSON Payload</span>
                </span>
                <span className="text-emerald-400 font-bold">PARSED ECS</span>
              </div>
              <pre className="text-emerald-400 font-mono leading-relaxed selection:bg-emerald-500 selection:text-black">
                {JSON.stringify(current.eventData, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
