import { useState, useEffect, useCallback, useRef } from 'react';
import { AttackScenarioId, SimulationPhase, SimulationState } from '../components/hero/types';
import { SCENARIOS } from '../components/hero/scenariosData';

export const useTelemetrySimulation = () => {
  const [selectedScenario, setSelectedScenario] = useState<AttackScenarioId>('powershell');
  const [phase, setPhase] = useState<SimulationPhase>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [eventsPerSec, setEventsPerSec] = useState<number>(18);
  const [epsHistory, setEpsHistory] = useState<number[]>([14, 16, 15, 18, 17, 19, 15, 18, 16, 17, 18, 15]);
  const [totalAlerts, setTotalAlerts] = useState<number>(421);
  const [lastTriggerTime, setLastTriggerTime] = useState<number | null>(null);

  const scenario = SCENARIOS[selectedScenario] || SCENARIOS.powershell;
  const timerRef = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimers = () => {
    timerRef.current.forEach((t) => clearTimeout(t));
    timerRef.current = [];
  };

  // Baseline EPS jitter when idle
  useEffect(() => {
    const interval = setInterval(() => {
      if (phase === 'idle') {
        const jitter = Math.floor(Math.random() * 5) - 2;
        const currentBase = scenario.metrics.baseEps;
        const nextVal = Math.max(10, currentBase + jitter);
        setEventsPerSec(nextVal);
        setEpsHistory((prev) => [...prev.slice(1), nextVal]);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [phase, scenario.metrics.baseEps]);

  const triggerSimulation = useCallback(
    (scenarioId?: AttackScenarioId) => {
      const targetId = scenarioId || selectedScenario;
      if (scenarioId && scenarioId !== selectedScenario) {
        setSelectedScenario(scenarioId);
      }

      clearAllTimers();
      setLastTriggerTime(Date.now());
      setPhase('firing');
      setProgress(15);
      setEventsPerSec(45);

      const targetScenario = SCENARIOS[targetId];

      // Phase 1: Packet in transit from Attacker to Target (350ms)
      const t1 = setTimeout(() => {
        setPhase('packet_in_transit');
        setProgress(35);
        setEventsPerSec(82);
        setEpsHistory((prev) => [...prev.slice(1), 82]);
      }, 350);

      // Phase 2: Endpoint logs hit (750ms)
      const t2 = setTimeout(() => {
        setPhase('endpoint_hit');
        setProgress(60);
        setEventsPerSec(135);
        setEpsHistory((prev) => [...prev.slice(1), 135]);
      }, 750);

      // Phase 3: Telemetry packet sent to SIEM (1150ms)
      const t3 = setTimeout(() => {
        setPhase('siem_ingesting');
        setProgress(80);
        setEventsPerSec(targetScenario.metrics.peakEps);
        setEpsHistory((prev) => [...prev.slice(1), targetScenario.metrics.peakEps]);
      }, 1150);

      // Phase 4: Wazuh matches rule & indexes in OpenSearch (1550ms)
      const t4 = setTimeout(() => {
        setPhase('rule_evaluated');
        setProgress(95);
      }, 1550);

      // Phase 5: Detection alert confirmed (1850ms)
      const t5 = setTimeout(() => {
        setPhase('alert_generated');
        setProgress(100);
        setTotalAlerts((prev) => prev + 1);
        setEpsHistory((prev) => [...prev.slice(1), targetScenario.metrics.peakEps - 20]);
      }, 1850);

      // Reset to idle after 6 seconds
      const t6 = setTimeout(() => {
        setPhase('idle');
        setProgress(0);
      }, 6500);

      timerRef.current = [t1, t2, t3, t4, t5, t6];
    },
    [selectedScenario]
  );

  const selectScenario = useCallback(
    (id: AttackScenarioId) => {
      setSelectedScenario(id);
      if (phase !== 'idle') {
        clearAllTimers();
        setPhase('idle');
        setProgress(0);
      }
    },
    [phase]
  );

  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  return {
    scenario,
    selectedScenario,
    selectScenario,
    phase,
    progress,
    eventsPerSec,
    epsHistory,
    totalAlerts,
    isSimulating: phase !== 'idle',
    lastTriggerTime,
    triggerSimulation,
  };
};
