export interface FinancialTerm {
  displayName: string;
  pattern: string;
  explanation: string;
}

/** Longest phrases first so overlapping matches prefer the full term. */
export const FINANCIAL_TERMS: FinancialTerm[] = [
  {
    displayName: "Quantitative easing",
    pattern: "\\bquantitative easing\\b",
    explanation:
      "Quantitative easing — often called QE — is when a central bank creates new money to purchase government bonds. The goal is to encourage lending and spending when the economy needs a boost.",
  },
  {
    displayName: "Short selling",
    pattern: "\\bshort selling\\b",
    explanation:
      "Short selling is when an investor borrows shares and returns them later after a price change. It's a strategy used when someone expects prices to fall — but it comes with significant risk if prices rise instead.",
  },
  {
    displayName: "Federal Reserve",
    pattern: "\\bfederal reserve\\b",
    explanation:
      "The Federal Reserve — often called the Fed — is America's central bank. It sets monetary policy, including interest rates, to keep the economy stable and inflation in check.",
  },
  {
    displayName: "Interest rate",
    pattern: "\\binterest rates?\\b",
    explanation:
      "Interest rates are the cost of borrowing money. When rates go up, loans get more expensive and companies often spend less, which can slow the economy and affect stock prices.",
  },
  {
    displayName: "Profit margin",
    pattern: "\\bprofit margins?\\b",
    explanation:
      "Profit margin shows what percentage of revenue a company keeps as profit after paying its costs. A higher margin means the company retains more of each dollar it earns.",
  },
  {
    displayName: "Basis points",
    pattern: "\\bbasis points?\\b",
    explanation:
      "Basis points are a tiny unit for measuring interest rates. One basis point equals 0.01%. So when rates rise by 25 basis points, they go up by a quarter of a percent.",
  },
  {
    displayName: "Yield curve",
    pattern: "\\byield curve\\b",
    explanation:
      "The yield curve shows the difference between short-term and long-term interest rates. When it flips upside down — called an inversion — it has historically predicted recessions.",
  },
  {
    displayName: "Bull market",
    pattern: "\\bbull markets?\\b",
    explanation:
      "A bull market is when stock prices are rising and investors are optimistic. It's named after a bull thrusting upward with its horns.",
  },
  {
    displayName: "Bear market",
    pattern: "\\bbear markets?\\b",
    explanation:
      "A bear market is when stock prices fall more than 20% from their recent highs. It's named after a bear swiping downward with its claws.",
  },
  {
    displayName: "Market cap",
    pattern: "\\bmarket caps?\\b",
    explanation:
      "Market cap is short for market capitalisation. It's the total value of all a company's shares added together. A higher market cap generally means a bigger, more established company.",
  },
  {
    displayName: "Hedge fund",
    pattern: "\\bhedge funds?\\b",
    explanation:
      "A hedge fund is a pool of money managed by professionals using advanced strategies. They're typically designed for wealthy or institutional investors rather than everyday retail investors.",
  },
  {
    displayName: "Dow Jones",
    pattern: "\\bDow Jones\\b",
    explanation:
      "The Dow Jones Industrial Average tracks 30 large, well-known US companies. It's one of the oldest and most quoted measures of the US stock market.",
  },
  {
    displayName: "S&P 500",
    pattern: "\\bS&P 500\\b",
    explanation:
      "The S&P 500 is an index tracking 500 of America's largest public companies. It's widely seen as a snapshot of how the overall US stock market is performing.",
  },
  {
    displayName: "Semiconductor",
    pattern: "\\bsemiconductors?\\b",
    explanation:
      "Semiconductors are tiny chips that power electronics — from phones and laptops to cars and AI servers. The semiconductor industry is a critical backbone of modern technology.",
  },
  {
    displayName: "Volatility",
    pattern: "\\bvolatility\\b",
    explanation:
      "Volatility measures how much and how quickly prices move up and down. High volatility means prices are swinging more dramatically — like a roller coaster ride for markets.",
  },
  {
    displayName: "Deflation",
    pattern: "\\bdeflation\\b",
    explanation:
      "Deflation is when prices fall over time, so your money buys more than before. While that sounds good, it often signals a weakening economy because people delay spending waiting for lower prices.",
  },
  {
    displayName: "Inflation",
    pattern: "\\binflation\\b",
    explanation:
      "Inflation is when the purchasing power of money decreases over time — meaning the same amount of money buys you less than it did before.",
  },
  {
    displayName: "Recession",
    pattern: "\\brecessions?\\b",
    explanation:
      "A recession is a significant slowdown in economic activity — usually meaning shrinking GDP for several months in a row. Jobs can become harder to find and businesses often pull back on spending.",
  },
  {
    displayName: "Liquidity",
    pattern: "\\bliquidity\\b",
    explanation:
      "Liquidity refers to how easily an asset can be converted to cash without drastically moving its price. Highly liquid markets have lots of active participants and tight spreads.",
  },
  {
    displayName: "Dividend",
    pattern: "\\bdividends?\\b",
    explanation:
      "A dividend is a portion of a company's profits paid out to shareholders. Think of it like a company sharing a slice of its earnings with people who own its stock.",
  },
  {
    displayName: "Treasury",
    pattern: "\\bTreasur(?:y|ies)\\b",
    explanation:
      "Treasury securities are debt instruments issued by the US government. They're considered among the safest investments because they're backed by the full faith of the US government.",
  },
  {
    displayName: "Earnings",
    pattern: "\\bearnings\\b",
    explanation:
      "Earnings are the profits a company generates over a given period. They appear in quarterly reports and are a key number investors watch to gauge a company's financial health.",
  },
  {
    displayName: "Revenue",
    pattern: "\\brevenue\\b",
    explanation:
      "Revenue is the total money a company brings in from its business activities before subtracting costs. It's the top line — how much came in the door — before expenses are deducted.",
  },
  {
    displayName: "Futures",
    pattern: "\\bfutures\\b",
    explanation:
      "Futures are contracts that lock in a price for an asset to be exchanged on a specific future date. They're commonly used by traders and businesses to hedge against price swings in commodities, currencies, or stocks.",
  },
  {
    displayName: "Options",
    pattern: "\\boptions\\b",
    explanation:
      "Options give the holder the right — but not the obligation — to exchange an asset at a set price before a deadline. They're a flexible tool used for hedging risk or speculating on price movement.",
  },
  {
    displayName: "NASDAQ",
    pattern: "\\bNASDAQ\\b",
    explanation:
      "The NASDAQ is a major US stock exchange known for technology and growth companies. The NASDAQ Composite index tracks thousands of stocks listed on that exchange.",
  },
  {
    displayName: "FOMC",
    pattern: "\\bFOMC\\b",
    explanation:
      "The FOMC is basically the committee that decides how expensive it is to borrow money in America. When they meet, markets pay close attention because their decisions affect stocks, mortgages and savings rates worldwide.",
  },
  {
    displayName: "CPI",
    pattern: "\\bCPI\\b",
    explanation:
      "Think of CPI as a shopping basket score. It tracks how much everyday items like food, rent and petrol cost over time. When CPI goes up it means things are getting more expensive — that's inflation.",
  },
  {
    displayName: "PCE",
    pattern: "\\bPCE\\b",
    explanation:
      "PCE stands for Personal Consumption Expenditures. It's another way to measure how much everyday goods and services cost. The Federal Reserve pays close attention to PCE when tracking inflation.",
  },
  {
    displayName: "GDP",
    pattern: "\\bGDP\\b",
    explanation:
      "GDP stands for Gross Domestic Product. It's the total value of all goods and services a country produces in a year. Think of it as the country's overall economic report card.",
  },
  {
    displayName: "ETF",
    pattern: "\\bETFs?\\b",
    explanation:
      "An ETF is like a pre-made bundle of stocks. Instead of buying one company, you buy a slice of many companies at once. It's a popular way to invest without putting all your eggs in one basket.",
  },
  {
    displayName: "IPO",
    pattern: "\\bIPOs?\\b",
    explanation:
      "An IPO stands for Initial Public Offering. It's when a private company first offers shares to the public on a stock exchange. It's the moment a company opens its ownership to everyday investors.",
  },
  {
    displayName: "EPS",
    pattern: "\\bEPS\\b",
    explanation:
      "EPS stands for Earnings Per Share. It tells you how much profit a company made for each share of stock. Higher EPS generally means the company is more profitable.",
  },
  {
    displayName: "P/E",
    pattern: "\\bP\\/E\\b",
    explanation:
      "P/E stands for Price to Earnings ratio. It shows how much investors are willing to pay for each dollar of profit. A high P/E means investors expect strong future growth.",
  },
  {
    displayName: "QE",
    pattern: "\\bQE\\b",
    explanation:
      "QE stands for quantitative easing. It's when a central bank creates new money to purchase government bonds, aiming to encourage lending and spending when the economy needs a boost.",
  },
  {
    displayName: "Bond",
    pattern: "\\bbonds?\\b",
    explanation:
      "A bond is essentially a loan you give to a government or company. In return, they pay you periodic interest and return the original amount when the bond matures.",
  },
  {
    displayName: "Yield",
    pattern: "\\byields?\\b",
    explanation:
      "Yield is the return you earn from an investment, often expressed as a percentage. For bonds, it shows how much income you'll receive relative to the price you pay.",
  },
];

export interface TextSegment {
  text: string;
  term?: FinancialTerm;
}

export function parseTextWithTerms(text: string): TextSegment[] {
  if (!text) return [{ text: "" }];

  const covered = new Array<boolean>(text.length).fill(false);
  const matches: { start: number; end: number; term: FinancialTerm }[] = [];

  for (const term of FINANCIAL_TERMS) {
    const regex = new RegExp(term.pattern, "gi");
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      let overlaps = false;
      for (let i = start; i < end; i++) {
        if (covered[i]) {
          overlaps = true;
          break;
        }
      }
      if (overlaps) continue;

      for (let i = start; i < end; i++) covered[i] = true;
      matches.push({ start, end, term });
    }
  }

  matches.sort((a, b) => a.start - b.start);

  const segments: TextSegment[] = [];
  let pos = 0;
  for (const match of matches) {
    if (match.start > pos) {
      segments.push({ text: text.slice(pos, match.start) });
    }
    segments.push({
      text: text.slice(match.start, match.end),
      term: match.term,
    });
    pos = match.end;
  }

  if (pos < text.length) {
    segments.push({ text: text.slice(pos) });
  }

  return segments.length ? segments : [{ text }];
}
