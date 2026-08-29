module.exports = {
  apps: [
    {
      name: 'xsendflow-worker',
      script: './server/worker.mjs',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      restart_delay: 5000,
      exp_backoff_restart_delay: 100,
      max_restarts: 50,
      min_uptime: '10s',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
