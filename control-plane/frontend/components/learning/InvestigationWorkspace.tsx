"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Terminal,
  Search,
  Brain,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Server,
  Play,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Clock,
  Layers,
  FileText,
} from "lucide-react";
import { LabWorkspaceData, LabPhase, LabQuestion } from "../../lib/types/api";
import { StatusBadge } from "../ui/StatusBadge";
import { CommandBlock } from "../ui/CommandBlock";
import { useToast } from "../ui/Toast";

interface InvestigationWorkspaceProps {
  workspace: LabWorkspaceData;
  onUpdateStep: (stepIndex: number) => Promise<void>;
  onSaveVerdict: (verdict: string) => Promise<void>;
  onSubmitAnswer: (questionId: string, option: string, isCorrect: boolean) => Promise<void>;
  onStartRequiredHosts: () => Promise<void>;
  onCompleteLab: () => Promise<void>;
  isStartingHosts?: boolean;
}

export const InvestigationWorkspace: React.FC<InvestigationWorkspaceProps> = ({
  workspace,
  onUpdateStep,
  onSaveVerdict,
  onSubmitAnswer,
  onStartRequiredHosts,
  onCompleteLab,
  isStartingHosts,
}) => {
  const { success, error } = useToast();
  const { lab, environment_status, phases, answers, verdict: savedVerdict } = workspace;

  const [activeStep, setActiveStep] = useState<number>(lab.current_step || 0);
  const [revealedHints, setRevealedHints] = useState<Record<number, boolean>>({});
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (answers) {
      Object.entries(answers).forEach(([k, v]) => {
        initial[k] = v.selected_option;
      });
    }
    return initial;
  });
  const [userVerdict, setUserVerdict] = useState<string>(savedVerdict || "");
  const [isSolutionsRevealed, setIsSolutionsRevealed] = useState(false);
  const [preRevealChecked, setPreRevealChecked] = useState<Record<string, boolean>>({});
  const [copiedQuery, setCopiedQuery] = useState<string | null>(null);

  const currentPhase: LabPhase = phases[activeStep] || phases[0];

  const handleStepChange = async (nextStep: number) => {
    if (nextStep < 0 || nextStep >= phases.length) return;
    setActiveStep(nextStep);
    try {
      await onUpdateStep(nextStep);
    } catch {
      // Non-blocking step update
    }
  };

  const toggleHint = (idx: number) => {
    setRevealedHints((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleAnswerSelect = async (question: LabQuestion, option: string, optIdx: number) => {
    const isCorrect = optIdx === question.correct_index;
    setSelectedAnswers((prev) => ({ ...prev, [question.id]: option }));
    try {
      await onSubmitAnswer(question.id, option, isCorrect);
    } catch (err: any) {
      error("Submission Error", err.message);
    }
  };

  const handleVerdictSubmit = async (v: string) => {
    setUserVerdict(v);
    try {
      await onSaveVerdict(v);
      success("Verdict Recorded", `Case assessed as: ${v}`);
    } catch (err: any) {
      error("Failed to Save Verdict", err.message);
    }
  };

  const handleCopyQueryText = (queryText: string) => {
    navigator.clipboard.writeText(queryText).then(() => {
      setCopiedQuery(queryText);
      setTimeout(() => setCopiedQuery(null), 2000);
      success("Query Copied", "OpenSearch query copied to clipboard.");
    });
  };

  const allPreRevealDone = [
    "identified_process",
    "reviewed_telemetry",
    "inspected_payload",
    "formed_verdict",
  ].every((k) => preRevealChecked[k]);

  return (
    <div className="flex flex-col h-full bg-background overflow-y-auto scrollbar-thin">
      {/* 1. TOP LAB HEADER */}
      <div className="p-4 border-b border-border-subtle bg-card/60 space-y-3 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 font-mono text-[10px] font-bold uppercase">
                {lab.id.toUpperCase()}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {lab.level}
              </span>
              <StatusBadge status={lab.status.toUpperCase()} size="sm" />
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-100 font-mono mt-1">
              {lab.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface border border-border-subtle">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span>MITRE: <strong className="text-slate-200">{lab.mitre}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface border border-border-subtle">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lab.difficulty || "Beginner"}</span>
            </div>
          </div>
        </div>

        {/* Live Lab Environment Status Bar */}
        <div className="p-2.5 rounded bg-surface/80 border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-mono text-[11px] font-bold text-slate-300">
              ENVIRONMENT READINESS:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            {environment_status.required_hosts.map((host) => {
              const isOnline = host.status === "running";
              return (
                <div
                  key={host.key}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded font-mono border ${
                    isOnline
                      ? "bg-emerald-950/30 text-emerald-400 border-emerald-800/40"
                      : "bg-rose-950/30 text-rose-400 border-rose-800/40"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isOnline ? "bg-emerald-400" : "bg-rose-400 animate-pulse"
                    }`}
                  />
                  <span>{host.name}: {isOnline ? "ONLINE" : "OFFLINE"}</span>
                </div>
              );
            })}

            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-card text-slate-400 border border-border-subtle font-mono text-[10px]">
              <span>Index:</span>
              <span className="text-slate-200">{environment_status.required_index}</span>
            </div>
          </div>

          {!environment_status.ready && (
            <button
              onClick={onStartRequiredHosts}
              disabled={isStartingHosts}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-semibold font-mono text-xs transition-colors disabled:opacity-50 shrink-0"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{isStartingHosts ? "Starting EC2..." : "Start Required Nodes"}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. PROGRESSIVE STEP NAVIGATION TABS */}
      <div className="p-2 border-b border-border-subtle bg-surface/40 shrink-0 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 min-w-max">
          {phases.map((phase, idx) => {
            const isActive = idx === activeStep;
            const isPast = idx < activeStep;
            return (
              <button
                key={phase.id}
                onClick={() => handleStepChange(idx)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded font-mono text-xs transition-all border ${
                  isActive
                    ? "bg-primary text-black font-bold border-primary shadow-sm"
                    : isPast
                    ? "bg-surface/90 text-slate-300 border-border-subtle hover:text-white"
                    : "bg-surface/40 text-slate-500 border-transparent hover:text-slate-300"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                    isActive
                      ? "bg-black text-primary font-bold"
                      : isPast
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-700/50"
                      : "bg-surface text-slate-500"
                  }`}
                >
                  {isPast ? "✓" : idx + 1}
                </span>
                <span>{phase.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. STEP CONTENT AREA */}
      <div className="flex-1 p-5 space-y-6 max-w-4xl">
        {/* PHASE 1: MISSION BRIEFING */}
        {currentPhase.id === "phase-1" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="p-4 rounded-lg bg-card border border-primary/30 space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold font-mono text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>MISSION DIRECTIVE</span>
              </div>
              <p className="text-slate-200 text-sm leading-relaxed font-sans">
                {currentPhase.mission}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded bg-card/60 border border-border-subtle space-y-2">
                <div className="font-bold text-slate-200 font-mono flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <span>Objective & Scope</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {currentPhase.objective}
                </p>
              </div>

              <div className="p-4 rounded bg-card/60 border border-border-subtle space-y-2">
                <div className="font-bold text-slate-200 font-mono flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Target Telemetry Stream</span>
                </div>
                <div className="space-y-1 font-mono text-[11px] text-slate-300">
                  <div>Source: <span className="text-emerald-400">{currentPhase.source}</span></div>
                  <div>Target Index: <span className="text-primary">{currentPhase.target_index}</span></div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded bg-surface/50 border border-border-subtle space-y-3">
              <div className="font-bold text-slate-200 font-mono text-xs">
                Suggested Investigation Flow
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] font-mono flex items-center justify-center">1</span>
                  <span>Generate adversary telemetry</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] font-mono flex items-center justify-center">2</span>
                  <span>Query OpenSearch index</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] font-mono flex items-center justify-center">3</span>
                  <span>Cross-reference process lineage</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] font-mono flex items-center justify-center">4</span>
                  <span>Log findings & submit verdict</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => handleStepChange(1)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-primary text-black font-semibold font-mono text-xs hover:bg-primary-hover transition-all shadow-md"
              >
                <span>Start Investigation Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PHASE 2: GENERATE TELEMETRY */}
        {currentPhase.id === "phase-2" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="space-y-1">
              <div className="text-[11px] font-mono text-primary font-bold uppercase tracking-wider">
                STEP 2 OF {phases.length} — ADVERSARY EMULATION
              </div>
              <h2 className="text-base font-bold text-slate-100 font-mono">
                Generate Investigation Telemetry
              </h2>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {currentPhase.instructions}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded bg-card border border-border-subtle">
                <div className="text-[10px] text-slate-500 uppercase font-mono">Attack Host</div>
                <div className="font-mono text-slate-200 font-semibold mt-0.5">{currentPhase.attack_host}</div>
              </div>
              <div className="p-3 rounded bg-card border border-border-subtle">
                <div className="text-[10px] text-slate-500 uppercase font-mono">Target Host</div>
                <div className="font-mono text-slate-200 font-semibold mt-0.5">{currentPhase.target_host}</div>
              </div>
              <div className="p-3 rounded bg-card border border-border-subtle">
                <div className="text-[10px] text-slate-500 uppercase font-mono">MITRE Technique</div>
                <div className="font-mono text-emerald-400 font-semibold mt-0.5">{currentPhase.technique}</div>
              </div>
            </div>

            {/* Dynamic Command Block */}
            <div className="space-y-2">
              <div className="text-xs font-mono text-slate-300 font-semibold flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-primary" />
                <span>Simulation Command (1-Click Copy)</span>
              </div>
              <CommandBlock
                title="Trigger Adversary Simulation"
                description="Connects through Bastion jumpbox and executes the technique payload"
                command={currentPhase.command || ""}
              />
            </div>

            <div className="p-3 rounded bg-surface/50 border border-border-subtle text-xs text-slate-400 flex items-start gap-2.5">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-200">Analyst Tip:</strong> Allow 5–10 seconds for the event to transit from the target endpoint agent to the Wazuh indexer.
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => handleStepChange(2)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-semibold font-mono text-xs transition-all shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>✓ I Generated the Telemetry</span>
              </button>
            </div>
          </div>
        )}

        {/* PHASE 3: LOCATE & QUERY EVENTS */}
        {currentPhase.id === "phase-3" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="space-y-1">
              <div className="text-[11px] font-mono text-primary font-bold uppercase tracking-wider">
                STEP 3 OF {phases.length} — OPENSearch DISCOVERY
              </div>
              <h2 className="text-base font-bold text-slate-100 font-mono">
                Locate the Security Event in OpenSearch
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded bg-card border border-border-subtle">
                <div className="text-[10px] text-slate-500 uppercase font-mono">Target Index Pattern</div>
                <div className="font-mono text-primary font-bold mt-0.5">{currentPhase.target_index}</div>
              </div>
              <div className="p-3 rounded bg-card border border-border-subtle">
                <div className="text-[10px] text-slate-500 uppercase font-mono">Telemetry Source</div>
                <div className="font-mono text-slate-200 font-medium mt-0.5">{currentPhase.data_source}</div>
              </div>
            </div>

            {/* Query Box */}
            <div className="p-4 rounded-lg bg-card border border-border-subtle space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono text-slate-300 font-semibold flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-primary" />
                  <span>OpenSearch DQL Query</span>
                </div>
                <button
                  onClick={() => handleCopyQueryText(currentPhase.query || "")}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface hover:bg-card text-slate-300 hover:text-white border border-border-subtle font-mono text-[10px] transition-all"
                >
                  {copiedQuery === currentPhase.query ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-primary" />
                      <span>Copy Query</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-3 rounded bg-black/60 border border-border-subtle font-mono text-xs text-emerald-400 overflow-x-auto">
                {currentPhase.query}
              </pre>

              <div className="text-[11px] text-slate-400">
                Key field to inspect: <span className="font-mono text-primary">{currentPhase.query_field}</span>
              </div>
            </div>

            {/* Expandable Hints */}
            {currentPhase.hints && currentPhase.hints.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-mono text-slate-400 font-semibold">
                  Investigation Hints
                </div>
                {currentPhase.hints.map((hint, hIdx) => {
                  const isRevealed = revealedHints[hIdx];
                  return (
                    <div
                      key={hint.title}
                      className="rounded border border-border-subtle bg-surface/60 overflow-hidden text-xs"
                    >
                      <button
                        onClick={() => toggleHint(hIdx)}
                        className="w-full flex items-center justify-between p-2.5 text-left hover:bg-surface transition-colors"
                      >
                        <div className="flex items-center gap-2 text-slate-300 font-medium">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                          <span>{hint.title}</span>
                        </div>
                        {isRevealed ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                      {isRevealed && (
                        <div className="p-3 border-t border-border-subtle bg-card/60 text-slate-300 leading-relaxed">
                          {hint.content}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => handleStepChange(3)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-semibold font-mono text-xs transition-all shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>✓ I Found the Event in OpenSearch</span>
              </button>
            </div>
          </div>
        )}

        {/* PHASE 4: CROSS-REFERENCE & 🧠 SOC ANALYST THINKING */}
        {currentPhase.id === "phase-4" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="space-y-1">
              <div className="text-[11px] font-mono text-primary font-bold uppercase tracking-wider">
                STEP 4 OF {phases.length} — CORRELATION & METHODOLOGY
              </div>
              <h2 className="text-base font-bold text-slate-100 font-mono">
                Cross-Reference Telemetry & Analyst Thinking
              </h2>
            </div>

            {/* Highlighted SOC Analyst Thinking Box */}
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/40 space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold font-mono text-xs uppercase tracking-wider">
                <Brain className="w-4 h-4" />
                <span>🧠 SOC ANALYST THINKING — WHY & HOW</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Before recording your final verdict, ask the fundamental questions that distinguish routine operations from adversary tradecraft:
              </p>
              <div className="space-y-2 pt-1">
                {currentPhase.thinking_prompts?.map((prompt, pIdx) => (
                  <div key={pIdx} className="flex items-start gap-2 text-xs text-slate-200 font-mono">
                    <span className="text-primary font-bold">•</span>
                    <span>{prompt}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cross Reference Query Block */}
            {currentPhase.cross_query && (
              <div className="p-4 rounded bg-card border border-border-subtle space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-slate-300 font-semibold flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Corroborating Query in Index: <span className="text-primary">{currentPhase.cross_index}</span></span>
                  </div>
                  <button
                    onClick={() => handleCopyQueryText(currentPhase.cross_query || "")}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface text-slate-300 hover:text-white border border-border-subtle font-mono text-[10px]"
                  >
                    <Copy className="w-3 h-3 text-primary" />
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="p-2.5 rounded bg-black/60 font-mono text-xs text-emerald-400 overflow-x-auto">
                  {currentPhase.cross_query}
                </pre>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={() => handleStepChange(4)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-primary text-black font-semibold font-mono text-xs hover:bg-primary-hover transition-all shadow-md"
              >
                <span>Continue to Assessment & Verdict</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PHASE 5: ANALYST DECISION & VERDICT */}
        {currentPhase.id === "phase-5" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-1">
              <div className="text-[11px] font-mono text-primary font-bold uppercase tracking-wider">
                STEP 5 OF {phases.length} — INTERACTIVE ASSESSMENT
              </div>
              <h2 className="text-base font-bold text-slate-100 font-mono">
                Analyst Decision & Investigative Questions
              </h2>
            </div>

            {/* Assessment Questions */}
            <div className="space-y-4">
              {currentPhase.questions?.map((q, qIdx) => {
                const selectedOpt = selectedAnswers[q.id];
                const hasAnswered = Boolean(selectedOpt);
                const selectedIdx = q.options.indexOf(selectedOpt);
                const isCorrect = selectedIdx === q.correct_index;

                return (
                  <div
                    key={q.id}
                    className="p-4 rounded-lg bg-card border border-border-subtle space-y-3 text-xs"
                  >
                    <div className="flex items-center gap-2 font-mono text-slate-200 font-semibold">
                      <span className="px-1.5 py-0.5 rounded bg-surface text-primary text-[10px]">
                        Q{qIdx + 1}
                      </span>
                      <span>{q.question}</span>
                    </div>

                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const isOptionSelected = selectedOpt === opt;
                        const isOptionCorrect = optIdx === q.correct_index;

                        let optStyle = "bg-surface/70 hover:bg-surface border-border-subtle text-slate-300";
                        if (hasAnswered) {
                          if (isOptionSelected) {
                            optStyle = isOptionCorrect
                              ? "bg-emerald-950/40 border-emerald-600 text-emerald-300 font-semibold"
                              : "bg-rose-950/40 border-rose-600 text-rose-300 font-semibold";
                          } else if (isOptionCorrect) {
                            optStyle = "bg-emerald-950/20 border-emerald-800/40 text-emerald-400";
                          }
                        }

                        return (
                          <button
                            key={opt}
                            onClick={() => handleAnswerSelect(q, opt, optIdx)}
                            className={`w-full flex items-center justify-between p-2.5 rounded border text-left transition-all text-xs font-sans ${optStyle}`}
                          >
                            <span>{opt}</span>
                            {hasAnswered && isOptionSelected && (
                              <span className="font-mono text-[10px] uppercase font-bold shrink-0 ml-2">
                                {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {hasAnswered && (
                      <div className="p-3 rounded bg-surface border border-border-subtle text-[11px] text-slate-300 space-y-1">
                        <div className="font-bold font-mono text-slate-200">
                          {isCorrect ? "✓ Explanation" : "Analysis Feedback:"}
                        </div>
                        <p>{q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Final Verdict Selector */}
            <div className="p-4 rounded-lg bg-card border border-primary/40 space-y-3 text-xs">
              <div className="flex items-center gap-2 font-mono text-slate-200 font-bold">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>FORMAL CASE VERDICT</span>
              </div>
              <p className="text-slate-400 text-xs">
                Select your evidence-backed security assessment for this incident:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { value: "True Positive", label: "True Positive (Confirmed Threat / Exploit)" },
                  { value: "Suspicious", label: "Suspicious Activity (Requires Containment)" },
                  { value: "False Positive", label: "False Positive (Benign Admin Action)" },
                  { value: "Inconclusive", label: "Inconclusive (Needs Further Telemetry)" },
                ].map((v) => {
                  const isSelected = userVerdict === v.value;
                  return (
                    <button
                      key={v.value}
                      onClick={() => handleVerdictSubmit(v.value)}
                      className={`p-2.5 rounded border text-left font-mono text-xs transition-all ${
                        isSelected
                          ? "bg-primary/20 border-primary text-primary font-bold shadow-sm"
                          : "bg-surface/70 border-border-subtle text-slate-300 hover:text-white hover:bg-surface"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{v.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => handleStepChange(3)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded bg-surface hover:bg-card text-slate-400 hover:text-white border border-border-subtle font-mono text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous Step</span>
              </button>

              <button
                onClick={() => handleStepChange(5)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-primary text-black font-semibold font-mono text-xs hover:bg-primary-hover transition-all shadow-md"
              >
                <span>Proceed to Debrief & Solutions Gate</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PHASE 6: DEBRIEF & SOLUTIONS GATE */}
        {currentPhase.id === "phase-6" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-1">
              <div className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                STEP 6 OF {phases.length} — DEBRIEF & SOLUTIONS GATE
              </div>
              <h2 className="text-base font-bold text-slate-100 font-mono">
                Investigation Complete & Findings Verification
              </h2>
            </div>

            {/* Pre-reveal Checklist Gate */}
            {!isSolutionsRevealed ? (
              <div className="p-5 rounded-lg bg-card border border-border-subtle space-y-4 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-slate-200 font-mono text-xs flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                    <span>Self-Assessment Checklist Before Revealing Solutions</span>
                  </div>
                  <p className="text-slate-400 text-xs">
                    Confirm your independent investigation milestones:
                  </p>
                </div>

                <div className="space-y-2">
                  {[
                    { key: "identified_process", label: "I identified the process name and command line arguments" },
                    { key: "reviewed_telemetry", label: "I reviewed raw events in OpenSearch Dashboards" },
                    { key: "inspected_payload", label: "I inspected the payload content and execution flags" },
                    { key: "formed_verdict", label: "I logged evidence and submitted an initial case verdict" },
                  ].map((item) => {
                    const isChecked = Boolean(preRevealChecked[item.key]);
                    return (
                      <button
                        key={item.key}
                        onClick={() =>
                          setPreRevealChecked((prev) => ({
                            ...prev,
                            [item.key]: !prev[item.key],
                          }))
                        }
                        className={`w-full flex items-center gap-2.5 p-2.5 rounded border text-left transition-all ${
                          isChecked
                            ? "bg-emerald-950/20 border-emerald-800/40 text-slate-200"
                            : "bg-surface/70 border-border-subtle text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                            isChecked
                              ? "bg-emerald-500 text-black"
                              : "border border-slate-600 bg-surface"
                          }`}
                        >
                          {isChecked ? "✓" : ""}
                        </span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setIsSolutionsRevealed(true)}
                    disabled={!allPreRevealDone}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-primary text-black font-semibold font-mono text-xs hover:bg-primary-hover transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Reveal Expected Analysis & Solutions</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Revealed Solutions Content */
              <div className="space-y-5 animate-in fade-in duration-300">
                {/* Verdict Comparison Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded bg-card border border-border-subtle space-y-1">
                    <div className="text-[10px] text-slate-500 uppercase font-mono">Your Submitted Verdict</div>
                    <div className="text-sm font-mono text-primary font-bold">
                      {userVerdict || "No verdict submitted"}
                    </div>
                  </div>

                  <div className="p-3.5 rounded bg-card border border-emerald-800/50 space-y-1">
                    <div className="text-[10px] text-emerald-400 uppercase font-mono">Expected Lab Verdict</div>
                    <div className="text-sm font-mono text-emerald-400 font-bold">
                      {currentPhase.expected_verdict}
                    </div>
                  </div>
                </div>

                {/* Expected Findings Box */}
                <div className="p-4 rounded-lg bg-card border border-border-subtle space-y-2 text-xs">
                  <div className="font-bold text-slate-200 font-mono text-xs">
                    Expected Findings Summary
                  </div>
                  <p className="text-slate-300 leading-relaxed font-sans">
                    {currentPhase.expected_findings}
                  </p>
                </div>

                {/* Full Markdown Reference */}
                <div className="p-4 rounded-lg bg-card border border-border-subtle space-y-3">
                  <div className="text-xs font-mono text-slate-400 font-bold uppercase">
                    Authoritative Lab Reference Document
                  </div>
                  <div className="prose-dark max-w-none text-slate-300 text-xs leading-relaxed overflow-x-auto">
                    <pre className="p-4 rounded bg-surface/80 border border-border-subtle text-slate-300 text-xs font-sans whitespace-pre-wrap leading-relaxed">
                      {currentPhase.solution_markdown}
                    </pre>
                  </div>
                </div>

                {/* Lab Complete Action */}
                <div className="p-4 rounded bg-emerald-950/30 border border-emerald-800/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Lab Complete! Mark as finished in curriculum tracker.</span>
                  </div>
                  <button
                    onClick={onCompleteLab}
                    className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-semibold font-mono text-xs transition-all shadow-md shrink-0"
                  >
                    Mark Lab Completed ✓
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={() => handleStepChange(4)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded bg-surface hover:bg-card text-slate-400 hover:text-white border border-border-subtle font-mono text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous Step</span>
              </button>

              <Link
                href="/learning"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded bg-surface hover:bg-card text-primary hover:underline font-mono text-xs"
              >
                <span>Back to Curriculum Overview →</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
