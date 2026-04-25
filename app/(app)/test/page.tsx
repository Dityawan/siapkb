'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

const MAX_SIZE_MB = 5;

type StorageInfo = {
  success: boolean;
  bucket?: string;
  totalFiles?: number;
  usedMB?: number;
  usedGB?: number;
  freeTierGB?: number;
  usedPercent?: number;
  error?: string;
};

export default function TestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; url?: string; error?: string; data?: any } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [storageLoading, setStorageLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchStorage = useCallback(async () => {
    setStorageLoading(true);
    try {
      const res = await fetch('/api/test/storage');
      const data = await res.json();
      setStorage(data);
    } catch {
      setStorage({ success: false, error: 'Gagal membaca storage' });
    } finally {
      setStorageLoading(false);
    }
  }, []);

  useEffect(() => { fetchStorage(); }, [fetchStorage]);

  const handleFileChange = (selectedFile: File | null) => {
    setResult(null);
    if (!selectedFile) return;
    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setResult({ success: false, error: `File terlalu besar. Maksimal ${MAX_SIZE_MB}MB.` });
      return;
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/test/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setResult({ success: true, url: data.url, data });
        // Refresh storage info setelah upload sukses
        fetchStorage();
      } else {
        setResult({ success: false, error: data.error });
      }
    } catch (err: any) {
      setResult({ success: false, error: 'Gagal menghubungi server: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const getBarColor = (percent: number) => {
    if (percent < 50) return '#22c55e';
    if (percent < 80) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      padding: '2rem'
    }}>
      <div style={{ width: '100%', maxWidth: '600px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>☁️</div>
          <h1 style={{ color: '#f1f5f9', fontSize: '1.75rem', fontWeight: '700', margin: 0 }}>
            Cloudflare R2 Upload Test
          </h1>
          <p style={{ color: '#94a3b8', marginTop: '0.5rem', fontSize: '0.9rem' }}>
            Uji coba upload file ke Cloudflare R2 Storage
          </p>
        </div>

        {/* Storage Info */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600' }}>
              📦 Storage Bucket: <span style={{ color: '#60a5fa' }}>{storage?.bucket || '...'}</span>
            </span>
            <button
              onClick={fetchStorage}
              disabled={storageLoading}
              style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              {storageLoading ? '⏳' : '🔄 Refresh'}
            </button>
          </div>

          {storageLoading ? (
            <p style={{ color: '#475569', fontSize: '0.85rem', margin: 0 }}>Memuat data storage...</p>
          ) : storage?.success ? (
            <>
              {/* Progress Bar */}
              <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '999px', height: '10px', overflow: 'hidden', marginBottom: '0.6rem' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(storage.usedPercent ?? 0, 100)}%`,
                  background: getBarColor(storage.usedPercent ?? 0),
                  borderRadius: '999px',
                  transition: 'width 0.5s ease',
                }} />
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                  <span style={{ color: '#f1f5f9', fontWeight: '600' }}>{storage.usedMB} MB</span>
                  {' '}/ {storage.freeTierGB} GB (Free Tier)
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: '700', color: getBarColor(storage.usedPercent ?? 0) }}>
                  {storage.usedPercent}%
                </span>
              </div>
              <p style={{ color: '#475569', fontSize: '0.75rem', margin: '0.4rem 0 0' }}>
                {storage.totalFiles} file tersimpan · Sisa: {((storage.freeTierGB ?? 10) - (storage.usedGB ?? 0)).toFixed(3)} GB
              </p>
            </>
          ) : (
            <p style={{ color: '#f87171', fontSize: '0.82rem', margin: 0 }}>⚠️ {storage?.error}</p>
          )}
        </div>

        {/* Upload Card */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '2rem',
          backdropFilter: 'blur(10px)',
        }}>
          <form onSubmit={handleSubmit}>
            {/* Drop Zone */}
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const dropped = e.dataTransfer.files[0];
                if (dropped) handleFileChange(dropped);
              }}
              style={{
                border: `2px dashed ${dragOver ? '#3b82f6' : 'rgba(255,255,255,0.2)'}`,
                borderRadius: '10px',
                padding: '2rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragOver ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)',
                transition: 'all 0.2s',
                marginBottom: '1.25rem',
              }}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                style={{ display: 'none' }}
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />
              {file ? (
                <div>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                    {file.type.startsWith('image/') ? '🖼️' : '📄'}
                  </div>
                  <p style={{ color: '#e2e8f0', fontWeight: '600', margin: '0 0 0.25rem' }}>{file.name}</p>
                  <p style={{ color: '#64748b', fontSize: '0.82rem', margin: 0 }}>{formatSize(file.size)}</p>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📁</div>
                  <p style={{ color: '#94a3b8', margin: '0 0 0.25rem', fontWeight: '500' }}>Klik atau drag & drop file di sini</p>
                  <p style={{ color: '#475569', fontSize: '0.8rem', margin: 0 }}>JPG, PNG, WEBP, PDF · Maks {MAX_SIZE_MB}MB</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!file || loading}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: !file || loading ? '#334155' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                color: !file || loading ? '#64748b' : 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: !file || loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {loading ? '⏳ Sedang mengunggah...' : '🚀 Upload ke R2'}
            </button>
          </form>

          {/* Result */}
          {result && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              borderRadius: '8px',
              background: result.success ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${result.success ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}>
              {result.success ? (
                <div>
                  <p style={{ color: '#4ade80', fontWeight: '700', margin: '0 0 0.75rem' }}>✅ Upload Berhasil!</p>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 0.4rem' }}>URL Publik:</p>
                  <a href={result.url} target="_blank" rel="noopener noreferrer"
                    style={{ color: '#60a5fa', wordBreak: 'break-all', fontSize: '0.85rem', textDecoration: 'underline' }}>
                    {result.url}
                  </a>
                  {result.data?.fileType?.startsWith('image/') && (
                    <div style={{ marginTop: '1rem' }}>
                      <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 0.5rem' }}>Preview:</p>
                      <img src={result.url} alt="Preview"
                        style={{ maxWidth: '100%', borderRadius: '6px', maxHeight: '200px', objectFit: 'contain' }} />
                    </div>
                  )}
                  <details style={{ marginTop: '1rem' }}>
                    <summary style={{ color: '#64748b', cursor: 'pointer', fontSize: '0.8rem' }}>Lihat response lengkap</summary>
                    <pre style={{
                      background: '#0f172a', color: '#94a3b8', padding: '0.75rem',
                      borderRadius: '6px', fontSize: '0.75rem', overflow: 'auto',
                      marginTop: '0.5rem', whiteSpace: 'pre-wrap',
                    }}>
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : (
                <div>
                  <p style={{ color: '#f87171', fontWeight: '700', margin: '0 0 0.5rem' }}>❌ Gagal Upload</p>
                  <p style={{ color: '#fca5a5', fontSize: '0.85rem', margin: 0 }}>{result.error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', color: '#334155', fontSize: '0.75rem', marginTop: '1.5rem' }}>
          Halaman ini hanya untuk pengujian internal — tidak untuk pengguna umum
        </p>
      </div>
    </div>
  );
}
