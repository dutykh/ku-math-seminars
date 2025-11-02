# KU Math Seminars Website

A minimal, static website for displaying the weekly programme of Mathematics Department seminars at Khalifa University.

**Author:** Dr. Denys Dutykh (Khalifa University of Science and Technology, Abu Dhabi, UAE)  
**License:** GNU General Public License v3.0

## Overview

This site displays the current week's mathematics seminars across multiple series:
- CCMS Seminar (College of Computing and Mathematical Sciences)
- Math Seminar (General Mathematics Department)
- Financial Math Seminar
- Graduate Math Seminar
- Undergraduate Math Seminar

## Architecture

- **Build-time data load**: `src/pages/index.astro` reads `public/data/week.yml` using Node `fs` and the `yaml` package, parses into `WeekData` (see `src/lib/types.ts`).
- **Rendering**: Astro pages/components render static HTML with small interactive islands when needed. Main composition is in `index.astro` using components:
  - `src/components/WeekHeader.astro` – week banner, theme controls.
  - `src/components/SeriesSection.astro` – section per seminar series.
  - `src/components/SeminarCard.astro` – individual seminar card with status, links, abstract/biography toggles.
- **Styling**: Tailwind CSS via `@astrojs/tailwind` with custom design tokens and utilities defined in `tailwind.config.ts`. Global styles in `src/index.css`. Print stylesheet in `public/styles/print.css`.
- **Time/formatting utilities**: `src/lib/time.ts` for week range, time ranges, timezone labels, timeline positions.
- **PDF generation**: Two options
  - Client-side export in `src/pages/index.astro` using jsPDF from CDN for a quick printable summary and detail pages.
  - A typed generator `src/lib/pdfGenerator.ts` providing a class-based, multi-page A4 poster builder using `jspdf` (imported via ESM).
- **SEO/metadata**: `index.astro` generates dynamic `<title>`, `<meta>` and JSON-LD structured data for Organization, WebSite, CollectionPage, and each Event.
- **Build output**: Astro static build to `dist/` (see `astro.config.mjs`). Optional Express server (`server.js`) can serve the static output.

## Technical Stack

- **Astro 5** – Static site generator, islands architecture.
- **TypeScript** – Strict config via `astro/tsconfigs/strict`.
- **YAML** – Content source in `public/data/week.yml` parsed with `yaml`.
- **Tailwind CSS 3** – Integrated via `@astrojs/tailwind`; PostCSS + Autoprefixer.
- **jsPDF** – PDF generation (ESM in `src/lib/pdfGenerator.ts` and CDN in `index.astro`).
- **Express 5 (optional)** – Static server for `dist/` in `server.js`.
- Tooling: **PostCSS**, **Autoprefixer**, **pnpm**.

## Local Development

### Prerequisites
- Node.js ≥ 20
- pnpm (recommended) or npm

### Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The site will be available at http://localhost:4321

### Build for Production

```bash
# Generate static files
pnpm build

# Preview production build
pnpm preview
```

## Weekly Content Management

### Editing Seminar Data

1. Open `public/data/week.yml`
2. Update the week information (dates, status, etc.)
3. Modify the seminars list with current week's talks
4. Save the file - changes are reflected immediately in dev mode

### YAML Schema

```yaml
week:
  isoWeek: 34              # ISO week number
  start: August 18, 2025   # Week start date (Month DD, YYYY)
  end: August 24, 2025     # Week end date (Month DD, YYYY)
  timezone: Asia/Dubai     # IANA timezone
  status: open             # open|holiday|break|exams|cancelled
  note: ""                 # Optional status message

series:
  - code: ccms             # Series identifier
    label: CCMS Seminar    # Display name
    organisedBy: Centre... # Optional organizer

seminars:
  - series: ccms           # Must match series code
    speaker: Dr Jane Smith
    affiliation: University X
    title: Talk Title
    status: confirmed      # Optional: confirmed|cancelled|postponed|tentative
    start: 2025-08-20T12:00:00+04:00  # ISO 8601 with timezone
    end: 2025-08-20T13:00:00+04:00    # Optional
    location: Building A, Room 301
    abstract: |            # Markdown supported
      Abstract text here...
    links:                 # All optional
      speaker: https://...
      slides: https://...
      teams: https://...
    tags: [PDE, Analysis]  # Optional
```

## Features

### Seminar Status Handling
Individual seminars can have status indicators:
- `confirmed` (default) - Normal display
- `cancelled` - Shows with [CANCELLED] prefix, strike-through text, and red accent
- `postponed` - Shows with [POSTPONED] prefix and orange accent
- `tentative` - Shows with [TENTATIVE] prefix, dashed border, and blue accent

To skip a seminar series entirely for a week, simply omit it from the seminars list.

### Week Status Banners
The site automatically displays appropriate banners for the entire week:
- `open` - Default state, no banner shown
- `holiday` - University holiday
- `break` - Spring/summer break
- `exams` - Examination period
- `cancelled` - Week cancelled

Each banner can include a custom message via the `week.note` field. When no seminars are scheduled, the page shows an explanatory card that reuses the same note so visitors understand why the schedule is empty.

### Empty Week Handling
- Setting `seminars: []` (or omitting the list) renders a polished “No seminars scheduled” card instead of leaving the page blank.
- The card displays the note supplied in `week.note`, making it easy to announce holidays, academic breaks, or other pauses.

### Print/PDF Export
- Click "Print / Save PDF" button
- Browser opens print dialog
- Abstracts auto-expand in print version
- URLs shown after links for paper reference
- A4 page formatting applied

### Accessibility
- Semantic HTML structure
- Keyboard navigation for all interactive elements
- Screen reader compatible
- High contrast color scheme
- ARIA live regions for dynamic updates

### Security

- Abstract/biography HTML is minimally sanitized in `SeminarCard.astro` (`sanitizeHTML()`), and links use `rel="noopener noreferrer"`.
- No database or dynamic server required for the site. For stronger sanitization, consider integrating DOMPurify (package is available in dependencies) in the rendering path.

## Deployment

This is a static site. Deploy the contents of `dist/` to any static host (Nginx/Apache/Vercel/Netlify/etc.).

```bash
# Build static files
pnpm build

# Preview locally
pnpm preview

# Optional: serve dist/ with Express (useful on a bare VM)
node server.js
```

## File Structure

```text
ku-math-seminars/
├── src/
│   ├── components/
│   │   ├── WeekHeader.astro         # Week banner and controls
│   │   ├── SeriesSection.astro      # Group per series
│   │   ├── SeminarCard.astro        # Seminar card w/ status, abstract, links
│   │   └── icons/                    # Icon components (Astro SVGs)
│   ├── lib/
│   │   ├── types.ts                 # YAML schema types (WeekData, Seminar, ...)
│   │   ├── time.ts                  # Date/time formatting utilities
│   │   └── pdfGenerator.ts          # Class-based jsPDF poster generator
│   ├── pages/
│   │   └── index.astro              # Main page, YAML load, SEO/JSON-LD
│   └── index.css                    # Global styles (Tailwind layers, tokens)
├── public/
│   ├── data/week.yml                # Weekly seminars data (edit weekly)
│   ├── assets/                      # Logos, icons, favicons
│   └── styles/print.css             # Print styles for A4 export
├── astro.config.mjs                 # Astro config (+ Tailwind integration)
├── tailwind.config.ts               # Tailwind theme, tokens, animations
├── postcss.config.mjs               # PostCSS + Autoprefixer
├── server.js                        # Optional Express static server for dist/
├── package.json                     # Scripts and dependencies
├── pnpm-lock.yaml                   # Lockfile
└── tsconfig.json                    # TS configuration
```

## Data Flow and Content Model

- **Source**: `public/data/week.yml` holds `week`, optional `series[]`, and `seminars[]`.
- **Types**: Defined in `src/lib/types.ts` with `WeekStatus` and `SeminarStatus` enums.
- **Grouping**: `index.astro` groups seminars by `series` and renders known + unknown series in a stable order.
- **Status handling**: Cards reflect `confirmed|cancelled|postponed|tentative` with distinct visuals.

## SEO and Accessibility

- **SEO**: Dynamic title/description, meta keywords, OG/Twitter cards, JSON-LD for Organization, Website, CollectionPage, and Events generated in `index.astro`.
- **A11y**: Semantic structure, keyboard support for details/summary, skip links, high-contrast theme, ARIA live regions for dynamic updates.

## Troubleshooting

### YAML Not Loading
- Check browser console for errors
- Verify YAML syntax at [yamllint.com](https://www.yamllint.com/)
- Ensure file is saved as `public/data/week.yml`

### Print Issues
- Use Chrome/Edge for best PDF results
- Check print preview before saving
- Abstracts should auto-expand in print view

### Development Server Issues
- Clear browser cache
- Restart dev server: `pnpm dev`
- Check Node.js version ≥ 20
