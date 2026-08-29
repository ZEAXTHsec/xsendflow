# 🏛️ XSendFlow VPS Background Worker Daemon

A persistent, enterprise-grade Node.js worker that runs 24/7 on your VPS (Ubuntu/Debian, Docker, or AWS/Hetzner/DigitalOcean) to manage email campaigns with continuous Supabase synchronization.

---

## ⚡ Quick Start

### 1. Configure Environment Variables
Create or copy `.env.local` on your VPS:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://putztvsdxuprkbxufrge.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=https://xsendflow.com
```

### 2. Start with PM2 (Recommended)
```bash
npm install -g pm2
npm install
pm2 start daemon/ecosystem.config.cjs
pm2 save
pm2 startup
```

### 3. Or Run as a Systemd Service
Create `/etc/systemd/system/xsendflow-worker.service`:
```ini
[Unit]
Description=XSendFlow VPS Campaign Worker Daemon
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/xsendflow
ExecStart=/usr/bin/node daemon/vps-worker.mjs
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```
Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable xsendflow-worker
sudo systemctl start xsendflow-worker
sudo journalctl -u xsendflow-worker -f
```

---

## 🛡️ Deliverability Safety Architecture

1. **Automatic Timezone Windows**: Dispatches emails only when the target clock is inside the client's scheduled window (e.g. 10:00 AM - 2:00 PM USA EST).
2. **Mailbox Safety Caps**: Caps each inbox at 40–50 emails/day to preserve SPF/DKIM domain reputation.
3. **Gaussian Pacing**: Randomizes delay intervals (35s–55s) between consecutive emails to mimic human behavior.
4. **Atomic Supabase Updates**: Records delivery statuses, interaction timestamps, and sender account allocations in real time.