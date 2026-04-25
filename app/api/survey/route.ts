import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const dynamic = 'force-dynamic';

function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY!,
      secretAccessKey: process.env.R2_SECRET_KEY!,
    },
  });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const company = formData.get('company') as string;
    const message = formData.get('message') as string;
    const answersStr = formData.get('answers') as string;
    
    let answers: any = {};
    try {
      if (answersStr) answers = JSON.parse(answersStr);
    } catch (e) {}

    // Validasi data dasar
    if (!name && !email && Object.keys(answers).length === 0) {
      return NextResponse.json({ success: false, error: "Data tidak boleh kosong" }, { status: 400 });
    }

    // Handle file upload ke Cloudflare R2
    const file = formData.get('file') as File | null;
    if (file && file.size > 0) {
      const bucket = process.env.R2_BUCKET;
      const publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, '');

      if (bucket && publicUrl) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const safeName = file.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9.\-_]/g, '');
        const uniqueName = `${Date.now()}-${safeName}`;

        const r2 = getR2Client();
        await r2.send(new PutObjectCommand({
          Bucket: bucket,
          Key: uniqueName,
          Body: buffer,
          ContentType: file.type,
          ContentLength: file.size,
        }));

        answers.fileUrl = `${publicUrl}/${uniqueName}`;
        answers.fileName = file.name;
      }
    }

    const survey = await prisma.survey.create({
      data: {
        name: name || null,
        email: email || null,
        phone: phone || null,
        company: company || null,
        message: message || null,
        answers: answers || null,
      },
    });

    return NextResponse.json({ success: true, data: survey }, { status: 201 });
  } catch (error) {
    console.error("Error submitting survey:", error);
    return NextResponse.json({ success: false, error: "Gagal menyimpan data survei" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const surveys = await prisma.survey.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json({ success: true, data: surveys }, { status: 200 });
  } catch (error) {
    console.error("Error fetching surveys:", error);
    return NextResponse.json({ success: false, error: "Gagal mengambil data survei" }, { status: 500 });
  }
}
