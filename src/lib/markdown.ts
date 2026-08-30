/**
 * Server-side Markdown rendering and sanitization.
 * Author: Dr. Denys Dutykh (Khalifa University of Science and Technology, Abu Dhabi, UAE)
 * License: GNU General Public License v3.0
 *
 * Abstracts and biographies are authored as Markdown in the YAML week files.
 * They are converted and sanitized here, at build time, so no untrusted HTML
 * and no client-side sanitizer ever reaches the browser.
 */
import { marked } from 'marked';
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

const purifierWindow = new JSDOM('').window;
const DOMPurify = createDOMPurify(purifierWindow as unknown as Window & typeof globalThis);

// Outbound links open in a new tab and must not hand the opener over with
// them. Doing this in a DOMPurify hook operates on the parsed DOM, so unlike a
// regex over the serialized output it cannot be confused by attribute values
// that happen to contain angle brackets or quotes.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (!(node instanceof purifierWindow.HTMLAnchorElement)) return;
  if (!node.hasAttribute('href')) return;

  if (!node.hasAttribute('target')) {
    node.setAttribute('target', '_blank');
  }
  if (node.getAttribute('target') === '_blank') {
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

const SANITIZE_CONFIG: Parameters<typeof DOMPurify.sanitize>[1] = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'base'],
  FORBID_ATTR: ['style'],
  ALLOW_DATA_ATTR: false
};

/** Convert a Markdown fragment to sanitized HTML. Returns '' for empty input. */
export function renderMarkdown(markdown: string | undefined | null): string {
  if (!markdown) return '';

  const parsed = marked.parse(markdown, { gfm: true, breaks: true, async: false });
  const html = typeof parsed === 'string' ? parsed : '';

  return DOMPurify.sanitize(html, SANITIZE_CONFIG);
}
