"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Terminal,
  ArrowLeft,
  Copy,
  Download,
  Check,
  RefreshCw,
  Clock,
  FileCode,
} from "lucide-react";
import { operationsApi } from "../../../lib/api/operations";
import { OperationDetail } from "../../../lib/types/api";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { CardSkeleton } from "../../../components/ui/LoadingSkeleton";
import { ErrorState } from "../../../components/ui/ErrorState";
import { useToast } from "../../../components/ui/Toast";

export default function OperationDetailPage() {
  const params = useParams();
  const logFile = params?.id as string;
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [detail, setDetail] = useState<OperationDetail | null>(null);
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const terminalRef = useRef<HTMLPreElement>(null);

  const loadLogDetail = async () => {
    if (!logFile) return;
    try {
      setErrorMsg(null);
      const res = await operationsApi.getOperationDetail(logFile);
      setDetail(res);
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to read log '${logFile}'.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogDetail();
    // Refresh periodically if operation is running
    const interval = setInterval(() => {
      if (detail?.metadata?.status === "RUNNING") {
        loadLogDetail();
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [logFile, detail?.metadata?.status]);

  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [detail?.content, autoScroll]);

  const handleCopy = async () => {
    if (!detail?.content) return;
    try {
      await navigator.clipboard.writeText(detail.content);
      setCopied(true);
      success("Log Copied", "Complete raw stdout/stderr copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (loading && !detail) {
    return (
      <div className="space-y-6">
        <CardSkeleton className="h-24" />
        <CardSkeleton className="h-96" />
      </div>
    );
  }

  if (errorMsg && !detail) {
    return (
      <div className="space-y-4">
        <Link
          href="/operations"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Operations</span>
        </Link>
        <ErrorState
          title={`Log '${logFile}' Not Found`}
          message={errorMsg}
          onRetry={loadLogDetail}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="space-y-2">
        <Link
          href="/operations"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Operations Console</span>
        </Link>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-card border border-border-default flex items-center justify-center text-primary font-mono text-base font-bold">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100 font-mono">
                  {detail?.filename || logFile}
                </h2>
                {detail?.metadata && (
                  <StatusBadge status={detail.metadata.status} size="sm" />
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Action: <span className="font-mono text-slate-300">{detail?.metadata?.action || "Command Output"}</span> • Timestamp: {detail?.metadata?.timestamp || "Recorded"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-muted hover:bg-slate-700 text-xs font-medium text-slate-200 border border-border-default transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Log</span>
                </>
              )}
            </button>
            <a
              href={operationsApi.getDownloadUrl(logFile)}
              download={logFile}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-primary hover:bg-primary-hover text-xs font-semibold text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
          </div>
        </div>
      </div>

      {/* Terminal Log Output Window */}
      <div className="rounded border border-border-subtle bg-code overflow-hidden shadow-2xl">
        <div className="px-4 py-2.5 bg-surface border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
            <span className="text-[11px] font-mono text-slate-400 ml-2">stdout / stderr stream</span>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded border-border-default bg-surface text-primary focus:ring-primary"
            />
            <span className="text-[11px]">Auto-scroll</span>
          </label>
        </div>

        <pre
          ref={terminalRef}
          className="p-4 text-slate-200 font-mono text-xs leading-relaxed overflow-x-auto max-h-[600px] whitespace-pre-wrap select-text"
        >
          <code>{detail?.content || "Log is empty or waiting for process output..."}</code>
        </pre>
      </div>
    </div>
  );
}
