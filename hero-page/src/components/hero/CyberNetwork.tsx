import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { NETWORK_NODES, NETWORK_EDGES, SCENARIOS } from './scenariosData';
import { AttackPath } from './AttackPath';
import { AttackScenarioId, SimulationPhase } from './types';

interface CyberNetworkProps {
  activeScenarioId?: AttackScenarioId;
  simulationPhase?: SimulationPhase;
  simulationProgress?: number;
  onNodeClick?: (nodeId: string) => void;
}

interface NetworkNodeObjectProps {
  node: typeof NETWORK_NODES[0];
  isAttacker: boolean;
  isTarget: boolean;
  isSiem: boolean;
  isOpenSearch: boolean;
  isAnalyst: boolean;
  phase: SimulationPhase;
  onClick?: () => void;
}

const NetworkNodeObject: React.FC<NetworkNodeObjectProps> = ({
  node,
  isAttacker,
  isTarget,
  isSiem,
  isOpenSearch,
  isAnalyst,
  phase,
  onClick,
}) => {
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);

  // Compute active highlight states based on simulation phase
  const isHighActive = useMemo(() => {
    if (isAttacker && (phase === 'firing' || phase === 'packet_in_transit')) return true;
    if (isTarget && (phase === 'packet_in_transit' || phase === 'endpoint_hit')) return true;
    if (isSiem && (phase === 'siem_ingesting' || phase === 'rule_evaluated' || phase === 'alert_generated')) return true;
    if (isOpenSearch && (phase === 'rule_evaluated' || phase === 'alert_generated')) return true;
    if (isAnalyst && phase === 'alert_generated') return true;
    return false;
  }, [isAttacker, isTarget, isSiem, isOpenSearch, isAnalyst, phase]);

  const baseColor = useMemo(() => new THREE.Color(node.accentColor), [node.accentColor]);

  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * (isHighActive ? 2.5 : 0.6);
      ringRef.current.rotation.x += delta * 0.3;
    }
    if (outerRingRef.current) {
      outerRingRef.current.rotation.y += delta * (isHighActive ? -1.8 : -0.4);
    }
    if (coreRef.current) {
      const scale = isHighActive
        ? 1.0 + Math.sin(state.clock.elapsedTime * 8) * 0.18
        : 1.0 + Math.sin(state.clock.elapsedTime * 2 + node.position[0]) * 0.06;
      coreRef.current.scale.set(scale, scale, scale);
    }
  });

  const nodeRadius = isSiem ? 0.32 : isTarget || isAttacker ? 0.24 : 0.18;

  return (
    <group position={node.position} onClick={onClick}>
      {/* 1. Core Sphere */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[nodeRadius, 16, 16]} />
        <meshStandardMaterial
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={isHighActive ? 2.8 : 1.2}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* 2. Outer Orbital Ring 1 */}
      <mesh ref={ringRef}>
        <ringGeometry args={[nodeRadius * 1.45, nodeRadius * 1.58, 24]} />
        <meshBasicMaterial
          color={baseColor}
          side={THREE.DoubleSide}
          transparent
          opacity={isHighActive ? 0.95 : 0.55}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 3. Secondary Perpendicular Ring for central SIEM / Core nodes */}
      {(isSiem || isTarget || isAttacker) && (
        <mesh ref={outerRingRef}>
          <ringGeometry args={[nodeRadius * 1.85, nodeRadius * 1.95, 24]} />
          <meshBasicMaterial
            color={baseColor}
            side={THREE.DoubleSide}
            transparent
            opacity={isHighActive ? 0.8 : 0.35}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* 4. HTML Floating Label Tag */}
      <Html
        position={[0, nodeRadius + 0.35, 0]}
        center
        distanceFactor={11}
        className="pointer-events-none select-none"
      >
        <div
          className={`px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap border transition-all duration-300 backdrop-blur-md ${
            isHighActive
              ? 'bg-black/90 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,242,254,0.6)] scale-110'
              : 'bg-black/60 border-slate-700/60 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: node.accentColor }}
            />
            <span>{node.name}</span>
          </div>
          <div className="text-[8px] text-slate-400 tracking-tight">{node.ip}</div>
        </div>
      </Html>
    </group>
  );
};

export const CyberNetwork: React.FC<CyberNetworkProps> = ({
  activeScenarioId = 'powershell',
  simulationPhase = 'idle',
  simulationProgress = 0,
  onNodeClick,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const scenario = SCENARIOS[activeScenarioId] || SCENARIOS.powershell;

  // Find target node ID from scenario
  const targetNodeId = scenario.targetNode;

  // Gentle group floating tilt
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.12) * 0.05;
      groupRef.current.rotation.x = Math.sin(clock.elapsedTime * 0.08) * 0.03;
    }
  });

  // Lookup node position by ID
  const nodePositionMap = useMemo(() => {
    const map = new Map<string, [number, number, number]>();
    NETWORK_NODES.forEach((n) => map.set(n.id, n.position));
    return map;
  }, []);

  return (
    <group ref={groupRef} position={[0, -0.3, 0]}>
      {/* 1. Render all network edges & active attack vectors */}
      {NETWORK_EDGES.map((edge) => {
        const startPos = nodePositionMap.get(edge.source) || [0, 0, 0];
        const endPos = nodePositionMap.get(edge.target) || [0, 0, 0];

        const isAttackEdge =
          edge.source === 'node-attacker' && edge.target === targetNodeId;
        const isTelemetryEdge =
          edge.source === targetNodeId && edge.target === 'node-siem';
        const isIndexEdge =
          edge.source === 'node-siem' && edge.target === 'node-opensearch';

        let pulseActive = false;
        let pulseProg = 0;
        let pColor = '#00f2fe';

        if (isAttackEdge && (simulationPhase === 'firing' || simulationPhase === 'packet_in_transit')) {
          pulseActive = true;
          pulseProg = (simulationProgress - 15) / 25; // 0 to 1
          pColor = '#f43f5e';
        } else if (isTelemetryEdge && (simulationPhase === 'endpoint_hit' || simulationPhase === 'siem_ingesting')) {
          pulseActive = true;
          pulseProg = (simulationProgress - 60) / 25;
          pColor = '#00f2fe';
        } else if (isIndexEdge && (simulationPhase === 'rule_evaluated' || simulationPhase === 'alert_generated')) {
          pulseActive = true;
          pulseProg = (simulationProgress - 80) / 20;
          pColor = '#a855f7';
        }

        return (
          <AttackPath
            key={edge.id}
            edge={edge}
            startPos={startPos}
            endPos={endPos}
            isSimulating={simulationPhase !== 'idle'}
            pulseActive={pulseActive}
            pulseProgress={pulseProg}
            pulseColor={pColor}
          />
        );
      })}

      {/* 2. Render all 3D topology nodes */}
      {NETWORK_NODES.map((node) => {
        const isAttacker = node.id === 'node-attacker';
        const isTarget = node.id === targetNodeId;
        const isSiem = node.id === 'node-siem';
        const isOpenSearch = node.id === 'node-opensearch';
        const isAnalyst = node.id === 'node-analyst';

        return (
          <NetworkNodeObject
            key={node.id}
            node={node}
            isAttacker={isAttacker}
            isTarget={isTarget}
            isSiem={isSiem}
            isOpenSearch={isOpenSearch}
            isAnalyst={isAnalyst}
            phase={simulationPhase}
            onClick={() => onNodeClick && onNodeClick(node.id)}
          />
        );
      })}
    </group>
  );
};
