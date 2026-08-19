"use client";

import React, { useState, useEffect } from "react";
import { FileText, Save, Check, X } from "lucide-react";
import { useToast } from "../ui/Toast";

interface NotesDrawerProps {
  labId: string;
  initialNotes?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (notes: string) => Promise<void>;
}

export const NotesDrawer: React.FC<NotesDrawerProps> = ({
  labId,
  initialNotes = "",
  isOpen,
  onClose,
  onSave,
}) => {
  const [notes, setNotes] = useState(initialNotes);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(notes);
      setIsSaved(true);
      success("Notes saved", "Your investigation notes are stored in local SQLite.");
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err: any) {
      error("Failed to save notes", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-surface border-l border-border-default shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-card/60">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-slate-100">Investigation Notes</h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 p-1 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-3">
        <div className="text-xs text-slate-400">
          Document your artifact hashes, IP indicators, SQLi payloads, or incident conclusions for <span className="font-mono text-slate-300">{labId}</span>.
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write your triage notes, query syntax, or analysis findings here..."
          className="flex-1 w-full p-3 rounded bg-card border border-border-subtle focus:border-primary focus:outline-none text-slate-100 font-mono text-xs leading-relaxed resize-none placeholder:text-slate-600"
        />
      </div>

      <div className="flex items-center justify-between px-5 py-3.5 border-t border-border-subtle bg-card/40">
        <span className="text-[11px] text-slate-500">Stored locally in SQLite</span>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-semibold text-white transition-colors ${
            isSaved
              ? "bg-emerald-600 hover:bg-emerald-500"
              : "bg-primary hover:bg-primary-hover"
          } ${isSaving ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {isSaved ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Saved</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : "Save Notes"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
