'use client';

import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type RegionOption = {
  id: string;
  name: string;
  postal_code?: string;
  kode_pos?: string;
  zip_code?: string;
};

type PostalCodeCandidate = {
  code: number | string;
  village: string;
  district: string;
  regency: string;
  province: string;
};

export type AlamatPelaporValue = {
  provinceId: string;
  provinceName: string;
  regencyId: string;
  regencyName: string;
  districtId: string;
  districtName: string;
  villageId: string;
  villageName: string;
  postalCode: string;
};

type AlamatPelaporFieldProps = {
  fieldId: string;
  value: AlamatPelaporValue;
  onChange: (next: AlamatPelaporValue) => void;
  errorMessage?: string;
};

const API_BASE = 'https://api-regional-indonesia.vercel.app/api';

async function fetchRegions(endpoint: string): Promise<RegionOption[]> {
  const response = await fetch(`${API_BASE}${endpoint}`);

  if (!response.ok) {
    throw new Error('Gagal mengambil data wilayah.');
  }

  const json = (await response.json()) as RegionOption[] | { data?: RegionOption[] };

  if (Array.isArray(json)) {
    return json;
  }

  return Array.isArray(json.data) ? json.data : [];
}

function normalizeRegionName(value: string) {
  return value
    .toLowerCase()
    .replace(/^kabupaten\s+/i, '')
    .replace(/^kota\s+/i, '')
    .trim();
}

async function fetchPostalCodeByRegion(villageName: string, districtName: string, regencyName: string, provinceName: string) {
  const response = await fetch(`https://kodepos.vercel.app/search/?q=${encodeURIComponent(villageName)}`);

  if (!response.ok) {
    throw new Error('Postal code lookup failed');
  }

  const json = (await response.json()) as { data?: PostalCodeCandidate[] };
  const candidates = Array.isArray(json.data) ? json.data : [];

  const normalizedDistrict = normalizeRegionName(districtName);
  const normalizedRegency = normalizeRegionName(regencyName);
  const normalizedProvince = normalizeRegionName(provinceName);
  const normalizedVillage = normalizeRegionName(villageName);

  const exact = candidates.find((item) => {
    return (
      normalizeRegionName(item.village) === normalizedVillage &&
      normalizeRegionName(item.district) === normalizedDistrict &&
      normalizeRegionName(item.regency) === normalizedRegency &&
      normalizeRegionName(item.province) === normalizedProvince
    );
  });

  if (exact?.code) {
    return String(exact.code);
  }

  return '';
}

function filterOptions(options: RegionOption[], keyword: string) {
  const trimmed = keyword.trim().toLowerCase();

  if (!trimmed) {
    return options;
  }

  return options.filter((option) => option.name.toLowerCase().includes(trimmed));
}

export default function AlamatPelaporField({ fieldId, value, onChange, errorMessage }: AlamatPelaporFieldProps) {
  const isAlamatPelapor = fieldId === 'alamat_pelapor';

  const [provinces, setProvinces] = useState<RegionOption[]>([]);
  const [regencies, setRegencies] = useState<RegionOption[]>([]);
  const [districts, setDistricts] = useState<RegionOption[]>([]);
  const [villages, setVillages] = useState<RegionOption[]>([]);

  const [searchProvince, setSearchProvince] = useState('');
  const [isProvinceMenuOpen, setIsProvinceMenuOpen] = useState(false);
  const [highlightedProvinceIndex, setHighlightedProvinceIndex] = useState(0);

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingRegencies, setLoadingRegencies] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [loadingPostalCode, setLoadingPostalCode] = useState(false);

  const [apiError, setApiError] = useState('');

  const filteredProvinces = useMemo(() => filterOptions(provinces, searchProvince), [provinces, searchProvince]);

  const handleProvinceSelect = (selected: RegionOption) => {
    setSearchProvince(selected.name);
    setIsProvinceMenuOpen(false);
    setHighlightedProvinceIndex(0);
    setRegencies([]);
    setDistricts([]);
    setVillages([]);

    onChange({
      ...value,
      provinceId: selected.id,
      provinceName: selected.name,
      regencyId: '',
      regencyName: '',
      districtId: '',
      districtName: '',
      villageId: '',
      villageName: '',
      postalCode: '',
    });
  };

  const loadProvinces = async () => {
    try {
      setLoadingProvinces(true);
      setApiError('');
      const data = await fetchRegions('/provinces');
      setProvinces(data);
    } catch {
      setApiError('Gagal memuat provinsi. Coba lagi.');
    } finally {
      setLoadingProvinces(false);
    }
  };

  useEffect(() => {
    if (!isAlamatPelapor) {
      return;
    }

    void loadProvinces();
  }, [isAlamatPelapor]);

  const handleRetry = async () => {
    setApiError('');

    try {
      if (!value.provinceId) {
        await loadProvinces();
        return;
      }

      if (!value.regencyId) {
        setLoadingRegencies(true);
        const data = await fetchRegions(`/cities/${value.provinceId}`);
        setRegencies(data);
        return;
      }

      if (!value.districtId) {
        setLoadingDistricts(true);
        const data = await fetchRegions(`/districts/${value.regencyId}`);
        setDistricts(data);
        return;
      }

      setLoadingVillages(true);
      const data = await fetchRegions(`/villages/${value.districtId}`);
      setVillages(data);
    } catch {
      setApiError('Gagal memuat data wilayah. Coba lagi.');
    } finally {
      setLoadingRegencies(false);
      setLoadingDistricts(false);
      setLoadingVillages(false);
    }
  };

  useEffect(() => {
    const loadRegencies = async () => {
      if (!value.provinceId || !isAlamatPelapor) {
        return;
      }

      try {
        setLoadingRegencies(true);
        setApiError('');
        const data = await fetchRegions(`/cities/${value.provinceId}`);
        setRegencies(data);
      } catch {
        setApiError('Gagal memuat kabupaten/kota. Coba lagi.');
      } finally {
        setLoadingRegencies(false);
      }
    };

    void loadRegencies();
  }, [value.provinceId, isAlamatPelapor]);

  useEffect(() => {
    const loadDistricts = async () => {
      if (!value.regencyId || !isAlamatPelapor) {
        return;
      }

      try {
        setLoadingDistricts(true);
        setApiError('');
        const data = await fetchRegions(`/districts/${value.regencyId}`);
        setDistricts(data);
      } catch {
        setApiError('Gagal memuat kecamatan. Coba lagi.');
      } finally {
        setLoadingDistricts(false);
      }
    };

    void loadDistricts();
  }, [value.regencyId, isAlamatPelapor]);

  useEffect(() => {
    const loadVillages = async () => {
      if (!value.districtId || !isAlamatPelapor) {
        return;
      }

      try {
        setLoadingVillages(true);
        setApiError('');
        const data = await fetchRegions(`/villages/${value.districtId}`);
        setVillages(data);
      } catch {
        setApiError('Gagal memuat kelurahan/desa. Coba lagi.');
      } finally {
        setLoadingVillages(false);
      }
    };

    void loadVillages();
  }, [value.districtId, isAlamatPelapor]);

  if (!isAlamatPelapor) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-md border border-gray-200 p-4">
      <div>
        <Label htmlFor="alamat-pelapor-provinsi">Provinsi *</Label>
        <div className="relative mt-2">
          <Input
            id="alamat-pelapor-search-provinsi"
            value={searchProvince}
            onChange={(e) => {
              setSearchProvince(e.target.value);
              setIsProvinceMenuOpen(true);
              setHighlightedProvinceIndex(0);
            }}
            onFocus={() => setIsProvinceMenuOpen(true)}
            onBlur={() => {
              setTimeout(() => setIsProvinceMenuOpen(false), 100);
            }}
            onKeyDown={(e) => {
              if (!isProvinceMenuOpen && e.key === 'ArrowDown') {
                setIsProvinceMenuOpen(true);
                return;
              }

              if (!isProvinceMenuOpen) {
                return;
              }

              if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (!filteredProvinces.length) {
                  return;
                }
                setHighlightedProvinceIndex((prev) => (prev + 1) % filteredProvinces.length);
              }

              if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (!filteredProvinces.length) {
                  return;
                }
                setHighlightedProvinceIndex((prev) => (prev - 1 + filteredProvinces.length) % filteredProvinces.length);
              }

              if (e.key === 'Enter') {
                e.preventDefault();
                const selected = filteredProvinces[highlightedProvinceIndex];
                if (selected) {
                  handleProvinceSelect(selected);
                }
              }

              if (e.key === 'Escape') {
                setIsProvinceMenuOpen(false);
              }
            }}
            placeholder="Cari provinsi..."
            disabled={loadingProvinces || provinces.length === 0}
            autoComplete="off"
            role="combobox"
            aria-expanded={isProvinceMenuOpen}
            aria-controls="alamat-pelapor-provinsi-listbox"
          />

          {isProvinceMenuOpen && (
            <div
              id="alamat-pelapor-provinsi-listbox"
              className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-md"
              role="listbox"
            >
              {filteredProvinces.length ? (
                filteredProvinces.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 ${highlightedProvinceIndex === index ? 'bg-blue-50 text-blue-700' : ''}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleProvinceSelect(item)}
                    role="option"
                    aria-selected={value.provinceId === item.id}
                  >
                    {item.name}
                  </button>
                ))
              ) : (
                <p className="px-3 py-2 text-sm text-gray-500">Provinsi tidak ditemukan</p>
              )}
            </div>
          )}
        </div>
        {loadingProvinces && <p className="mt-1 text-xs text-gray-500">Memuat data provinsi...</p>}
      </div>

      <div>
        <Label htmlFor="alamat-pelapor-kabupaten">Kabupaten/Kota *</Label>
        <select
          id="alamat-pelapor-kabupaten"
          className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={value.regencyId}
          onChange={(e) => {
            const selected = regencies.find((item) => item.id === e.target.value);
            setDistricts([]);
            setVillages([]);
            onChange({
              ...value,
              regencyId: e.target.value,
              regencyName: selected?.name || '',
              districtId: '',
              districtName: '',
              villageId: '',
              villageName: '',
              postalCode: '',
            });
          }}
          disabled={!value.provinceId || loadingRegencies}
        >
          <option value="">Pilih kabupaten/kota</option>
          {regencies.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
        {loadingRegencies && <p className="mt-1 text-xs text-gray-500">Memuat data kabupaten/kota...</p>}
      </div>

      <div>
        <Label htmlFor="alamat-pelapor-kecamatan">Kecamatan *</Label>
        <select
          id="alamat-pelapor-kecamatan"
          className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={value.districtId}
          onChange={(e) => {
            const selected = districts.find((item) => item.id === e.target.value);
            setVillages([]);
            onChange({
              ...value,
              districtId: e.target.value,
              districtName: selected?.name || '',
              villageId: '',
              villageName: '',
              postalCode: '',
            });
          }}
          disabled={!value.regencyId || loadingDistricts}
        >
          <option value="">Pilih kecamatan</option>
          {districts.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
        {loadingDistricts && <p className="mt-1 text-xs text-gray-500">Memuat data kecamatan...</p>}
      </div>

      <div>
        <Label htmlFor="alamat-pelapor-kelurahan">Kelurahan/Desa *</Label>
        <select
          id="alamat-pelapor-kelurahan"
          className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={value.villageId}
          onChange={(e) => {
            const selected = villages.find((item) => item.id === e.target.value);
            const localPostalCode = selected?.postal_code || selected?.kode_pos || selected?.zip_code || '';

            onChange({
              ...value,
              villageId: e.target.value,
              villageName: selected?.name || '',
              postalCode: localPostalCode,
            });

            if (!localPostalCode && selected?.name && value.districtName && value.regencyName && value.provinceName) {
              setLoadingPostalCode(true);
              void fetchPostalCodeByRegion(selected.name, value.districtName, value.regencyName, value.provinceName)
                .then((postalCode) => {
                  if (!postalCode) {
                    return;
                  }

                  onChange({
                    ...value,
                    villageId: e.target.value,
                    villageName: selected.name,
                    postalCode,
                  });
                })
                .finally(() => {
                  setLoadingPostalCode(false);
                });
            }
          }}
          disabled={!value.districtId || loadingVillages}
        >
          <option value="">Pilih kelurahan/desa</option>
          {villages.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>
        {loadingVillages && <p className="mt-1 text-xs text-gray-500">Memuat data kelurahan/desa...</p>}
      </div>

      <div>
        <Label htmlFor="alamat-pelapor-kodepos">Kode Pos</Label>
        <Input
          id="alamat-pelapor-kodepos"
          value={value.postalCode}
          placeholder="Kode pos otomatis"
          readOnly
        />
        {loadingPostalCode && <p className="mt-1 text-xs text-gray-500">Mencari kode pos otomatis...</p>}
      </div>

      {apiError && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <p>{apiError}</p>
          <button
            type="button"
            className="mt-2 text-sm font-medium underline"
            onClick={() => void handleRetry()}
          >
            Coba lagi
          </button>
        </div>
      )}

      {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
    </div>
  );
}
