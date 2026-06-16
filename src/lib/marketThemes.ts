import { getStockProfile } from "./stockData";
import { getTickerMetaBySymbol } from "./tickerMap";
import type { Competitor } from "./types";

export interface MarketThemeConfig {
  title: string;
  subtitle: string;
  message: string;
  relatedTickers: string[];
}

const THEME_CONFIGS: Record<string, MarketThemeConfig> = {
  OIL: {
    title: "Energy",
    subtitle: "Market theme",
    message: "Live market data isn't available for this theme yet.",
    relatedTickers: ["XOM", "CVX", "COP"],
  },
  ENERGY: {
    title: "Energy",
    subtitle: "Market theme",
    message: "Live market data isn't available for this theme yet.",
    relatedTickers: ["XOM", "CVX", "COP"],
  },
  FED: {
    title: "Federal Reserve",
    subtitle: "Market theme",
    message: "Live market data isn't available for this theme yet.",
    relatedTickers: ["JPM", "BAC", "GS"],
  },
  RATES: {
    title: "Rates",
    subtitle: "Market theme",
    message: "Live market data isn't available for this theme yet.",
    relatedTickers: ["JPM", "BAC", "GS"],
  },
  GOLD: {
    title: "Gold",
    subtitle: "Market theme",
    message: "Live market data isn't available for this theme yet.",
    relatedTickers: ["NEM", "GOLD", "AEM"],
  },
  SPX: {
    title: "S&P 500",
    subtitle: "Market theme",
    message: "Live market data isn't available for this theme yet.",
    relatedTickers: ["SPY", "IVV", "VOO"],
  },
  QQQ: {
    title: "Nasdaq 100",
    subtitle: "Market theme",
    message: "Live market data isn't available for this theme yet.",
    relatedTickers: ["QQQ", "AAPL", "MSFT"],
  },
  DJI: {
    title: "Dow Jones",
    subtitle: "Market theme",
    message: "Live market data isn't available for this theme yet.",
    relatedTickers: ["DIA", "JPM", "UNH"],
  },
  MARKET: {
    title: "Broad Market",
    subtitle: "Market theme",
    message: "Live market data isn't available for this theme yet.",
    relatedTickers: ["SPY", "QQQ", "IWM"],
  },
};

export const MARKET_THEME_TICKERS = new Set(Object.keys(THEME_CONFIGS));

export function isMarketThemeTicker(ticker: string): boolean {
  return MARKET_THEME_TICKERS.has(ticker.toUpperCase());
}

export function getMarketThemeConfig(ticker: string): MarketThemeConfig {
  const upper = ticker.toUpperCase();
  const stored = THEME_CONFIGS[upper];
  if (stored) return stored;

  const meta = getTickerMetaBySymbol(upper);
  return {
    title: meta.companyName,
    subtitle: "Market theme",
    message: "Live market data isn't available for this theme yet.",
    relatedTickers: [],
  };
}

export function getRelatedAssetsFromTickers(tickers: string[]): Competitor[] {
  return tickers.map((symbol) => {
    const upper = symbol.toUpperCase();
    const profile = getStockProfile(upper);
    const meta = getTickerMetaBySymbol(upper);
    return {
      ticker: upper,
      name: profile.name,
      price: profile.price,
      changePercent: profile.changePercent,
      color: meta.logoColor,
    };
  });
}
