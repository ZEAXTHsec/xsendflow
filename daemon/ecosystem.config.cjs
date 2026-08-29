module.exports = {
  apps: [
    {
      name: 'xsendflow-worker',
      script: './daemon/vps-worker.mjs',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};