'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AlamatPelaporField, { AlamatPelaporValue } from '@/components/alamat-pelapor-field';

type UserType = 'general' | 'healthcare' | 'field' | 'manager' | null;
type MainReportCategory = 'contraception' | 'sdm' | 'sarana' | 'prosedur' | null;
type IncidentCategory = 'A' | 'B' | 'C' | 'D' | null;
type FormStep = 'consent' | 'userType' | 'identity' | 'category' | 'incident' | 'complete';

interface FormData {
  // Common fields
  nama: string;
  alamat?: string;
  alamatJalan?: string;
  alamat_pelapor_provinsi_id?: string;
  alamat_pelapor_provinsi_nama?: string;
  alamat_pelapor_kabupaten_id?: string;
  alamat_pelapor_kabupaten_nama?: string;
  alamat_pelapor_kecamatan_id?: string;
  alamat_pelapor_kecamatan_nama?: string;
  alamat_pelapor_kelurahan_id?: string;
  alamat_pelapor_kelurahan_nama?: string;
  alamat_pelapor_kode_pos?: string;
  noHp: string;
  email: string;

  // Healthcare & Field Worker fields
  namaFasilitas?: string;
  provinsi?: string;
  kabupatenKota?: string;
  kecamatan?: string;
  kelurahan?: string;
  desa?: string;
  wilayahKerja?: string;

  // Manager fields
  namaInstansi?: string;
  unitKerja?: string;
  alamatInstansi?: string;

  // Incident fields
  tanggalKejadian: string;
  tempatKejadian: string;
  alamatTempatPelayanan: string;
  jenisPelayanan: string;
  jenisAlokonBmhp?: 'Alokon' | 'BMHP' | '';
  isiLaporan: string;
  foto?: File | null;
}

const mainCategoryOptions = {
  contraception: 'Alat dan obat kontrasepsi',
  sdm: 'Tenaga Pemberi Layanan KB',
  sarana: 'Sarana dan Prasarana Pelayanan KB',
  prosedur: 'Prosedur Layanan',
};

const categoryDescriptions = {
  A: 'Komplikasi - kondisi yang terjadi akibat intervensi medis',
  B: 'Kegagalan - kehamilan yang tidak diinginkan saat menggunakan kontrasepsi secara benar',
  C: 'Kerusakan - ditemukannya kerusakan pada Alokon/BMHP',
  D: 'Lainnya',
};

const generalServiceOptions = [
  'Pil KB',
  'Suntik',
  'Implan/Susuk KB',
  'IUD/Spiral',
  'Kondom',
  'Metode Operasi Wanita (MOW) / Tubektomi',
  'Metode Operasi Pria (MOP) / Vasektomi',
];

const alokonOptions = ['Pil KB', 'Suntik', 'Implan/Susuk KB', 'IUD/Spiral', 'Kondom'];
const bmhpOptions = ['Syringe/Suntikan', 'Lainnya'];

export default function SurveiForm() {
  const [step, setStep] = useState<FormStep>('consent');
  const [userType, setUserType] = useState<UserType>(null);
  const [mainCategory, setMainCategory] = useState<MainReportCategory>(null);
  const [reportCategory, setReportCategory] = useState<IncidentCategory>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch, setError, clearErrors } = useForm<FormData>({
    defaultValues: {
      nama: '',
      alamat: '',
      alamatJalan: '',
      alamat_pelapor_provinsi_id: '',
      alamat_pelapor_provinsi_nama: '',
      alamat_pelapor_kabupaten_id: '',
      alamat_pelapor_kabupaten_nama: '',
      alamat_pelapor_kecamatan_id: '',
      alamat_pelapor_kecamatan_nama: '',
      alamat_pelapor_kelurahan_id: '',
      alamat_pelapor_kelurahan_nama: '',
      alamat_pelapor_kode_pos: '',
      noHp: '',
      email: '',
      tanggalKejadian: '',
      tempatKejadian: '',
      alamatTempatPelayanan: '',
      jenisPelayanan: '',
      jenisAlokonBmhp: '',
      isiLaporan: '',
    },
  });

  const foto = watch('foto');
  const selectedJenisAlokonBmhp = watch('jenisAlokonBmhp');
  const alamatPelaporValue: AlamatPelaporValue = {
    provinceId: watch('alamat_pelapor_provinsi_id') || '',
    provinceName: watch('alamat_pelapor_provinsi_nama') || '',
    regencyId: watch('alamat_pelapor_kabupaten_id') || '',
    regencyName: watch('alamat_pelapor_kabupaten_nama') || '',
    districtId: watch('alamat_pelapor_kecamatan_id') || '',
    districtName: watch('alamat_pelapor_kecamatan_nama') || '',
    villageId: watch('alamat_pelapor_kelurahan_id') || '',
    villageName: watch('alamat_pelapor_kelurahan_nama') || '',
    postalCode: watch('alamat_pelapor_kode_pos') || '',
  };
  const alamatPelaporError =
    errors.alamat_pelapor_provinsi_id?.message ||
    errors.alamat_pelapor_kabupaten_id?.message ||
    errors.alamat_pelapor_kecamatan_id?.message ||
    errors.alamat_pelapor_kelurahan_id?.message;

  const handleAlamatPelaporChange = (next: AlamatPelaporValue) => {
    setValue('alamat_pelapor_provinsi_id', next.provinceId, { shouldValidate: true });
    setValue('alamat_pelapor_provinsi_nama', next.provinceName);
    setValue('alamat_pelapor_kabupaten_id', next.regencyId, { shouldValidate: true });
    setValue('alamat_pelapor_kabupaten_nama', next.regencyName);
    setValue('alamat_pelapor_kecamatan_id', next.districtId, { shouldValidate: true });
    setValue('alamat_pelapor_kecamatan_nama', next.districtName);
    setValue('alamat_pelapor_kelurahan_id', next.villageId, { shouldValidate: true });
    setValue('alamat_pelapor_kelurahan_nama', next.villageName);
    setValue('alamat_pelapor_kode_pos', next.postalCode);

    const addressParts = [next.villageName, next.districtName, next.regencyName, next.provinceName].filter(Boolean);
    let formattedAlamat = addressParts.join(', ');
    if (next.postalCode) {
      formattedAlamat += ` ${next.postalCode}`;
    }

    setValue('alamat', formattedAlamat);
  };

  const handleConsent = () => {
    setStep('userType');
  };

  const handleUserTypeSelect = (type: UserType) => {
    setUserType(type);
    setStep('identity');
  };

  const handleIdentitySubmit = (data: FormData) => {
    setStep('category');
  };

  const handleMainCategorySelect = (category: MainReportCategory) => {
    setMainCategory(category);
    setReportCategory(null);
    setValue('jenisAlokonBmhp', '');
    setValue('jenisPelayanan', '');
  };

  const handleSubCategorySelect = (category: IncidentCategory) => {
    setReportCategory(category);
    setValue('jenisAlokonBmhp', '');
    setValue('jenisPelayanan', '');
  };

  const handleCategoryContinue = () => {
    if (!mainCategory) {
      return;
    }

    if (mainCategory === 'contraception' && !reportCategory) {
      return;
    }

    setStep('incident');
  };

  const handleIncidentSubmit = async (data: FormData) => {
    try {
      const payloadAnswers = {
        userType,
        mainCategory,
        reportCategory,
        tanggalKejadian: data.tanggalKejadian,
        tempatKejadian: data.tempatKejadian,
        alamatTempatPelayanan: data.alamatTempatPelayanan,
        jenisPelayanan: data.jenisPelayanan,
        jenisAlokonBmhp: data.jenisAlokonBmhp,
        alamatLengkap: data.alamatJalan ? `${data.alamatJalan}, ${data.alamat}` : data.alamat,
        kodePos: data.alamat_pelapor_kode_pos,
        unitKerja: data.unitKerja,
        alamatInstansi: data.alamatInstansi
      };

      const formData = new FormData();
      formData.append('name', data.nama || '');
      formData.append('email', data.email || '');
      formData.append('phone', data.noHp || '');
      formData.append('company', data.namaInstansi || data.namaFasilitas || data.wilayahKerja || '');
      formData.append('message', data.isiLaporan || '');
      formData.append('answers', JSON.stringify(payloadAnswers));

      if (foto) {
        formData.append('file', foto);
      }

      const response = await fetch('/api/survey', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Gagal mengirim data');
      }

      console.log('Form submitted successfully!');
      setStep('complete');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Terjadi kesalahan saat mengirim formulir. Silakan coba lagi.');
    }
  };

  const handleReset = () => {
    reset();
    setStep('consent');
    setUserType(null);
    setMainCategory(null);
    setReportCategory(null);
  };

  // Consent Step
  if (step === 'consent') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>FORMULIR ADUAN/LAPORAN KUALITAS PELAYANAN KB</CardTitle>
          <CardDescription>SIAP KB - Saluran Informasi dan Aduan Kualitas Pelayanan KB</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 [&_[data-slot=label]]:mb-2">
          <div className="bg-blue-50 p-4 rounded-lg">
            <ul className="text-sm text-gray-700 leading-relaxed list-disc pl-5 space-y-1">
              <li>Silakan isi formulir aduan/laporan dengan jelas dan lengkap sesuai kondisi yang Anda alami.</li>
              <li>Data yang jelas dan lengkap akan membantu kami dalam menindaklanjuti aduan/laporan Anda dengan cepat.</li>
              <li>Aduan/laporan yang Anda sampaikan dapat membantu kami dalam meningkatkan kualitas pelayanan KB.</li>
              <li>Identitas dan laporan Anda akan dijaga kerahasiaannya.</li>
            </ul>
          </div>
          <div className="space-y-2">
            <Label>Apakah anda bersedia mengisi form? *</Label>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="consent-yes"
                name="consent"
                value="yes"
                defaultChecked
                className="cursor-pointer"
              />
              <label htmlFor="consent-yes" className="cursor-pointer">
                Ya
              </label>
            </div>
          </div>
          <Button onClick={handleConsent} className="w-full bg-blue-600 hover:bg-blue-700">
            Lanjutkan
          </Button>
        </CardContent>
      </Card>
    );
  }

  // User Type Selection Step
  if (step === 'userType') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Pilih Kategori Pelapor</CardTitle>
          <CardDescription>Silakan pilih kategori Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3 whitespace-normal"
              onClick={() => handleUserTypeSelect('general')}
            >
              <span className="text-left">Masyarakat</span>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3 whitespace-normal"
              onClick={() => handleUserTypeSelect('healthcare')}
            >
              <span className="text-left">Tenaga Pemberi Layanan KB</span>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3 whitespace-normal"
              onClick={() => handleUserTypeSelect('field')}
            >
              <span className="text-left">Tenaga Lini Lapangan (PKB / PLKB / Kader)</span>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-3 whitespace-normal"
              onClick={() => handleUserTypeSelect('manager')}
            >
              <span className="text-left">Pengelola Program KB (Pusat / Provinsi / Kabupaten / Kota)</span>
            </Button>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStep('consent')}
            >
              Kembali
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Identity Step
  if (step === 'identity') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Identitas Pelapor</CardTitle>
          <CardDescription>Mohon diisi sesuai dengan identitas Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleIdentitySubmit)} className="space-y-4 [&_[data-slot=label]]:mb-2">
            <div>
              <Label htmlFor="nama">Nama Lengkap *</Label>
              <Input
                id="nama"
                {...register('nama', { required: 'Nama wajib diisi' })}
                placeholder="Masukan Nama Lengkap Anda"
                className={errors.nama ? 'border-red-500' : ''}
              />
              {errors.nama && <p className="text-red-500 text-sm mt-1">{errors.nama.message}</p>}
            </div>

            <div>
              <Label>Alamat Pelapor *</Label>
              <input
                type="hidden"
                {...register('alamat_pelapor_provinsi_id', { required: 'Provinsi wajib dipilih' })}
              />
              <input
                type="hidden"
                {...register('alamat_pelapor_kabupaten_id', { required: 'Kabupaten/Kota wajib dipilih' })}
              />
              <input
                type="hidden"
                {...register('alamat_pelapor_kecamatan_id', { required: 'Kecamatan wajib dipilih' })}
              />
              <input
                type="hidden"
                {...register('alamat_pelapor_kelurahan_id', { required: 'Kelurahan/Desa wajib dipilih' })}
              />
              <input type="hidden" {...register('alamat_pelapor_provinsi_nama')} />
              <input type="hidden" {...register('alamat_pelapor_kabupaten_nama')} />
              <input type="hidden" {...register('alamat_pelapor_kecamatan_nama')} />
              <input type="hidden" {...register('alamat_pelapor_kelurahan_nama')} />
              <input type="hidden" {...register('alamat_pelapor_kode_pos')} />
              <input type="hidden" {...register('alamat')} />
              <AlamatPelaporField
                fieldId="alamat_pelapor"
                value={alamatPelaporValue}
                onChange={handleAlamatPelaporChange}
                errorMessage={alamatPelaporError}
              />
            </div>

            <div>
              <Label htmlFor="alamatJalan">Alamat Lengkap *</Label>
              <Textarea
                id="alamatJalan"
                {...register('alamatJalan', { required: 'Alamat lengkap wajib diisi' })}
                placeholder="Tuliskan nama jalan/dusun dan RT/RW"
                className={errors.alamatJalan ? 'border-red-500' : ''}
              />
              {errors.alamatJalan && <p className="text-red-500 text-sm mt-1">{errors.alamatJalan.message}</p>}
            </div>

            <div>
              <Label htmlFor="noHp">No. HP/WhatsApp Aktif *</Label>
              <Input
                id="noHp"
                {...register('noHp', {
                  required: 'No. HP wajib diisi',
                  pattern: {
                    value: /^\d+$/,
                    message: 'No. HP hanya boleh angka',
                  },
                })}
                placeholder="Masukkan nomor HP / WhatsApp aktif Anda"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                onInput={(e) => {
                  e.currentTarget.value = e.currentTarget.value.replace(/\D/g, '');
                }}
                className={errors.noHp ? 'border-red-500' : ''}
              />
              {errors.noHp && <p className="text-red-500 text-sm mt-1">{errors.noHp.message}</p>}
            </div>

            <div>
              <Label htmlFor="email">Email (opsional)</Label>
              <Input
                id="email"
                {...register('email')}
                placeholder="Masukkan email Anda"
                type="email"
              />
              <p className="text-xs text-gray-500 mt-1">Contoh: nama@email.com</p>
            </div>

            {userType === 'healthcare' && (
              <div>
                <Label htmlFor="namaFasilitas">Nama Fasilitas Pelayanan Kesehatan *</Label>
                <Input
                  id="namaFasilitas"
                  {...register('namaFasilitas', { 
                    required: userType === 'healthcare' ? 'Nama fasilitas wajib diisi' : false 
                  })}
                  placeholder="Masukkan nama fasilitas"
                  className={errors.namaFasilitas ? 'border-red-500' : ''}
                />
                {errors.namaFasilitas && <p className="text-red-500 text-sm mt-1">{errors.namaFasilitas.message}</p>}
              </div>
            )}

            {userType === 'field' && (
              <div>
                <Label htmlFor="wilayahKerja">Wilayah Kerja *</Label>
                <Textarea
                  id="wilayahKerja"
                  {...register('wilayahKerja', { 
                    required: userType === 'field' ? 'Wilayah kerja wajib diisi' : false 
                  })}
                  placeholder="Masukkan wilayah kerja (Provinsi, Kabupaten/Kota, Kecamatan, Desa)"
                  className={errors.wilayahKerja ? 'border-red-500' : ''}
                />
                {errors.wilayahKerja && <p className="text-red-500 text-sm mt-1">{errors.wilayahKerja.message}</p>}
              </div>
            )}

            {userType === 'manager' && (
              <>
                <div>
                  <Label htmlFor="namaInstansi">Nama Instansi *</Label>
                  <Input
                    id="namaInstansi"
                    {...register('namaInstansi', { 
                      required: userType === 'manager' ? 'Nama instansi wajib diisi' : false 
                    })}
                    placeholder="Masukkan nama instansi"
                    className={errors.namaInstansi ? 'border-red-500' : ''}
                  />
                  {errors.namaInstansi && <p className="text-red-500 text-sm mt-1">{errors.namaInstansi.message}</p>}
                  <p className="text-xs text-gray-500 mt-1">Contoh: Kementerian Kependudukan dan Pembangunan Keluarga/BKKBN</p>
                </div>
                <div>
                  <Label htmlFor="unitKerja">Unit Kerja</Label>
                  <Input
                    id="unitKerja"
                    {...register('unitKerja')}
                    placeholder="Masukkan unit kerja"
                  />
                  <p className="text-xs text-gray-500 mt-1">Contoh: Direktorat Bina Kualitas Pelayanan KB</p>
                </div>
                <div>
                  <Label htmlFor="alamatInstansi">Alamat Instansi *</Label>
                  <Textarea
                    id="alamatInstansi"
                    {...register('alamatInstansi', { 
                      required: userType === 'manager' ? 'Alamat instansi wajib diisi' : false 
                    })}
                    placeholder="Masukkan alamat instansi"
                    className={errors.alamatInstansi ? 'border-red-500' : ''}
                  />
                  {errors.alamatInstansi && <p className="text-red-500 text-sm mt-1">{errors.alamatInstansi.message}</p>}
                </div>
              </>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep('userType')}
              >
                Kembali
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                Lanjutkan
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }


  // Category Selection Step
  if (step === 'category') {
    const canContinue = !!mainCategory && (mainCategory !== 'contraception' || !!reportCategory);

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Kategori Laporan</CardTitle>
          <CardDescription>Pilih kategori yang ingin Anda laporkan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 [&_[data-slot=label]]:mb-2">
          <div className="space-y-2">
            <Label>Kategori utama *</Label>
            <select
              value={mainCategory ?? ''}
              onChange={(e) => handleMainCategorySelect((e.target.value || null) as MainReportCategory)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Pilih kategori utama</option>
              <option value="contraception">{mainCategoryOptions.contraception}</option>
              <option value="sdm">{mainCategoryOptions.sdm}</option>
              <option value="sarana">{mainCategoryOptions.sarana}</option>
              <option value="prosedur">{mainCategoryOptions.prosedur}</option>
            </select>
          </div>

          {mainCategory === 'contraception' && (
            <div className="space-y-2">
              <Label>Kategori laporan *</Label>
              <select
                value={reportCategory ?? ''}
                onChange={(e) => handleSubCategorySelect((e.target.value || null) as IncidentCategory)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Pilih kategori laporan</option>
                  <option value="A">Komplikasi</option>
                  <option value="B">Kegagalan</option>
                  <option value="C">Kerusakan</option>
                  <option value="D">Lainnya</option>
              </select>
              {reportCategory && (
                <p className="text-sm text-gray-600">
                  {categoryDescriptions[reportCategory as keyof typeof categoryDescriptions]}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStep('identity')}
            >
              Kembali
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={handleCategoryContinue}
              disabled={!canContinue}
            >
              Lanjutkan
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Incident Details Step
  if (step === 'incident') {
    const isGeneralForm = mainCategory !== null && mainCategory !== 'contraception';
    const isAorB = reportCategory === 'A' || reportCategory === 'B';
    const isCorD = reportCategory === 'C' || reportCategory === 'D';
    const detailJenisOptions = selectedJenisAlokonBmhp === 'Alokon' ? alokonOptions : bmhpOptions;

    const dateLabel = reportCategory === 'C'
      ? 'Tanggal ditemukan *'
      : reportCategory === 'D'
        ? 'Tanggal kejadian/ditemukan *'
        : 'Tanggal dilayani *';

    const placeLabel = reportCategory === 'C'
      ? 'Nama Tempat Ditemukan *'
      : reportCategory === 'D'
        ? 'Nama Tempat Kejadian *'
        : 'Nama Tempat Pelayanan *';

    const placeAddressLabel = reportCategory === 'C'
      ? 'Alamat Tempat Ditemukan *'
      : reportCategory === 'D'
        ? 'Alamat Tempat Kejadian *'
        : 'Alamat Tempat Pelayanan *';

    const reportLabel = reportCategory === 'C' ? 'Isi laporan kerusakan *' : 'Isi laporan *';

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Detail Kejadian yang Dilaporkan</CardTitle>
          <CardDescription>
            Kategori utama: {mainCategory ? mainCategoryOptions[mainCategory as keyof typeof mainCategoryOptions] : '-'}
            {reportCategory ? ` | ${categoryDescriptions[reportCategory as keyof typeof categoryDescriptions]}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleIncidentSubmit)} className="space-y-4 [&_[data-slot=label]]:mb-2">
            <div>
              <Label htmlFor="tanggalKejadian">{dateLabel}</Label>
              <Input
                id="tanggalKejadian"
                type="date"
                {...register('tanggalKejadian', { required: 'Tanggal wajib diisi' })}
                className={errors.tanggalKejadian ? 'border-red-500' : ''}
              />
              {errors.tanggalKejadian && <p className="text-red-500 text-sm mt-1">{errors.tanggalKejadian.message}</p>}
            </div>

            <div>
              <Label htmlFor="tempatKejadian">{placeLabel}</Label>
              <Input
                id="tempatKejadian"
                {...register('tempatKejadian', { required: 'Tempat kejadian wajib diisi' })}
                placeholder="Masukkan nama RS/Puskesmas/Klinik/Praktik Dokter/Praktik Bidan"
                className={errors.tempatKejadian ? 'border-red-500' : ''}
              />
              {errors.tempatKejadian && <p className="text-red-500 text-sm mt-1">{errors.tempatKejadian.message}</p>}
            </div>

            <div>
              <Label htmlFor="alamatTempatPelayanan">{placeAddressLabel}</Label>
              <Textarea
                id="alamatTempatPelayanan"
                {...register('alamatTempatPelayanan', { required: 'Alamat tempat wajib diisi' })}
                placeholder="Masukkan alamat tempat"
                rows={3}
                className={errors.alamatTempatPelayanan ? 'border-red-500' : ''}
              />
              {errors.alamatTempatPelayanan && <p className="text-red-500 text-sm mt-1">{errors.alamatTempatPelayanan.message}</p>}
            </div>

            {isGeneralForm && (
              <div className="space-y-2">
                <Label>Jenis Pelayanan/Metode Kontrasepsi *</Label>
                <input
                  type="hidden"
                  {...register('jenisPelayanan', { required: 'Jenis pelayanan wajib dipilih' })}
                />
                <select
                  value={watch('jenisPelayanan') || ''}
                  onChange={(e) => setValue('jenisPelayanan', e.target.value, { shouldValidate: true })}
                  className={`w-full rounded-md border bg-background px-3 py-2 text-sm ${errors.jenisPelayanan ? 'border-red-500' : 'border-input'}`}
                >
                  <option value="">Pilih jenis pelayanan</option>
                    {generalServiceOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                    ))}
                </select>
                {errors.jenisPelayanan && <p className="text-red-500 text-sm mt-1">{errors.jenisPelayanan.message}</p>}
              </div>
            )}

            {isAorB && (
              <div className="space-y-2">
                <Label>Jenis Pelayanan/Metode Kontrasepsi *</Label>
                <input
                  type="hidden"
                  {...register('jenisPelayanan', { required: 'Jenis pelayanan wajib dipilih' })}
                />
                <select
                  value={watch('jenisPelayanan') || ''}
                  onChange={(e) => setValue('jenisPelayanan', e.target.value, { shouldValidate: true })}
                  className={`w-full rounded-md border bg-background px-3 py-2 text-sm ${errors.jenisPelayanan ? 'border-red-500' : 'border-input'}`}
                >
                  <option value="">Pilih jenis pelayanan</option>
                  {generalServiceOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                {errors.jenisPelayanan && <p className="text-red-500 text-sm mt-1">{errors.jenisPelayanan.message}</p>}
              </div>
            )}

            {isCorD && (
              <>
                <div className="space-y-2">
                  <Label>Jenis *</Label>
                  <input
                    type="hidden"
                    {...register('jenisAlokonBmhp', { required: 'Jenis wajib dipilih' })}
                  />
                  <select
                    value={selectedJenisAlokonBmhp || ''}
                    onChange={(e) => {
                      setValue('jenisAlokonBmhp', e.target.value as 'Alokon' | 'BMHP', { shouldValidate: true });
                      setValue('jenisPelayanan', '', { shouldValidate: true });
                    }}
                    className={`w-full rounded-md border bg-background px-3 py-2 text-sm ${errors.jenisAlokonBmhp ? 'border-red-500' : 'border-input'}`}
                  >
                    <option value="">Pilih jenis</option>
                    <option value="Alokon">Alat dan Obat Kontrasepsi</option>
                    <option value="BMHP">Bahan Medis Habis Pakai</option>
                  </select>
                  {errors.jenisAlokonBmhp && <p className="text-red-500 text-sm mt-1">{errors.jenisAlokonBmhp.message}</p>}
                </div>

                {selectedJenisAlokonBmhp && (
                  <div className="space-y-2">
                    <Label>
                      {selectedJenisAlokonBmhp === 'Alokon' ? 'Jenis Alat dan Obat Kontrasepsi *' : 'Jenis Bahan Medis Habis Pakai *'}
                    </Label>
                    <input
                      type="hidden"
                      {...register('jenisPelayanan', { required: 'Jenis wajib dipilih' })}
                    />
                    <select
                      value={watch('jenisPelayanan') || ''}
                      onChange={(e) => setValue('jenisPelayanan', e.target.value, { shouldValidate: true })}
                      className={`w-full rounded-md border bg-background px-3 py-2 text-sm ${errors.jenisPelayanan ? 'border-red-500' : 'border-input'}`}
                    >
                      <option value="">Pilih jenis detail</option>
                        {detailJenisOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                        ))}
                    </select>
                    {errors.jenisPelayanan && <p className="text-red-500 text-sm mt-1">{errors.jenisPelayanan.message}</p>}
                  </div>
                )}
              </>
            )}

            <div>
              <Label htmlFor="isiLaporan">{reportLabel}</Label>
              <Textarea
                id="isiLaporan"
                {...register('isiLaporan', { required: 'Isi laporan wajib diisi' })}
                placeholder="Ceritakan kronologis masalah yang dilaporkan dengan lengkap dan jelas"
                rows={5}
                className={errors.isiLaporan ? 'border-red-500' : ''}
              />
              {errors.isiLaporan && <p className="text-red-500 text-sm mt-1">{errors.isiLaporan.message}</p>}
            </div>

            <div className="pt-2">
              <Label htmlFor="foto">Silakan unggah bukti pendukung (dokumen/foto, Maks 1 MB)</Label>
              <Input
                id="foto"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 1024 * 1024) {
                      setError('foto', { type: 'manual', message: 'Ukuran file maksimal 1 MB' });
                      e.target.value = '';
                      setValue('foto', undefined as any);
                    } else {
                      clearErrors('foto');
                      setValue('foto', file);
                    }
                  } else {
                    clearErrors('foto');
                    setValue('foto', undefined as any);
                  }
                }}
                className={`cursor-pointer ${errors.foto ? 'border-red-500' : ''}`}
              />
              {errors.foto && <p className="text-red-500 text-sm mt-1">{errors.foto.message}</p>}
              {!errors.foto && foto && <p className="text-sm text-green-600 mt-1">File dipilih: {foto.name}</p>}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setStep('category')}
              >
                Kembali
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-700">
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Mengirim...
                  </>
                ) : (
                  'Kirim Laporan'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Completion Step
  if (step === 'complete') {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Terima Kasih!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <ul className="text-green-800 list-disc pl-5 space-y-1 text-sm">
              <li>Terima kasih atas laporan/aduan yang Anda sampaikan.</li>
              <li>Laporan/aduan Anda sudah kami terima dengan baik.</li>
              <li>Tim kami akan memverifikasi dan menindaklanjuti laporan Anda.</li>
            </ul>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm text-gray-700">
              Untuk informasi lebih lanjut silakan hubungi WhatsApp Tim SIAP KB +6285810622200
            </p>
            <a
              href="https://wa.me/6285810622200"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
            >
              Hubungi WhatsApp
            </a>
          </div>
          <Button
            onClick={handleReset}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Buat Laporan Baru
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
}
