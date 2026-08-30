/*
 * KU Math Seminars - PM2 process definitions
 * Author: Dr. Denys Dutykh (Khalifa University of Science and Technology, Abu Dhabi, UAE)
 * License: GNU General Public License v3.0
 *
 * Both processes bind loopback only; Traefik is the sole public entry point.
 *
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 */

const path = require('node:path');

const cwd = __dirname;

module.exports = {
  apps: [
    {
      name: 'events-website',
      script: 'server.js',
      cwd,
      env: {
        NODE_ENV: 'production',
        PORT: 3004,
        HOST: '127.0.0.1'
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      error_file: path.join(cwd, 'logs/website-error.log'),
      out_file: path.join(cwd, 'logs/website-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'ku-math-seminars-webhook',
      script: 'webhook-server.js',
      cwd,
      // GITHUB_WEBHOOK_SECRET lives here, outside git (.env.webhook is ignored).
      env_file: '.env.webhook',
      env: {
        NODE_ENV: 'production',
        WEBHOOK_PORT: 3005,
        WEBHOOK_HOST: '127.0.0.1'
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      error_file: path.join(cwd, 'logs/webhook-error.log'),
      out_file: path.join(cwd, 'logs/webhook-out.log'),
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
