import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getR2Client, getR2Config } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';

export const dynamic = 'force-dynamic';

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

    // Simpan ke database DULU (cepat, ~50ms) agar user tidak menunggu upload
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

    // Handle file upload ke Cloudflare R2 SETELAH DB save
    const file = formData.get('file') as File | null;
    if (file && file.size > 0) {
      const { bucket, publicUrl } = getR2Config();

      if (bucket && publicUrl) {
        try {
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

          // Update record dengan URL file
          answers.fileUrl = `${publicUrl}/${uniqueName}`;
          answers.fileName = file.name;

          await prisma.survey.update({
            where: { id: survey.id },
            data: { answers },
          });
        } catch (uploadError) {
          // File upload gagal, tapi data survey sudah tersimpan
          console.error('R2 upload error (survey already saved):', uploadError);
        }
      }
    }

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
