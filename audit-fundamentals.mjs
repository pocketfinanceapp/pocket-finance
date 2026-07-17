/**
 * One-time audit: checks every US-listed ticker in the app's catalog against
 * Twelve Data directly and flags anything that looks wrong — same pattern
 * that caught the BRK and TSM bugs, but automated across the whole catalog
 * instead of one screenshot at a time.
 *
 * Run from the project root:
 *   node audit-fundamentals.mjs
 *
 * Reads TWELVE_DATA_API_KEY from .env.local automatically. Takes ~11 minutes
 * (114 tickers, paced to stay under the 610 credits/min plan limit). Writes
 * audit-report.json when done — paste that back to Claude.
 */

import fs from "node:fs";
import path from "node:path";

const PROJECT_ROOT = process.cwd();

function loadEnvLocal() {
  const envPath = path.join(PROJECT_ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const API_KEY = process.env.TWELVE_DATA_API_KEY;
if (!API_KEY) {
  console.error(
    "ERROR: TWELVE_DATA_API_KEY not found. Make sure this script runs from the project root (same folder as .env.local)."
  );
  process.exit(1);
}

// Matches src/lib/twelveDataSymbolOverrides.ts — update here too if that file changes.
const SYMBOL_OVERRIDES = {
  BRK: "BRK.B",
};

function toTwelveDataSymbol(ticker) {
  const upper = ticker.trim().toUpperCase();
  return SYMBOL_OVERRIDES[upper] ?? upper;
}

// Every NASDAQ/NYSE ticker in src/lib/tickerMap.ts (excludes private tickers
// like OPENAI/ANTHROPIC/SPACEX and the deprecated SPY entry).
const TICKERS = [
  "AAPL","MSFT","GOOGL","AMZN","TSLA","META","NVDA","NFLX","AMD","INTC","AVGO","LULU",
  "JPM","GS","XOM","COIN","JNJ","BA","DIS","WMT","KO","PEP","NKE","SBUX","PYPL","CRM",
  "ORCL","ADBE","IBM","CSCO","QCOM","UBER","ABNB","SHOP","PLTR","RIVN","F","GM","V","MA",
  "BRK","BAC","WFC","C","MS","CVX","MRNA","PFE","LLY","MU","SNOW","SPOT","HOOD","SQ",
  "ASML","TSM","ARM","SMCI","COST","HD","MCD","UNH","GOOG","SNAP","PINS","MSTR","BABA",
  "TCEHY","INFY","COP","NEM","QQQ","DIA","IWM","SOXX","XLK","NET","CRWD","PANW","DDOG",
  "ZS","INTU","BKNG","RIOT","MARA","PDD","JD","SCHW","BLK","AXP","ABBV","TMO","MRK","PG",
  "TGT","NOW","TXN","AMAT","LRCX","SLB","VZ","CMCSA","CAT","DE","RTX","LMT","SAP","NVS",
  "UBS","VALE","ITUB","BBD","ABEV","AMX",
];

const DELAY_MS = 5500; // ~11 tickers/min * 51 credits = ~560 credits/min, under the 610 cap
const MISMATCH_THRESHOLD = 0.15; // flag if self-computed vs Twelve Data disagree by >15%

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function num(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

async function fetchQuote(requestSymbol) {
  const res = await fetch(
    `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(requestSymbol)}&apikey=${API_KEY}`
  );
  const data = await res.json();
  if (!res.ok || data.status === "error") {
    return { error: data.message || `HTTP ${res.status}` };
  }
  const price = Number(data.close);
  return { price: Number.isFinite(price) ? price : null };
}

async function fetchStatistics(requestSymbol) {
  const res = await fetch(
    `https://api.twelvedata.com/statistics?symbol=${encodeURIComponent(requestSymbol)}&apikey=${API_KEY}`
  );
  const data = await res.json();
  if (!res.ok || data.status === "error" || !data.statistics) {
    return { error: data.message || `HTTP ${res.status}` };
  }
  const stats = data.statistics;
  const valuations = stats.valuations_metrics ?? {};
  const financials = stats.financials ?? {};
  const incomeStatement = financials.income_statement ?? {};
  const stockStatistics = stats.stock_statistics ?? {};
  return {
    marketCap: num(valuations.market_capitalization),
    peRatio: num(valuations.trailing_pe),
    eps: num(incomeStatement.diluted_eps_ttm),
    sharesOutstanding: num(stockStatistics.shares_outstanding),
  };
}

async function main() {
  console.log(`Auditing ${TICKERS.length} tickers against Twelve Data...`);
  console.log(`Estimated time: ~${Math.ceil((TICKERS.length * DELAY_MS) / 60000)} minutes\n`);

  const flagged = [];
  const errors = [];
  let checked = 0;

  for (const ticker of TICKERS) {
    const requestSymbol = toTwelveDataSymbol(ticker);
    process.stdout.write(`[${++checked}/${TICKERS.length}] ${ticker}... `);

    try {
      const [quote, stats] = await Promise.all([
        fetchQuote(requestSymbol),
        fetchStatistics(requestSymbol),
      ]);

      if (quote.error || stats.error) {
        const msg = quote.error || stats.error;
        errors.push({ ticker, requestSymbol, error: msg });
        console.log(`ERROR: ${msg}`);
        await sleep(DELAY_MS);
        continue;
      }

      const { price } = quote;
      const { marketCap, peRatio, eps, sharesOutstanding } = stats;
      const issues = [];

      if (price != null && sharesOutstanding != null && marketCap != null && marketCap > 0) {
        const selfComputed = price * sharesOutstanding;
        const ratio = selfComputed / marketCap;
        if (ratio > 1 + MISMATCH_THRESHOLD || ratio < 1 - MISMATCH_THRESHOLD) {
          issues.push({
            type: "market_cap_mismatch",
            price,
            sharesOutstanding,
            selfComputedMarketCap: Math.round(selfComputed),
            twelveDataMarketCap: Math.round(marketCap),
            ratio: Number(ratio.toFixed(2)),
          });
        }
      }

      if (price != null && eps != null && eps > 0 && peRatio != null && peRatio > 0) {
        const selfComputedPE = price / eps;
        const diff = Math.abs(selfComputedPE - peRatio) / peRatio;
        if (diff > MISMATCH_THRESHOLD) {
          issues.push({
            type: "pe_mismatch",
            price,
            eps,
            selfComputedPE: Number(selfComputedPE.toFixed(1)),
            twelveDataPE: peRatio,
          });
        }
      }

      if (eps != null && eps < 0 && peRatio != null && peRatio > 0) {
        issues.push({
          type: "negative_eps_positive_pe",
          eps,
          twelveDataPE: peRatio,
        });
      }

      if (marketCap == null || sharesOutstanding == null || price == null) {
        issues.push({
          type: "missing_data",
          marketCap,
          sharesOutstanding,
          price,
        });
      }

      if (issues.length > 0) {
        flagged.push({ ticker, requestSymbol, issues });
        console.log(`FLAGGED (${issues.map((i) => i.type).join(", ")})`);
      } else {
        console.log("ok");
      }
    } catch (err) {
      errors.push({ ticker, requestSymbol, error: String(err) });
      console.log(`ERROR: ${err}`);
    }

    await sleep(DELAY_MS);
  }

  const report = {
    generatedAt: new Date().toISOString(),
    totalChecked: checked,
    flaggedCount: flagged.length,
    errorCount: errors.length,
    flagged,
    errors,
  };

  const outPath = path.join(PROJECT_ROOT, "audit-report.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Done. Checked ${checked} tickers.`);
  console.log(`Flagged: ${flagged.length}`);
  console.log(`Errors (fetch failed): ${errors.length}`);
  console.log(`Full report written to: audit-report.json`);
  console.log(`${"=".repeat(60)}`);

  if (flagged.length > 0) {
    console.log("\nFlagged tickers:");
    for (const f of flagged) {
      console.log(`  ${f.ticker}: ${f.issues.map((i) => i.type).join(", ")}`);
    }
  }
}

main();
