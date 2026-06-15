import path from "node:path";
import sharp from "sharp";

const LOGO_PATH = path.join(process.cwd(), "public", "logo.png");

function computeAlpha(r, g, b) {
  const minChannel = Math.min(r, g, b);
  const maxChannel = Math.max(r, g, b);

  // Light checkerboard / white background → transparent
  if (minChannel >= 245) return 0;

  // Dark black background → transparent (previous script incorrectly kept these opaque)
  if (maxChannel <= 30) return 0;

  // Soft edge on light greys
  if (minChannel >= 200) {
    return Math.round((255 * (245 - minChannel)) / 45);
  }

  return 255;
}

async function main() {
  const { data, info } = await sharp(LOGO_PATH)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const rgba = Buffer.alloc(width * height * 4);

  for (let i = 0; i < width * height; i++) {
    const src = i * channels;
    const dst = i * 4;
    const r = data[src];
    const g = data[src + 1];
    const b = data[src + 2];
    const alpha = computeAlpha(r, g, b);

    rgba[dst] = r;
    rgba[dst + 1] = g;
    rgba[dst + 2] = b;
    rgba[dst + 3] = alpha;
  }

  await sharp(rgba, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(LOGO_PATH);

  const meta = await sharp(LOGO_PATH).metadata();
  console.log(`Wrote ${LOGO_PATH}`);
  console.log(
    `Format: ${meta.format}, size: ${meta.width}x${meta.height}, hasAlpha: ${meta.hasAlpha}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
