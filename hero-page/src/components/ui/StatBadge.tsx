import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatBadgeProps {
  label: string;
  value: string;
  sublabel?: string;
  icon: LucideIcon;
  variant?: 'cyan' | 'emerald' | 'amber' | 'purple';
}

export const StatBadge: React.FC<StatBadgeProps> = ({
  label,
  value,
  sublabel,
  icon: Icon,
  variant = 'cyan',
}) => {
  const variantStyles = {
    cyan: {
      border: 'border-cyan-500/20 hover:border-cyan-500/50',
      glow: 'group-hover:shadow-[0_0_20px_rgba(0,242,254,0.15)]',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      text: 'text-cyan-400',
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/50',
      glow: 'group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      text: 'text-emerald-400',
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/50',
      glow: 'group-hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      text: 'text-amber-400',
    },
    purple: {
      border: 'border-purple-500/20 hover:border-purple-500/50',
      glow: 'group-hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]',
      iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      text: 'text-purple-400',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      className={`group relative p-4 rounded-xl bg-[#081120]/90 border ${style.border} transition-all duration-300 ${style.glow} flex items-center gap-4`}
    >
      <div className={`p-3 rounded-lg border ${style.iconBg} shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white flex items-center gap-1.5">
          {value}
        </div>
        <div className="text-xs font-semibold text-slate-300">{label}</div>
        {sublabel && <div className="text-[10px] text-slate-400 font-mono mt-0.5">{sublabel}</div>}
      </div>
    </div>
  );
};
