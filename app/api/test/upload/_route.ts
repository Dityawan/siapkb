import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
];

function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKey = process.env.R2_ACCESS_KEY;
  const secretKey = process.env.R2_SECRET_KEY;

  if (!accountId || !accessKey || !secretKey) {
    throw new Error('Konfigurasi Cloudflare R2 belum lengkap di .env (R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY)');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
  });
}

function generateSafeFilename(originalName: string): string {
  const timestamp = Date.now();
  const safeName = originalName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9.\-_]/g, '');
  return `${timestamp}-${safeName}`;
}

export async function POST(request: Request) {
  try {
    const bucket = process.env.R2_BUCKET;
    const publicUrl = process.env.R2_PUBLIC_URL;

    if (!bucket || !publicUrl) {
      return NextResponse.json(
        { success: false, error: 'Konfigurasi R2_BUCKET atau R2_PUBLIC_URL belum diisi di .env' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    // Validasi: file harus ada
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File tidak ditemukan dalam request' },
        { status: 400 }
      );
    }

    // Validasi: tipe file
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: `Tipe file tidak diizinkan. Hanya: JPG, PNG, WEBP, PDF` },
        { status: 400 }
      );
    }

    // Validasi: ukuran file (maks 5MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `Ukuran file melebihi batas maksimal 5MB. Ukuran file: ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 400 }
      );
    }

    // Konversi file ke Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filename = generateSafeFilename(file.name);

    // Upload ke Cloudflare R2
    const r2 = getR2Client();
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: filename,
      Body: buffer,
      ContentType: file.type,
      ContentLength: file.size,
    });

    await r2.send(command);

    // Hapus trailing slash dari publicUrl jika ada
    const baseUrl = publicUrl.replace(/\/$/, '');
    const fileUrl = `${baseUrl}/${filename}`;

    return NextResponse.json({
      success: true,
      message: 'File berhasil diunggah ke Cloudflare R2!',
      fileName: filename,
      originalName: file.name,
      fileSize: file.size,
      fileType: file.type,
      url: fileUrl,
    });

  } catch (error: any) {
    console.error('[R2 Upload Error]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mengunggah file ke R2' },
      { status: 500 }
    );
  }
}
