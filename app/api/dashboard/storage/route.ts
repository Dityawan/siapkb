import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getR2Client } from '@/lib/r2';

export const dynamic = 'force-dynamic';

// Storage API yang bisa diakses oleh semua user yang login (admin & superadmin)
export async function GET() {
  try {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKey = process.env.R2_ACCESS_KEY;
    const secretKey = process.env.R2_SECRET_KEY;
    const bucket = process.env.R2_BUCKET;

    if (!accountId || !accessKey || !secretKey || !bucket) {
      return NextResponse.json({ success: false, error: 'R2 not configured' }, { status: 500 });
    }

    // Ambil max GB dari database
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

    const r2 = getR2Client();

    let totalSize = 0, totalFiles = 0;
    let token: string | undefined;
    do {
      const res = await r2.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }));
      for (const obj of res.Contents || []) { totalSize += obj.Size || 0; totalFiles++; }
      token = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (token);

    return NextResponse.json({
      success: true,
      bucket,
      totalFiles,
      usedMB: parseFloat((totalSize / 1024 / 1024).toFixed(2)),
      usedGB: parseFloat((totalSize / 1024 / 1024 / 1024).toFixed(4)),
      freeTierGB: maxGb,
      usedPercent: parseFloat(((totalSize / (maxGb * 1024 * 1024 * 1024)) * 100).toFixed(2)),
    });
  } catch (e: any) {
    console.error('Storage API error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
