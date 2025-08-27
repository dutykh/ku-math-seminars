/*
 * KU Math Seminars - OG Image Generator
 * Author: Dr. Denys Dutykh (Khalifa University of Science and Technology, Abu Dhabi, UAE)
 * License: GNU General Public License v3.0
 *
 * Purpose: Generate a raster Open Graph image from the SVG source so that
 * platforms like WhatsApp, Slack, and Facebook that do not support SVG for
 * og:image can render a proper preview.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const svgPath = path.resolve(__dirname, '../public/assets/og-image.svg');
  const outPath = path.resolve(__dirname, '../public/assets/og-image.png');

  if (!fs.existsSync(svgPath)) {
    console.warn('[gen-og] SVG source not found at', svgPath);
    return;
  }

  // Recommended OG size 1200x630
  const width = 1200;
  const height = 630;

  try {
    const svgBuffer = fs.readFileSync(svgPath);

    await sharp(svgBuffer, { density: 300 })
      .resize(width, height, { fit: 'cover' })
      .png({ quality: 90 })
      .toFile(outPath);

    console.log(`[gen-og] Generated ${path.relative(process.cwd(), outPath)} (${width}x${height})`);
  } catch (err) {
    console.error('[gen-og] Failed to generate PNG from SVG:', err);
    process.exitCode = 1;
  }
}

main();
