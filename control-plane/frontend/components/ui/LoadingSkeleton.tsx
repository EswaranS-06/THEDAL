import React from "react";

export const LoadingSkeleton: React.FC<{
  rows?: number;
  className?: string;
}> = ({ rows = 3, className = "" }) => {
  return (
    <div className={`space-y-3 animate-pulse ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-9 bg-card/60 rounded border border-border-subtle/50 w-full"
        />
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`p-4 rounded border border-border-subtle bg-card/40 animate-pulse ${className}`}>
      <div className="h-4 bg-muted rounded w-1/3 mb-3" />
      <div className="h-3 bg-muted/60 rounded w-2/3 mb-2" />
      <div className="h-3 bg-muted/40 rounded w-1/2" />
    </div>
  );
};
