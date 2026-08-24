import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { NetworkEdgeDef } from './types';

interface AttackPathProps {
  edge: NetworkEdgeDef;
  startPos: [number, number, number];
  endPos: [number, number, number];
  isSimulating?: boolean;
  pulseActive?: boolean;
  pulseProgress?: number;
  pulseColor?: string;
}

export const AttackPath: React.FC<AttackPathProps> = ({
  edge,
  startPos,
  endPos,
  isSimulating = false,
  pulseActive = false,
  pulseProgress = 0,
  pulseColor,
}) => {
  const packetRef = useRef<THREE.Mesh>(null);
  const baselinePacketRef = useRef<THREE.Mesh>(null);

  const startVec = useMemo(() => new THREE.Vector3(...startPos), [startPos]);
  const endVec = useMemo(() => new THREE.Vector3(...endPos), [endPos]);

  // Generate slightly curved arc for high visual cyber appeal
  const { linePoints, curve } = useMemo(() => {
    const mid = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5);
    // Subtle offset towards camera/upward for arc
    mid.z += 0.25;
    mid.y += 0.15;

    const quadCurve = new THREE.QuadraticBezierCurve3(startVec, mid, endVec);
    const pts = quadCurve.getPoints(24);
    return { linePoints: pts, curve: quadCurve };
  }, [startVec, endVec]);

  const lineGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(linePoints);
    return geometry;
  }, [linePoints]);

  const baseLineColor = useMemo(() => {
    if (edge.type === 'attack') return new THREE.Color('#f43f5e');
    if (edge.type === 'index') return new THREE.Color('#a855f7');
    if (edge.type === 'analyst') return new THREE.Color('#38bdf8');
    return new THREE.Color('#00f2fe');
  }, [edge.type]);

  // Animate ambient baseline telemetry pulses continuously
  useFrame(({ clock }) => {
    if (baselinePacketRef.current) {
      const t = (clock.elapsedTime * 0.4 + (startPos[0] * 0.2)) % 1;
      const pt = curve.getPoint(t);
      baselinePacketRef.current.position.copy(pt);
    }

    if (packetRef.current && pulseActive) {
      const pt = curve.getPoint(Math.max(0, Math.min(1, pulseProgress)));
      packetRef.current.position.copy(pt);
    }
  });

  return (
    <group>
      {/* 1. Underlying Connection Line */}
      {/* @ts-ignore */}
      <line geometry={lineGeometry}>
        <lineBasicMaterial
          color={baseLineColor}
          transparent
          opacity={edge.dashed ? 0.25 : 0.4}
          blending={THREE.AdditiveBlending}
          linewidth={1}
        />
      </line>

      {/* 2. Ambient Continuous Packet Pulse */}
      <mesh ref={baselinePacketRef}>
        <sphereGeometry args={[0.032, 8, 8]} />
        <meshBasicMaterial
          color={baseLineColor}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 3. High-Intensity Simulation Exploit / Telemetry Packet */}
      {pulseActive && (
        <mesh ref={packetRef}>
          <sphereGeometry args={[0.075, 12, 12]} />
          <meshBasicMaterial
            color={pulseColor ? new THREE.Color(pulseColor) : baseLineColor}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
    </group>
  );
};
