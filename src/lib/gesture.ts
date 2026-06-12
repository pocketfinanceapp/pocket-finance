/** Skip gesture capture for taps on controls */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!target) return false;
  const el =
    target instanceof Element
      ? target
      : target instanceof Text
        ? target.parentElement
        : null;
  if (!el) return false;
  return !!el.closest(
    "button, a, input, textarea, select, label, [data-no-drag], [data-interactive]"
  );
}
