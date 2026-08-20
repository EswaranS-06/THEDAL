"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  GraduationCap,
  ArrowLeft,
  ArrowRight,
  FileText,
  CheckCircle,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { learningApi } from "../../../../lib/api/learning";
import { LabDetail, LabItem } from "../../../../lib/types/api";
import { StatusBadge } from "../../../../components/ui/StatusBadge";
import { MarkdownRenderer } from "../../../../components/learning/MarkdownRenderer";
import { NotesDrawer } from "../../../../components/learning/NotesDrawer";
import { CardSkeleton } from "../../../../components/ui/LoadingSkeleton";
import { ErrorState } from "../../../../components/ui/ErrorState";
import { useToast } from "../../../../components/ui/Toast";

export default function LabDetailPage() {
  const params = useParams();
  const router = useRouter();
  const labId = params?.id as string;
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lab, setLab] = useState<LabDetail | null>(null);
  const [allLabs, setAllLabs] = useState<LabItem[]>([]);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const loadLab = useCallback(async () => {
    if (!labId) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const [labRes, allRes] = await Promise.all([
        learningApi.getLabDetail(labId),
        learningApi.getLabs().catch(() => ({ labs: [], stats: null })),
      ]);
      setLab(labRes);
      setAllLabs(allRes.labs || []);
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to load lab '${labId}'.`);
    } finally {
      setLoading(false);
    }
  }, [labId]);

  useEffect(() => {
    loadLab();
  }, [loadLab]);

  const handleStatusChange = async (newStatus: "Not Started" | "In Progress" | "Completed") => {
    if (!lab) return;
    setIsUpdatingStatus(true);
    try {
      await learningApi.updateProgress({
        lab_id: lab.id,
        status: newStatus,
      });
      setLab((prev) => (prev ? { ...prev, status: newStatus } : null));
      success("Status Updated", `Lab marked as ${newStatus}`);
    } catch (err: any) {
      error("Update Failed", err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveNotes = async (notes: string) => {
    if (!lab) return;
    await learningApi.updateProgress({
      lab_id: lab.id,
      notes,
    });
    setLab((prev) => (prev ? { ...prev, notes } : null));
  };

  if (loading && !lab) {
    return (
      <div className="space-y-6">
        <CardSkeleton className="h-28" />
        <CardSkeleton className="h-96" />
      </div>
    );
  }

  if (errorMsg || !lab) {
    return (
      <div className="space-y-4">
        <Link
          href="/learning"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Learning Portal</span>
        </Link>
        <ErrorState
          title={`Lab '${labId}' Not Found`}
          message={errorMsg || "Unable to load lab content."}
          onRetry={loadLab}
        />
      </div>
    );
  }

  // Find previous and next labs
  const currentIndex = allLabs.findIndex((l) => l.id === lab.id);
  const prevLab = currentIndex > 0 ? allLabs[currentIndex - 1] : null;
  const nextLab = currentIndex !== -1 && currentIndex < allLabs.length - 1 ? allLabs[currentIndex + 1] : null;

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Link
            href="/learning"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Curriculum Overview</span>
          </Link>

          <div className="flex items-center gap-2">
            {prevLab && (
              <Link
                href={`/learning/labs/${prevLab.id}`}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface hover:bg-card border border-border-subtle text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev Lab</span>
              </Link>
            )}
            {nextLab && (
              <Link
                href={`/learning/labs/${nextLab.id}`}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-surface hover:bg-card border border-border-subtle text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                <span>Next Lab</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Lab Metadata Card */}
        <div className="p-5 rounded border border-border-subtle bg-card/60 space-y-4 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 font-semibold uppercase">
                  {lab.level}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  MITRE: {lab.mitre}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-100">{lab.title}</h2>
              <div className="text-xs text-slate-400">
                Source: <span className="font-mono text-slate-300">{lab.source}</span> • Target Index: <span className="font-mono text-slate-300">{lab.target_index}</span>
              </div>
            </div>

            {/* Status Selector & Notes Button */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setIsNotesOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface hover:bg-card border border-border-default text-xs font-medium text-slate-200 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-primary" />
                <span>Notes {lab.notes ? "•" : ""}</span>
              </button>

              <select
                value={lab.status || "Not Started"}
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

      {/* Lab Markdown Body */}
      <div className="p-6 rounded border border-border-subtle bg-surface/80 shadow-sm overflow-hidden">
        <MarkdownRenderer
          contentHtml={lab.rendered_html}
          rawMarkdown={lab.raw_markdown}
        />
      </div>

      {/* Bottom Lab Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border-subtle text-xs">
        {prevLab ? (
          <Link
            href={`/learning/labs/${prevLab.id}`}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Previous</div>
              <div className="font-semibold text-slate-300">{prevLab.title}</div>
            </div>
          </Link>
        ) : (
          <div />
        )}

        {nextLab ? (
          <Link
            href={`/learning/labs/${nextLab.id}`}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-right"
          >
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Next</div>
              <div className="font-semibold text-slate-300">{nextLab.title}</div>
            </div>
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <div />
        )}
      </div>

      {/* Notes Drawer */}
      <NotesDrawer
        labId={lab.id}
        initialNotes={lab.notes}
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        onSave={handleSaveNotes}
      />
    </div>
  );
}
