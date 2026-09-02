import { NextRequest, NextResponse } from 'next/server';
import os from 'os';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(2)} GB`;
  }
  return `${mb.toFixed(1)} MB`;
}

function formatDuration(seconds: number): string {
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

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let dbLatencyMs = 0;
  let activeCampaignsCount = 0;

  // 1. Supabase Database Ping
  try {
    const dbStart = Date.now();
    const supabase = createAdminClient();
    const { count, error } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .in('status', ['in_progress', 'sending', 'scheduled']);

    dbLatencyMs = Date.now() - dbStart;
    if (!error) {
      dbStatus = 'connected';
      activeCampaignsCount = count ?? 0;
    } else {
      dbStatus = 'degraded';
    }
  } catch {
    dbStatus = 'error';
  }

  // 2. System Resources
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(1);

  const procMem = process.memoryUsage();
  const isHealthy = dbStatus !== 'error';

  const healthPayload = {
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'XSendFlow Cold Outreach Engine',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    executionTimeMs: Date.now() - startTime,
    vps: {
      platform: os.platform(),
      release: os.release(),
      architecture: os.arch(),
      hostname: os.hostname(),
      uptime: formatDuration(os.uptime()),
      cpuCount: os.cpus().length,
      cpuModel: os.cpus()[0]?.model || 'Standard CPU',
      loadAverage: os.loadavg ? os.loadavg() : [0, 0, 0],
      memory: {
        total: formatBytes(totalMem),
        used: formatBytes(usedMem),
        free: formatBytes(freeMem),
        usagePercent: `${memUsagePercent}%`
      }
    },
    node: {
      version: process.version,
      pid: process.pid,
      uptime: formatDuration(process.uptime()),
      memory: {
        rss: formatBytes(procMem.rss),
        heapTotal: formatBytes(procMem.heapTotal),
        heapUsed: formatBytes(procMem.heapUsed),
        external: formatBytes(procMem.external)
      }
    },
    database: {
      provider: 'Supabase Cloud PostgreSQL',
      status: dbStatus,
      latencyMs: dbLatencyMs,
      activeCampaignsInQueue: activeCampaignsCount
    },
    daemon: {
      workerScript: 'daemon/vps-worker.mjs',
      pm2Config: 'daemon/ecosystem.config.cjs',
      cronEndpoint: '/api/cron/dispatch',
      status: 'operational'
    }
  };

  return NextResponse.json(healthPayload, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
    }
  });
}
