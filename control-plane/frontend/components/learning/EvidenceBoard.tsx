"use client";

import React, { useState } from "react";
import {
  FileCheck,
  Plus,
  Trash2,
  Save,
  CheckSquare,
  Square,
  Copy,
  Check,
  ShieldAlert,
  ClipboardList,
  Edit3,
} from "lucide-react";
import { EvidenceItem } from "../../lib/types/api";
import { useToast } from "../ui/Toast";

interface EvidenceBoardProps {
  labId: string;
  evidence: EvidenceItem[];
  checklist: string[];
  notes: string;
  onAddEvidence: (item: { source: string; event_id?: string; timestamp?: string; finding: string }) => Promise<void>;
  onDeleteEvidence: (id: number) => Promise<void>;
  onUpdateChecklist: (checklist: string[]) => Promise<void>;
  onSaveNotes: (notes: string) => Promise<void>;
}

export const EvidenceBoard: React.FC<EvidenceBoardProps> = ({
  labId,
  evidence,
  checklist,
  notes,
  onAddEvidence,
  onDeleteEvidence,
  onUpdateChecklist,
  onSaveNotes,
}) => {
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<"evidence" | "checklist" | "notes">("evidence");
  const [isAdding, setIsAdding] = useState(false);
  const [source, setSource] = useState("PowerShell 4104");
  const [eventId, setEventId] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [finding, setFinding] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [localNotes, setLocalNotes] = useState(notes || "");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [copiedBrief, setCopiedBrief] = useState(false);

  // Sync prop changes
  React.useEffect(() => {
    setLocalNotes(notes || "");
  }, [notes]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finding.trim()) return;
    try {
      setIsSubmitting(true);
      await onAddEvidence({
        source,
        event_id: eventId.trim(),
        timestamp: timestamp.trim() || new Date().toISOString().replace("T", " ").substring(0, 19),
        finding: finding.trim(),
      });
      setFinding("");
      setEventId("");
      setTimestamp("");
      setIsAdding(false);
      success("Evidence Added", "Artifact registered to case board.");
    } catch (err: any) {
      error("Failed to Add Evidence", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleChecklistItem = async (item: string) => {
    const next = checklist.includes(item)
      ? checklist.filter((i) => i !== item)
      : [...checklist, item];
    try {
      await onUpdateChecklist(next);
    } catch (err: any) {
      error("Checklist Error", err.message);
    }
  };

  const handleSaveNotesClick = async () => {
    try {
      setIsSavingNotes(true);
      await onSaveNotes(localNotes);
      success("Notes Saved", "Investigation notes persisted.");
    } catch (err: any) {
      error("Save Failed", err.message);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleCopyBrief = () => {
    const brief = [
      `=== SOC ANALYST INVESTIGATION BRIEF: ${labId.toUpperCase()} ===`,
      `Date: ${new Date().toUTCString()}`,
      "",
      "--- INVESTIGATION CHECKLIST ---",
      checklist.map((c) => `[x] ${c}`).join("\n") || "No items checked",
      "",
      "--- COLLECTED CASE EVIDENCE ---",
      evidence.length === 0
        ? "No evidence items recorded."
        : evidence
            .map(
              (e, idx) =>
                `#${idx + 1} [${e.source}${e.event_id ? ` / EID ${e.event_id}` : ""}] (${e.timestamp})\n   ${e.finding}`
            )
            .join("\n\n"),
      "",
      "--- ANALYST NOTES ---",
      localNotes || "No analyst notes written.",
    ].join("\n");

    navigator.clipboard.writeText(brief).then(() => {
      setCopiedBrief(true);
      setTimeout(() => setCopiedBrief(false), 2500);
      success("Case Brief Copied", "Incident summary copied to clipboard.");
    });
  };

  return (
    <div className="flex flex-col h-full bg-card/70 border-l border-border-subtle">
      {/* Tab Selector Header */}
      <div className="p-2 border-b border-border-subtle bg-surface/50">
        <div className="grid grid-cols-3 gap-1 bg-surface p-0.5 rounded border border-border-subtle text-[11px]">
          <button
            onClick={() => setActiveTab("evidence")}
            className={`py-1 rounded font-medium transition-all ${
              activeTab === "evidence"
                ? "bg-primary/20 text-primary font-bold shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Evidence ({evidence.length})
          </button>
          <button
            onClick={() => setActiveTab("checklist")}
            className={`py-1 rounded font-medium transition-all ${
              activeTab === "checklist"
                ? "bg-primary/20 text-primary font-bold shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Checklist ({checklist.length})
          </button>
          <button
            onClick={() => setActiveTab("notes")}
            className={`py-1 rounded font-medium transition-all ${
              activeTab === "notes"
                ? "bg-primary/20 text-primary font-bold shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Notes
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs scrollbar-thin">
        {/* EVIDENCE TAB */}
        {activeTab === "evidence" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-200 font-bold font-mono text-xs">
                <ShieldAlert className="w-3.5 h-3.5 text-primary" />
                <span>CASE EVIDENCE BOARD</span>
              </div>
              <button
                onClick={() => setIsAdding(!isAdding)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 font-mono text-[10px] transition-all"
              >
                <Plus className="w-3 h-3" />
                <span>Add Finding</span>
              </button>
            </div>

            {/* Quick Add Finding Form */}
            {isAdding && (
              <form
                onSubmit={handleAddSubmit}
                className="p-2.5 rounded bg-surface border border-primary/30 space-y-2 text-xs"
              >
                <div className="text-[11px] font-bold text-slate-200 uppercase font-mono">
                  New Evidence Finding
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400">Source</label>
                    <input
                      type="text"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      placeholder="e.g. Sysmon / Nginx"
                      className="w-full mt-0.5 px-2 py-1 rounded bg-card border border-border-subtle text-slate-200 text-xs focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Event ID / Rule</label>
                    <input
                      type="text"
                      value={eventId}
                      onChange={(e) => setEventId(e.target.value)}
                      placeholder="e.g. 4104 / 100401"
                      className="w-full mt-0.5 px-2 py-1 rounded bg-card border border-border-subtle text-slate-200 text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400">Timestamp (UTC)</label>
                  <input
                    type="text"
                    value={timestamp}
                    onChange={(e) => setTimestamp(e.target.value)}
                    placeholder="Auto-generated or custom"
                    className="w-full mt-0.5 px-2 py-1 rounded bg-card border border-border-subtle text-slate-200 text-xs focus:outline-none focus:border-primary font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400">Finding / Artifact Detail</label>
                  <textarea
                    value={finding}
                    onChange={(e) => setFinding(e.target.value)}
                    placeholder="Describe observed command line, process lineage, or hash..."
                    rows={3}
                    className="w-full mt-0.5 px-2 py-1 rounded bg-card border border-border-subtle text-slate-200 text-xs focus:outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-2 py-1 rounded text-[11px] text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-2.5 py-1 rounded bg-primary text-black font-semibold text-[11px] hover:bg-primary-hover transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : "Save Finding"}
                  </button>
                </div>
              </form>
            )}

            {/* Evidence List */}
            {evidence.length === 0 ? (
              <div className="p-4 rounded border border-dashed border-border-subtle bg-surface/30 text-center space-y-1">
                <ClipboardList className="w-5 h-5 text-slate-500 mx-auto" />
                <div className="text-xs text-slate-400 font-medium">No Evidence Logged</div>
                <p className="text-[10px] text-slate-500">
                  Click &apos;Add Finding&apos; to record artifacts during your investigation.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {evidence.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded bg-surface/70 border border-border-subtle/80 hover:border-border-default transition-all space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-primary font-bold">
                          #{String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-card text-slate-300 border border-border-subtle">
                          {item.source}
                        </span>
                        {item.event_id && (
                          <span className="font-mono text-amber-400">
                            EID {item.event_id}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => onDeleteEvidence(item.id)}
                        className="text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                        title="Delete Finding"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <p className="text-slate-200 text-[11px] leading-snug break-words">
                      {item.finding}
                    </p>

                    <div className="text-[9px] font-mono text-slate-500">
                      {item.timestamp}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CHECKLIST TAB */}
        {activeTab === "checklist" && (
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-slate-200 font-bold font-mono text-xs">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>INVESTIGATION CHECKLIST</span>
            </div>

            <div className="space-y-1.5">
              {[
                "Review Mission Briefing & Scenario",
                "Verify Lab Infrastructure Status",
                "Trigger Telemetry Simulation",
                "Locate Security Event in OpenSearch",
                "Cross-Reference Process Lineage",
                "Collect Artifact Evidence",
                "Form Final Analyst Verdict",
              ].map((item) => {
                const isChecked = checklist.includes(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggleChecklistItem(item)}
                    className={`w-full flex items-start gap-2 p-2 rounded text-left transition-all border ${
                      isChecked
                        ? "bg-emerald-950/20 border-emerald-800/40 text-slate-200"
                        : "bg-surface/60 border-border-subtle text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    )}
                    <span className={`text-[11px] leading-tight ${isChecked ? "line-through text-slate-400" : ""}`}>
                      {item}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === "notes" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-200 font-bold font-mono text-xs">
                <Edit3 className="w-3.5 h-3.5 text-primary" />
                <span>CASE NOTES</span>
              </div>
              <button
                onClick={handleSaveNotesClick}
                disabled={isSavingNotes}
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 font-mono text-[10px] transition-all disabled:opacity-50"
              >
                <Save className="w-3 h-3" />
                <span>{isSavingNotes ? "Saving..." : "Save"}</span>
              </button>
            </div>

            <textarea
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              placeholder="Write your investigation hypothesis, command lines, timestamps, and conclusions here..."
              rows={12}
              className="w-full p-2.5 rounded bg-surface border border-border-subtle text-slate-200 text-xs font-mono focus:outline-none focus:border-primary leading-relaxed scrollbar-thin resize-none"
            />
          </div>
        )}
      </div>

      {/* Bottom Export Action */}
      <div className="p-2.5 border-t border-border-subtle bg-surface/50">
        <button
          onClick={handleCopyBrief}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-surface hover:bg-card text-slate-300 hover:text-white border border-border-subtle text-[11px] font-mono transition-all"
        >
          {copiedBrief ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-bold">Brief Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-primary" />
              <span>Copy Incident Brief</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
