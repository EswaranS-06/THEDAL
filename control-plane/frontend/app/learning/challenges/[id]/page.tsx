"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ShieldAlert,
  ArrowLeft,
  Key,
  FileText,
  CheckCircle,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { learningApi } from "../../../../lib/api/learning";
import { LabDetail, ChallengeSolution } from "../../../../lib/types/api";
import { StatusBadge } from "../../../../components/ui/StatusBadge";
import { MarkdownRenderer } from "../../../../components/learning/MarkdownRenderer";
import { NotesDrawer } from "../../../../components/learning/NotesDrawer";
import { ChallengeRevealModal } from "../../../../components/learning/ChallengeRevealModal";
import { CardSkeleton } from "../../../../components/ui/LoadingSkeleton";
import { ErrorState } from "../../../../components/ui/ErrorState";
import { useToast } from "../../../../components/ui/Toast";

export default function ChallengeDetailPage() {
  const params = useParams();
  const challengeId = params?.id as string;
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<LabDetail | null>(null);
  const [solution, setSolution] = useState<ChallengeSolution | null>(null);

  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isRevealOpen, setIsRevealOpen] = useState(false);
  const [isFetchingSolution, setIsFetchingSolution] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadChallenge = useCallback(async () => {
    if (!challengeId) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await learningApi.getChallengeDetail(challengeId);
      setChallenge(res);
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to load challenge '${challengeId}'.`);
    } finally {
      setLoading(false);
    }
  }, [challengeId]);

  useEffect(() => {
    loadChallenge();
  }, [loadChallenge]);

  const handleStatusChange = async (newStatus: "Not Started" | "In Progress" | "Completed") => {
    if (!challenge) return;
    setIsUpdatingStatus(true);
    try {
      await learningApi.updateProgress({
        lab_id: challenge.id,
        status: newStatus,
      });
      setChallenge((prev) => (prev ? { ...prev, status: newStatus } : null));
      success("Status Updated", `Challenge marked as ${newStatus}`);
    } catch (err: any) {
      error("Update Failed", err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveNotes = async (notes: string) => {
    if (!challenge) return;
    await learningApi.updateProgress({
      lab_id: challenge.id,
      notes,
    });
    setChallenge((prev) => (prev ? { ...prev, notes } : null));
  };

  const handleRevealSolution = async () => {
    if (!challenge) return;
    setIsFetchingSolution(true);
    try {
      const res = await learningApi.getChallengeSolution(challenge.id);
      setSolution(res);
    } catch (err: any) {
      error("Failed to load solution", err.message);
    } finally {
      setIsFetchingSolution(false);
    }
  };

  if (loading && !challenge) {
    return (
      <div className="space-y-6">
        <CardSkeleton className="h-28" />
        <CardSkeleton className="h-96" />
      </div>
    );
  }

  if (errorMsg || !challenge) {
    return (
      <div className="space-y-4">
        <Link
          href="/learning/challenges"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Mystery Challenges</span>
        </Link>
        <ErrorState
          title={`Challenge '${challengeId}' Not Found`}
          message={errorMsg || "Unable to load challenge scenario."}
          onRetry={loadChallenge}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Link
            href="/learning/challenges"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Mystery Challenges</span>
          </Link>
        </div>

        {/* Challenge Header Card */}
        <div className="p-5 rounded border border-amber-500/30 bg-card/60 space-y-4 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-600/30 font-semibold uppercase">
                  Mystery Tier Challenge
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Target: {challenge.target_index}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-100">{challenge.title}</h2>
              <div className="text-xs text-slate-400">
                Source: <span className="font-mono text-slate-300">{challenge.source}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsNotesOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface hover:bg-card border border-border-default text-xs font-medium text-slate-200 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-primary" />
                <span>Notes {challenge.notes ? "•" : ""}</span>
              </button>

              <button
                onClick={() => setIsRevealOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-950/60 hover:bg-amber-900/80 border border-amber-600/40 text-xs font-semibold text-amber-300 transition-colors"
              >
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Reveal Solution</span>
              </button>

              <select
                value={challenge.status || "Not Started"}
                onChange={(e) => handleStatusChange(e.target.value as any)}
                disabled={isUpdatingStatus}
                className="px-3 py-1.5 rounded bg-surface border border-border-default text-xs font-semibold text-slate-200 focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Challenge Markdown Prompt */}
      <div className="p-6 rounded border border-border-subtle bg-surface/80 shadow-sm overflow-hidden">
        <MarkdownRenderer
          contentHtml={challenge.rendered_html}
          rawMarkdown={challenge.raw_markdown}
        />
      </div>

      {/* Notes Drawer */}
      <NotesDrawer
        labId={challenge.id}
        initialNotes={challenge.notes}
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        onSave={handleSaveNotes}
      />

      {/* Solution Reveal Modal */}
      <ChallengeRevealModal
        isOpen={isRevealOpen}
        challengeTitle={challenge.title}
        solutionHtml={solution?.solution_html}
        solutionMarkdown={solution?.solution_markdown}
        isLoading={isFetchingSolution}
        onReveal={handleRevealSolution}
        onClose={() => setIsRevealOpen(false)}
      />
    </div>
  );
}
