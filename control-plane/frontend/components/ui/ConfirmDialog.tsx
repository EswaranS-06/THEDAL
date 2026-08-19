"use client";

import React, { ReactNode } from "react";
import { AlertCircle, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "warning";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary",
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-card border border-border-default rounded shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle bg-surface">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-200 p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 text-xs text-slate-300 leading-relaxed space-y-3">
          {description}
        </div>

        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-border-subtle bg-surface/50">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-3 py-1.5 rounded text-xs font-medium text-slate-300 bg-muted hover:bg-slate-700 border border-border-subtle transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-3.5 py-1.5 rounded text-xs font-semibold text-white transition-colors flex items-center gap-1.5 ${
              variant === "warning"
                ? "bg-amber-600 hover:bg-amber-500"
                : "bg-primary hover:bg-primary-hover"
            } ${isLoading ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {isLoading ? "Executing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
