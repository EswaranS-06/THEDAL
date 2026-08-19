import React from "react";
import { CheckCircle, AlertTriangle, XCircle, HelpCircle, Circle, Play, Square } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  variant?: "health" | "state" | "operation" | "lab" | "default";
  size?: "sm" | "md";
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant = "default",
  size = "md",
  showIcon = true,
}) => {
  const norm = (status || "UNKNOWN").toUpperCase();

  let colorClasses = "bg-muted text-slate-300 border-border-subtle";
  let IconComponent = HelpCircle;

  if (["PASS", "RUNNING", "SUCCESS", "COMPLETED", "VALID", "READY", "ONLINE"].includes(norm)) {
    colorClasses = "bg-status-pass-bg text-emerald-400 border-emerald-500/30";
    IconComponent = norm === "RUNNING" ? Play : CheckCircle;
  } else if (["WARNING", "STOPPED", "IN PROGRESS", "PAUSED", "DEGRADED", "DRIFT"].includes(norm)) {
    colorClasses = "bg-status-warn-bg text-amber-400 border-amber-500/30";
    IconComponent = norm === "STOPPED" ? Square : AlertTriangle;
  } else if (["FAIL", "FAILURE", "ERROR", "TERMINATED", "CRITICAL", "OFFLINE", "INVALID"].includes(norm)) {
    colorClasses = "bg-status-fail-bg text-rose-400 border-rose-500/30";
    IconComponent = XCircle;
  } else if (["INFO", "NOT STARTED", "UNCHECKED", "PENDING"].includes(norm)) {
    colorClasses = "bg-status-info-bg text-blue-400 border-blue-500/30";
    IconComponent = Circle;
  }

  const sizeClasses = size === "sm" ? "px-1.5 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded border ${sizeClasses} ${colorClasses} tracking-tight select-none`}
    >
      {showIcon && <IconComponent className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />}
      <span>{status}</span>
    </span>
  );
};
