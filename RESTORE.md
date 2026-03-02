# Restoring ku-math-seminars Website

This guide explains how to restore the ku-math-seminars website that was taken offline on 2026-01-24.

## What was stopped

1. **PM2 Process: events-website** - Astro preview server running on port 3004
2. **PM2 Process: ku-math-seminars-webhook** - GitHub webhook listener

## Quick Restore

To restore the website, run these commands from the ku-math-seminars directory:

```bash
cd /home/dds/www/ku-math-seminars

# Start the webhook listener
pm2 start ecosystem.webhook.config.cjs

# Start the Astro preview server
pm2 start pnpm --name "events-website" -- start

# Save the PM2 configuration
pm2 save
```

## Verification

After starting, verify the processes are running:

```bash
pm2 list
ps aux | grep -E "(ku-math|seminars|3004)"
```

## Notes

- The website files remain intact in `/home/dds/www/ku-math-seminars`
- The Git repository is preserved
- All dependencies in `node_modules` are still available
- No nginx configuration changes were made (check if nginx config exists)
- The domain was: events.denys-dutykh.com (port 3004)

## Full Setup (if needed)

If you need to rebuild from scratch:

```bash
cd /home/dds/www/ku-math-seminars

# Install dependencies
pnpm install

# Build the site
pnpm build

# Start services
pm2 start ecosystem.webhook.config.cjs
pm2 start pnpm --name "events-website" -- start
pm2 save
```
