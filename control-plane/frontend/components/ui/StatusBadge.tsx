import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle, Circle, Play, Square } from "lucide-react";

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

  let colorClasses = "bg-panel text-text-muted border-border-subtle";
  let IconComponent = HelpCircle;

  if (["PASS", "RUNNING", "SUCCESS", "COMPLETED", "VALID", "READY", "ONLINE", "OPERATIONAL", "HEALTHY", "ACTIVE"].includes(norm)) {
    colorClasses = "bg-primary/10 text-primary border-primary/30";
    IconComponent = norm === "RUNNING" ? Play : CheckCircle2;
  } else if (["WARNING", "STOPPED", "IN PROGRESS", "PAUSED", "DEGRADED", "DRIFT", "UNHEALTHY"].includes(norm)) {
    colorClasses = "bg-accent-yellow/10 text-accent-yellow border-accent-yellow/30";
    IconComponent = norm === "STOPPED" ? Square : AlertTriangle;
  } else if (["FAIL", "FAILURE", "ERROR", "TERMINATED", "CRITICAL", "OFFLINE", "INVALID"].includes(norm)) {
    colorClasses = "bg-accent-red/10 text-accent-red border-accent-red/30";
    IconComponent = XCircle;
  } else if (["INFO", "NOT STARTED", "UNCHECKED", "PENDING"].includes(norm)) {
    colorClasses = "bg-accent-blue/10 text-accent-blue border-accent-blue/30";
    IconComponent = Circle;
  }

  const sizeClasses = size === "sm" ? "px-1.5 py-0.2 text-[10px] font-mono" : "px-2 py-0.5 text-[11px] font-mono";

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded border ${sizeClasses} ${colorClasses} tracking-tight select-none`}
    >
      {showIcon && <IconComponent className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />}
      <span>{status}</span>
    </span>
  );
};
