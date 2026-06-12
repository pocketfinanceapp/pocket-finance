"use client";

import { useState } from "react";
import {
  parseTextWithTerms,
  type FinancialTerm,
} from "@/lib/financialTerms";
import { FinancialTermPopup } from "./FinancialTermPopup";

interface FinancialTermTextProps {
  text: string;
}

export function FinancialTermText({ text }: FinancialTermTextProps) {
  const [activeTerm, setActiveTerm] = useState<FinancialTerm | null>(null);
  const segments = parseTextWithTerms(text);

  return (
    <>
      {segments.map((segment, index) =>
        segment.term ? (
          <button
            key={`${index}-${segment.text}`}
            type="button"
            data-no-drag
            onClick={() => setActiveTerm(segment.term!)}
            className="inline cursor-pointer border-0 bg-transparent p-0 font-normal text-inherit underline decoration-[#00C6C6] decoration-1 underline-offset-[3px]"
            style={{ touchAction: "manipulation" }}
          >
            {segment.text}
          </button>
        ) : (
          <span key={`${index}-${segment.text}`}>{segment.text}</span>
        )
      )}
      <FinancialTermPopup term={activeTerm} onClose={() => setActiveTerm(null)} />
    </>
  );
}
