import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CyberNetwork } from './CyberNetwork';
import { TelemetryParticles } from './TelemetryParticles';
import { AttackScenarioId, SimulationPhase } from './types';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface HeroSceneProps {
  pointerX?: number;
  pointerY?: number;
  activeScenarioId?: AttackScenarioId;
  simulationPhase?: SimulationPhase;
  simulationProgress?: number;
}

const CameraRig: React.FC<{ pointerX: number; pointerY: number }> = ({
  pointerX,
  pointerY,
}) => {
  useFrame((state) => {
    // Smooth camera parallax with subtle inertia
    const targetX = pointerX * 0.8;
    const targetY = pointerY * -0.5;
    const targetZ = 6.2 + Math.abs(pointerX) * 0.2;

    state.camera.position.x += (targetX - state.camera.position.x) * 0.05;
    state.camera.position.y += (targetY - state.camera.position.y) * 0.05;
    state.camera.position.z += (targetZ - state.camera.position.z) * 0.05;
    state.camera.lookAt(0, 0, 0);
  });

  return null;
};

// Accessible 2D Fallback for Reduced-Motion & Low-Power devices
const ReducedMotionFallback: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center p-8 opacity-40">
      <svg className="w-full max-w-2xl h-64" viewBox="0 0 800 300" fill="none">
        <circle cx="100" cy="150" r="16" fill="#f43f5e" />
        <text x="100" y="190" fill="#f43f5e" fontSize="12" textAnchor="middle" fontFamily="monospace">Attacker</text>
        <line x1="116" y1="150" x2="384" y2="150" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="400" cy="150" r="24" fill="#00f2fe" />
        <text x="400" y="200" fill="#00f2fe" fontSize="14" textAnchor="middle" fontFamily="monospace" fontWeight="bold">WAZUH SIEM</text>
        <line x1="424" y1="150" x2="684" y2="150" stroke="#a855f7" strokeWidth="2" />
        <circle cx="700" cy="150" r="16" fill="#10b981" />
        <text x="700" y="190" fill="#10b981" fontSize="12" textAnchor="middle" fontFamily="monospace">Detection Engine</text>
      </svg>
    </div>
  );
};

export const HeroScene: React.FC<HeroSceneProps> = ({
  pointerX = 0,
  pointerY = 0,
  activeScenarioId = 'powershell',
  simulationPhase = 'idle',
  simulationProgress = 0,
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <ReducedMotionFallback />;
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      <Canvas
        camera={{ position: [0, 0, 6.2], fov: 48 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        className="w-full h-full"
      >
        <CameraRig pointerX={pointerX} pointerY={pointerY} />

        {/* Ambient & Directional Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={0.8} color="#38bdf8" />
        <pointLight position={[-5, 5, 2]} intensity={1.5} color="#f43f5e" distance={15} />
        <pointLight position={[2, 0.8, 2]} intensity={2.2} color="#00f2fe" distance={12} />
        <pointLight position={[4, -1, 2]} intensity={1.5} color="#a855f7" distance={12} />

        <Suspense fallback={null}>
          {/* Ambient Cyber Dust Particle Field */}
          <TelemetryParticles count={260} speed={0.3} />

          {/* Interactive 3D Cyber Range Network */}
          <CyberNetwork
            activeScenarioId={activeScenarioId}
            simulationPhase={simulationPhase}
            simulationProgress={simulationProgress}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};
