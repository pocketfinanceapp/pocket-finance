"use client";

import { useEffect, useRef, useState } from "react";
import { Globe } from "lucide-react";
import {
  getCachedLogoUrl,
  isLogoExhausted,
  resolveCompanyLogo,
} from "@/lib/logoCache";

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
  const [logoUrl, setLogoUrl] = useState<string | null>(() =>
    getCachedLogoUrl(upper)
  );
  const [imageReady, setImageReady] = useState(false);
  const [failed, setFailed] = useState(() => isLogoExhausted(upper));
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    let cancelled = false;

    const cached = getCachedLogoUrl(upper);
    if (cached) {
      setLogoUrl(cached);
      setFailed(false);
      setImageReady(false);
      return;
    }

    setLogoUrl(null);
    setImageReady(false);
    setFailed(isLogoExhausted(upper));

    if (showGlobe || isLogoExhausted(upper)) return;

    void resolveCompanyLogo(upper).then((url) => {
      if (cancelled) return;
      if (url) {
        setLogoUrl(url);
        setFailed(false);
      } else {
        setFailed(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [upper, showGlobe]);

  useEffect(() => {
    if (!logoUrl || !imgRef.current) return;
    if (imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setImageReady(true);
    }
  }, [logoUrl]);

  const radius = shape === "circle" ? "rounded-full" : "rounded-xl";
  const showImage = Boolean(logoUrl) && !failed && !showGlobe;

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden text-xs font-bold text-white ${radius}`}
      style={{
        width: size,
        height: size,
        backgroundColor: showImage && imageReady ? "#ffffff" : color,
        fontSize: size * 0.32,
        transition: "background-color 180ms ease",
      }}
    >
      {showGlobe ? (
        <Globe
          className="text-white"
          style={{ width: size * 0.5, height: size * 0.5 }}
          strokeWidth={2.25}
        />
      ) : (
        <>
          {!imageReady && <span className="relative z-[1]">{label}</span>}
          {showImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={imgRef}
              src={logoUrl!}
              alt={`${upper} logo`}
              width={size}
              height={size}
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ease-out"
              style={{
                opacity: imageReady ? 1 : 0,
                transform: "scale(1.14)",
              }}
              onLoad={() => setImageReady(true)}
              onError={() => {
                setImageReady(false);
                setFailed(true);
                setLogoUrl(null);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
