"use client";

interface MetricInfoButtonProps {
  label: string;
  onClick: () => void;
  /** Slightly smaller for tight rows like performance pills */
  size?: "sm" | "md";
}

export function MetricInfoButton({
  label,
  onClick,
  size = "md",
}: MetricInfoButtonProps) {
  const dim = size === "sm" ? "h-3.5 w-3.5 text-[9px]" : "h-4 w-4 text-[10px]";

  return (
    <button
      type="button"
      data-no-drag
      data-interactive
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-[#00C6C6]/35 bg-[#00C6C6]/12 font-semibold leading-none text-[#7EEAEA]/95 ${dim}`}
      aria-label={`What is ${label}?`}
      style={{ touchAction: "manipulation" }}
    >
      i
    </button>
  );
}
