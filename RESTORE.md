<!--
  KU Math Seminars - Restore Guide
  Author: Dr. Denys Dutykh (Khalifa University of Science and Technology, Abu Dhabi, UAE)
  License: GNU General Public License v3.0
-->

# Restore Guide

How to bring <https://www.events.denys-dutykh.com> back up on the VPS after the
processes or the Traefik route have been removed.

The site is down when both of these are true:

- nothing is listening on `127.0.0.1:3004`, and
- `curl -sSI https://www.events.denys-dutykh.com/` returns Traefik's bare
  `404` with `content-length: 19` and no `strict-transport-security` header
  (that header is proof the request reached `server.js`).

## 0. Prerequisites

```bash
node -v            # must be >= 22.12.0 (Astro 7 requirement)
pnpm -v
pm2 -v
```

If Node is older than 22.12 the build will fail. Install a newer Node before
continuing; nothing else in this guide will work around it.

## 1. Build

```bash
cd /path/to/ku-math-seminars      # e.g. /home/dds/www/ku-math-seminars
git pull --ff-only origin main
pnpm install --frozen-lockfile
ASTRO_TELEMETRY_DISABLED=1 pnpm build
```

A successful build ends with `[build] Complete!` and leaves `dist/index.html`,
`dist/archive.html`, `dist/404.html`, `dist/seminars.ics` and
`dist/sitemap-index.xml` in place.

If the build fails with a message naming a field in `data/week.yml`, that is the
schema validation doing its job: fix the field it names and rebuild.

## 2. Webhook secret

Only needed if GitHub delivers push events to this VPS.

```bash
echo "GITHUB_WEBHOOK_SECRET=<the secret configured in the GitHub repo>" > .env.webhook
chmod 600 .env.webhook
```

The webhook rejects every request when this is missing, by design.

## 3. Start both processes

```bash
pm2 start ecosystem.config.cjs
pm2 save
```

This starts `events-website` (port 3004) and `ku-math-seminars-webhook`
(port 3005). Both bind `127.0.0.1` only.

Verify locally, before touching Traefik:

```bash
pm2 list
curl -sSI http://127.0.0.1:3004/ | head -5
curl -fsS http://127.0.0.1:3005/health      # "Webhook server is running"
```

`curl -sSI http://127.0.0.1:3004/` must show `strict-transport-security`,
`x-content-type-options`, `referrer-policy`, `x-frame-options` and
`permissions-policy`. If it does not, `server.js` is not the process answering.

## 4. Restore the Traefik route

The router and service are in `deploy/traefik-events.yml`. Copy that block into
the dynamic configuration, adjusting the entryPoint name (`websecure`) and
`certResolver` (`letsencrypt`) to match `/etc/traefik/traefik.yml`:

```bash
sudo cp deploy/traefik-events.yml /etc/traefik/dynamic/events.yml
```

Traefik watches the dynamic directory and reloads on its own; no restart is
needed. Confirm it loaded:

```bash
sudo journalctl -u traefik -n 50 --no-pager
```

Install `deploy/traefik-webhook.yml` as well **only** if GitHub must reach the
webhook over the internet. If deployments are run by hand
(`bash scripts/deploy.sh`), leave it out and keep port 3005 unreachable.

## 5. Verify the live site

```bash
curl -sSI https://www.events.denys-dutykh.com/
curl -sSI https://events.denys-dutykh.com/          # expect 301 to the www host
curl -fsS  https://www.events.denys-dutykh.com/seminars.ics | head -5
curl -sS -o /dev/null -w '%{http_code}\n' https://www.events.denys-dutykh.com/no-such-page
```

Expected:

- `200` with the full set of security headers on the canonical host
- `301` from the apex host to `www`
- a `BEGIN:VCALENDAR` document from the calendar feed
- `404`, not `200`, for an unknown path

Then open the site and check that `/archive` lists the past weeks and that
**Export PDF** downloads the weekly poster.

## Routine updates

Once running, publishing a new week is just:

```bash
# edit data/week.yml, then
git commit -am "Week NN programme" && git push
```

The webhook runs `scripts/deploy.sh`, which pulls, installs from the lockfile,
rebuilds and restarts both PM2 processes. To deploy by hand instead:

```bash
bash scripts/deploy.sh
```

## Troubleshooting

**Traefik returns 404 with `content-length: 19`.** No router matched. The
`events-router` block is missing from the dynamic configuration; redo step 4.

**Traefik returns 502.** The route exists but nothing is listening on 3004.
`pm2 list`, then `pm2 logs events-website --lines 50`.

**`server.js` exits immediately with "No build found".** `dist/` is missing;
redo step 1.

**The webhook returns 401.** The signature did not verify: the secret in
`.env.webhook` does not match the one configured in the GitHub repository.

**The webhook returns 503.** `GITHUB_WEBHOOK_SECRET` is not set in the process
environment. Check `.env.webhook` exists, then `pm2 restart ku-math-seminars-webhook --update-env`.

**The webhook returns 409.** A deployment is already running. This is the
concurrency guard; wait for it to finish.
