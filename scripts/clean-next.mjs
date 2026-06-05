#!/usr/bin/env node
/**
 * Removes the Next.js build cache (.next).
 * Run before `next dev` to avoid stale webpack vendor-chunk errors.
 */
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const targets = [".next"];

for (const name of targets) {
  const dir = join(root, name);
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
    console.log(`[clean] removed ${name}/`);
  }
}

console.log("[clean] ready");
