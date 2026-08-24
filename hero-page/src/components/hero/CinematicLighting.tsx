import React from 'react';

interface CinematicLightingProps {
  pointerX?: number;
  pointerY?: number;
}

export const CinematicLighting: React.FC<CinematicLightingProps> = ({
  pointerX = 0,
  pointerY = 0,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* 1. Core Cyan Light Field (Centered behind headline with subtle pointer reaction) */}
      <div
        className="absolute top-[18%] left-1/2 -translate-x-1/2 w-[750px] sm:w-[900px] h-[450px] rounded-full blur-[140px] opacity-25 transition-transform duration-1000 ease-out"
        style={{
          background: 'radial-gradient(circle, #00f2fe 0%, #0284c7 45%, transparent 70%)',
          transform: `translate(calc(-50% + ${pointerX * 25}px), ${pointerY * 20}px)`,
        }}
      />

      {/* 2. Violet Atmospheric Emitter (Upper Right) */}
      <div
        className="absolute top-[8%] right-[5%] w-[550px] h-[550px] rounded-full blur-[160px] opacity-20 transition-transform duration-1000 ease-out"
        style={{
          background: 'radial-gradient(circle, #a855f7 0%, #6366f1 50%, transparent 75%)',
          transform: `translate(${pointerX * -30}px, ${pointerY * -25}px)`,
        }}
      />

      {/* 3. Deep Blue Foundation Field (Lower Center/Behind 3D Network) */}
      <div
        className="absolute top-[48%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full blur-[180px] opacity-20"
        style={{
          background: 'radial-gradient(ellipse, #1e3a8a 0%, #0369a1 40%, transparent 70%)',
          transform: `translate(calc(-50% + ${pointerX * 15}px), ${pointerY * 15}px)`,
        }}
      />

      {/* 4. Threat Pulse Glow (Active only when high severity events occur) */}
      <div
        className="absolute top-[25%] left-[15%] w-[400px] h-[400px] rounded-full blur-[150px] opacity-15"
        style={{
          background: 'radial-gradient(circle, #f43f5e 0%, transparent 70%)',
        }}
      />
    </div>
  );
};
