import React from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message: string;
  details?: string;
  onRetry?: () => void;
  isOffline?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "An error occurred",
  message,
  details,
  onRetry,
  isOffline = false,
}) => {
  return (
    <div className="p-6 rounded border border-status-fail/40 bg-status-fail-bg/20 text-slate-100">
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded bg-status-fail/20 text-rose-400 mt-0.5">
          <AlertOctagon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-rose-300">{title}</h4>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{message}</p>
          {details && (
            <pre className="mt-3 p-2.5 rounded bg-code border border-border-subtle text-[11px] font-mono text-rose-300 overflow-x-auto">
              <code>{details}</code>
            </pre>
          )}
          {isOffline && (
            <div className="mt-3 text-xs text-slate-400">
              Check if the FastAPI backend service is running locally on <code className="text-slate-300">127.0.0.1:8080</code>.
            </div>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-muted hover:bg-slate-700 text-xs font-medium text-slate-200 border border-border-default transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Request</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
