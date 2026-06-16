export interface StockMetricExplanation {
  displayName: string;
  explanation: string;
}

export const STOCK_METRIC_EXPLANATIONS: Record<string, StockMetricExplanation> =
  {
    "Market Cap": {
      displayName: "Market Cap",
      explanation:
        "Market Cap is the total value of a company based on its current share price. It's calculated by multiplying the share price by the total number of shares. A larger market cap generally means a bigger, more established company.",
    },
    "Revenue (TTM)": {
      displayName: "Revenue TTM",
      explanation:
        "Revenue is the total amount of money a company brought in from sales over the last 12 months. TTM stands for Trailing Twelve Months. It shows how much the business is actually earning before any costs are taken out.",
    },
    "P/E Ratio": {
      displayName: "P/E Ratio",
      explanation:
        "P/E stands for Price to Earnings ratio. It shows how much investors are willing to pay for each dollar of profit the company makes. A higher P/E means investors expect strong future growth.",
    },
    "EPS (TTM)": {
      displayName: "EPS TTM",
      explanation:
        "EPS stands for Earnings Per Share. It tells you how much profit the company made per share of stock over the last 12 months. Higher EPS generally means the company is more profitable.",
    },
    EBITDA: {
      displayName: "EBITDA",
      explanation:
        "EBITDA measures a company's core profitability before accounting for interest, taxes, and accounting adjustments. It's used to compare how efficiently different companies generate profit from their operations.",
    },
    "Dividend Yield": {
      displayName: "Dividend Yield",
      explanation:
        "Dividend Yield shows how much a company pays out to shareholders each year as a percentage of its share price. A 2% yield means for every $100 of shares you own, you receive $2 per year in dividends.",
    },
    "24h Volume": {
      displayName: "24h Volume",
      explanation:
        "24h Volume is the total value of this asset traded across exchanges in the last 24 hours. Higher volume usually means more liquidity and stronger market interest.",
    },
    "Circulating Supply": {
      displayName: "Circulating Supply",
      explanation:
        "Circulating Supply is the number of coins or tokens currently available and actively trading in the market. It helps investors gauge scarcity and potential inflation from new issuance.",
    },
  };
