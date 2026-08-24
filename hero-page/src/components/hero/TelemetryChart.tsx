import React from 'react';
import { Activity, Zap, Clock } from 'lucide-react';

interface TelemetryChartProps {
  eventsPerSec: number;
  historyEps: number[];
  severityLevel: number;
  severityColor: 'amber' | 'rose' | 'emerald';
  isSimulating: boolean;
  latencyMs: number;
  confidence: number;
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({
  eventsPerSec,
  historyEps,
  severityLevel,
  severityColor,
  isSimulating,
  latencyMs,
  confidence,
}) => {
  // Normalize history values for SVG path calculation (range 0 - 250)
  const maxVal = 240;
  const width = 160;
  const height = 40;

  const points = historyEps
    .map((val, idx) => {
      const x = (idx / (historyEps.length - 1)) * width;
      const y = height - (Math.min(val, maxVal) / maxVal) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(' ');

  const currentX = width;
  const currentY =
    height - (Math.min(eventsPerSec, maxVal) / maxVal) * (height - 6) - 3;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-[#02050c]/90 border border-slate-800/80 font-mono">
      {/* 1. Live EPS Sparkline */}
      <div className="sm:col-span-1 space-y-1.5 p-2 rounded-lg bg-black/40 border border-slate-900">
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>INGEST RATE</span>
          </span>
          <span className={`font-bold ${isSimulating ? 'text-cyan-300' : 'text-slate-300'}`}>
            {eventsPerSec} EPS
          </span>
        </div>

        {/* Real-time SVG Sparkline */}
        <div className="h-10 w-full relative overflow-hidden flex items-end">
          <svg
            className="w-full h-full overflow-visible"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="epsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#00f2fe" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Gradient fill underneath */}
            <polygon
              points={`0,${height} ${points} ${width},${height}`}
              fill="url(#epsGrad)"
            />

            {/* Sparkline path */}
            <polyline
              fill="none"
              stroke="#00f2fe"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />

            {/* Moving current point */}
            <circle
              cx={currentX}
              cy={currentY}
              r="3"
              fill="#00f2fe"
              className={isSimulating ? 'animate-ping' : ''}
            />
            <circle cx={currentX} cy={currentY} r="2" fill="#ffffff" />
          </svg>
        </div>
      </div>

      {/* 2. Detection Criticality Gauge */}
      <div className="sm:col-span-1 space-y-1.5 p-2 rounded-lg bg-black/40 border border-slate-900">
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>RULE SEVERITY</span>
          </span>
          <span
            className={`font-bold ${
              severityColor === 'rose'
                ? 'text-rose-400'
                : severityColor === 'amber'
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            LVL {severityLevel}/16
          </span>
        </div>

        {/* 16-Segment Criticality Bar */}
        <div className="pt-2">
          <div className="grid grid-cols-16 gap-0.5 h-2 bg-slate-950 rounded p-0.5 border border-slate-800">
            {Array.from({ length: 16 }).map((_, i) => {
              const active = i < severityLevel;
              let barBg = 'bg-slate-800';
              if (active) {
                if (i < 8) barBg = 'bg-cyan-500';
                else if (i < 12) barBg = 'bg-amber-400';
                else barBg = 'bg-rose-500';
              }
              return (
                <div
                  key={i}
                  className={`h-full rounded-sm transition-all duration-300 ${barBg}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[8px] text-slate-500 mt-1">
            <span>Low</span>
            <span>Medium</span>
            <span>Critical</span>
          </div>
        </div>
      </div>

      {/* 3. Ingestion Latency & Confidence */}
      <div className="sm:col-span-1 space-y-1.5 p-2 rounded-lg bg-black/40 border border-slate-900">
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>PIPELINE LATENCY</span>
          </span>
          <span className="text-emerald-300 font-bold">{latencyMs}ms</span>
        </div>

        <div className="pt-1.5 space-y-1">
          <div className="flex justify-between text-[9px]">
            <span className="text-slate-400">Model Confidence:</span>
            <span className="text-emerald-400 font-bold">{confidence}%</span>
          </div>
          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
