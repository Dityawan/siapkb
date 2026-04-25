import { NextResponse } from 'next/server';
import { getSurveiReports, insertSurveiReport } from '@/lib/survei-repository';

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const nama = getFormValue(formData, 'nama');
    const noHp = getFormValue(formData, 'noHp');
    const isiLaporan = getFormValue(formData, 'isiLaporan');

    if (!nama || !noHp || !isiLaporan) {
      return NextResponse.json(
        { message: 'Data wajib belum lengkap (nama, no HP, isi laporan).' },
        { status: 400 },
      );
    }

    const foto = formData.get('foto');
    const fotoFile = foto instanceof File ? foto : null;

    const rawPayload: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') {
        rawPayload[key] = value;
      }
    }

    const insertId = await insertSurveiReport({
      userType: getFormValue(formData, 'userType'),
      mainCategory: getFormValue(formData, 'mainCategory'),
      reportCategory: getFormValue(formData, 'reportCategory'),
      nama,
      noHp,
      email: getFormValue(formData, 'email'),
      alamatPelapor: getFormValue(formData, 'alamat'),
      alamatPelaporProvinsiId: getFormValue(formData, 'alamat_pelapor_provinsi_id'),
      alamatPelaporProvinsiNama: getFormValue(formData, 'alamat_pelapor_provinsi_nama'),
      alamatPelaporKabupatenId: getFormValue(formData, 'alamat_pelapor_kabupaten_id'),
      alamatPelaporKabupatenNama: getFormValue(formData, 'alamat_pelapor_kabupaten_nama'),
      alamatPelaporKecamatanId: getFormValue(formData, 'alamat_pelapor_kecamatan_id'),
      alamatPelaporKecamatanNama: getFormValue(formData, 'alamat_pelapor_kecamatan_nama'),
      alamatPelaporKelurahanId: getFormValue(formData, 'alamat_pelapor_kelurahan_id'),
      alamatPelaporKelurahanNama: getFormValue(formData, 'alamat_pelapor_kelurahan_nama'),
      alamatPelaporKodePos: getFormValue(formData, 'alamat_pelapor_kode_pos'),
      namaFasilitas: getFormValue(formData, 'namaFasilitas'),
      provinsi: getFormValue(formData, 'provinsi'),
      kabupatenKota: getFormValue(formData, 'kabupatenKota'),
      kecamatan: getFormValue(formData, 'kecamatan'),
      kelurahan: getFormValue(formData, 'kelurahan'),
      desa: getFormValue(formData, 'desa'),
      wilayahKerja: getFormValue(formData, 'wilayahKerja'),
      namaInstansi: getFormValue(formData, 'namaInstansi'),
      unitKerja: getFormValue(formData, 'unitKerja'),
      alamatInstansi: getFormValue(formData, 'alamatInstansi'),
      tanggalKejadian: getFormValue(formData, 'tanggalKejadian'),
      tempatKejadian: getFormValue(formData, 'tempatKejadian'),
      alamatTempatPelayanan: getFormValue(formData, 'alamatTempatPelayanan'),
      jenisPelayanan: getFormValue(formData, 'jenisPelayanan'),
      jenisAlokonBmhp: getFormValue(formData, 'jenisAlokonBmhp'),
      isiLaporan,
      fotoFilename: fotoFile?.name || '',
      fotoMimeType: fotoFile?.type || '',
      fotoSize: fotoFile ? fotoFile.size : null,
      rawPayload: JSON.stringify(rawPayload),
    });

    return NextResponse.json({
      message: 'Laporan berhasil disimpan',
      id: insertId,
    });
  } catch (error) {
    console.error('POST /api/survei error:', error);
    return NextResponse.json(
      { message: 'Gagal menyimpan laporan ke database.' },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = Number(searchParams.get('limit') || '50');
    const data = await getSurveiReports(limitParam);

    return NextResponse.json({
      count: data.length,
      data,
    });
  } catch (error) {
    console.error('GET /api/survei error:', error);
    return NextResponse.json(
      { message: 'Gagal mengambil data laporan.' },
      { status: 500 },
    );
  }
}
