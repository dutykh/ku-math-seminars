module.exports = {
  apps: [
    {
      name: 'ku-math-seminars-webhook',
      script: 'webhook-server.js',
      cwd: '/home/dds/www/ku-math-seminars',
      env_file: '.env.webhook',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      log_file: './logs/webhook.log',
      error_file: './logs/webhook-error.log',
      out_file: './logs/webhook-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
