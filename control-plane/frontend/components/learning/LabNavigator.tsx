"use client";

import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  CircleDot,
  Circle,
  RotateCcw,
  ArrowLeft,
  GraduationCap,
  Layers,
  ChevronRight,
} from "lucide-react";
import { LabItem, CurriculumStats } from "../../lib/types/api";

interface LabNavigatorProps {
  currentLabId: string;
  allLabs: LabItem[];
  stats: CurriculumStats | null;
  onResetLab?: () => void;
  isResetting?: boolean;
}

export const LabNavigator: React.FC<LabNavigatorProps> = ({
  currentLabId,
  allLabs,
  stats,
  onResetLab,
  isResetting,
}) => {
  const currentIdx = allLabs.findIndex((l) => l.id === currentLabId);
  const total = allLabs.length || 14;
  const completed = stats?.completed || allLabs.filter((l) => l.status === "Completed").length;
  const progressPct = Math.round((completed / total) * 100);

  // Group labs by level
  const levels = [
    {
      title: "LEVEL 1 — FOUNDATIONS",
      code: "1",
      labs: allLabs.filter((l) => l.level_code === "1"),
    },
    {
      title: "LEVEL 2 — INVESTIGATION",
      code: "2",
      labs: allLabs.filter((l) => l.level_code === "2"),
    },
    {
      title: "LEVEL 3 — ATTACK CORRELATION",
      code: "3",
      labs: allLabs.filter((l) => l.level_code === "3"),
    },
  ];

  return (
    <div className="flex flex-col h-full bg-card/70 border-r border-border-subtle select-none">
      {/* Navigator Top Header */}
      <div className="p-3.5 border-b border-border-subtle space-y-3">
        <div className="flex items-center justify-between">
          <Link
            href="/learning"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Curriculum</span>
          </Link>
          <span className="text-[11px] font-mono text-slate-400">
            Lab {currentIdx >= 0 ? currentIdx + 1 : 1} of {total}
          </span>
        </div>

        {/* Overall Curriculum Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Curriculum Progress</span>
            <span className="font-mono text-primary font-bold">
              {completed}/{total} ({progressPct}%)
            </span>
          </div>
          <div className="w-full bg-surface h-1.5 rounded-full overflow-hidden border border-border-subtle">
            <div
              className="h-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-500 rounded-full"
              style={{ width: `${Math.max(progressPct, 4)}%` }}
            />
          </div>
        </div>

        {/* Reset Lab Action */}
        {onResetLab && (
          <button
            onClick={onResetLab}
            disabled={isResetting}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded bg-surface/70 hover:bg-rose-950/30 hover:border-rose-800/40 text-slate-400 hover:text-rose-400 border border-border-subtle text-[11px] font-mono transition-all disabled:opacity-50"
            title="Reset answers, evidence, and notes for this lab"
          >
            <RotateCcw className={`w-3 h-3 ${isResetting ? "animate-spin" : ""}`} />
            <span>Reset Lab Progress</span>
          </button>
        )}
      </div>

      {/* Lab List / Accordion */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4 text-xs scrollbar-thin">
        {levels.map((lvl) => {
          if (lvl.labs.length === 0) return null;
          return (
            <div key={lvl.code} className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-500 tracking-wider uppercase font-mono">
                {lvl.title}
              </div>
              <div className="space-y-0.5">
                {lvl.labs.map((lab) => {
                  const isActive = lab.id === currentLabId;
                  const isDone = lab.status === "Completed";
                  const isInProg = lab.status === "In Progress";

                  return (
                    <Link
                      key={lab.id}
                      href={`/learning/labs/${lab.id}`}
                      className={`group flex items-center justify-between px-2.5 py-2 rounded transition-all ${
                        isActive
                          ? "bg-primary/15 text-primary border border-primary/40 font-semibold shadow-sm"
                          : "text-slate-300 hover:bg-surface/80 hover:text-slate-100 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        {isDone ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : isInProg ? (
                          <CircleDot className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0 group-hover:text-slate-400" />
                        )}
                        <span className="truncate text-[11px] leading-tight">
                          {lab.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
