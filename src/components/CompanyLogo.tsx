"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  // Seeding these from the sessionStorage-backed cache here caused a
  // hydration mismatch (React error #418): the server always renders with
  // an empty cache, but once the cache is warm on a repeat visit, the
  // client's *first* render (before hydration even finishes) would already
  // see a populated cache and render an <img> where the server rendered the
  // ticker-letter fallback. Always start from the SSR-safe default and let
  // the mount effect below apply the cached value immediately after.
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [imageReady, setImageReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // useLayoutEffect (client-only, runs after hydration) rather than
  // useEffect so a warm cache is applied before the browser paints — avoids
  // a visible flash of the fallback letter without reintroducing the
  // hydration mismatch the initial state above used to cause.
  useLayoutEffect(() => {
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
        backgroundColor: color,
        fontSize: size * 0.32,
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
              style={{ opacity: imageReady ? 1 : 0 }}
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
