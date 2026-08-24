import React from 'react';

export const TacticalGrid: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* 3D Perspective Plane Grid at bottom */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[600px] opacity-25"
        style={{
          perspective: '1000px',
          perspectiveOrigin: '50% 100%',
        }}
      >
        <div 
          className="w-full h-full"
          style={{
            transform: 'rotateX(75deg) translateZ(0)',
            backgroundImage: `
              linear-gradient(to right, rgba(0, 242, 254, 0.18) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0, 242, 254, 0.18) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at 50% 100%, black 20%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 50% 100%, black 20%, transparent 80%)',
          }}
        />
      </div>

      {/* Top Subtle Tactical Scan Grid */}
      <div 
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(56, 189, 248, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(56, 189, 248, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(circle at 50% 35%, black 30%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 35%, black 30%, transparent 85%)',
        }}
      />

      {/* Very subtle CRT scanline effect */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, #000, #000 1px, transparent 1px, transparent 2px)',
          backgroundSize: '100% 2px',
        }}
      />

      {/* Peripheral Horizon Fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-[#020617]/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-transparent to-[#020617]" />
    </div>
  );
};
