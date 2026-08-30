// KU Math Seminars - Astro Configuration
// Author: Dr. Denys Dutykh (Khalifa University of Science and Technology, Abu Dhabi, UAE)
// License: GNU General Public License v3.0

// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const SITE = 'https://www.events.denys-dutykh.com';

/**
 * jsPDF lazily imports html2canvas, canvg and a browser build of DOMPurify to
 * support doc.html() and SVG embedding. This site only ever draws text, lines
 * and one PNG, so those code paths never run, but they still emit ~250 KB of
 * chunks. Stub them in the browser build only; the server build keeps the real
 * DOMPurify, which sanitizes seminar abstracts at build time.
 */
function stripUnusedPdfDeps() {
  const stubbed = new Set(['html2canvas', 'canvg', 'dompurify']);
  const STUB_ID = '\0ku-pdf-stub';

  return {
    name: 'ku-strip-unused-pdf-deps',
    enforce: 'pre',
    /**
     * @param {string} source
     * @param {string | undefined} _importer
     * @param {{ ssr?: boolean }} [options]
     */
    resolveId(source, _importer, options) {
      if (options?.ssr) return null;
      return stubbed.has(source) ? STUB_ID : null;
    },
    /** @param {string} id */
    load(id) {
      return id === STUB_ID ? 'export default undefined;' : null;
    }
  };
}

// https://astro.build/config
export default defineConfig({
  site: SITE,
  output: 'static',
  build: {
    assets: 'assets',
    // Emit dist/archive.html rather than dist/archive/index.html so that
    // /archive resolves directly, with no trailing-slash redirect hop.
    format: 'file'
  },
  trailingSlash: 'never',
  integrations: [sitemap()],
  security: {
    // Astro emits <meta http-equiv="content-security-policy"> carrying SHA-256
    // hashes for every inline script and style it processes, so no
    // 'unsafe-inline' is needed. frame-ancestors, HSTS and the other transport
    // headers cannot be expressed in a meta CSP and are sent by server.js.
    csp: {
      algorithm: 'SHA-256',
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
        "manifest-src 'self'"
      ],
      scriptDirective: {
        resources: ["'self'", 'https://www.googletagmanager.com']
      },
      styleDirective: {
        resources: ["'self'"]
      }
    }
  },
  markdown: {
    // Seminar Markdown is rendered by `marked` in src/lib/markdown.ts, never by
    // Astro's pipeline. Disabling Shiki drops a large dependency and removes
    // the inline styles that would otherwise fight the CSP.
    syntaxHighlight: false
  },
  vite: {
    plugins: [stripUnusedPdfDeps(), tailwindcss()]
  }
});
