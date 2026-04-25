import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
    return `Alat & obat kontrasepsi - ${sub[reportCategory] || reportCategory || ''}`;
  }
  const map: Record<string, string> = {
    sdm: 'Tenaga Pemberi Layanan KB',
    sarana: 'Sarana & Prasarana KB',
    prosedur: 'Prosedur Layanan',
  };
  return map[mainCategory] || mainCategory || '-';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const where: any = {};
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    const surveys = await prisma.survey.findMany({ where, orderBy: { createdAt: 'desc' } });

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });

    // Header
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(18);
    doc.setTextColor(30, 64, 175);
    doc.text('SIAP KB - Rekap Data Laporan Lengkap', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('Saluran Informasi dan Aduan Kualitas Pelayanan KB', pageWidth / 2, 22, { align: 'center' });
    doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}  ·  Total Laporan: ${surveys.length}`, pageWidth / 2, 28, { align: 'center' });

    // Tabel
    const head = [[
      'No', 
      'Waktu Kirim', 
      'Identitas Pelapor', 
      'Profil & Instansi', 
      'Kategori Laporan', 
      'Detail Kejadian', 
      'Isi Laporan',
      'Lampiran'
    ]];

    const body = surveys.map((s: any, i: number) => {
      const a = s.answers || {};
      
      const waktuKirim = new Date(s.createdAt).toLocaleString('id-ID', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      const identitas = `${s.name || '-'}\nHP: ${s.phone || '-'}\nEmail: ${s.email || '-'}\nAlamat: ${a.alamatLengkap || '-'} ${a.kodePos ? '('+a.kodePos+')' : ''}`;
      
      const profilInstansi = `Tipe: ${getUserTypeLabel(a.userType)}\nInstansi: ${s.company || '-'}\nUnit: ${a.unitKerja || '-'}\nAlamat Instansi: ${a.alamatInstansi || '-'}`;

      const detailKejadian = `Tgl: ${a.tanggalKejadian || '-'}\nTempat: ${a.tempatKejadian || '-'}\nAlmt Tempat: ${a.alamatTempatPelayanan || '-'}\nPelayanan: ${a.jenisPelayanan || '-'}\nAlokon/BMHP: ${a.jenisAlokonBmhp || '-'}`;

      return [
        i + 1,
        waktuKirim,
        identitas,
        profilInstansi,
        getCategoryLabel(a.mainCategory, a.reportCategory),
        detailKejadian,
        s.message || '-',
        a.fileUrl || '-'
      ];
    });

    autoTable(doc, {
      startY: 35,
      head,
      body,
      styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak', valign: 'top' },
      headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold', valign: 'middle' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 10 },    // No
        1: { cellWidth: 25 },    // Waktu Kirim
        2: { cellWidth: 50 },    // Identitas
        3: { cellWidth: 50 },    // Profil & Instansi
        4: { cellWidth: 40 },    // Kategori Laporan
        5: { cellWidth: 60 },    // Detail Kejadian
        6: { cellWidth: 'auto' }, // Isi Laporan
        7: { cellWidth: 40 },    // Lampiran
      },
      margin: { left: 10, right: 10 },
    });

    // Footer halaman
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 5, { align: 'center' });
    }

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="laporan-siapkb-${Date.now()}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
