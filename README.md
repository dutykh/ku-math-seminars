<!--
  KU Math Seminars - Project README
  Author: Dr. Denys Dutykh (Khalifa University of Science and Technology, Abu Dhabi, UAE)
  License: GNU General Public License v3.0
-->

# KU Math Seminars

Static website publishing the weekly seminar programme and faculty interview
schedule of the **Mathematics Department, Khalifa University of Science and
Technology**, Abu Dhabi, UAE.

**Deployed at: <https://www.events.denys-dutykh.com>**

The apex host `events.denys-dutykh.com` redirects to the `www` host, which is
the canonical origin. The site runs on a VPS behind Traefik; see
[Deployment](#deployment).

## What the site does

- Shows the current week's seminars, grouped by series, with abstracts and
  speaker biographies.
- Shows faculty job interviews (teaching and research sessions) when scheduled.
- Displays a banner when the week is a holiday, a break, an exam period, on
  standby between semesters, or cancelled.
- Exports the whole week as a multi-page A4 PDF poster, generated in the browser.
- Publishes a subscribable iCalendar feed at `/seminars.ics`.
- Keeps every past week at `/archive`.

Everything on the page is driven by one hand-edited YAML file.

## Stack

| Concern | Choice |
|---|---|
| Framework | Astro 7 (static output, no adapter) |
| Styling | Tailwind CSS 4 via `@tailwindcss/vite` (CSS-first config, no `tailwind.config.*`) |
| Fonts | Inter, self-hosted through `@fontsource-variable/inter` |
| Data | YAML in `data/`, validated at build time with zod (`astro/zod`) |
| Markdown | `marked`, sanitized server-side with DOMPurify + jsdom |
| PDF export | `jspdf`, bundled and loaded on demand |
| Runtime | Node ≥ 22.12, Express static server, PM2, Traefik |

## Updating the weekly programme

Edit **`data/week.yml`**, commit, push. That is the whole workflow.

`data/templates/newevent.yml` holds blank seminar and interview stanzas to copy
from. Past weeks are moved into `data/archives/<year>-<isoWeek>-week.yml`, where
the archive page picks them up automatically.

None of these files are served: they live outside `public/`, are read at build
time, and are validated before the build succeeds. A malformed timestamp, an
unknown status value or a missing required field fails the build with the
offending field named, rather than shipping a broken page.

### Schema

```yaml
week:
  isoWeek: 3                       # 1-53
  start: January 12, 2026          # "Month DD, YYYY"
  end: January 18, 2026
  timezone: Asia/Dubai             # IANA zone; defaults to Asia/Dubai
  status: open                     # open | holiday | break | exams | standby | cancelled
  semester: Fall 2025              # optional
  nextSemester: Spring 2026        # optional
  resumeDate: January 19, 2026     # optional
  note: Optional banner message

series:
  - code: ccms
    label: CCMS College Seminar
    organisedBy: Organizer names
    organisedByUrl: https://...

seminars:
  - series: ccms                   # must match a series code
    speaker: Dr Jane Smith
    affiliation: University X
    affiliationUrl: https://...
    title: Talk title
    start: 2026-01-14T12:00:00+04:00   # ISO 8601 with offset
    end: 2026-01-14T13:00:00+04:00
    location: Room / virtual
    status: confirmed              # confirmed | cancelled | postponed | tentative
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
    interviewType: teaching        # teaching | research
    mode: virtual                  # virtual | in-person
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

To skip a series for a week, simply omit its seminars. Cancelled seminars are
shown on the page with a badge but excluded from the calendar feed.

## Project structure

```text
data/
  week.yml                  the current week (the file to edit)
  archives/                 past weeks, rendered at /archive
  templates/newevent.yml    blank stanzas to copy from
assets-src/
  KUMathLogo-master.png     4268px master; the served copy is generated
src/
  layouts/BaseLayout.astro  document shell: meta, icons, analytics, CSP surface
  pages/
    index.astro             the current week
    archive.astro           every archived week
    seminars.ics.ts         iCalendar feed
    404.astro
  components/
    WeekHeader.astro        logos, week range, Export PDF
    WeeklySummary.astro     "week at a glance" table of contents
    SeriesSection.astro     one seminar series
    SeminarCard.astro       one seminar
    JobInterviewsSection.astro, JobInterviewCard.astro
    SiteFooter.astro
    ui/Button.astro, icons/
  lib/
    schema.ts               zod schemas; all types are inferred from here
    data.ts                 build-time YAML loading and validation
    markdown.ts             marked + DOMPurify sanitization
    time.ts                 date, time-range and timezone formatting
    anchors.ts              stable anchor ids
  scripts/pdf-export.ts     browser PDF generation (dynamically imported)
  index.css                 design tokens, @theme, base and component layers
public/
  assets/                   logos, icons, OG image
  styles/print.css          print stylesheet
  robots.txt, site.webmanifest
scripts/
  build-assets.js           derives og-image.png and the sized math logo
  deploy.sh                 pull, install, build, restart (webhook target)
deploy/
  traefik-events.yml        Traefik router + service for the site
  traefik-webhook.yml       optional Traefik route for the GitHub webhook
server.js                   production static server (port 3004)
webhook-server.js           GitHub deployment webhook (port 3005)
ecosystem.config.cjs        PM2 definitions for both processes
```

## Local development

Requires **Node ≥ 22.12** (Astro 7) and pnpm.

```bash
pnpm install
pnpm dev            # http://localhost:4321
```

Build and serve exactly what production serves:

```bash
ASTRO_TELEMETRY_DISABLED=1 pnpm build
pnpm start          # http://127.0.0.1:3004
```

`pnpm build` runs `scripts/build-assets.js` first, regenerating
`public/assets/og-image.png` from `og-image.svg` and the 256px math logo from
the master in `assets-src/`.

Checks:

```bash
pnpm check          # astro check: types and templates
pnpm audit          # dependency advisories; expected to be clean
```

## Security model

- **Content-Security-Policy** is generated by Astro (`security.csp`) and emitted
  as a `<meta>` element carrying a SHA-256 hash for every inline script and
  style. There is no `'unsafe-inline'`. The only permitted third-party script
  origin is `https://www.googletagmanager.com`.
- **Transport and framing headers** (HSTS, `X-Content-Type-Options`,
  `Referrer-Policy`, `X-Frame-Options`, `Cross-Origin-Opener-Policy`,
  `Permissions-Policy`) are sent by `server.js`. A meta CSP cannot express
  them, so ownership is split cleanly and the two never conflict.
- **No third-party assets.** Fonts are self-hosted and jsPDF is bundled; the
  browser makes no request to any CDN.
- **Seminar Markdown** is converted and sanitized at build time (`marked` +
  DOMPurify over a jsdom window). `script`, `style`, `iframe`, `object`,
  `embed`, `form` and `base` are stripped, as are `style` attributes. Outbound
  links get `target="_blank"` plus `rel="noopener noreferrer"` through a
  DOMPurify `afterSanitizeAttributes` hook.
- **Both Node processes bind `127.0.0.1`.** Traefik is the only public entry
  point.
- **The webhook fails closed.** Without `GITHUB_WEBHOOK_SECRET` every request is
  rejected; signatures are compared with `crypto.timingSafeEqual`, and only
  `push` events on `main`/`master` trigger a deployment. Concurrent deployments
  are prevented by an in-process guard and an `flock` in `deploy.sh`.
- **Deployments install from the lockfile** (`pnpm install --frozen-lockfile`),
  so a webhook can never resolve new dependency versions.

## Deployment

Runs on a VPS (Ubuntu Server) as two PM2 processes behind Traefik.

| Process | Port | Purpose |
|---|---|---|
| `events-website` | 3004 | serves `dist/` via `server.js` |
| `ku-math-seminars-webhook` | 3005 | GitHub push webhook, runs `scripts/deploy.sh` |

```bash
cd /path/to/ku-math-seminars
pnpm install --frozen-lockfile
ASTRO_TELEMETRY_DISABLED=1 pnpm build
pm2 start ecosystem.config.cjs
pm2 save
```

Responses are compressed by Traefik's `compress` middleware rather than in the
Node process (the archive page is roughly 590 KB of HTML raw and 57 KB gzipped,
so this is not optional). The middleware is part of
`deploy/traefik-events.yml`.

Traefik: copy `deploy/traefik-events.yml` into the dynamic configuration
directory (and `deploy/traefik-webhook.yml` only if GitHub must reach the
webhook over the internet), adjusting the entryPoint and `certResolver` names to
match `/etc/traefik/traefik.yml`.

The webhook secret belongs in `.env.webhook` (gitignored), which PM2 loads:

```bash
echo "GITHUB_WEBHOOK_SECRET=<the secret configured in GitHub>" > .env.webhook
chmod 600 .env.webhook
```

See [RESTORE.md](RESTORE.md) for bringing the site back up from a stopped state.

## License

GNU General Public License v3.0. See [LICENSE](LICENSE).
