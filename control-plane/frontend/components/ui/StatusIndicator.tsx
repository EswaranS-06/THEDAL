import React from "react";

interface StatusIndicatorProps {
  status: "PASS" | "WARNING" | "FAIL" | "UNKNOWN" | string;
  label?: string;
  pulse?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  pulse = false,
}) => {
  const norm = (status || "UNKNOWN").toUpperCase();

  let dotColor = "bg-slate-500";
  let textColor = "text-slate-400";

  if (["PASS", "RUNNING", "SUCCESS", "COMPLETED", "VALID", "ONLINE"].includes(norm)) {
    dotColor = "bg-status-pass";
    textColor = "text-emerald-400";
  } else if (["WARNING", "STOPPED", "IN PROGRESS", "DEGRADED", "DRIFT"].includes(norm)) {
    dotColor = "bg-status-warn";
    textColor = "text-amber-400";
  } else if (["FAIL", "FAILURE", "ERROR", "TERMINATED", "OFFLINE"].includes(norm)) {
    dotColor = "bg-status-fail";
    textColor = "text-rose-400";
  } else if (["INFO", "PENDING"].includes(norm)) {
    dotColor = "bg-status-info";
    textColor = "text-blue-400";
  }

  return (
    <div className="inline-flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
      </span>
      {label && <span className={`text-xs font-medium ${textColor}`}>{label}</span>}
    </div>
  );
};
