export interface SpringConfig {
  stiffness?: number;
  damping?: number;
  mass?: number;
}

export const SPRING_SNAP: Required<SpringConfig> = {
  stiffness: 920,
  damping: 36,
  mass: 0.58,
};

const DEFAULT = SPRING_SNAP;

export function animateSpring(
  from: number,
  to: number,
  onUpdate: (value: number) => void,
  onComplete?: () => void,
  config: SpringConfig = {}
): () => void {
  const { stiffness, damping, mass } = { ...DEFAULT, ...config };
  let value = from;
  let velocity = 0;
  let raf = 0;
  let last = performance.now();

  const step = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.028);
    last = now;

    const displacement = value - to;
    const springForce = -stiffness * displacement;
    const dampForce = -damping * velocity;
    const acceleration = (springForce + dampForce) / mass;

    velocity += acceleration * dt;
    value += velocity * dt;

    if (Math.abs(displacement) < 0.25 && Math.abs(velocity) < 0.25) {
      onUpdate(to);
      onComplete?.();
      return;
    }

    onUpdate(value);
    raf = requestAnimationFrame(step);
  };

  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}
