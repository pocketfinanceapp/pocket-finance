"use client";

import { Check } from "lucide-react";
import { MarketFlag } from "@/components/MarketFlag";
import { useApp } from "@/context/AppContext";
import {
  APP_CURRENCIES,
  APP_REGIONS,
  currencyForRegion,
  getAppRegion,
  type AppCurrency,
  type AppRegionId,
} from "@/lib/regionPreferences";

export function RegionCurrencyEditor() {
  const {
    preferredRegion,
    preferredCurrency,
    setPreferredRegion,
    setPreferredCurrency,
  } = useApp();

  const handleRegion = (region: AppRegionId) => {
    setPreferredRegion(region);
  };

  const handleCurrency = (
    currency: AppCurrency,
    options?: { manual?: boolean }
  ) => {
    setPreferredCurrency(currency, options);
  };

  const regionDefaultCurrency = currencyForRegion(preferredRegion);
  const currencyMatchesRegion = preferredCurrency === regionDefaultCurrency;

  return (
    <div className="space-y-7">
      <section>
        <h3 className="text-[13px] font-semibold text-pocket-text">Region</h3>
        <p className="mt-1 text-[12px] leading-relaxed text-pocket-muted">
          Softly prioritises local news and markets. Global headlines stay
          available.
        </p>
        <div className="mt-3 space-y-1.5">
          {APP_REGIONS.map((item) => {
            const active = preferredRegion === item.id;
            return (
              <button
                key={item.id}
                type="button"
                data-no-drag
                onClick={() => handleRegion(item.id)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors active:bg-white/[0.04]"
                style={{
                  background: active ? "rgba(0,198,198,0.08)" : undefined,
                  border: active
                    ? "1px solid rgba(0,198,198,0.45)"
                    : "1px solid transparent",
                }}
              >
                <MarketFlag
                  countryCode={item.countryCode}
                  size={24}
                  rounded="md"
                />
                <span className="min-w-0 flex-1 text-[14px] font-medium text-pocket-text">
                  {item.label}
                </span>
                {active && (
                  <Check className="h-4 w-4 shrink-0 text-[#00C6C6]" strokeWidth={2.75} />
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="text-[13px] font-semibold text-pocket-text">Currency</h3>
        <p className="mt-1 text-[12px] leading-relaxed text-pocket-muted">
          Auto-set from region ({getAppRegion(preferredRegion).label} →{" "}
          {regionDefaultCurrency}). Prices convert approximately for display.
        </p>
        {!currencyMatchesRegion && (
          <button
            type="button"
            data-no-drag
            onClick={() =>
              handleCurrency(regionDefaultCurrency, { manual: false })
            }
            className="mt-2 text-[12px] font-semibold text-pocket-teal active:opacity-70"
          >
            Reset to {regionDefaultCurrency}
          </button>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {APP_CURRENCIES.map((code) => {
            const active = preferredCurrency === code;
            return (
              <button
                key={code}
                type="button"
                data-no-drag
                onClick={() => handleCurrency(code)}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                  active
                    ? "bg-[#00C6C6] text-black"
                    : "bg-[var(--pocket-surface-hover)] text-pocket-muted"
                }`}
              >
                {code}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
