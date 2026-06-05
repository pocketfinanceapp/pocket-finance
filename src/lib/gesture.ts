/** Skip gesture capture for taps on controls */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return !!target.closest(
    "button, a, input, textarea, select, label, [data-no-drag], [data-interactive]"
  );
}
