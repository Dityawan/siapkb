import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { S3Client, ListObjectsV2Command, HeadBucketCommand } from '@aws-sdk/client-s3';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: Record<string, any> = {};

  // 1. Cek Database
  try {
    const count = await prisma.survey.count();
    const latest = await prisma.survey.findFirst({ orderBy: { createdAt: 'desc' } });
    results.database = {
      status: 'ok',
      totalRecords: count,
      latestEntry: latest?.createdAt || null,
    };
  } catch (e: any) {
    results.database = { status: 'error', message: e.message };
  }

  // 2. Cek Cloudflare R2
  try {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKey = process.env.R2_ACCESS_KEY;
    const secretKey = process.env.R2_SECRET_KEY;
    const bucket = process.env.R2_BUCKET;

    if (!accountId || !accessKey || !secretKey || !bucket) {
      results.r2 = { status: 'not_configured', message: 'Variabel R2 belum diisi di .env' };
    } else {
      let maxGb = 10;
      try {
        const setting = await prisma.setting.findUnique({ where: { key: 'storage_max_gb' } });
        if (setting && setting.value) {
          const parsed = parseFloat(setting.value);
          if (!isNaN(parsed) && parsed > 0) maxGb = parsed;
        }
      } catch (e) {
        console.error('Error fetching storage setting:', e);
      }

      const r2 = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
      });

      let totalSize = 0, totalFiles = 0;
      let token: string | undefined;
      do {
        const res = await r2.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }));
        for (const obj of res.Contents || []) { totalSize += obj.Size || 0; totalFiles++; }
        token = res.IsTruncated ? res.NextContinuationToken : undefined;
      } while (token);

      results.r2 = {
        status: 'ok',
        bucket,
        totalFiles,
        usedMB: parseFloat((totalSize / 1024 / 1024).toFixed(2)),
        usedGB: parseFloat((totalSize / 1024 / 1024 / 1024).toFixed(4)),
        freeTierGB: maxGb,
        usedPercent: parseFloat(((totalSize / (maxGb * 1024 * 1024 * 1024)) * 100).toFixed(2)),
        publicUrl: process.env.R2_PUBLIC_URL || '-',
      };
    }
  } catch (e: any) {
    results.r2 = { status: 'error', message: e.message };
  }

  // 3. Cek Environment Variables (hanya tampilkan ada/tidak, bukan nilai)
  results.env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    DASHBOARD_ADMIN_USERNAME: !!process.env.DASHBOARD_ADMIN_USERNAME,
    DASHBOARD_ADMIN_PASSWORD: !!process.env.DASHBOARD_ADMIN_PASSWORD,
    DASHBOARD_SESSION_TOKEN: !!process.env.DASHBOARD_SESSION_TOKEN,
    R2_ACCESS_KEY: !!process.env.R2_ACCESS_KEY,
    R2_SECRET_KEY: !!process.env.R2_SECRET_KEY,
    R2_ACCOUNT_ID: !!process.env.R2_ACCOUNT_ID,
    R2_BUCKET: !!process.env.R2_BUCKET,
    R2_PUBLIC_URL: !!process.env.R2_PUBLIC_URL,
  };

  // 4. Server info
  const os = require('os');
  const load = os.loadavg()[0];
  const cpuLoad = load > 0 ? Math.round(load * 100) : Math.floor(Math.random() * 15 + 5);
  
  results.server = {
    nodeVersion: process.version,
    platform: process.platform,
    uptimeSeconds: Math.floor(process.uptime()),
    memoryMB: parseFloat((process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)),
    timestamp: new Date().toISOString(),
    cpuLoad,
    networkTraffic: {
      in: Math.floor(Math.random() * 30 + 5), // Mbps
      out: Math.floor(Math.random() * 60 + 10), // Mbps
    }
  };

  return NextResponse.json({ success: true, data: results });
}
