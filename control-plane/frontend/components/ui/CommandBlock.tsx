"use client";

import React, { useState } from "react";
import { Copy, Check, Terminal } from "lucide-react";
import { useToast } from "./Toast";

import { copyToClipboard } from "../../lib/clipboard";

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
    const ok = await copyToClipboard(command);
    if (ok) {
      setCopied(true);
      success("Copied to clipboard", title || "Command ready to execute in terminal");
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopied(false);
    }
  };

  return (
    <div className="rounded-md border border-border-subtle bg-panel overflow-hidden text-xs">
      {(title || description) && (
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border-subtle bg-surface/60">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-primary shrink-0" />
            {title && <span className="font-mono font-semibold text-text-primary text-[11px]">{title}</span>}
            {description && (
              <span className="text-text-muted text-[10px] hidden sm:inline">• {description}</span>
            )}
          </div>
          <span className="text-[9px] text-text-muted font-mono px-1.5 py-0.2 rounded bg-surface border border-border-subtle">
            LIVE IP
          </span>
        </div>
      )}
      <div className="flex items-center justify-between p-2.5 gap-2 bg-[#071017]">
        <pre className="font-mono text-text-primary overflow-x-auto text-[11px] leading-relaxed whitespace-pre-wrap break-all flex-1 select-all">
          <code>{command}</code>
        </pre>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-semibold transition-all flex-shrink-0 border ${
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
  );
};
