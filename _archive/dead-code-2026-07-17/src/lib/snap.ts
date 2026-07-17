/** Velocity-first snap — fast flicks commit immediately (TikTok / Reels feel) */
const VELOCITY_COMMIT = 0.12; // px/ms — low threshold
const DISTANCE_COMMIT = 0.1; // only 10% of page needed without velocity

export function resolveSnapIndex(
  offsetPx: number,
  itemSize: number,
  velocity: number,
  maxIndex: number
): number {
  const raw = -offsetPx / itemSize;
  const base = Math.round(raw);

  // Velocity dominates distance
  if (velocity < -VELOCITY_COMMIT) {
    return Math.max(0, Math.min(maxIndex, Math.ceil(raw - 0.05)));
  }
  if (velocity > VELOCITY_COMMIT) {
    return Math.max(0, Math.min(maxIndex, Math.floor(raw + 0.05)));
  }

  const frac = raw - Math.floor(raw);
  if (frac > 1 - DISTANCE_COMMIT) {
    return Math.max(0, Math.min(maxIndex, Math.ceil(raw)));
  }
  if (frac < DISTANCE_COMMIT) {
    return Math.max(0, Math.min(maxIndex, Math.floor(raw)));
  }

  return Math.max(0, Math.min(maxIndex, base));
}
