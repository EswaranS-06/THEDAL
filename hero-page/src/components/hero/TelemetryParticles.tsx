import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface TelemetryParticlesProps {
  count?: number;
  speed?: number;
}

export const TelemetryParticles: React.FC<TelemetryParticlesProps> = ({
  count = 280,
  speed = 0.25,
}) => {
  const pointsRef = useRef<THREE.Points>(null);

  // Generate random positions in a 3D cylindrical field around the hero
  const [positions, colors, scales] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sca = new Float32Array(count);

    const cyanColor = new THREE.Color('#00f2fe');
    const blueColor = new THREE.Color('#38bdf8');
    const violetColor = new THREE.Color('#a855f7');
    const emeraldColor = new THREE.Color('#10b981');

    for (let i = 0; i < count; i++) {
      // Cylindrical/spherical distribution
      const radius = 3.5 + Math.random() * 8.0;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 8.0;

      pos[i * 3] = Math.cos(theta) * radius;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = Math.sin(theta) * radius - 2.0;

      // Color distribution (mostly cyan/blue, some violet and emerald)
      const rand = Math.random();
      let chosenColor = cyanColor;
      if (rand < 0.45) chosenColor = cyanColor;
      else if (rand < 0.75) chosenColor = blueColor;
      else if (rand < 0.92) chosenColor = violetColor;
      else chosenColor = emeraldColor;

      col[i * 3] = chosenColor.r;
      col[i * 3 + 1] = chosenColor.g;
      col[i * 3 + 2] = chosenColor.b;

      sca[i] = Math.random() * 1.8 + 0.6;
    }

    return [pos, col, sca];
  }, [count]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += delta * 0.035 * speed;
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.04;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.055}
        vertexColors
        transparent
        opacity={0.65}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};
