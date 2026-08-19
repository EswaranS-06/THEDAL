"use client";

import React, { useState } from "react";
import { AlertTriangle, X, ShieldAlert } from "lucide-react";

interface DangerDialogProps {
  isOpen: boolean;
  title: string;
  requiredPhrase?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DangerDialog: React.FC<DangerDialogProps> = ({
  isOpen,
  title,
  requiredPhrase = "DESTROY THEDAL",
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const [typedPhrase, setTypedPhrase] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);

  if (!isOpen) return null;

  const isConfirmed = typedPhrase.trim() === requiredPhrase && acknowledged;

  const handleClose = () => {
    setTypedPhrase("");
    setAcknowledged(false);
    onCancel();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isConfirmed && !isLoading) {
      onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-card border border-rose-600/50 rounded shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-rose-900/40 bg-rose-950/40">
          <div className="flex items-center gap-2.5 text-rose-400">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="text-sm font-semibold">{title}</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-200 p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4 text-xs text-slate-300">
            <div className="p-3 rounded bg-rose-950/20 border border-rose-800/30 text-rose-300 space-y-1.5">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>Destructive Cloud Infrastructure Action</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                This action will trigger <code className="text-rose-300 font-mono">terraform destroy</code>. All AWS EC2 instances, VPC subnets, security groups, routing tables, and internet gateways will be permanently terminated.
              </p>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                disabled={isLoading}
                className="mt-0.5 rounded border-border-default bg-surface text-rose-600 focus:ring-rose-500"
              />
              <span className="text-slate-300 leading-normal">
                I understand this will irreversibly destroy all active AWS lab infrastructure.
              </span>
            </label>

            <div>
              <label className="block font-medium text-slate-200 mb-1.5">
                Type <span className="font-mono text-rose-400 font-semibold">{requiredPhrase}</span> to confirm:
              </label>
              <input
                type="text"
                value={typedPhrase}
                onChange={(e) => setTypedPhrase(e.target.value)}
                disabled={isLoading}
                placeholder={requiredPhrase}
                className="w-full px-3 py-2 rounded bg-surface border border-border-default focus:border-rose-500 focus:outline-none text-slate-100 font-mono text-xs placeholder:text-slate-600"
                autoFocus
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-border-subtle bg-surface/50">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-3 py-1.5 rounded text-xs font-medium text-slate-300 bg-muted hover:bg-slate-700 border border-border-subtle transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isConfirmed || isLoading}
              className={`px-4 py-1.5 rounded text-xs font-semibold text-white transition-colors ${
                isConfirmed && !isLoading
                  ? "bg-rose-600 hover:bg-rose-500"
                  : "bg-rose-950 text-rose-400/50 cursor-not-allowed border border-rose-900/30"
              }`}
            >
              {isLoading ? "Destroying..." : "Permanently Destroy Infrastructure"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
