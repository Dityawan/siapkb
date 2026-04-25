import { pool } from '@/lib/db';

export type SurveiInsertInput = {
  userType: string;
  mainCategory: string;
  reportCategory: string;
  nama: string;
  noHp: string;
  email: string;
  alamatPelapor: string;
  alamatPelaporProvinsiId: string;
  alamatPelaporProvinsiNama: string;
  alamatPelaporKabupatenId: string;
  alamatPelaporKabupatenNama: string;
  alamatPelaporKecamatanId: string;
  alamatPelaporKecamatanNama: string;
  alamatPelaporKelurahanId: string;
  alamatPelaporKelurahanNama: string;
  alamatPelaporKodePos: string;
  namaFasilitas: string;
  provinsi: string;
  kabupatenKota: string;
  kecamatan: string;
  kelurahan: string;
  desa: string;
  wilayahKerja: string;
  namaInstansi: string;
  unitKerja: string;
  alamatInstansi: string;
  tanggalKejadian: string;
  tempatKejadian: string;
  alamatTempatPelayanan: string;
  jenisPelayanan: string;
  jenisAlokonBmhp: string;
  isiLaporan: string;
  fotoFilename: string;
  fotoMimeType: string;
  fotoSize: number | null;
  rawPayload: string;
};

let hasEnsuredTable = false;

export async function ensureSurveiTable() {
  if (hasEnsuredTable) {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS survei_reports (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      user_type VARCHAR(30) NOT NULL,
      main_category VARCHAR(30) NULL,
      report_category VARCHAR(10) NULL,
      nama VARCHAR(150) NOT NULL,
      no_hp VARCHAR(30) NOT NULL,
      email VARCHAR(150) NULL,
      alamat_pelapor TEXT NULL,
      alamat_pelapor_provinsi_id VARCHAR(30) NULL,
      alamat_pelapor_provinsi_nama VARCHAR(120) NULL,
      alamat_pelapor_kabupaten_id VARCHAR(30) NULL,
      alamat_pelapor_kabupaten_nama VARCHAR(120) NULL,
      alamat_pelapor_kecamatan_id VARCHAR(30) NULL,
      alamat_pelapor_kecamatan_nama VARCHAR(120) NULL,
      alamat_pelapor_kelurahan_id VARCHAR(30) NULL,
      alamat_pelapor_kelurahan_nama VARCHAR(120) NULL,
      alamat_pelapor_kode_pos VARCHAR(15) NULL,
      nama_fasilitas VARCHAR(180) NULL,
      provinsi VARCHAR(120) NULL,
      kabupaten_kota VARCHAR(120) NULL,
      kecamatan VARCHAR(120) NULL,
      kelurahan VARCHAR(120) NULL,
      desa VARCHAR(120) NULL,
      wilayah_kerja TEXT NULL,
      nama_instansi VARCHAR(180) NULL,
      unit_kerja VARCHAR(180) NULL,
      alamat_instansi TEXT NULL,
      tanggal_kejadian DATE NULL,
      tempat_kejadian VARCHAR(180) NULL,
      alamat_tempat_pelayanan TEXT NULL,
      jenis_pelayanan VARCHAR(180) NULL,
      jenis_alokon_bmhp VARCHAR(30) NULL,
      isi_laporan TEXT NOT NULL,
      foto_filename VARCHAR(255) NULL,
      foto_mime_type VARCHAR(120) NULL,
      foto_size INT NULL,
      raw_payload JSON NULL,
      PRIMARY KEY (id),
      INDEX idx_created_at (created_at),
      INDEX idx_user_type (user_type),
      INDEX idx_main_category (main_category),
      INDEX idx_report_category (report_category)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  hasEnsuredTable = true;
}

export async function insertSurveiReport(input: SurveiInsertInput) {
  await ensureSurveiTable();

  const [result] = await pool.execute(
    `
      INSERT INTO survei_reports (
        user_type,
        main_category,
        report_category,
        nama,
        no_hp,
        email,
        alamat_pelapor,
        alamat_pelapor_provinsi_id,
        alamat_pelapor_provinsi_nama,
        alamat_pelapor_kabupaten_id,
        alamat_pelapor_kabupaten_nama,
        alamat_pelapor_kecamatan_id,
        alamat_pelapor_kecamatan_nama,
        alamat_pelapor_kelurahan_id,
        alamat_pelapor_kelurahan_nama,
        alamat_pelapor_kode_pos,
        nama_fasilitas,
        provinsi,
        kabupaten_kota,
        kecamatan,
        kelurahan,
        desa,
        wilayah_kerja,
        nama_instansi,
        unit_kerja,
        alamat_instansi,
        tanggal_kejadian,
        tempat_kejadian,
        alamat_tempat_pelayanan,
        jenis_pelayanan,
        jenis_alokon_bmhp,
        isi_laporan,
        foto_filename,
        foto_mime_type,
        foto_size,
        raw_payload
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `,
    [
      input.userType,
      input.mainCategory || null,
      input.reportCategory || null,
      input.nama,
      input.noHp,
      input.email || null,
      input.alamatPelapor || null,
      input.alamatPelaporProvinsiId || null,
      input.alamatPelaporProvinsiNama || null,
      input.alamatPelaporKabupatenId || null,
      input.alamatPelaporKabupatenNama || null,
      input.alamatPelaporKecamatanId || null,
      input.alamatPelaporKecamatanNama || null,
      input.alamatPelaporKelurahanId || null,
      input.alamatPelaporKelurahanNama || null,
      input.alamatPelaporKodePos || null,
      input.namaFasilitas || null,
      input.provinsi || null,
      input.kabupatenKota || null,
      input.kecamatan || null,
      input.kelurahan || null,
      input.desa || null,
      input.wilayahKerja || null,
      input.namaInstansi || null,
      input.unitKerja || null,
      input.alamatInstansi || null,
      input.tanggalKejadian || null,
      input.tempatKejadian || null,
      input.alamatTempatPelayanan || null,
      input.jenisPelayanan || null,
      input.jenisAlokonBmhp || null,
      input.isiLaporan,
      input.fotoFilename || null,
      input.fotoMimeType || null,
      input.fotoSize,
      input.rawPayload || null,
    ],
  );

  const insertResult = result as { insertId: number };
  return insertResult.insertId;
}

export type SurveiListItem = {
  id: number;
  createdAt: string;
  userType: string;
  mainCategory: string | null;
  reportCategory: string | null;
  nama: string;
  noHp: string;
  email: string | null;
  tempatKejadian: string | null;
  jenisPelayanan: string | null;
  isiLaporan: string;
};

export async function getSurveiReports(limit = 50): Promise<SurveiListItem[]> {
  await ensureSurveiTable();

  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(limit, 200)) : 50;

  const [rows] = await pool.query(
    `
      SELECT
        id,
        created_at,
        user_type,
        main_category,
        report_category,
        nama,
        no_hp,
        email,
        tempat_kejadian,
        jenis_pelayanan,
        isi_laporan
      FROM survei_reports
      ORDER BY id DESC
      LIMIT ?
    `,
    [safeLimit],
  );

  return (rows as Array<Record<string, string | number | null>>).map((row) => ({
    id: Number(row.id),
    createdAt: String(row.created_at ?? ''),
    userType: String(row.user_type ?? ''),
    mainCategory: row.main_category ? String(row.main_category) : null,
    reportCategory: row.report_category ? String(row.report_category) : null,
    nama: String(row.nama ?? ''),
    noHp: String(row.no_hp ?? ''),
    email: row.email ? String(row.email) : null,
    tempatKejadian: row.tempat_kejadian ? String(row.tempat_kejadian) : null,
    jenisPelayanan: row.jenis_pelayanan ? String(row.jenis_pelayanan) : null,
    isiLaporan: String(row.isi_laporan ?? ''),
  }));
}
