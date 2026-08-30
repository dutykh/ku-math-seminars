/*
 * KU Math Seminars - Build-time asset pipeline
 * Author: Dr. Denys Dutykh (Khalifa University of Science and Technology, Abu Dhabi, UAE)
 * License: GNU General Public License v3.0
 *
 * Derives the served images from the masters in assets-src/ and public/assets/:
 *
 *   og-image.svg              -> og-image.png (1200x630)
 *       Social platforms (WhatsApp, Slack, Facebook) will not render SVG for
 *       og:image, so a raster copy is required.
 *
 *   KUMathLogo-master.png     -> KUMathLogo-transparent.png (256x256)
 *       The master is 4268x4268; the site never shows it larger than 128 CSS
 *       pixels, so the served copy is capped at 2x that.
 *
 * Run automatically by `pnpm build` via the prebuild hook.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const rel = (p) => path.relative(root, p);

async function generateOgImage() {
  const source = path.join(root, 'public/assets/og-image.svg');
  const target = path.join(root, 'public/assets/og-image.png');

  if (!fs.existsSync(source)) {
    console.warn('[assets] og-image.svg not found at', rel(source));
    return;
  }

  await sharp(fs.readFileSync(source), { density: 300 })
    .resize(1200, 630, { fit: 'cover' })
    // The card is flat brand colours over a gradient, so a quantised palette
    // halves the file with no visible loss.
    .png({ compressionLevel: 9, quality: 100, palette: true })
    .toFile(target);

  console.log(`[assets] ${rel(target)} (1200x630, ${(fs.statSync(target).size / 1024).toFixed(0)} KB)`);
}

async function generateMathLogo() {
  const source = path.join(root, 'assets-src/KUMathLogo-master.png');
  const target = path.join(root, 'public/assets/KUMathLogo-transparent.png');

  if (!fs.existsSync(source)) {
    console.warn('[assets] KUMathLogo-master.png not found at', rel(source));
    return;
  }

  await sharp(source)
    .resize(256, 256, { fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true })
    .toFile(target);

  console.log(`[assets] ${rel(target)} (256x256, ${(fs.statSync(target).size / 1024).toFixed(0)} KB)`);
}

async function main() {
  try {
    await generateOgImage();
    await generateMathLogo();
  } catch (error) {
    console.error('[assets] generation failed:', error);
    process.exitCode = 1;
  }
}

main();
