import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const DEFAULT_SETTINGS: Record<string, { value: string; label: string }> = {
  storage_show_on_dashboard: { value: 'true', label: 'Tampilkan widget storage di Dashboard' },
  storage_max_gb: { value: '10', label: 'Kapasitas maksimal storage (GB)' },
  storage_warning_percent: { value: '80', label: 'Persentase peringatan storage (%)' },
  survey_response_limit: { value: '1000', label: 'Batas maksimal form respons' },
};

export async function GET() {
  try {
    const dbSettings = await prisma.setting.findMany();
    
    // Gabungkan dengan default
    const result: Record<string, any> = {};
    for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) {
      const found = dbSettings.find((s: any) => s.key === key);
      result[key] = {
        value: found?.value ?? def.value,
        label: def.label,
      };
    }
    
    return NextResponse.json({ success: true, data: result });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    for (const [key, value] of Object.entries(body)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value), label: DEFAULT_SETTINGS[key]?.label || key },
      });
    }
    
    return NextResponse.json({ success: true, message: 'Pengaturan berhasil disimpan' });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
