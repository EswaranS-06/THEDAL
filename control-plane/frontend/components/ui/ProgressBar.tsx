import React from "react";

interface ProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  sublabel?: string;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  sublabel,
  size = "md",
  showValue = true,
}) => {
  const clamped = Math.min(100, Math.max(0, Math.round(value)));

  const heightClasses = size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2";

  return (
    <div className="w-full">
      {(label || showValue || sublabel) && (
        <div className="flex items-center justify-between text-xs mb-1.5">
          <div className="flex items-center gap-2">
            {label && <span className="font-medium text-slate-200">{label}</span>}
            {sublabel && <span className="text-slate-400">{sublabel}</span>}
          </div>
          {showValue && (
            <span className="font-mono text-slate-300 font-semibold">{clamped}%</span>
          )}
        </div>
      )}
      <div className={`w-full bg-muted rounded-full overflow-hidden ${heightClasses}`}>
        <div
          className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
