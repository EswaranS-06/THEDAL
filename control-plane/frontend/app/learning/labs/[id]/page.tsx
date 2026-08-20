"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Menu,
  ShieldAlert,
  GraduationCap,
  Layers,
  Sparkles,
} from "lucide-react";
import { learningApi } from "../../../../lib/api/learning";
import { LabWorkspaceData, LabItem, CurriculumStats } from "../../../../lib/types/api";
import { LabNavigator } from "../../../../components/learning/LabNavigator";
import { InvestigationWorkspace } from "../../../../components/learning/InvestigationWorkspace";
import { EvidenceBoard } from "../../../../components/learning/EvidenceBoard";
import { CardSkeleton } from "../../../../components/ui/LoadingSkeleton";
import { ErrorState } from "../../../../components/ui/ErrorState";
import { useToast } from "../../../../components/ui/Toast";

export default function LabDetailPage() {
  const params = useParams();
  const router = useRouter();
  const labId = (params?.id as string) || "";
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<LabWorkspaceData | null>(null);
  const [allLabs, setAllLabs] = useState<LabItem[]>([]);
  const [stats, setStats] = useState<CurriculumStats | null>(null);

  const [showLeftNav, setShowLeftNav] = useState(true);
  const [showRightBoard, setShowRightBoard] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [isStartingHosts, setIsStartingHosts] = useState(false);

  const loadWorkspaceData = useCallback(async () => {
    if (!labId) return;
    try {
      setLoading(true);
      setErrorMsg(null);
      const [wsRes, labsRes] = await Promise.all([
        learningApi.getWorkspace(labId),
        learningApi.getLabs().catch(() => ({ labs: [], stats: null })),
      ]);
      setWorkspace(wsRes);
      setAllLabs(labsRes.labs || []);
      setStats(labsRes.stats || null);
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to load investigation workspace for '${labId}'.`);
    } finally {
      setLoading(false);
    }
  }, [labId]);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  // Actions
  const handleUpdateStep = async (stepIndex: number) => {
    if (!workspace) return;
    try {
      await learningApi.updateProgress({
        lab_id: labId,
        current_step: stepIndex,
        status: workspace.lab.status === "Not Started" ? "In Progress" : undefined,
      });
      setWorkspace((prev) =>
        prev
          ? {
              ...prev,
              lab: {
                ...prev.lab,
                current_step: stepIndex,
                status: prev.lab.status === "Not Started" ? "In Progress" : prev.lab.status,
              },
            }
          : null
      );
    } catch (err: any) {
      error("Progress Update Failed", err.message);
    }
  };

  const handleAddEvidence = async (item: { source: string; event_id?: string; timestamp?: string; finding: string }) => {
    const newEv = await learningApi.addEvidence({
      lab_id: labId,
      ...item,
    });
    setWorkspace((prev) =>
      prev ? { ...prev, evidence: [...prev.evidence, newEv] } : null
    );
  };

  const handleDeleteEvidence = async (id: number) => {
    await learningApi.deleteEvidence(id);
    setWorkspace((prev) =>
      prev ? { ...prev, evidence: prev.evidence.filter((e) => e.id !== id) } : null
    );
    success("Evidence Removed", "Finding deleted from case board.");
  };

  const handleUpdateChecklist = async (newChecklist: string[]) => {
    await learningApi.saveChecklist({
      lab_id: labId,
      checklist: newChecklist,
    });
    setWorkspace((prev) =>
      prev ? { ...prev, checklist: newChecklist } : null
    );
  };

  const handleSaveNotes = async (notes: string) => {
    await learningApi.updateProgress({
      lab_id: labId,
      notes,
    });
    setWorkspace((prev) =>
      prev ? { ...prev, notes } : null
    );
  };

  const handleSaveVerdict = async (verdict: string) => {
    await learningApi.saveVerdict({
      lab_id: labId,
      verdict,
    });
    setWorkspace((prev) =>
      prev ? { ...prev, verdict, lab: { ...prev.lab, verdict } } : null
    );
  };

  const handleSubmitAnswer = async (questionId: string, option: string, isCorrect: boolean) => {
    await learningApi.submitAnswer({
      lab_id: labId,
      question_id: questionId,
      selected_option: option,
      is_correct: isCorrect,
    });
    setWorkspace((prev) =>
      prev
        ? {
            ...prev,
            answers: {
              ...prev.answers,
              [questionId]: { selected_option: option, is_correct: isCorrect },
            },
          }
        : null
    );
  };

  const handleStartRequiredHosts = async () => {
    if (!workspace) return;
    try {
      setIsStartingHosts(true);
      const reqKeys = workspace.environment_status.required_hosts.map((h) => h.key);
      await learningApi.startRequiredHosts(reqKeys);
      success("Instances Starting", "EC2 start requested for lab nodes.");
      // Reload workspace after delay
      setTimeout(() => {
        loadWorkspaceData();
      }, 5000);
    } catch (err: any) {
      error("Start Request Failed", err.message);
    } finally {
      setIsStartingHosts(false);
    }
  };

  const handleCompleteLab = async () => {
    try {
      await learningApi.updateProgress({
        lab_id: labId,
        status: "Completed",
      });
      setWorkspace((prev) =>
        prev
          ? {
              ...prev,
              lab: { ...prev.lab, status: "Completed" },
            }
          : null
      );
      success("Lab Completed! 🎉", `Investigation ${labId.toUpperCase()} logged as completed.`);
    } catch (err: any) {
      error("Completion Error", err.message);
    }
  };

  const handleResetLab = async () => {
    if (!window.confirm("Are you sure you want to reset this lab? This will clear all notes, evidence, answers, and progress.")) {
      return;
    }
    try {
      setIsResetting(true);
      await learningApi.resetLab(labId);
      await loadWorkspaceData();
      success("Lab Reset", "Workspace restored to initial state.");
    } catch (err: any) {
      error("Reset Failed", err.message);
    } finally {
      setIsResetting(false);
    }
  };

  if (loading && !workspace) {
    return (
      <div className="space-y-4">
        <CardSkeleton className="h-16" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <CardSkeleton className="h-96" />
          <CardSkeleton className="h-96 md:col-span-2" />
          <CardSkeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (errorMsg || !workspace) {
    return (
      <div className="space-y-4">
        <Link
          href="/learning"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Curriculum</span>
        </Link>
        <ErrorState
          title={`Lab '${labId}' Not Found`}
          message={errorMsg || "Unable to initialize investigation workspace."}
          onRetry={loadWorkspaceData}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] -m-4 sm:-m-6 bg-background overflow-hidden border border-border-subtle rounded-lg">
      {/* Mini Workspace Utility Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-surface border-b border-border-subtle shrink-0 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLeftNav(!showLeftNav)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-card hover:bg-surface text-slate-300 hover:text-white border border-border-subtle font-mono text-[11px] transition-colors"
            title="Toggle Lab Navigator"
          >
            <Menu className="w-3 h-3 text-primary" />
            <span>Navigator</span>
          </button>

          <span className="text-slate-500 font-mono">|</span>

          <span className="text-[11px] font-mono text-slate-300 font-bold truncate max-w-[200px] sm:max-w-md">
            {workspace.lab.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRightBoard(!showRightBoard)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-card hover:bg-surface text-slate-300 hover:text-white border border-border-subtle font-mono text-[11px] transition-colors"
            title="Toggle Evidence Board"
          >
            <ShieldAlert className="w-3 h-3 text-primary" />
            <span>Case Evidence ({workspace.evidence.length})</span>
          </button>
        </div>
      </div>

      {/* 3-Panel Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* PANEL 1: LEFT LAB NAVIGATOR (Width: 260px) */}
        {showLeftNav && (
          <aside className="w-64 md:w-72 shrink-0 h-full overflow-hidden transition-all duration-200">
            <LabNavigator
              currentLabId={labId}
              allLabs={allLabs}
              stats={stats}
              onResetLab={handleResetLab}
              isResetting={isResetting}
            />
          </aside>
        )}

        {/* PANEL 2: CENTER INVESTIGATION WORKSPACE (Flex: 1) */}
        <main className="flex-1 h-full overflow-hidden flex flex-col min-w-0">
          <InvestigationWorkspace
            workspace={workspace}
            onUpdateStep={handleUpdateStep}
            onSaveVerdict={handleSaveVerdict}
            onSubmitAnswer={handleSubmitAnswer}
            onStartRequiredHosts={handleStartRequiredHosts}
            onCompleteLab={handleCompleteLab}
            isStartingHosts={isStartingHosts}
          />
        </main>

        {/* PANEL 3: RIGHT CASE EVIDENCE & NOTES BOARD (Width: 320px) */}
        {showRightBoard && (
          <aside className="w-72 lg:w-80 shrink-0 h-full overflow-hidden transition-all duration-200">
            <EvidenceBoard
              labId={labId}
              evidence={workspace.evidence}
              checklist={workspace.checklist}
              notes={workspace.notes}
              onAddEvidence={handleAddEvidence}
              onDeleteEvidence={handleDeleteEvidence}
              onUpdateChecklist={handleUpdateChecklist}
              onSaveNotes={handleSaveNotes}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
