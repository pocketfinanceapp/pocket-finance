import { cleanArticleTitle } from "./sourceBranding";
import { getStockProfile } from "./stockData";
import type { NewsArticle } from "./types";

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function generateShareCardBlob(
  article: NewsArticle
): Promise<Blob | null> {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const stock = getStockProfile(article.ticker);
  const changePct = stock.changePercent;
  const positive = changePct >= 0;
  const headline = cleanArticleTitle(article.headline);

  const bg = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  bg.addColorStop(0, "#0a0a0a");
  bg.addColorStop(0.45, "#111827");
  bg.addColorStop(1, "#0f172a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  ctx.fillStyle = "rgba(59,110,245,0.12)";
  ctx.beginPath();
  ctx.arc(920, 180, 220, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(0,198,198,0.1)";
  ctx.beginPath();
  ctx.arc(180, 1120, 260, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 52px system-ui, -apple-system, sans-serif";
  ctx.fillText("Pocket Finance", 72, 110);

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "500 28px system-ui, -apple-system, sans-serif";
  ctx.fillText("Market news, simplified", 72, 156);

  roundRect(ctx, 72, 220, 220, 64, 32);
  ctx.fillStyle = "rgba(0,198,198,0.18)";
  ctx.fill();
  ctx.strokeStyle = "rgba(0,198,198,0.45)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#00C6C6";
  ctx.font = "bold 30px system-ui, -apple-system, sans-serif";
  ctx.fillText(`$${article.ticker}`, 104, 262);

  roundRect(ctx, 312, 220, 180, 64, 32);
  ctx.fillStyle = positive ? "rgba(0,198,198,0.18)" : "rgba(248,113,113,0.18)";
  ctx.fill();
  ctx.strokeStyle = positive ? "rgba(0,198,198,0.45)" : "rgba(248,113,113,0.45)";
  ctx.stroke();
  ctx.fillStyle = positive ? "#00C6C6" : "#f87171";
  ctx.font = "bold 30px system-ui, -apple-system, sans-serif";
  ctx.fillText(
    `${positive ? "+" : ""}${changePct.toFixed(2)}%`,
    344,
    262
  );

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 64px system-ui, -apple-system, sans-serif";
  wrapText(ctx, headline, 72, 420, CARD_WIDTH - 144, 74, 4);

  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.font = "500 32px system-ui, -apple-system, sans-serif";
  wrapText(ctx, article.subheading, 72, 760, CARD_WIDTH - 144, 42, 3);

  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "600 28px system-ui, -apple-system, sans-serif";
  ctx.fillText(article.sourceName, 72, CARD_HEIGHT - 120);

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "500 24px system-ui, -apple-system, sans-serif";
  ctx.fillText("pocketfinance.app", 72, CARD_HEIGHT - 72);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 0.92);
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  const words = text.split(/\s+/);
  let line = "";
  let lineCount = 0;
  let cursorY = y;

  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = words[i];
      lineCount += 1;
      cursorY += lineHeight;
      if (lineCount >= maxLines - 1) {
        const rest = words.slice(i).join(" ");
        let clipped = rest;
        while (
          ctx.measureText(`${clipped}…`).width > maxWidth &&
          clipped.length > 0
        ) {
          clipped = clipped.slice(0, -1);
        }
        ctx.fillText(`${clipped}…`, x, cursorY);
        return;
      }
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cursorY);
}

export async function shareBrandedArticleCard(
  article: NewsArticle
): Promise<"shared" | "copied" | "cancelled" | "failed"> {
  const blob = await generateShareCardBlob(article);
  if (!blob) return "failed";

  const file = new File([blob], `pocket-finance-${article.ticker}.png`, {
    type: "image/png",
  });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title: cleanArticleTitle(article.headline),
        text: `${article.ticker} · ${article.sourceName}`,
        files: [file],
      });
      return "shared";
    } catch {
      return "cancelled";
    }
  }

  try {
    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": blob }),
    ]);
    return "copied";
  } catch {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pocket-finance-${article.ticker}.png`;
    link.click();
    URL.revokeObjectURL(url);
    return "copied";
  }
}
