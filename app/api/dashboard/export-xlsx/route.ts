import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';

function getUserTypeLabel(userType: string) {
  const map: Record<string, string> = {
    general: 'Masyarakat Umum',
    healthcare: 'Tenaga Kesehatan',
    field: 'PKB/PLKB/Kader',
    manager: 'Pengelola Program',
  };
  return map[userType] || userType || '-';
}

function getCategoryLabel(mainCategory: string, reportCategory: string) {
  if (mainCategory === 'contraception') {
    const sub: Record<string, string> = { A: 'Komplikasi', B: 'Kegagalan', C: 'Kerusakan', D: 'Lainnya' };
    return `Alat dan obat kontrasepsi - ${sub[reportCategory] || reportCategory || ''}`;
  }
  const map: Record<string, string> = {
    sdm: 'Tenaga Pemberi Layanan KB',
    sarana: 'Sarana dan Prasarana Pelayanan KB',
    prosedur: 'Prosedur Layanan',
  };
  return map[mainCategory] || mainCategory || '-';
}

export async function GET() {
  try {
    const surveys = await prisma.survey.findMany({ orderBy: { createdAt: 'desc' } });

    const rows = surveys.map((s: any) => {
      const a = s.answers || {};
      const tanggalKirim = new Date(s.createdAt).toLocaleString('id-ID', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      });
      const alamat = a.alamatLengkap
        ? `${a.alamatLengkap}${a.kodePos ? ' (Kode Pos: ' + a.kodePos + ')' : ''}`
        : '-';

      return {
        'ID Laporan': s.id,
        'Tanggal Kirim': tanggalKirim,
        'Nama Pelapor': s.name || '-',
        'Email': s.email || '-',
        'No. HP': s.phone || '-',
        'Kategori Pelapor': getUserTypeLabel(a.userType),
        'Alamat Pelapor': alamat,
        'Instansi / Faskes / Wilayah': s.company || '-',
        'Unit Kerja': a.unitKerja || '-',
        'Alamat Instansi': a.alamatInstansi || '-',
        'Kategori Laporan': getCategoryLabel(a.mainCategory, a.reportCategory),
        'Tanggal Kejadian': a.tanggalKejadian || '-',
        'Tempat Kejadian': a.tempatKejadian || '-',
        'Jenis Pelayanan': a.jenisPelayanan || '-',
        'Jenis Alokon/BMHP': a.jenisAlokonBmhp || '-',
        'Isi Laporan': s.message || '-',
        'Lampiran URL': a.fileUrl || '-',
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();

    // Auto column width
    const colWidths = Object.keys(rows[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...rows.map((r: any) => String(r[key] || '').length), 15),
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Data Laporan');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="laporan-siapkb-${Date.now()}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating XLSX:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
