/*
 * KU Math Seminars - Production static server
 * Author: Dr. Denys Dutykh (Khalifa University of Science and Technology, Abu Dhabi, UAE)
 * License: GNU General Public License v3.0
 *
 * Serves the built `dist/` directory behind Traefik.
 *
 * Header ownership is split deliberately:
 *   - Astro emits the Content-Security-Policy as a <meta> element, because only
 *     the build knows the SHA-256 hashes of the inline scripts.
 *   - Everything a meta CSP cannot express (HSTS, frame-ancestors via
 *     X-Frame-Options, Referrer-Policy, Permissions-Policy, nosniff) is sent
 *     here. The two never overlap, so they cannot conflict.
 *
 * Environment:
 *   PORT   listening port          (default 3004)
 *   HOST   bind address            (default 127.0.0.1; Traefik is the only
 *                                   thing that should reach this process)
 */

import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, 'dist');

const port = Number(process.env.PORT) || 3004;
const host = process.env.HOST || '127.0.0.1';

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  console.error(`No build found at ${DIST}. Run \`pnpm build\` first.`);
  process.exit(1);
}

const app = express();

// Traefik terminates TLS and sets X-Forwarded-*; trust exactly one proxy hop so
// req.ip and req.protocol are accurate without letting clients spoof them.
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.set('etag', 'strong');

app.use((_req, res, next) => {
  // Transport and framing headers. The CSP itself lives in the page <meta>.
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), accelerometer=(), gyroscope=(), interest-cohort=()'
  );
  next();
});

// Pages are emitted as flat files (build.format: 'file'), so /archive maps to
// archive.html. Normalise a stray trailing slash rather than 404-ing on it.
app.use((req, res, next) => {
  if (req.path.length > 1 && req.path.endsWith('/')) {
    const query = req.originalUrl.slice(req.path.length);
    res.redirect(308, req.path.replace(/\/+$/, '') + query);
    return;
  }
  next();
});

// Astro fingerprints everything under /assets, so those may be cached forever.
// Anything else (HTML, the calendar feed, icons, the manifest) must revalidate
// so a redeploy is visible immediately.
app.use(
  express.static(DIST, {
    // Resolve /archive to archive.html.
    extensions: ['html'],
    index: 'index.html',
    redirect: false,
    setHeaders(res, filePath) {
      const relative = path.relative(DIST, filePath);

      if (relative.startsWith(`assets${path.sep}`) && /\.[0-9a-zA-Z_-]{8,}\./.test(path.basename(filePath))) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
      }
    }
  })
);

// A static site has no client-side router: an unknown path is a genuine 404 and
// must say so, or search engines index soft-404s as real pages.
const notFoundPage = path.join(DIST, '404.html');

app.use((req, res) => {
  res.status(404);

  if (req.accepts('html') && fs.existsSync(notFoundPage)) {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(notFoundPage);
    return;
  }

  res.type('txt').send('Not found');
});

const server = app.listen(port, host, () => {
  console.log(`KU Math Seminars listening on http://${host}:${port}`);
  console.log(`Serving ${DIST}`);
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    console.log(`${signal} received, shutting down.`);
    server.close(() => process.exit(0));
  });
}
