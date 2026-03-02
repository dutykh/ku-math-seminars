# KU Math Seminars Website

Static Astro website for publishing weekly Mathematics Department seminars and faculty interview events at Khalifa University.

## Stack

- Astro 5 + TypeScript
- Tailwind CSS
- YAML data source (`public/data/week.yml`)
- Server-side Markdown rendering: `marked`
- Server-side HTML sanitization: `DOMPurify` + `jsdom`
- PDF export in browser: jsPDF (CDN)
- Optional runtime services: Express static server, GitHub webhook deployment server

## Project Structure

```text
src/
  components/
    WeekHeader.astro
    WeeklySummary.astro
    SeriesSection.astro
    SeminarCard.astro
    JobInterviewsSection.astro
    JobInterviewCard.astro
  lib/
    anchors.ts
    time.ts
    types.ts
    pdfGenerator.ts
  pages/
    index.astro
public/
  data/week.yml
  assets/
  styles/print.css
scripts/
  gen-og.js
  deploy.sh
server.js
webhook-server.js
RESTORE.md
```

## Local Development

Prerequisites:

- Node.js 20+
- pnpm

Commands:

```bash
pnpm install
pnpm dev
```

App URL: `http://localhost:4321`

## Build and Preview

```bash
# Recommended in CI/restricted environments
ASTRO_TELEMETRY_DISABLED=1 pnpm build

pnpm preview
```

`prebuild` runs `scripts/gen-og.js` to regenerate `public/assets/og-image.png` from `public/assets/og-image.svg`.

## Data Source

Weekly content is fully driven by:

- `public/data/week.yml`

High-level schema:

```yaml
week:
  isoWeek: 3
  start: January 12, 2026
  end: January 18, 2026
  timezone: Asia/Dubai
  status: open # open|holiday|break|exams|standby|cancelled
  semester: Fall 2025
  nextSemester: Spring 2026
  resumeDate: January 19, 2026
  note: Optional message

series:
  - code: ccms
    label: CCMS College Seminar
    organisedBy: Organizer names
    organisedByUrl: https://...

seminars:
  - series: ccms
    speaker: Dr Jane Smith
    affiliation: University X
    affiliationUrl: https://...
    title: Talk title
    start: 2026-01-14T12:00:00+04:00
    end: 2026-01-14T13:00:00+04:00
    location: Room / virtual
    status: confirmed # confirmed|cancelled|postponed|tentative
    abstract: |
      Markdown supported
    biography: |
      Markdown supported
    links:
      speaker: https://...
      slides: https://...
      teams: https://...
      zoom: https://...
      video: https://...
    tags: [PDE, Analysis]

interviews:
  - candidate: Dr Jane Smith
    candidateUrl: https://...
    position: Assistant Professor
    interviewType: teaching # teaching|research
    mode: virtual # virtual|in-person
    start: 2026-01-15T09:00:00+04:00
    end: 2026-01-15T09:45:00+04:00
    location: Virtual (Teams)
    organizedBy: [Panel member 1, Panel member 2]
    notes: Optional notes
    links:
      meeting: https://...
      cv: https://...
      profile: https://...
```

## Security Notes

- Abstract/biography Markdown is converted with `marked` and sanitized server-side with `DOMPurify` (`jsdom` window).
- Script/style/iframe/object/embed/form tags are blocked in rendered seminar content.
- External links use `target="_blank"` + `rel="noopener noreferrer"`.
- Webhook deployment endpoint now fails closed if `GITHUB_WEBHOOK_SECRET` is missing and rejects invalid signatures.

## Runtime Services

### Static server (optional)

```bash
node server.js
```

Default port: `3004` (override with `PORT`).

### Webhook deployment server (optional)

```bash
GITHUB_WEBHOOK_SECRET=... node webhook-server.js
```

Default port: `3005` (override with `WEBHOOK_PORT`).

Webhook behavior:

- Accepts GitHub `push` events only.
- Triggers deployment only for `refs/heads/main` or `refs/heads/master`.
- Executes `scripts/deploy.sh`.
- Deployment script restarts only `events-website` and `ku-math-seminars-webhook` PM2 processes.

## PDF / Print

- Header includes two export buttons (mobile + desktop), both bound to the same PDF export logic.
- Browser print stylesheet is in `public/styles/print.css`.
- Exported PDF includes overview + detail pages.

## Quality Checks

```bash
pnpm astro check
ASTRO_TELEMETRY_DISABLED=1 pnpm build
```

## License

GNU General Public License v3.0 (see `LICENSE`).
