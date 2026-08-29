#!/bin/bash
# ==============================================================================
# XSENDFLOW PM2 AUTO-HEAL & STARTUP WATCHDOG SCRIPT
# Host: Oracle Linux / Ubuntu VPS (68.233.104.131)
# ==============================================================================

set -e

echo "🚀 Configuring XSendFlow PM2 Watchdog Daemon..."

# Ensure PM2 is installed globally
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2 globally via npm..."
    npm install -g pm2
fi

# Stop existing worker instance if running
pm2 delete xsendflow-worker 2>/dev/null || true

# Start worker with production ecosystem config
echo "⚡ Starting xsendflow-worker with auto-restart..."
pm2 start server/ecosystem.config.cjs

# Save PM2 process list
echo "💾 Saving PM2 process snapshot..."
pm2 save

# Setup systemd auto-startup hook across VPS kernel reboots
echo "🔄 Configuring system startup daemon..."
pm2 startup systemd -u $(whoami) --hp $HOME 2>/dev/null || pm2 startup

pm2 save

echo "=============================================================================="
echo "✅ PM2 WATCHDOG ACTIVE & ARMED ACROSS SERVER REBOOTS!"
echo "Status check: pm2 status"
echo "Live logs:    pm2 logs xsendflow-worker"
echo "=============================================================================="
