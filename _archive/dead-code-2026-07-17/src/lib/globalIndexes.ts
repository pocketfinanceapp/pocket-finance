export type GlobalIndexRegion = "us" | "europe" | "apac";

export interface GlobalIndex {
  id: string;
  name: string;
  fullName: string;
  value: number;
  changePercent: number;
}

export const GLOBAL_INDEX_REGIONS: {
  id: GlobalIndexRegion;
  label: string;
}[] = [
  { id: "us", label: "US" },
  { id: "europe", label: "Europe" },
  { id: "apac", label: "Asia-Pacific" },
];

export const GLOBAL_INDEXES: Record<GlobalIndexRegion, GlobalIndex[]> = {
  us: [
    {
      id: "djia",
      name: "DJIA",
      fullName: "Dow Jones Industrial Average",
      value: 42618.5,
      changePercent: 0.32,
    },
    {
      id: "nasdaq",
      name: "NASDAQ",
      fullName: "Nasdaq Composite",
      value: 18924.77,
      changePercent: 0.56,
    },
    {
      id: "sp500",
      name: "S&P 500",
      fullName: "S&P 500 Index",
      value: 5930.85,
      changePercent: 0.48,
    },
    {
      id: "russell2k",
      name: "Russell 2K",
      fullName: "Russell 2000 Index",
      value: 2198.34,
      changePercent: -0.12,
    },
    {
      id: "vix",
      name: "VIX",
      fullName: "CBOE Volatility Index",
      value: 18.24,
      changePercent: -2.1,
    },
  ],
  europe: [
    {
      id: "ftse100",
      name: "FTSE 100",
      fullName: "FTSE 100 Index",
      value: 8412.33,
      changePercent: -0.12,
    },
    {
      id: "dax",
      name: "DAX",
      fullName: "DAX Performance Index",
      value: 22456.3,
      changePercent: 0.41,
    },
    {
      id: "cac40",
      name: "CAC 40",
      fullName: "CAC 40 Index",
      value: 7834.15,
      changePercent: -0.18,
    },
    {
      id: "stoxx600",
      name: "STOXX 600",
      fullName: "STOXX Europe 600",
      value: 538.22,
      changePercent: 0.15,
    },
    {
      id: "smi",
      name: "SMI",
      fullName: "Swiss Market Index",
      value: 12198.6,
      changePercent: 0.09,
    },
  ],
  apac: [
    {
      id: "nikkei225",
      name: "Nikkei 225",
      fullName: "Nikkei Stock Average",
      value: 39872.5,
      changePercent: 0.31,
    },
    {
      id: "asx200",
      name: "ASX 200",
      fullName: "S&P/ASX 200",
      value: 8234.12,
      changePercent: 0.42,
    },
    {
      id: "hsi",
      name: "HSI",
      fullName: "Hang Seng Index",
      value: 17892.44,
      changePercent: -0.28,
    },
    {
      id: "shanghai",
      name: "Shanghai",
      fullName: "Shanghai Composite",
      value: 3124.86,
      changePercent: -0.44,
    },
    {
      id: "kospi",
      name: "KOSPI",
      fullName: "Korea Composite Stock Price Index",
      value: 2748.92,
      changePercent: 0.27,
    },
  ],
};
