# Restore Guide

This guide restores the KU Math Seminars website and webhook deployment service after they were stopped.

## Services

- `events-website`: Astro preview/static service (port `3004`)
- `ku-math-seminars-webhook`: GitHub webhook listener (port `3005`)

## Prerequisites

- Project directory exists (example: `/home/dds/www/ku-math-seminars`)
- `pnpm` dependencies installed
- `pm2` installed
- `GITHUB_WEBHOOK_SECRET` configured for webhook process

## Quick Restore

```bash
cd /home/dds/www/ku-math-seminars

# Ensure dependencies and build are current
pnpm install
ASTRO_TELEMETRY_DISABLED=1 pnpm build

# Start webhook listener (requires secret in ecosystem/env)
pm2 start ecosystem.webhook.config.cjs

# Start website
pm2 start pnpm --name "events-website" -- start

# Persist PM2 process list
pm2 save
```

## Verify

```bash
pm2 list
pm2 logs events-website --lines 50
pm2 logs ku-math-seminars-webhook --lines 50
curl -fsS http://127.0.0.1:3005/health
```

Expected:

- Both PM2 processes are `online`
- Webhook health endpoint returns: `Webhook server is running`

## If Webhook Fails

Common cause: missing `GITHUB_WEBHOOK_SECRET`.

The webhook server now rejects requests when this secret is absent. Configure it in `ecosystem.webhook.config.cjs` or your process environment, then restart:

```bash
pm2 restart ku-math-seminars-webhook
```

## Full Rebuild Path

```bash
cd /home/dds/www/ku-math-seminars
pnpm install
ASTRO_TELEMETRY_DISABLED=1 pnpm build
pm2 restart events-website
pm2 restart ku-math-seminars-webhook
pm2 save
```
