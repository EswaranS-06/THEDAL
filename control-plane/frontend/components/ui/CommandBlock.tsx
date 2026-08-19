"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useToast } from "./Toast";

interface CommandBlockProps {
  command: string;
  title?: string;
  description?: string;
  compact?: boolean;
}

export const CommandBlock: React.FC<CommandBlockProps> = ({
  command,
  title,
  description,
  compact = false,
}) => {
  const [copied, setCopied] = useState(false);
  const { success } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      success("Copied to clipboard", title || "Command ready to execute in your terminal");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  return (
    <div className="rounded border border-border-subtle bg-surface/80 overflow-hidden text-xs">
      {(title || description) && (
        <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle bg-card/40">
          <div>
            {title && <span className="font-semibold text-slate-200">{title}</span>}
            {description && (
              <span className="text-slate-400 ml-2 text-[11px] font-normal">{description}</span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Dynamic IP</span>
        </div>
      )}
      <div className="flex items-center justify-between p-2.5 gap-2 bg-code/90">
        <pre className="font-mono text-slate-200 overflow-x-auto text-[11px] leading-relaxed whitespace-pre-wrap break-all flex-1 select-all">
          <code>{command}</code>
        </pre>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors flex-shrink-0 ${
            copied
              ? "bg-emerald-950/80 text-emerald-400 border border-emerald-700/50"
              : "bg-muted hover:bg-slate-700 text-slate-300 border border-border-default"
          }`}
          title="Copy command to clipboard"
          aria-label="Copy command"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
