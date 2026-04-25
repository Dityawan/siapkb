import { NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKey = process.env.R2_ACCESS_KEY;
    const secretKey = process.env.R2_SECRET_KEY;
    const bucket = process.env.R2_BUCKET;

    if (!accountId || !accessKey || !secretKey || !bucket) {
      return NextResponse.json({ success: false, error: 'Konfigurasi R2 belum lengkap di .env' }, { status: 500 });
    }

    // Get max GB setting from database
    let maxGb = 10;
    try {
      const setting = await prisma.setting.findUnique({ where: { key: 'storage_max_gb' } });
      if (setting && setting.value) {
        const parsed = parseFloat(setting.value);
        if (!isNaN(parsed) && parsed > 0) {
          maxGb = parsed;
        }
      }
    } catch (e) {
      console.error('Error fetching storage setting:', e);
    }

    const r2 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    });

    // List semua objek di bucket dan hitung total ukurannya
    let totalSize = 0;
    let totalFiles = 0;
    let continuationToken: string | undefined = undefined;

    do {
      const command: ListObjectsV2Command = new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
      });
      const response = await r2.send(command);

      for (const obj of response.Contents || []) {
        totalSize += obj.Size || 0;
        totalFiles++;
      }

      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);

    const maxBytes = maxGb * 1024 * 1024 * 1024;
    const usedPercent = (totalSize / maxBytes) * 100;

    return NextResponse.json({
      success: true,
      bucket,
      totalFiles,
      usedBytes: totalSize,
      usedMB: parseFloat((totalSize / 1024 / 1024).toFixed(2)),
      usedGB: parseFloat((totalSize / 1024 / 1024 / 1024).toFixed(4)),
      freeTierGB: maxGb,
      usedPercent: parseFloat(usedPercent.toFixed(2)),
    });

  } catch (error: any) {
    console.error('[R2 Storage Check Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
