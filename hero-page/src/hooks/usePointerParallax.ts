import { useEffect, useState, useRef } from 'react';

interface PointerParallaxState {
  x: number; // Normalized -1 to 1 (damped)
  y: number; // Normalized -1 to 1 (damped)
  rawX: number; // Normalized -1 to 1 (immediate)
  rawY: number; // Normalized -1 to 1 (immediate)
  isHovered: boolean;
}

export const usePointerParallax = (damping: number = 0.05): PointerParallaxState => {
  const [state, setState] = useState<PointerParallaxState>({
    x: 0,
    y: 0,
    rawX: 0,
    rawY: 0,
    isHovered: false,
  });

  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const isHoveredRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMouseMove = (e: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const rawX = (e.clientX - centerX) / centerX;
      const rawY = (e.clientY - centerY) / centerY;

      targetRef.current = {
        x: Math.max(-1, Math.min(1, rawX)),
        y: Math.max(-1, Math.min(1, rawY)),
      };
      isHoveredRef.current = true;
    };

    const handleMouseLeave = () => {
      targetRef.current = { x: 0, y: 0 };
      isHoveredRef.current = false;
    };

    const updateLoop = () => {
      // Linear interpolation (lerp) for smooth inertia
      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * damping;
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * damping;

      setState({
        x: currentRef.current.x,
        y: currentRef.current.y,
        rawX: targetRef.current.x,
        rawY: targetRef.current.y,
        isHovered: isHoveredRef.current,
      });

      animationFrameRef.current = requestAnimationFrame(updateLoop);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    animationFrameRef.current = requestAnimationFrame(updateLoop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [damping]);

  return state;
};
