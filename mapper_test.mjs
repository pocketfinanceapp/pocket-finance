import { mapMarketauxArticle } from "./src/lib/newsMapper.ts";

const kospi = mapMarketauxArticle({
  uuid: "1",
  title: "Asian Stocks Fall as Kospi Hit by Selloff in Chips: Markets Wrap",
  description: "Semiconductor stocks fell across Asia, dragging regional equities lower, as investors became more skeptical that the artificial intelligence-driven rally can withstand lofty valuations. Oil declined.",
  snippet: "",
  url: "https://example.com/1",
  imageUrl: null,
  language: "en",
  publishedAt: new Date().toISOString(),
  source: "bloomberg.com",
  entities: [
    { symbol: "OIL", name: "Crude Oil", exchange: null, country: null, type: "commodity", industry: null, matchScore: 40, sentimentScore: -0.1 },
  ],
});
console.log("Kospi article ticker:", kospi.ticker, kospi.companyName);

const hormuz = mapMarketauxArticle({
  uuid: "2",
  title: "Oil traders warn market is close to running on empty as Hormuz shuts again",
  description: "Stockpiles that acted as shock absorbers early in Iran war are running low as crucial waterway closes again",
  snippet: "",
  url: "https://example.com/2",
  imageUrl: null,
  language: "en",
  publishedAt: new Date().toISOString(),
  source: "ft.com",
  entities: [
    { symbol: "OIL", name: "Crude Oil", exchange: null, country: null, type: "commodity", industry: null, matchScore: 55, sentimentScore: -0.2 },
  ],
});
console.log("Hormuz article ticker:", hormuz.ticker, hormuz.companyName);
