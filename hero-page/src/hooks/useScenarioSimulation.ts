import { useState, useEffect, useRef, useCallback } from 'react';
import { SCENARIOS, AttackScenario } from '../components/hero/scenariosData';

export type SimulationPhase = 'idle' | 'attack' | 'ingest' | 'detected';

export interface ScenarioSimulationState {
  scenario: AttackScenario;
  phase: SimulationPhase;
  progress: number;
  triggerSimulation: (scenarioId?: string) => void;
  selectScenario: (scenarioId: string) => void;
  selectedScenarioId: string;
}

export function useScenarioSimulation(): ScenarioSimulationState {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('powershell');
  const [phase, setPhase] = useState<SimulationPhase>('idle');
  const [progress, setProgress] = useState<number>(0);
  
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const DURATION_MS = 2000; // 2 seconds total calm deterministic run

  const stopAnimation = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    startTimeRef.current = null;
  }, []);

  const runSimulationStep = useCallback((timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }
    const elapsed = timestamp - startTimeRef.current;
    const normProgress = Math.min(elapsed / DURATION_MS, 1);
    setProgress(normProgress);

    if (normProgress < 0.4) {
      setPhase('attack');
    } else if (normProgress < 0.75) {
      setPhase('ingest');
    } else if (normProgress < 1.0) {
      setPhase('detected');
    } else {
      setPhase('idle');
      setProgress(0);
      stopAnimation();
      return;
    }

    animFrameRef.current = requestAnimationFrame(runSimulationStep);
  }, [DURATION_MS, stopAnimation]);

  const triggerSimulation = useCallback((scenarioId?: string) => {
    stopAnimation();
    if (scenarioId && SCENARIOS[scenarioId]) {
      setSelectedScenarioId(scenarioId);
    }
    
    // Check reduced motion preference
    const prefersReducedMotion = typeof window !== 'undefined' && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      setPhase('detected');
      setProgress(1);
      setTimeout(() => {
        setPhase('idle');
        setProgress(0);
      }, 1500);
      return;
    }

    setPhase('attack');
    setProgress(0);
    animFrameRef.current = requestAnimationFrame(runSimulationStep);
  }, [runSimulationStep, stopAnimation]);

  const selectScenario = useCallback((scenarioId: string) => {
    if (SCENARIOS[scenarioId]) {
      setSelectedScenarioId(scenarioId);
      triggerSimulation(scenarioId);
    }
  }, [triggerSimulation]);

  useEffect(() => {
    return () => {
      stopAnimation();
    };
  }, [stopAnimation]);

  return {
    scenario: SCENARIOS[selectedScenarioId] || SCENARIOS.powershell,
    phase,
    progress,
    triggerSimulation,
    selectScenario,
    selectedScenarioId,
  };
}
