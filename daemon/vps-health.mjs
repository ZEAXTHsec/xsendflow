#!/usr/bin/env node

/**
 * 🏛️ XSendFlow VPS Health & Infrastructure Diagnostic CLI
 * 
 * Inspects server hardware, RAM allocation, CPU load, Node.js process health,
 * Supabase connectivity, and background campaign dispatch status.
 * 
 * Usage:
 *   node daemon/vps-health.mjs
 * Or:
 *   npm run vps:health
 */

import os from 'os';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Native Zero-Dependency .env.local reader
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [k, ...v] = trimmed.split('=');
        if (k && !process.env[k.trim()]) {
          process.env[k.trim()] = v.join('=').trim().replace(/^['"]|['"]$/g, '');
        }
      }
    }
  }
} catch {}

function formatBytes(bytes) {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(1)} MB`;
}

function formatDuration(seconds) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

async function runVpsHealth() {
  const hrStart = Date.now();
  console.log('========================================================================');
  console.log('🛡️  XSENDFLOW VPS & INFRASTRUCTURE HEALTH REPORT');
  console.log('========================================================================\n');

  // 1. VPS Host Hardware
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(1);
  const cpus = os.cpus();

  console.log('🖥️  VPS SERVER HARDWARE:');
  console.log(`   • Hostname:       ${os.hostname()}`);
  console.log(`   • Platform / OS:  ${os.type()} ${os.release()} (${os.arch()})`);
  console.log(`   • CPU Model:      ${cpus[0]?.model.trim()} (${cpus.length} Cores)`);
  console.log(`   • System Uptime:  ${formatDuration(os.uptime())}`);
  console.log(`   • Total RAM:      ${formatBytes(totalMem)}`);
  console.log(`   • Free RAM:       ${formatBytes(freeMem)} (${(100 - parseFloat(memUsagePercent)).toFixed(1)}% available)`);
  console.log(`   • RAM Utilized:   ${formatBytes(usedMem)} (${memUsagePercent}%)`);
  if (os.loadavg && os.loadavg().length) {
    const loads = os.loadavg().map(l => l.toFixed(2)).join(', ');
    console.log(`   • Load Average:   [${loads}] (1m, 5m, 15m)`);
  }

  // 2. Node.js Process Runtime
  const mem = process.memoryUsage();
  console.log('\n⚙️  NODE.JS ENGINE RUNTIME:');
  console.log(`   • Node Version:   ${process.version}`);
  console.log(`   • Process PID:    ${process.pid}`);
  console.log(`   • Process RSS:    ${formatBytes(mem.rss)}`);
  console.log(`   • V8 Heap Used:   ${formatBytes(mem.heapUsed)} / ${formatBytes(mem.heapTotal)}`);

  // 3. Supabase Cloud Connection & Database Queue
  console.log('\n🗄️  SUPABASE CLOUD DATABASE:');
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://putztvsdxuprkbxufrge.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1dHp0dnNkeHVwcmtieHVmcmdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyMzQ4MjIsImV4cCI6MjA5ODgxMDgyMn0.b2Xla5rxDtSYlF9pcouQS8do0LdXK_OKVeiW3w0PeJo';

  let dbStatus = '❌ Offline';
  let dbLatency = 0;
  let activeCampaigns = 0;

  try {
    const dbStart = Date.now();
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false }
    });

    const { count, error } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .in('status', ['in_progress', 'sending', 'scheduled']);

    dbLatency = Date.now() - dbStart;
    if (!error) {
      dbStatus = '✅ Connected & Healthy';
      activeCampaigns = count || 0;
    } else {
      dbStatus = `⚠️ Degraded: ${error.message}`;
    }
  } catch (e) {
    dbStatus = `❌ Error: ${e.message}`;
  }

  console.log(`   • Endpoint URL:   ${SUPABASE_URL}`);
  console.log(`   • Status:         ${dbStatus}`);
  console.log(`   • Query Latency:  ${dbLatency} ms`);
  console.log(`   • Active Queues:  ${activeCampaigns} campaigns in flight`);

  // 4. Daemon & Worker Services
  console.log('\n🤖 BACKGROUND DAEMON & WORKER:');
  console.log(`   • Worker Script:  daemon/vps-worker.mjs`);
  console.log(`   • PM2 Config:     daemon/ecosystem.config.cjs`);
  console.log(`   • Dispatch Route: /api/cron/dispatch`);
  console.log(`   • Health Route:   /api/health`);

  // 5. Overall Assessment
  console.log('\n========================================================================');
  const isHealthy = dbStatus.includes('Healthy') && parseFloat(memUsagePercent) < 90;
  if (isHealthy) {
    console.log(`🟢 OVERALL VPS STATUS: HEALTHY & OPERATIONAL (${Date.now() - hrStart} ms check)`);
  } else {
    console.log(`🟡 OVERALL VPS STATUS: ATTENTION REQUIRED (${Date.now() - hrStart} ms check)`);
  }
  console.log('========================================================================\n');
}

runVpsHealth();
