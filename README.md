# KU Math Seminars Website

A minimal, static website for displaying the weekly programme of Mathematics Department seminars at Khalifa University.

**Author:** Dr. Deny Dutykh (Khalifa University of Science and Technology, Abu Dhabi, UAE)  
**License:** GNU General Public License v3.0

## Overview

This site displays the current week's mathematics seminars across multiple series:
- CCMS Seminar (Centre for Computational and Mathematical Sciences)
- Math Seminar (General Mathematics Department)
- Financial Math Seminar
- Graduate Math Seminar
- Undergraduate Math Seminar

## Technical Stack

- **Astro 5** - Static site generator with islands architecture
- **TypeScript** - Type safety and better development experience
- **YAML** - Runtime data fetching for immediate updates
- **Lightweight CSS** - No external frameworks, optimized for performance
- **Print-ready** - A4 PDF export with proper formatting

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
  start: 2025-08-18        # Week start date (YYYY-MM-DD)
  end: 2025-08-24          # Week end date
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
    start: 2025-08-20T12:00:00+04:00  # ISO 8601 with timezone
    end: 2025-08-20T13:00:00+04:00    # Optional
    location: Building A, Room 301
    abstract: |            # Markdown supported
      Abstract text here...
    links:                 # All optional
      speaker: https://...
      slides: https://...
      zoom: https://...
    tags: [PDE, Analysis]  # Optional
```

## Features

### Status Banners
The site automatically displays appropriate banners for:
- `holiday` - University holiday
- `break` - Spring/summer break
- `exams` - Examination period
- `cancelled` - Week cancelled

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
- Markdown content sanitized with DOMPurify
- External links use `rel="noopener noreferrer"`
- No server-side code or database dependencies

## Deployment

This is a static site - upload the contents of `/dist/` to any web server:

```bash
# Build static files
pnpm build

# Contents of dist/ can be served by Apache, Nginx, etc.
```

## File Structure

```
ku-math-seminars/
├── src/
│   ├── lib/types.ts          # TypeScript definitions
│   └── pages/index.astro     # Main page
├── public/
│   ├── data/week.yml         # Seminar data (edit weekly)
│   ├── assets/ku-logo.svg    # University logo
│   └── styles/print.css      # Print stylesheet
├── astro.config.mjs          # Astro configuration
├── package.json              # Dependencies and scripts
└── tsconfig.json             # TypeScript configuration
```

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
