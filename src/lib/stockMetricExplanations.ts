export interface StockMetricExplanation {
  displayName: string;
  /** Plain-English “what is this?” */
  explanation: string;
  /** Optional formula shown as a monospace callout */
  formula?: string;
  /** Optional how to read the number */
  tip?: string;
  /** Optional typical ranges / rules of thumb */
  rangeGuide?: string;
}

function entry(
  displayName: string,
  explanation: string,
  extras?: Pick<StockMetricExplanation, "formula" | "tip" | "rangeGuide">
): StockMetricExplanation {
  return { displayName, explanation, ...extras };
}

export const STOCK_METRIC_EXPLANATIONS: Record<string, StockMetricExplanation> =
  {
    "Market Cap": entry(
      "Market Cap",
      "Market capitalization is the total market value of a company — what the market thinks the whole business is worth right now.",
      {
        formula: "Market Cap = Share Price × Shares Outstanding",
        tip: "Use it to compare company size, not whether a stock is “cheap.” A $3T company can still be expensive on earnings.",
        rangeGuide:
          "Rough sizes: Mega-cap $200B+, Large-cap $10B–$200B, Mid-cap $2B–$10B, Small-cap under $2B.",
      }
    ),
    "Mkt. cap": entry(
      "Market Cap",
      "Market capitalization is the total market value of a company — what the market thinks the whole business is worth right now.",
      {
        formula: "Market Cap = Share Price × Shares Outstanding",
        tip: "Use it to compare company size, not whether a stock is “cheap.” A $3T company can still be expensive on earnings.",
        rangeGuide:
          "Rough sizes: Mega-cap $200B+, Large-cap $10B–$200B, Mid-cap $2B–$10B, Small-cap under $2B.",
      }
    ),
    "Revenue (TTM)": entry(
      "Revenue (TTM)",
      "Revenue is total sales — money customers paid the company before costs. TTM means Trailing Twelve Months (the last year of reported results).",
      {
        formula: "Revenue = Sum of sales over the last 12 months",
        tip: "Rising revenue shows demand. Compare it with profit metrics (EPS, margins) to see if growth is turning into earnings.",
        rangeGuide:
          "Fast growers can have strong sales but low/negative profit while they invest to expand.",
      }
    ),
    "P/E Ratio": entry(
      "P/E Ratio",
      "Price-to-Earnings shows how many years of current earnings you’re effectively paying for at today’s share price. It’s a quick valuation check.",
      {
        formula: "P/E = Share Price ÷ Earnings Per Share (EPS)",
        tip: "A higher P/E often means investors expect faster future growth. A lower P/E can mean cheaper valuation — or worry about the business.",
        rangeGuide:
          "Many mature stocks land around 15–25. Growth tech often runs higher; compare within the same industry.",
      }
    ),
    "P/E ratio": entry(
      "P/E Ratio",
      "Price-to-Earnings shows how many years of current earnings you’re effectively paying for at today’s share price. It’s a quick valuation check.",
      {
        formula: "P/E = Share Price ÷ Earnings Per Share (EPS)",
        tip: "A higher P/E often means investors expect faster future growth. A lower P/E can mean cheaper valuation — or worry about the business.",
        rangeGuide:
          "Many mature stocks land around 15–25. Growth tech often runs higher; compare within the same industry.",
      }
    ),
    "EPS (TTM)": entry(
      "EPS (TTM)",
      "Earnings Per Share is profit divided across every share. TTM uses the last twelve months of earnings.",
      {
        formula: "EPS = Net Income ÷ Shares Outstanding",
        tip: "Rising EPS usually means the company is becoming more profitable per share. Dilution (more shares issued) can lower EPS even if profits grow.",
        rangeGuide:
          "Compare EPS to the share price via P/E, and watch whether EPS is trending up over time.",
      }
    ),
    EPS: entry(
      "EPS",
      "Earnings Per Share is profit divided across every share. It shows how much the company earns for each share you own.",
      {
        formula: "EPS = Net Income ÷ Shares Outstanding",
        tip: "Rising EPS usually means the company is becoming more profitable per share. Dilution (more shares issued) can lower EPS even if profits grow.",
      }
    ),
    EBITDA: entry(
      "EBITDA",
      "EBITDA is a picture of operating profit before interest, taxes, depreciation, and amortization. Investors use it to compare operating strength across companies.",
      {
        formula:
          "EBITDA ≈ Operating Income + Depreciation + Amortization\n(or Net Income + Interest + Taxes + D&A)",
        tip: "It’s useful for comparing core business performance, but it ignores real costs like interest and the need to replace assets.",
        rangeGuide:
          "Growing EBITDA with stable margins often signals a healthier operating engine.",
      }
    ),
    "Dividend Yield": entry(
      "Dividend Yield",
      "Dividend yield is the annual cash payout relative to the current share price — like an income rate from owning the stock.",
      {
        formula: "Dividend Yield = Annual Dividends Per Share ÷ Share Price",
        tip: "A 2% yield means about $2 per year for every $100 of stock (before taxes). Yield rises if the price falls, even if the dividend didn’t increase.",
        rangeGuide:
          "Many large US stocks yield 0–3%. Very high yields can signal risk that the payout may be cut.",
      }
    ),
    Dividend: entry(
      "Dividend Yield",
      "Dividend yield is the annual cash payout relative to the current share price — like an income rate from owning the stock.",
      {
        formula: "Dividend Yield = Annual Dividends Per Share ÷ Share Price",
        tip: "A 2% yield means about $2 per year for every $100 of stock (before taxes). Yield rises if the price falls, even if the dividend didn’t increase.",
        rangeGuide:
          "Many large US stocks yield 0–3%. Very high yields can signal risk that the payout may be cut.",
      }
    ),
    "Quarterly dividend": entry(
      "Quarterly Dividend",
      "Many companies pay shareholders every three months. This figure is an estimate of that quarterly cash amount based on the current annual yield.",
      {
        formula: "Quarterly Dividend ≈ (Share Price × Yield) ÷ 4",
        tip: "Actual dividends are set by the company’s board and can rise, fall, or pause. Always treat estimates as approximate.",
      }
    ),
    "Ex-dividend date": entry(
      "Ex-Dividend Date",
      "The ex-dividend date is the market’s cut-off for who gets the next dividend. Buy before it to be eligible; buy on/after it and you typically miss that payment.",
      {
        formula: "Own before ex-date → eligible for that dividend",
        tip: "Share prices often drop roughly by the dividend amount on the ex-date — you’re not “losing” money so much as separating cash from the share price.",
      }
    ),
    Open: entry(
      "Open",
      "Open is the first traded price when today’s market session began.",
      {
        formula: "Day move from open ≈ Current Price − Open",
        tip: "Comparing open to the current price shows how sentiment shifted since the opening bell.",
      }
    ),
    High: entry(
      "High",
      "High is the peak price reached during today’s trading session.",
      {
        tip: "A wide gap between high and low means a volatile day. Trading near the high can show buyers remaining in control.",
      }
    ),
    Low: entry(
      "Low",
      "Low is the bottom price reached during today’s trading session.",
      {
        tip: "If price rebounds from the low, buyers stepped in. Repeated tests of the low can signal selling pressure.",
      }
    ),
    Volume: entry(
      "Volume",
      "Volume counts how many shares changed hands so far today. It measures trading activity.",
      {
        formula: "Higher volume = more shares bought and sold",
        tip: "Big price moves on high volume are usually more meaningful than the same move on quiet trading.",
        rangeGuide:
          "Compare with Average Volume — much higher than average can mark news-driven days.",
      }
    ),
    "Avg. vol.": entry(
      "Average Volume",
      "Average volume is a typical daily share-trading level over a recent period (often ~30 days). It’s the baseline for “normal” activity.",
      {
        formula: "Relative Volume ≈ Today’s Volume ÷ Average Volume",
        tip: "If relative volume is well above 1, the stock is unusually busy — often around earnings or major news.",
      }
    ),
    "52-wk high": entry(
      "52-Week High",
      "The highest closing (or traded) price over the past year. It anchors recent peak optimism.",
      {
        formula: "% below high ≈ (High − Price) ÷ High × 100",
        tip: "Trading near the 52-week high can show strong momentum. Sitting far below it can mean a long reset — or a value opportunity if fundamentals still hold.",
      }
    ),
    "52-wk low": entry(
      "52-Week Low",
      "The lowest price over the past year. It shows how close the stock is to its recent bottom.",
      {
        formula: "% above low ≈ (Price − Low) ÷ Low × 100",
        tip: "A bounce from the 52-week low can mark recovery. New lows with heavy volume often mean sellers are still active.",
      }
    ),
    Beta: entry(
      "Beta",
      "Beta estimates how sensitive a stock is to broad market swings (often vs the S&P 500).",
      {
        formula: "Beta ≈ Stock moves ÷ Market moves (statistical estimate)",
        tip: "Beta 1 ≈ moves with the market. Above 1 = typically more jumpy. Below 1 = usually steadier. Negative beta is rare and means it often moves opposite the market.",
        rangeGuide:
          "Many large-cap stocks sit near 0.8–1.3. High-growth tech can run well above 1.3.",
      }
    ),
    "Shares outstanding": entry(
      "Shares Outstanding",
      "Shares outstanding is the total number of shares held by investors. It’s the “slice count” of the company.",
      {
        formula: "Market Cap = Price × Shares Outstanding",
        tip: "Companies can issue more shares (dilution) or buy back shares (shrink the count). Both change EPS and market-cap math over time.",
      }
    ),
    "No. of employees": entry(
      "Employees",
      "Reported workforce size. It helps put revenue and profit into human scale.",
      {
        formula: "Revenue per employee ≈ Revenue ÷ Employees",
        tip: "Higher revenue per employee can signal a more scalable business model — common in software, less so in retail or manufacturing.",
      }
    ),
    "24h Volume": entry(
      "24h Volume",
      "For crypto, 24h volume is the total traded value over the last day — usually across major exchanges.",
      {
        formula: "24h Volume ≈ Sum of trades (in $) over 24 hours",
        tip: "Higher volume usually means better liquidity (easier to enter/exit) and stronger short-term interest.",
        rangeGuide:
          "Thin volume can mean choppier prices and wider spreads.",
      }
    ),
    "Circulating Supply": entry(
      "Circulating Supply",
      "How many coins/tokens are currently out in the market and tradeable — the free float of a crypto asset.",
      {
        formula: "Market Cap ≈ Price × Circulating Supply",
        tip: "If circulating supply rises over time (new unlocks/issuance), price can face pressure unless demand grows too.",
      }
    ),
    "Total Supply": entry(
      "Total Supply",
      "Total coins already created — including locked, reserved, or not yet circulating.",
      {
        formula: "Locked / reserved ≈ Total Supply − Circulating Supply",
        tip: "A large gap between total and circulating supply means more coins could enter the market later (dilution risk).",
      }
    ),
    FDV: entry(
      "Fully Diluted Valuation",
      "FDV estimates what the market cap would be if every coin in total supply traded at today’s price.",
      {
        formula: "FDV = Price × Total Supply",
        tip: "If FDV is much higher than market cap, a lot of future supply is still unlockable. Compare FDV across similar projects carefully.",
      }
    ),
    "All-Time High": entry(
      "All-Time High",
      "The highest price this asset has ever reached — the peak of historical optimism.",
      {
        formula: "Drawdown from ATH ≈ (ATH − Price) ÷ ATH × 100",
        tip: "Large drawdowns from ATH are common in crypto and growth assets. Context matters: time since ATH and whether fundamentals changed.",
      }
    ),
    "All-Time Low": entry(
      "All-Time Low",
      "The lowest price this asset has ever reached — the floor of historical panic or early trading.",
      {
        tip: "Distance from ATL shows long-term recovery. New all-time lows after years of trading can be a stark confidence signal.",
      }
    ),
  };

export function getStockMetricExplanation(
  key: string
): StockMetricExplanation | null {
  return STOCK_METRIC_EXPLANATIONS[key] ?? null;
}
