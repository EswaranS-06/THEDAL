import React from 'react';
import { motion } from 'framer-motion';
import { Server, Flame, Cpu, Lock } from 'lucide-react';
import { TacticalGrid } from './TacticalGrid';
import { CinematicLighting } from './CinematicLighting';
import { HeroScene } from './HeroScene';
import { FloatingTelemetryCard } from './FloatingTelemetryCard';
import { HeroHeadline } from './HeroHeadline';
import { HeroCTA } from './HeroCTA';
import { TelemetryTimeline } from './TelemetryTimeline';
import { StatBadge } from '../ui/StatBadge';
import { usePointerParallax } from '../../hooks/usePointerParallax';
import { useTelemetrySimulation } from '../../hooks/useTelemetrySimulation';

export const HeroExperience: React.FC = () => {
  const pointer = usePointerParallax(0.04);
  const simulation = useTelemetrySimulation();

  return (
    <section className="relative min-h-screen pt-28 sm:pt-36 pb-20 lg:pb-32 overflow-hidden bg-[#020617] text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* LAYER 1: Tactical Grid & Scanlines */}
      <TacticalGrid />

      {/* LAYER 2: Cinematic Lighting Fields with Pointer Parallax */}
      <CinematicLighting pointerX={pointer.x} pointerY={pointer.y} />

      {/* LAYER 3: 3D Cyber-Range Network Scene (Three.js WebGL) */}
      <HeroScene
        pointerX={pointer.x}
        pointerY={pointer.y}
        activeScenarioId={simulation.selectedScenario}
        simulationPhase={simulation.phase}
        simulationProgress={simulation.progress}
      />

      {/* LAYER 4: Floating Holographic Intelligence Cards */}
      <FloatingTelemetryCard
        type="alert"
        pointerX={pointer.x}
        pointerY={pointer.y}
      />
      <FloatingTelemetryCard
        type="network"
        pointerX={pointer.x}
        pointerY={pointer.y}
      />
      <FloatingTelemetryCard
        type="detection"
        pointerX={pointer.x}
        pointerY={pointer.y}
      />
      <FloatingTelemetryCard
        type="chain"
        pointerX={pointer.x}
        pointerY={pointer.y}
      />

      {/* LAYER 5: Core Content, Headline, Interactive Timeline & Metric Badges */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Animated Staggered Hero Presentation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Main Headline & Micro-Copy */}
          <HeroHeadline />
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <HeroCTA />
        </motion.div>

        {/* Centerpiece Interactive SOC Attack Timeline & Telemetry Console */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 sm:mt-16 max-w-5xl mx-auto"
        >
          <TelemetryTimeline
            selectedScenario={simulation.selectedScenario}
            onSelectScenario={simulation.selectScenario}
            phase={simulation.phase}
            progress={simulation.progress}
            eventsPerSec={simulation.eventsPerSec}
            epsHistory={simulation.epsHistory}
            onTriggerSimulation={simulation.triggerSimulation}
          />
        </motion.div>

        {/* Infrastructure & Curriculum Stat Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatBadge
            label="AWS Infrastructure"
            value="5 Cloud Nodes"
            sublabel="Static Internal IPs (10.10.0.0/16)"
            icon={Server}
            variant="cyan"
          />
          <StatBadge
            label="Hands-On Curriculum"
            value="14 Guided Labs"
            sublabel="Plus 3 Mystery Threat Challenges"
            icon={Flame}
            variant="amber"
          />
          <StatBadge
            label="Telemetry Sources"
            value="100% Native"
            sublabel="Sysmon v15, PowerShell, Nginx, Auditd"
            icon={Cpu}
            variant="emerald"
          />
          <StatBadge
            label="Architecture Cost"
            value="$0 NAT Gateway"
            sublabel="Squid Forward Proxy on Bastion"
            icon={Lock}
            variant="purple"
          />
        </motion.div>
      </div>
    </section>
  );
};
