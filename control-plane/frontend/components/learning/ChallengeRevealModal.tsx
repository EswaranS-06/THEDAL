"use client";

import React, { useState } from "react";
import { AlertTriangle, Key, X } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface ChallengeRevealModalProps {
  isOpen: boolean;
  challengeTitle: string;
  solutionHtml?: string;
  solutionMarkdown?: string;
  isLoading?: boolean;
  onReveal: () => Promise<void>;
  onClose: () => void;
}

export const ChallengeRevealModal: React.FC<ChallengeRevealModalProps> = ({
  isOpen,
  challengeTitle,
  solutionHtml,
  solutionMarkdown,
  isLoading = false,
  onReveal,
  onClose,
}) => {
  const [hasRevealed, setHasRevealed] = useState(false);

  if (!isOpen) return null;

  const handleRevealClick = async () => {
    await onReveal();
    setHasRevealed(true);
  };

  const handleClose = () => {
    setHasRevealed(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-card border border-border-default rounded shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-surface">
          <div className="flex items-center gap-2.5">
            <Key className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              {hasRevealed ? "Solution Key" : "Reveal Challenge Solution"}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto flex-1 text-xs text-slate-300 space-y-4">
          {!hasRevealed ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded bg-amber-950/30 border border-amber-600/40 text-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold text-amber-300">Challenge Value Notice</div>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    Revealing the solution will display the exact query filters, IOCs, and investigative conclusions for <strong className="text-white">{challengeTitle}</strong>. We recommend attempting independent triage in OpenSearch Dashboards first.
                  </p>
                </div>
              </div>
              <p className="text-slate-400 text-xs">
                Are you sure you want to reveal the official analysis key?
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-600/40 text-emerald-300 text-xs font-semibold">
                Official Solution & Analysis Key for {challengeTitle}
              </div>
              <div className="p-4 rounded bg-surface border border-border-subtle">
                <MarkdownRenderer contentHtml={solutionHtml} rawMarkdown={solutionMarkdown} />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-border-subtle bg-surface/50">
          <button
            onClick={handleClose}
            className="px-3 py-1.5 rounded text-xs font-medium text-slate-300 bg-muted hover:bg-slate-700 border border-border-subtle transition-colors"
          >
            {hasRevealed ? "Close Key" : "Keep Investigating"}
          </button>
          {!hasRevealed && (
            <button
              onClick={handleRevealClick}
              disabled={isLoading}
              className="px-3.5 py-1.5 rounded text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 transition-colors"
            >
              {isLoading ? "Loading..." : "Reveal Solution"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
