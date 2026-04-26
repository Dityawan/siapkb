import { S3Client } from '@aws-sdk/client-s3';

/**
 * Cached R2/S3 client — instantiated once and reused across all requests.
 * Avoids the ~500ms-2s overhead of creating a new S3Client per request.
 */

let cachedClient: S3Client | null = null;

export function getR2Client(): S3Client {
  if (cachedClient) return cachedClient;

  cachedClient = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY!,
      secretAccessKey: process.env.R2_SECRET_KEY!,
    },
  });

  return cachedClient;
}

export function getR2Config() {
  return {
    bucket: process.env.R2_BUCKET || '',
    publicUrl: (process.env.R2_PUBLIC_URL || '').replace(/\/$/, ''),
  };
}
