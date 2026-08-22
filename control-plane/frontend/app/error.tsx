"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log client error to console
    console.error("THEDAL Client Error Boundary Caught:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-accent-red/10 border border-accent-red/30 flex items-center justify-center text-accent-red mb-4 shadow-lg shadow-accent-red/5">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold font-mono tracking-wider text-text-primary mb-1">
        APPLICATION RUNTIME ERROR
      </h2>
      <p className="text-xs text-text-muted max-w-md mx-auto mb-2">
        An unexpected exception occurred while rendering this interface.
      </p>
      <div className="p-3 rounded bg-surface border border-border-subtle font-mono text-[11px] text-accent-red max-w-lg mx-auto mb-6 text-left overflow-x-auto">
        {error?.message || "Unknown error"}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="px-4 py-2 rounded bg-primary hover:bg-primary-hover text-white font-mono text-xs font-bold inline-flex items-center gap-2 transition-colors shadow-md shadow-primary/20"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
        <Link
          href="/"
          className="px-4 py-2 rounded bg-panel hover:bg-panel-hover border border-border-subtle text-text-primary font-mono text-xs font-bold inline-flex items-center gap-2 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
