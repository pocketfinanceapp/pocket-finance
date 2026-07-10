"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Globe } from "lucide-react";
import { getCompanyLogoUrl } from "@/lib/companyLogos";

function logoLabel(ticker: string): string {
  const upper = ticker.toUpperCase();
  if (upper === "SPX") return "SP";
  if (upper === "MARKET") return "";
  return upper.slice(0, 2);
}

export function CompanyLogo({
  ticker,
  color,
  size = 28,
  shape = "square",
}: {
  ticker: string;
  color: string;
  size?: number;
  shape?: "square" | "circle";
}) {
  const upper = ticker.toUpperCase();
  const showGlobe = upper === "MARKET";
  const label = logoLabel(upper);
  const logoUrl = getCompanyLogoUrl(upper);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [upper]);

  const radius = shape === "circle" ? "rounded-full" : "rounded-xl";
  const showImage = logoUrl && !imageFailed && !showGlobe;

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden text-xs font-bold text-white ${radius}`}
      style={{
        width: size,
        height: size,
        backgroundColor: showImage ? "#ffffff" : color,
        fontSize: size * 0.32,
      }}
    >
      {showGlobe ? (
        <Globe
          className="text-white"
          style={{ width: size * 0.5, height: size * 0.5 }}
          strokeWidth={2.25}
        />
      ) : showImage ? (
        <Image
          src={logoUrl}
          alt={`${upper} logo`}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          style={{ transform: "scale(1.14)" }}
          unoptimized
          onError={() => setImageFailed(true)}
        />
      ) : (
        label
      )}
    </div>
  );
}
