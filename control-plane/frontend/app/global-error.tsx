"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#050B10] text-[#E0E8F0] min-h-screen flex items-center justify-center p-6 font-sans">
        <div className="text-center space-y-4 max-w-md">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold font-mono text-white">
            GLOBAL APPLICATION ERROR
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            A critical error interrupted the THEDAL interface runtime.
          </p>
          <div className="p-3 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-red-400 text-left overflow-x-auto">
            {error?.message || "Unknown global error"}
          </div>
          <button
            onClick={() => reset()}
            className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-600 text-white font-mono text-xs font-bold inline-flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload Application</span>
          </button>
        </div>
      </body>
    </html>
  );
}
