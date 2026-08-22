"use client";

import React from "react";
import Link from "next/link";
import { Shield, ArrowLeft, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-accent-yellow/10 border border-accent-yellow/30 flex items-center justify-center text-accent-yellow mb-4 shadow-lg shadow-accent-yellow/5">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold font-mono tracking-wider text-text-primary mb-1">
        404 — PAGE NOT FOUND
      </h2>
      <p className="text-xs text-text-muted max-w-md mx-auto mb-6">
        The requested THEDAL Control Plane route or telemetry resource could not be found.
      </p>
      <Link
        href="/"
        className="px-4 py-2 rounded bg-primary hover:bg-primary-hover text-white font-mono text-xs font-bold inline-flex items-center gap-2 transition-colors shadow-md shadow-primary/20"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
}
