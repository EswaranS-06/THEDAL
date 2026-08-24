"use client";

import React, { useState } from "react";
import { Copy, Check, Terminal, Play, Loader2, Zap } from "lucide-react";
import { useToast } from "./Toast";
import { copyToClipboard } from "../../lib/clipboard";

interface CommandBlockProps {
  command: string;
  title?: string;
  description?: string;
  compact?: boolean;
  onRun?: () => void | Promise<void>;
  isRunning?: boolean;
  canRun?: boolean;
  runLabel?: string;
  runTitle?: string;
}

export const CommandBlock: React.FC<CommandBlockProps> = ({
  command,
  title,
  description,
  compact = false,
  onRun,
  isRunning = false,
  canRun = true,
  runLabel = "RUN",
  runTitle = "Execute this simulation directly on the Attack host",
}) => {
  const [copied, setCopied] = useState(false);
  const [internalRunning, setInternalRunning] = useState(false);
  const [runSuccess, setRunSuccess] = useState(false);
  const { success } = useToast();

  const handleCopy = async () => {
    const ok = await copyToClipboard(command);
    if (ok) {
      setCopied(true);
      success("Copied to clipboard", title || "Command ready to execute in terminal");
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopied(false);
    }
  };

  const handleRun = async () => {
    if (!onRun || isRunning || internalRunning) return;
    try {
      setInternalRunning(true);
      await onRun();
      setRunSuccess(true);
      setTimeout(() => setRunSuccess(false), 4000);
    } catch {
      // Error handled by caller
    } finally {
      setInternalRunning(false);
    }
  };

  const running = isRunning || internalRunning;

  return (
    <div className="rounded-md border border-border-subtle bg-panel overflow-hidden text-xs shadow-sm">
      {(title || description) && (
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border-subtle bg-surface/60">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-primary shrink-0" />
            {title && <span className="font-mono font-semibold text-text-primary text-[11px]">{title}</span>}
            {description && (
              <span className="text-text-muted text-[10px] hidden sm:inline">• {description}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {onRun && (
              <span className="text-[9px] text-emerald-400 font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5 text-emerald-400" />
                1-CLICK RUN AVAILABLE
              </span>
            )}
            <span className="text-[9px] text-text-muted font-mono px-1.5 py-0.2 rounded bg-surface border border-border-subtle">
              LIVE IP
            </span>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between p-2.5 gap-2.5 bg-[#071017]">
        <pre className="font-mono text-text-primary overflow-x-auto text-[11px] leading-relaxed whitespace-pre-wrap break-all flex-1 select-all">
          <code>{command}</code>
        </pre>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* 1. Direct Run Button */}
          {onRun && (
            <button
              onClick={handleRun}
              disabled={running || !canRun}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-mono font-bold transition-all border shadow-sm ${
                running
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50 cursor-wait animate-pulse"
                  : runSuccess
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                  : "bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black border-emerald-400 hover:shadow-[0_0_12px_rgba(16,185,129,0.4)]"
              } ${!canRun ? "opacity-50 cursor-not-allowed" : ""}`}
              title={runTitle}
              aria-label={runLabel}
            >
              {running ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                  <span>RUNNING...</span>
                </>
              ) : runSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">TRIGGERED!</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-black text-black" />
                  <span>{runLabel}</span>
                </>
              )}
            </button>
          )}

          {/* 2. Copy Button */}
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-mono font-semibold transition-all border ${
              copied
                ? "bg-primary/20 text-primary border-primary/50"
                : "bg-surface hover:bg-panel text-text-secondary hover:text-text-primary border-border-subtle"
            }`}
            title="Copy command to clipboard"
            aria-label="Copy command"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-primary" />
                <span className="text-primary font-bold">COPIED</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-text-muted" />
                <span>COPY</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

