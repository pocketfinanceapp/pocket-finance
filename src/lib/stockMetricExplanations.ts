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
    "Mkt. cap": {
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
    "P/E ratio": {
      displayName: "P/E Ratio",
      explanation:
        "P/E stands for Price to Earnings ratio. It shows how much investors are willing to pay for each dollar of profit the company makes. A higher P/E means investors expect strong future growth.",
    },
    "EPS (TTM)": {
      displayName: "EPS TTM",
      explanation:
        "EPS stands for Earnings Per Share. It tells you how much profit the company made per share of stock over the last 12 months. Higher EPS generally means the company is more profitable.",
    },
    EPS: {
      displayName: "EPS",
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
    Dividend: {
      displayName: "Dividend Yield",
      explanation:
        "Dividend Yield shows how much a company pays out to shareholders each year as a percentage of its share price. A 2% yield means for every $100 of shares you own, you receive $2 per year in dividends.",
    },
    "Quarterly dividend": {
      displayName: "Quarterly Dividend",
      explanation:
        "Quarterly Dividend is an estimate of the cash paid to shareholders each quarter based on the current annual dividend yield. Actual payouts can change with company policy and earnings.",
    },
    "Ex-dividend date": {
      displayName: "Ex-Dividend Date",
      explanation:
        "The Ex-Dividend Date is the cutoff when you must own the stock to receive the next dividend. If you buy on or after this date, you typically miss that upcoming payment.",
    },
    Open: {
      displayName: "Open",
      explanation:
        "Open is the first traded price when the market session started. Comparing open to the current price shows how the stock has moved so far today.",
    },
    High: {
      displayName: "High",
      explanation:
        "High is the highest price reached during today's trading session. It shows the peak buyers were willing to pay so far today.",
    },
    Low: {
      displayName: "Low",
      explanation:
        "Low is the lowest price reached during today's trading session. It shows how far the stock dipped during the day.",
    },
    Volume: {
      displayName: "Volume",
      explanation:
        "Volume is the number of shares traded so far today. Higher volume usually means more investor interest and better liquidity.",
    },
    "Avg. vol.": {
      displayName: "Average Volume",
      explanation:
        "Average Volume is a typical daily share count over a recent period. Comparing today's volume to average volume helps spot unusually busy trading days.",
    },
    "52-wk high": {
      displayName: "52-Week High",
      explanation:
        "The 52-Week High is the highest price over the past year. Trading near this level can signal strong momentum, while large gaps below it may suggest a pullback from recent strength.",
    },
    "52-wk low": {
      displayName: "52-Week Low",
      explanation:
        "The 52-Week Low is the lowest price over the past year. It helps investors gauge how far the stock has recovered or how close it is to recent lows.",
    },
    Beta: {
      displayName: "Beta",
      explanation:
        "Beta measures how much a stock typically moves relative to the broader market. A beta above 1 usually means more volatility than the market; below 1 usually means less.",
    },
    "Shares outstanding": {
      displayName: "Shares Outstanding",
      explanation:
        "Shares Outstanding is the total number of shares currently held by all shareholders. Market cap is essentially share price multiplied by shares outstanding.",
    },
    "No. of employees": {
      displayName: "Employees",
      explanation:
        "Number of Employees is the company's reported workforce size. It helps put revenue and profitability into context against how large the organization is.",
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
    "Total Supply": {
      displayName: "Total Supply",
      explanation:
        "Total Supply is the number of coins already created, including those locked, reserved, or not yet circulating. Comparing it with circulating supply shows how much supply could enter the market later.",
    },
    FDV: {
      displayName: "Fully Diluted Valuation",
      explanation:
        "FDV (Fully Diluted Valuation) estimates market value if the total supply were circulating at today's price. It's useful for comparing projects with different unlock schedules.",
    },
    "All-Time High": {
      displayName: "All-Time High",
      explanation:
        "All-Time High is the highest price this asset has ever reached. It helps show how current price compares with peak historical enthusiasm.",
    },
    "All-Time Low": {
      displayName: "All-Time Low",
      explanation:
        "All-Time Low is the lowest price this asset has ever reached. It provides context for long-term drawdowns and recovery since the trough.",
    },
  };

export function getStockMetricExplanation(
  key: string
): StockMetricExplanation | null {
  return STOCK_METRIC_EXPLANATIONS[key] ?? null;
}
