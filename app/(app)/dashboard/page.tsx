'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [storage, setStorage] = useState<any>(null);
  const [showStorage, setShowStorage] = useState(true);
  const [responseLimit, setResponseLimit] = useState(1000);
  const [storageMaxGB, setStorageMaxGB] = useState(10);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [data, setData] = useState({
    totalReports: 0,
    thisMonth: 0,
    categories: { A: 0, B: 0, C: 0, D: 0, X: 0, Y: 0, Z: 0 },
    userTypes: { general: 0, healthcare: 0, field: 0, manager: 0 },
    recentReports: [] as any[],
    isLoading: true
  });

  const fetchSurveys = async () => {
    try {
      const res = await fetch('/api/survey?t=' + Date.now());
      const json = await res.json();
      if (json.success) {
        const surveys = json.data;
        
        let thisMonthCount = 0;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const categories = { A: 0, B: 0, C: 0, D: 0, X: 0, Y: 0, Z: 0 };
        const userTypes = { general: 0, healthcare: 0, field: 0, manager: 0 };
        const recentReports = surveys.slice(0, 5).map((s: any) => {
          const dateObj = new Date(s.createdAt);
          if (dateObj.getMonth() === currentMonth && dateObj.getFullYear() === currentYear) {
            thisMonthCount++;
          }
          
          const answers = s.answers || {};
          
          // Count User Types
          if (answers.userType === 'general') userTypes.general++;
          else if (answers.userType === 'healthcare') userTypes.healthcare++;
          else if (answers.userType === 'field') userTypes.field++;
          else if (answers.userType === 'manager') userTypes.manager++;
          
          // Count Categories
          let displayCategory = '-';
          if (answers.mainCategory === 'contraception') {
            const mainStr = 'Alat dan obat kontrasepsi';
            if (answers.reportCategory === 'A') { categories.A++; displayCategory = `${mainStr} - Komplikasi`; }
            else if (answers.reportCategory === 'B') { categories.B++; displayCategory = `${mainStr} - Kegagalan`; }
            else if (answers.reportCategory === 'C') { categories.C++; displayCategory = `${mainStr} - Kerusakan`; }
            else if (answers.reportCategory === 'D') { categories.D++; displayCategory = `${mainStr} - Lainnya`; }
            else { displayCategory = mainStr; }
          } else if (answers.mainCategory === 'sdm') {
            categories.X++; displayCategory = 'Tenaga Pemberi Layanan KB';
          } else if (answers.mainCategory === 'sarana') {
            categories.Y++; displayCategory = 'Sarana dan Prasarana Pelayanan KB';
          } else if (answers.mainCategory === 'prosedur') {
            categories.Z++; displayCategory = 'Prosedur Layanan';
          }

          let displayUserType = '-';
          if (answers.userType === 'general') displayUserType = 'Masyarakat Umum';
          else if (answers.userType === 'healthcare') displayUserType = 'Tenaga Kesehatan';
          else if (answers.userType === 'field') displayUserType = 'PKB/PLKB';
          else if (answers.userType === 'manager') displayUserType = 'Pengelola Program';

          return {
            id: s.id,
            date: dateObj.toISOString().split('T')[0],
            userType: displayUserType,
            category: displayCategory,
            location: answers.tempatKejadian || answers.alamatLengkap || '-',
            status: 'Diterima',
            fullData: s
          };
        });

        // Also count for all surveys (not just top 5)
        surveys.slice(5).forEach((s: any) => {
          const dateObj = new Date(s.createdAt);
          if (dateObj.getMonth() === currentMonth && dateObj.getFullYear() === currentYear) {
            thisMonthCount++;
          }
          const answers = s.answers || {};
          if (answers.userType === 'general') userTypes.general++;
          else if (answers.userType === 'healthcare') userTypes.healthcare++;
          else if (answers.userType === 'field') userTypes.field++;
          else if (answers.userType === 'manager') userTypes.manager++;
          
          if (answers.mainCategory === 'contraception') {
            if (answers.reportCategory === 'A') categories.A++;
            else if (answers.reportCategory === 'B') categories.B++;
            else if (answers.reportCategory === 'C') categories.C++;
            else if (answers.reportCategory === 'D') categories.D++;
          } else if (answers.mainCategory === 'sdm') categories.X++;
          else if (answers.mainCategory === 'sarana') categories.Y++;
          else if (answers.mainCategory === 'prosedur') categories.Z++;
        });

        setData({
          totalReports: surveys.length,
          thisMonth: thisMonthCount,
          categories,
          userTypes,
          recentReports,
          isLoading: false
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setData(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    fetchSurveys();

    // Fetch current user details
    fetch('/api/auth/me?t=' + Date.now()).then(r => r.json()).then(json => {
      if (json.authenticated) {
        setCurrentUser(json.user);
      }
    }).catch(() => {});

    // Fetch settings (accessible for all logged-in users)
    fetch('/api/dashboard/settings?t=' + Date.now()).then(r => r.json()).then(json => {
      if (json.success) {
        setShowStorage(json.data?.storage_show_on_dashboard?.value === 'true');
        setStorageMaxGB(parseFloat(json.data?.storage_max_gb?.value || '10'));
        setResponseLimit(parseInt(json.data?.survey_response_limit?.value || '1000', 10));
      }
    }).catch(() => {});

    // Fetch storage info (accessible for all logged-in users)
    fetch('/api/dashboard/storage?t=' + Date.now()).then(r => r.json()).then(json => {
      if (json.success) setStorage(json);
    }).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
    });

    router.replace('/login');
    router.refresh();
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus laporan ini? Tindakan ini tidak dapat dibatalkan.')) return;
    
    try {
      const res = await fetch(`/api/dashboard/survey/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        fetchSurveys();
      } else {
        alert('Gagal menghapus laporan: ' + (json.error || 'Terjadi kesalahan'));
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Terjadi kesalahan saat menghapus laporan.');
    }
  };

  const maxCategory = Math.max(1, data.categories.A, data.categories.B, data.categories.C, data.categories.D, data.categories.X, data.categories.Y, data.categories.Z);
  const maxUserType = Math.max(1, data.userTypes.general, data.userTypes.healthcare, data.userTypes.field, data.userTypes.manager);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard SIAP KB</h1>
              <p className="text-gray-600">Saluran Informasi dan Aduan Kualitas Pelayanan KB</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <a href="/api/dashboard/export-xlsx" download>
                <Button variant="outline" className="text-green-700 border-green-300 hover:bg-green-50 gap-1">
                  ⬇ Unduh XLSX
                </Button>
              </a>
              <a href="/api/dashboard/export-pdf" download>
                <Button variant="outline" className="text-red-700 border-red-300 hover:bg-red-50 gap-1">
                  ⬇ Unduh PDF
                </Button>
              </a>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>


        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Laporan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {data.totalReports}
                {responseLimit > 0 && (
                  <span className="text-xl text-gray-400"> / {responseLimit}</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Semua waktu</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Laporan Bulan Ini</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{data.thisMonth}</div>
              <p className="text-xs text-gray-500 mt-1">April 2026</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Aksi Cepat</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/survei">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-sm">
                  Buat Laporan Baru
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Laporan Berdasarkan Kategori</CardTitle>
              <CardDescription>Distribusi laporan per kategori kejadian</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm w-1/3 truncate pr-2">Komplikasi (A)</span>
                  <div className="flex items-center gap-2 w-2/3 justify-end">
                    <div className="bg-red-200 h-2 rounded transition-all duration-500" style={{ width: `${(data.categories.A / maxCategory) * 100}%` }}></div>
                    <span className="text-sm font-semibold w-6 text-right">{data.categories.A}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm w-1/3 truncate pr-2">Kegagalan (B)</span>
                  <div className="flex items-center gap-2 w-2/3 justify-end">
                    <div className="bg-orange-200 h-2 rounded transition-all duration-500" style={{ width: `${(data.categories.B / maxCategory) * 100}%` }}></div>
                    <span className="text-sm font-semibold w-6 text-right">{data.categories.B}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm w-1/3 truncate pr-2">Kerusakan (C)</span>
                  <div className="flex items-center gap-2 w-2/3 justify-end">
                    <div className="bg-yellow-200 h-2 rounded transition-all duration-500" style={{ width: `${(data.categories.C / maxCategory) * 100}%` }}></div>
                    <span className="text-sm font-semibold w-6 text-right">{data.categories.C}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm w-1/3 truncate pr-2">Lainnya (D)</span>
                  <div className="flex items-center gap-2 w-2/3 justify-end">
                    <div className="bg-blue-200 h-2 rounded transition-all duration-500" style={{ width: `${(data.categories.D / maxCategory) * 100}%` }}></div>
                    <span className="text-sm font-semibold w-6 text-right">{data.categories.D}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm w-1/3 truncate pr-2">SDM/Nakes (X)</span>
                  <div className="flex items-center gap-2 w-2/3 justify-end">
                    <div className="bg-green-200 h-2 rounded transition-all duration-500" style={{ width: `${(data.categories.X / maxCategory) * 100}%` }}></div>
                    <span className="text-sm font-semibold w-6 text-right">{data.categories.X}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm w-1/3 truncate pr-2">Sarana/Prasarana (Y)</span>
                  <div className="flex items-center gap-2 w-2/3 justify-end">
                    <div className="bg-purple-200 h-2 rounded transition-all duration-500" style={{ width: `${(data.categories.Y / maxCategory) * 100}%` }}></div>
                    <span className="text-sm font-semibold w-6 text-right">{data.categories.Y}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm w-1/3 truncate pr-2">Prosedur Layanan (Z)</span>
                  <div className="flex items-center gap-2 w-2/3 justify-end">
                    <div className="bg-pink-200 h-2 rounded transition-all duration-500" style={{ width: `${(data.categories.Z / maxCategory) * 100}%` }}></div>
                    <span className="text-sm font-semibold w-6 text-right">{data.categories.Z}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Types */}
          <Card>
            <CardHeader>
              <CardTitle>Laporan Berdasarkan Tipe Pelapor</CardTitle>
              <CardDescription>Distribusi laporan per kategori pelapor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm w-1/3 truncate pr-2">Masyarakat Umum</span>
                  <div className="flex items-center gap-2 w-2/3 justify-end">
                    <div className="bg-blue-300 h-2 rounded transition-all duration-500" style={{ width: `${(data.userTypes.general / maxUserType) * 100}%` }}></div>
                    <span className="text-sm font-semibold w-6 text-right">{data.userTypes.general}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm w-1/3 truncate pr-2">Tenaga Kesehatan</span>
                  <div className="flex items-center gap-2 w-2/3 justify-end">
                    <div className="bg-cyan-300 h-2 rounded transition-all duration-500" style={{ width: `${(data.userTypes.healthcare / maxUserType) * 100}%` }}></div>
                    <span className="text-sm font-semibold w-6 text-right">{data.userTypes.healthcare}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm w-1/3 truncate pr-2">PKB/PLKB/Kader</span>
                  <div className="flex items-center gap-2 w-2/3 justify-end">
                    <div className="bg-teal-300 h-2 rounded transition-all duration-500" style={{ width: `${(data.userTypes.field / maxUserType) * 100}%` }}></div>
                    <span className="text-sm font-semibold w-6 text-right">{data.userTypes.field}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm w-1/3 truncate pr-2">Pengelola Program</span>
                  <div className="flex items-center gap-2 w-2/3 justify-end">
                    <div className="bg-sky-300 h-2 rounded transition-all duration-500" style={{ width: `${(data.userTypes.manager / maxUserType) * 100}%` }}></div>
                    <span className="text-sm font-semibold w-6 text-right">{data.userTypes.manager}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Laporan Terbaru</CardTitle>
            <CardDescription>Daftar laporan paling baru yang masuk</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Tanggal</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Pelapor</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Kategori</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Lokasi</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentReports.length > 0 ? (
                    data.recentReports.map((report) => (
                      <tr key={report.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{report.date}</td>
                        <td className="py-3 px-4">{report.userType}</td>
                        <td className="py-3 px-4">{report.category}</td>
                        <td className="py-3 px-4">{report.location}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setSelectedReport(report)}
                              className="text-xs h-7 px-3"
                            >
                              Lihat
                            </Button>
                            {currentUser?.role === 'superadmin' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteReport(report.id)}
                                className="text-xs h-7 px-3 text-red-600 border-red-200 hover:bg-red-50"
                              >
                                Hapus
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        {data.isLoading ? "Memuat data..." : "Belum ada laporan yang masuk."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Storage Widget */}
        {showStorage && storage && (
          <Card className="mt-8 overflow-hidden border-0 shadow-md">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row items-stretch">
                {/* Donut Chart */}
                <div className="flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100 md:w-56">
                  <div className="relative w-32 h-32">
                    <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15.9" fill="none"
                        stroke={storage.usedPercent < 50 ? '#22c55e' : storage.usedPercent < 80 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="3"
                        strokeDasharray={`${Math.min(storage.usedPercent, 100)} ${100 - Math.min(storage.usedPercent, 100)}`}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dasharray 0.8s ease' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-bold text-gray-800">{storage.usedPercent}%</span>
                      <span className="text-xs text-gray-500">Terpakai</span>
                    </div>
                  </div>
                </div>
                {/* Info */}
                <div className="flex-1 p-5 flex flex-col justify-center gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-700 text-sm">☁️ Cloudflare R2 Storage</h3>
                    <span className="text-xs text-gray-400">Bucket: {storage.bucket}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(storage.usedPercent, 100)}%`, background: storage.usedPercent < 50 ? '#22c55e' : storage.usedPercent < 80 ? '#f59e0b' : '#ef4444' }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-xl font-bold text-gray-800">{storage.usedMB}</p>
                      <p className="text-xs text-gray-500">MB Terpakai</p>
                    </div>
                    <div className="text-center border-x border-gray-100">
                      <p className="text-xl font-bold text-gray-800">{storage.freeTierGB}</p>
                      <p className="text-xs text-gray-500">GB Batas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-gray-800">{storage.totalFiles}</p>
                      <p className="text-xs text-gray-500">File</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer Info */}
        <div className="mt-8 text-center text-xs text-gray-500">
          <p>Kementerian Kependudukan dan Pembangunan Keluarga/BKKBN</p>
        </div>
      </div>

      {/* Modal Detail Laporan */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b shrink-0 bg-white pb-4 z-10">
              <div>
                <CardTitle>Detail Laporan</CardTitle>
                <CardDescription>ID: {selectedReport.id}</CardDescription>
              </div>
              <div className="flex gap-2 items-center">
                {currentUser?.role === 'superadmin' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      handleDeleteReport(selectedReport.id);
                      setSelectedReport(null);
                    }}
                    className="text-xs h-8 px-3"
                  >
                    Hapus Laporan
                  </Button>
                )}
                <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setSelectedReport(null)}>
                  X
                </Button>
              </div>
            </CardHeader>
            <div className="overflow-y-auto flex-1">
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm">
                <div className="col-span-2 bg-blue-50 border border-blue-100 p-3 rounded-md mb-2">
                  <p className="font-semibold text-blue-800 mb-1">Waktu Laporan Dikirim</p>
                  <p className="text-blue-900 font-medium">
                    {new Date(selectedReport.fullData.createdAt).toLocaleString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </p>
                </div>
                
                <div>
                  <p className="font-semibold text-gray-500 mb-1">Nama Pelapor</p>
                  <p>{selectedReport.fullData.name || '-'}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-500 mb-1">Kategori Pelapor</p>
                  <p>{selectedReport.userType}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-500 mb-1">No. HP</p>
                  <p>{selectedReport.fullData.phone || '-'}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-500 mb-1">Email</p>
                  <p>{selectedReport.fullData.email || '-'}</p>
                </div>
                
                {selectedReport.fullData.answers?.alamatLengkap && (
                  <div className="col-span-2">
                    <p className="font-semibold text-gray-500 mb-1">Alamat Pelapor</p>
                    <p>
                      {selectedReport.fullData.answers.alamatLengkap} 
                      {selectedReport.fullData.answers.kodePos ? ` (Kode Pos: ${selectedReport.fullData.answers.kodePos})` : ''}
                    </p>
                  </div>
                )}
                
                {selectedReport.fullData.company && (
                  <div>
                    <p className="font-semibold text-gray-500 mb-1">Instansi / Faskes / Wilayah</p>
                    <p>{selectedReport.fullData.company}</p>
                  </div>
                )}

                {selectedReport.fullData.answers?.unitKerja && (
                  <div>
                    <p className="font-semibold text-gray-500 mb-1">Unit Kerja</p>
                    <p>{selectedReport.fullData.answers.unitKerja}</p>
                  </div>
                )}

                {selectedReport.fullData.answers?.alamatInstansi && (
                  <div className="col-span-2">
                    <p className="font-semibold text-gray-500 mb-1">Alamat Instansi</p>
                    <p>{selectedReport.fullData.answers.alamatInstansi}</p>
                  </div>
                )}

                <div className="col-span-2 border-t pt-4">
                  <p className="font-semibold text-gray-500 mb-1">Kategori Laporan</p>
                  <p className="font-medium text-blue-600">{selectedReport.category}</p>
                </div>

                {selectedReport.fullData.answers?.tanggalKejadian && (
                  <div>
                    <p className="font-semibold text-gray-500 mb-1">Tanggal Kejadian / Ditemukan</p>
                    <p>{selectedReport.fullData.answers.tanggalKejadian}</p>
                  </div>
                )}

                {selectedReport.fullData.answers?.tempatKejadian && (
                  <div>
                    <p className="font-semibold text-gray-500 mb-1">Tempat Kejadian / Ditemukan</p>
                    <p>{selectedReport.fullData.answers.tempatKejadian}</p>
                  </div>
                )}

                {selectedReport.fullData.answers?.alamatTempatPelayanan && (
                  <div className="col-span-2">
                    <p className="font-semibold text-gray-500 mb-1">Alamat Tempat Kejadian</p>
                    <p>{selectedReport.fullData.answers.alamatTempatPelayanan}</p>
                  </div>
                )}
                
                {selectedReport.fullData.answers?.jenisPelayanan && (
                  <div>
                    <p className="font-semibold text-gray-500 mb-1">Jenis Pelayanan</p>
                    <p>{selectedReport.fullData.answers.jenisPelayanan}</p>
                  </div>
                )}
                {selectedReport.fullData.answers?.jenisAlokonBmhp && (
                  <div>
                    <p className="font-semibold text-gray-500 mb-1">Jenis Alokon/BMHP</p>
                    <p>{selectedReport.fullData.answers.jenisAlokonBmhp}</p>
                  </div>
                )}

                <div className="col-span-2">
                  <p className="font-semibold text-gray-500 mb-2">Isi Laporan</p>
                  <div className="bg-gray-50 p-4 rounded-md border text-gray-700 whitespace-pre-wrap">
                    {selectedReport.fullData.message || '-'}
                  </div>
                </div>

                {selectedReport.fullData.answers?.fileUrl && (
                  <div className="col-span-2 mt-2">
                    <p className="font-semibold text-gray-500 mb-2">Lampiran Bukti (Foto/Dokumen)</p>
                    <div className="flex items-center gap-4 p-3 border rounded-md bg-gray-50">
                      <span className="text-sm truncate max-w-[300px]">
                        {selectedReport.fullData.answers.fileName || 'Lampiran'}
                      </span>
                      <a 
                        href={selectedReport.fullData.answers.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
                        download
                      >
                        Download / Lihat
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
