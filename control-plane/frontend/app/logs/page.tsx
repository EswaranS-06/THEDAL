"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ScrollText,
  Search,
  Download,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Terminal,
  FileCode,
} from "lucide-react";
import { operationsApi } from "../../lib/api/operations";
import { OperationLogMeta, OperationDetail } from "../../lib/types/api";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { CardSkeleton } from "../../components/ui/LoadingSkeleton";
import { ErrorState } from "../../components/ui/ErrorState";
import { useToast } from "../../components/ui/Toast";

import { copyToClipboard } from "../../lib/clipboard";

export default function LogsPage() {
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [logs, setLogs] = useState<OperationLogMeta[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [logDetail, setLogDetail] = useState<OperationDetail | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await operationsApi.listOperations();
      const logList = res.logs || [];
      setLogs(logList);
      if (logList.length > 0 && !selectedFile) {
        setSelectedFile(logList[0].filename);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load operational logs.");
    } finally {
      setLoading(false);
    }
  }, [selectedFile]);

  const loadLogContent = useCallback(async (filename: string) => {
    setSelectedFile(filename);
    setLoadingContent(true);
    try {
      const res = await operationsApi.getOperationDetail(filename);
      setLogDetail(res);
    } catch (err: any) {
      error("Failed to read log", err.message);
    } finally {
      setLoadingContent(false);
    }
  }, [error]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    if (selectedFile) {
      loadLogContent(selectedFile);
    }
  }, [selectedFile, loadLogContent]);

  const handleCopy = async () => {
    if (!logDetail?.content) return;
    const ok = await copyToClipboard(logDetail.content);
    if (ok) {
      setCopied(true);
      success("Log Copied", "Log content copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopied(false);
    }
  };

  const filteredLogs = logs.filter(
    (l) =>
      l.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && logs.length === 0) {
    return (
      <div className="space-y-6">
        <CardSkeleton className="h-28" />
        <CardSkeleton className="h-96" />
      </div>
    );
  }

  if (errorMsg && logs.length === 0) {
    return (
      <ErrorState
        title="Failed to Load Logs"
        message={errorMsg}
        isOffline={true}
        onRetry={loadLogs}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-primary" />
            <span>Operational Audit Logs</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable logs of Terraform deployments, Ansible automation, and system diagnostics.
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-muted hover:bg-slate-700 text-xs font-medium text-slate-200 border border-border-default transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 2-Pane Log Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane: Log List & Search */}
        <div className="lg:col-span-5 rounded border border-border-subtle bg-card/60 overflow-hidden space-y-3 p-4">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs by action or filename..."
              className="w-full pl-9 pr-3 py-1.5 rounded bg-surface border border-border-subtle focus:border-primary focus:outline-none text-slate-200 text-xs placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredLogs.length === 0 ? (
              <div className="text-xs text-slate-500 italic p-4 text-center">
                No logs matching your query.
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isSelected = selectedFile === log.filename;
                return (
                  <button
                    key={log.filename}
                    onClick={() => loadLogContent(log.filename)}
                    className={`w-full p-3 rounded text-left transition-all border block ${
                      isSelected
                        ? "bg-primary/15 border-primary/40 text-slate-100"
                        : "bg-surface/70 hover:bg-card border-border-subtle/50 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold truncate">
                        {log.filename}
                      </span>
                      <StatusBadge status={log.status} size="sm" />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 font-mono">
                      <span>{log.action}</span>
                      <span>{log.timestamp}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Log Preview */}
        <div className="lg:col-span-7 rounded border border-border-subtle bg-card/60 overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-surface border-b border-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              <span className="font-mono text-xs font-semibold text-slate-200">
                {selectedFile || "No log selected"}
              </span>
            </div>

            {selectedFile && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-muted hover:bg-slate-700 text-[11px] font-medium text-slate-300 border border-border-subtle transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <a
                  href={operationsApi.getDownloadUrl(selectedFile)}
                  download={selectedFile}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-primary hover:bg-primary-hover text-[11px] font-semibold text-white transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </a>
              </div>
            )}
          </div>

          <div className="p-4 bg-code max-h-[600px] overflow-y-auto">
            {loadingContent ? (
              <div className="text-xs font-mono text-slate-500 italic p-4">
                Loading log content...
              </div>
            ) : (
              <pre className="text-slate-200 font-mono text-xs leading-relaxed whitespace-pre-wrap select-text">
                <code>{logDetail?.content || "No log content."}</code>
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
