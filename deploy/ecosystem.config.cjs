// =====================================================================
// PM2 Ecosystem Configuration — FSYS360 Service (FozSistemas)
// =====================================================================

module.exports = {
  apps: [
    {
      name: 'fsys360-service',
      script: 'node_modules/.bin/tsx',
      args: 'server.ts',
      cwd: '/opt/fsys360-service',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '600M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_file: '/opt/fsys360-service/.env',
      time: true,
      error_file: '/var/log/fsys360/error.log',
      out_file: '/var/log/fsys360/out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      kill_timeout: 4000
    }
  ]
};
