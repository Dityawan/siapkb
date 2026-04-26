import { NextResponse } from 'next/server';
import { ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getR2Client } from '@/lib/r2';

export const dynamic = 'force-dynamic';

// GET - List all files in R2 bucket
export async function GET() {
  try {
    const bucket = process.env.R2_BUCKET;
    const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, '');

    if (!bucket) {
      return NextResponse.json({ success: false, error: 'R2 bucket not configured' }, { status: 500 });
    }

    const r2 = getR2Client();
    const files: any[] = [];
    let token: string | undefined;

    do {
      const res = await r2.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token }));
      for (const obj of res.Contents || []) {
        files.push({
          key: obj.Key,
          size: obj.Size || 0,
          sizeMB: parseFloat(((obj.Size || 0) / 1024 / 1024).toFixed(3)),
          lastModified: obj.LastModified?.toISOString() || '',
          url: publicUrl ? `${publicUrl}/${obj.Key}` : '',
        });
      }
      token = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (token);

    // Sort by lastModified desc
    files.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

    return NextResponse.json({ success: true, files, total: files.length });
  } catch (e: any) {
    console.error('R2 list error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

// DELETE - Delete a file from R2 bucket
export async function DELETE(request: Request) {
  try {
    const { key } = await request.json();

    if (!key) {
      return NextResponse.json({ success: false, error: 'File key is required' }, { status: 400 });
    }

    const bucket = process.env.R2_BUCKET;
    if (!bucket) {
      return NextResponse.json({ success: false, error: 'R2 bucket not configured' }, { status: 500 });
    }

    const r2 = getR2Client();
    await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));

    return NextResponse.json({ success: true, message: `File "${key}" berhasil dihapus` });
  } catch (e: any) {
    console.error('R2 delete error:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
