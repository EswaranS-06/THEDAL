import React, { useRef, useState } from 'react';
import { Zap, Layers, Github, ArrowRight } from 'lucide-react';

export const HeroCTA: React.FC = () => {
  const [magneticOffset, setMagneticOffset] = useState({ x: 0, y: 0 });
  const primaryBtnRef = useRef<HTMLAnchorElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!primaryBtnRef.current) return;
    const rect = primaryBtnRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceX = (e.clientX - centerX) * 0.25;
    const distanceY = (e.clientY - centerY) * 0.25;
    setMagneticOffset({ x: distanceX, y: distanceY });
  };

  const handleMouseLeave = () => {
    setMagneticOffset({ x: 0, y: 0 });
  };

  return (
    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-20">
      {/* 1. Dominant Primary CTA: DEPLOY THE RANGE */}
      <a
        ref={primaryBtnRef}
        href="#install"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `translate(${magneticOffset.x}px, ${magneticOffset.y}px)`,
        }}
        className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 text-black font-bold font-mono text-sm tracking-wide transition-all duration-200 shadow-[0_0_30px_rgba(0,242,254,0.45)] hover:shadow-[0_0_45px_rgba(0,242,254,0.7)] hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950"
      >
        <span className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <Zap className="w-4 h-4 fill-black text-black transition-transform group-hover:scale-110" />
        <span>DEPLOY THE RANGE</span>
        <ArrowRight className="w-4 h-4 text-black transition-transform group-hover:translate-x-1" />
      </a>

      {/* 2. Secondary CTA: EXPLORE 14 LABS */}
      <a
        href="#curriculum"
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-[#040b18]/80 hover:bg-[#08152e] text-slate-200 font-semibold font-mono text-sm border border-slate-800 hover:border-cyan-500/40 transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,242,254,0.2)] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
      >
        <Layers className="w-4 h-4 text-cyan-400" />
        <span>EXPLORE 14 LABS</span>
      </a>

      {/* 3. Third Action: VIEW ON GITHUB */}
      <a
        href="https://github.com/EswaranS-06/THEDAL"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-4 rounded-xl bg-transparent hover:bg-slate-900/60 text-slate-400 hover:text-slate-200 font-mono text-xs border border-transparent hover:border-slate-800 transition-all duration-200 focus:outline-none"
      >
        <Github className="w-4 h-4 text-slate-400" />
        <span>VIEW ON GITHUB</span>
      </a>
    </div>
  );
};
