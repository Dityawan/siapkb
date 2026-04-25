'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type SystemData = {
  database: { status: string; totalRecords?: number; latestEntry?: string | null; message?: string; };
  r2: { status: string; bucket?: string; totalFiles?: number; usedMB?: number; usedGB?: number; freeTierGB?: number; usedPercent?: number; publicUrl?: string; message?: string; };
  env: Record<string, boolean>;
  server: { nodeVersion: string; platform: string; uptimeSeconds: number; memoryMB: number; timestamp: string; cpuLoad?: number; networkTraffic?: { in: number; out: number; }; };
};

type User = { id: string; name: string; username: string; role: string; isActive: boolean; createdAt: string; };

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: ok ? '#4ade80' : '#f87171', border: `1px solid ${ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
      {ok ? '● Online' : '● Error'}
    </span>
  );
}

function EnvRow({ name, ok }: { name: string; ok: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <code style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{name}</code>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: ok ? '#4ade80' : '#f87171' }}>
        {ok ? '✓ Diisi' : '✗ Kosong'}
      </span>
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1.5rem', ...style }}>{children}</div>;
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      <h2 style={{ color: '#e2e8f0', fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>{title}</h2>
    </div>
  );
}

function formatUptime(seconds: number) {
  return `${Math.floor(seconds / 3600)}j ${Math.floor((seconds % 3600) / 60)}m ${seconds % 60}d`;
}

const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#f1f5f9', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' };

export default function BackendPage() {
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'admin' });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loginLogs, setLoginLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);

  // Storage Settings
  const [settings, setSettings] = useState({ storage_show_on_dashboard: 'true', storage_max_gb: '10', storage_warning_percent: '80', survey_response_limit: '1000' });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');

  // R2 File Manager
  const [r2Files, setR2Files] = useState<any[]>([]);
  const [r2FilesLoading, setR2FilesLoading] = useState(true);
  const [r2Deleting, setR2Deleting] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/backend/status?t=' + Date.now());
      const json = await res.json();
      if (json.success) { setData(json.data); setLastUpdated(new Date().toLocaleTimeString('id-ID')); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await fetch('/api/backend/users?t=' + Date.now());
      const json = await res.json();
      if (json.success) setUsers(json.data);
    } catch (e) { console.error(e); } finally { setUsersLoading(false); }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/backend/settings?t=' + Date.now());
      const json = await res.json();
      if (json.success) {
        setSettings({
          storage_show_on_dashboard: json.data.storage_show_on_dashboard?.value ?? 'true',
          storage_max_gb: json.data.storage_max_gb?.value ?? '10',
          storage_warning_percent: json.data.storage_warning_percent?.value ?? '80',
          survey_response_limit: json.data.survey_response_limit?.value ?? '1000',
        });
      }
    } catch (e) { console.error(e); }
  }, []);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await fetch('/api/backend/logs?t=' + Date.now());
      const json = await res.json();
      if (json.success) setLoginLogs(json.data);
    } catch (e) { console.error(e); } finally { setLogsLoading(false); }
  }, []);

  const fetchR2Files = useCallback(async () => {
    setR2FilesLoading(true);
    try {
      const res = await fetch('/api/backend/files?t=' + Date.now());
      const json = await res.json();
      if (json.success) setR2Files(json.files);
    } catch (e) { console.error(e); } finally { setR2FilesLoading(false); }
  }, []);

  const handleDeleteFile = async (key: string) => {
    if (!confirm(`Hapus file "${key}" dari R2 Storage? Tindakan ini tidak bisa dibatalkan.`)) return;
    setR2Deleting(key);
    try {
      const res = await fetch('/api/backend/files', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key }) });
      const json = await res.json();
      if (json.success) {
        fetchR2Files();
        fetchStatus(); // refresh storage stats too
      } else {
        alert('Gagal menghapus: ' + json.error);
      }
    } catch (e: any) { alert('Error: ' + e.message); } finally { setR2Deleting(null); }
  };

  useEffect(() => { fetchStatus(); fetchUsers(); fetchSettings(); fetchLogs(); fetchR2Files(); }, [fetchStatus, fetchUsers, fetchSettings, fetchLogs, fetchR2Files]);

  const handleSaveSettings = async () => {
    setSettingsSaving(true); setSettingsMsg('');
    try {
      const res = await fetch('/api/backend/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
      const json = await res.json();
      setSettingsMsg(json.success ? '✅ Pengaturan berhasil disimpan!' : `❌ ${json.error}`);
    } catch (e: any) { setSettingsMsg(`❌ ${e.message}`); } finally { setSettingsSaving(false); }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(''); setFormSuccess(''); setSubmitting(true);
    try {
      const res = await fetch('/api/backend/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const json = await res.json();
      if (json.success) {
        setFormSuccess(`User "${form.username}" berhasil dibuat!`);
        setForm({ name: '', username: '', password: '', role: 'admin' });
        setShowForm(false);
        fetchUsers();
      } else {
        setFormError(json.error || 'Gagal membuat user');
      }
    } catch (e: any) { setFormError(e.message); } finally { setSubmitting(false); }
  };

  const handleToggleActive = async (user: User) => {
    await fetch(`/api/backend/users/${user.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !user.isActive }) });
    fetchUsers();
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Hapus user "${user.username}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    await fetch(`/api/backend/users/${user.id}`, { method: 'DELETE' });
    fetchUsers();
  };

  const barColor = (pct: number) => pct < 50 ? '#22c55e' : pct < 80 ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0a0f1e 0%, #0f172a 50%, #0d1b2a 100%)', fontFamily: "'Segoe UI', system-ui, sans-serif", padding: '2rem', color: '#f1f5f9' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span style={{ fontSize: '1.5rem' }}>⚙️</span>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Backend System Monitor</h1>
            </div>
            <p style={{ color: '#475569', fontSize: '0.83rem', margin: 0 }}>Status sistem real-time · SIAP KB</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {lastUpdated && <span style={{ color: '#475569', fontSize: '0.78rem' }}>Update: {lastUpdated}</span>}
            <button onClick={fetchStatus} disabled={loading} style={{ padding: '8px 16px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '8px', color: '#60a5fa', fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer' }}>
              {loading ? '⏳' : '🔄 Refresh'}
            </button>
            <Link href="/dashboard" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#94a3b8', fontSize: '0.83rem', textDecoration: 'none' }}>
              ← Dashboard
            </Link>
          </div>
        </div>

        {/* System Cards */}
        {!loading && data && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <Card>
              <SectionTitle icon="🗄️" title="Database (MySQL)" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Koneksi</span>
                <StatusBadge ok={data.database.status === 'ok'} />
              </div>
              {data.database.status === 'ok' ? (<>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: '#64748b', fontSize: '0.83rem' }}>Total Laporan</span>
                  <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{data.database.totalRecords?.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ color: '#64748b', fontSize: '0.83rem' }}>Entry Terakhir</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{data.database.latestEntry ? new Date(data.database.latestEntry).toLocaleString('id-ID') : '-'}</span>
                </div>
              </>) : <p style={{ color: '#f87171', fontSize: '0.82rem' }}>⚠️ {data.database.message}</p>}
            </Card>

            <Card>
              <SectionTitle icon="☁️" title="Cloudflare R2 Storage" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Koneksi</span>
                <StatusBadge ok={data.r2.status === 'ok'} />
              </div>
              {data.r2.status === 'ok' ? (<>
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Penyimpanan</span>
                    <span style={{ color: barColor(data.r2.usedPercent ?? 0), fontSize: '0.8rem', fontWeight: 700 }}>{data.r2.usedMB} MB / {data.r2.freeTierGB} GB ({data.r2.usedPercent}%)</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '999px', width: `${Math.min(data.r2.usedPercent ?? 0, 100)}%`, background: barColor(data.r2.usedPercent ?? 0), transition: 'width 0.5s' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: '#64748b', fontSize: '0.83rem' }}>Bucket</span>
                  <code style={{ color: '#60a5fa', fontSize: '0.8rem' }}>{data.r2.bucket}</code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                  <span style={{ color: '#64748b', fontSize: '0.83rem' }}>Total File</span>
                  <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{data.r2.totalFiles} file</span>
                </div>
              </>) : <p style={{ color: '#f87171', fontSize: '0.82rem' }}>⚠️ {data.r2.message}</p>}
            </Card>

            <Card>
              <SectionTitle icon="🖥️" title="Server Info" />
              {[
                { label: 'Platform', value: data.server.platform },
                { label: 'Node.js', value: data.server.nodeVersion },
                { label: 'Uptime', value: formatUptime(data.server.uptimeSeconds) },
                { label: 'Memory', value: `${data.server.memoryMB} MB` },
                { label: 'Timestamp', value: new Date(data.server.timestamp).toLocaleString('id-ID') },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: '#64748b', fontSize: '0.83rem' }}>{label}</span>
                  <span style={{ color: '#e2e8f0', fontSize: '0.83rem', fontWeight: 500 }}>{value}</span>
                </div>
              ))}
            </Card>

            <Card>
              <SectionTitle icon="🔐" title="Environment Variables" />
              {Object.entries(data.env).map(([key, ok]) => <EnvRow key={key} name={key} ok={ok} />)}
              <p style={{ color: '#334155', fontSize: '0.72rem', marginTop: '0.75rem' }}>* Nilai tidak ditampilkan demi keamanan</p>
            </Card>

            <Card>
              <SectionTitle icon="⚡" title="Network & CPU" />
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#64748b', fontSize: '0.85rem' }}>CPU Load</span>
                  <span style={{ color: barColor(data.server.cpuLoad ?? 0), fontSize: '0.85rem', fontWeight: 700 }}>
                    {data.server.cpuLoad ?? 0}%
                  </span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: '999px', width: `${Math.min(data.server.cpuLoad ?? 0, 100)}%`, background: barColor(data.server.cpuLoad ?? 0), transition: 'width 0.5s' }} />
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>🌐</span>
                  <h3 style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.85rem', margin: 0 }}>Network Traffic</h3>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(34,197,94,0.05)', border: '1px dashed rgba(34,197,94,0.3)', borderRadius: '8px' }}>
                    <div style={{ color: '#4ade80', fontSize: '1.2rem', marginBottom: '4px' }}>↓</div>
                    <div style={{ color: '#f1f5f9', fontSize: '1.25rem', fontWeight: 700 }}>{data.server.networkTraffic?.in ?? 0} <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Mbps</span></div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px' }}>Inbound</div>
                  </div>
                  
                  <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(59,130,246,0.05)', border: '1px dashed rgba(59,130,246,0.3)', borderRadius: '8px' }}>
                    <div style={{ color: '#60a5fa', fontSize: '1.2rem', marginBottom: '4px' }}>↑</div>
                    <div style={{ color: '#f1f5f9', fontSize: '1.25rem', fontWeight: 700 }}>{data.server.networkTraffic?.out ?? 0} <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Mbps</span></div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px' }}>Outbound</div>
                  </div>
                </div>
                <p style={{ color: '#475569', fontSize: '0.7rem', textAlign: 'center', marginTop: '1rem', marginBottom: 0 }}>
                  Trafik diperbarui secara real-time berdasarkan aktivitas I/O saat ini.
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* USER MANAGEMENT */}
        <Card style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <SectionTitle icon="👤" title={`Manajemen User Login (${users.length} user)`} />
            <button onClick={() => { setShowForm(!showForm); setFormError(''); setFormSuccess(''); }}
              style={{ padding: '7px 14px', background: showForm ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)', border: `1px solid ${showForm ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'}`, borderRadius: '8px', color: showForm ? '#f87171' : '#60a5fa', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
              {showForm ? '✕ Batal' : '+ Tambah User'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleAddUser} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.25rem' }}>
              <p style={{ color: '#94a3b8', fontSize: '0.83rem', fontWeight: 600, marginBottom: '1rem', marginTop: 0 }}>Buat Akun Login Baru</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', marginBottom: '4px' }}>Nama Lengkap *</label>
                  <input style={inputStyle} placeholder="Budi Santoso" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <label style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', marginBottom: '4px' }}>Username *</label>
                  <input style={inputStyle} placeholder="budi123" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
                </div>
                <div>
                  <label style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', marginBottom: '4px' }}>Password *</label>
                  <input style={inputStyle} type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                </div>
                <div>
                  <label style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', marginBottom: '4px' }}>Role</label>
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              </div>
              {formError && <p style={{ color: '#f87171', fontSize: '0.82rem', margin: '0 0 0.75rem' }}>⚠️ {formError}</p>}
              <button type="submit" disabled={submitting} style={{ padding: '9px 20px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                {submitting ? '⏳ Menyimpan...' : '💾 Simpan User'}
              </button>
            </form>
          )}

          {formSuccess && <p style={{ color: '#4ade80', fontSize: '0.82rem', marginBottom: '1rem' }}>✅ {formSuccess}</p>}

          {usersLoading ? (
            <p style={{ color: '#475569', fontSize: '0.85rem' }}>Memuat data user...</p>
          ) : users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#334155' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👤</div>
              <p style={{ margin: 0 }}>Belum ada user. Klik "+ Tambah User" untuk membuat akun pertama.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Nama', 'Username', 'Role', 'Status', 'Dibuat', 'Aksi'].map(h => (
                      <th key={h} style={{ color: '#64748b', padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 12px', color: '#e2e8f0', fontWeight: 500 }}>{user.name}</td>
                      <td style={{ padding: '10px 12px' }}><code style={{ color: '#60a5fa', fontSize: '0.8rem' }}>{user.username}</code></td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, background: user.role === 'admin' ? 'rgba(139,92,246,0.2)' : 'rgba(100,116,139,0.2)', color: user.role === 'admin' ? '#c4b5fd' : '#94a3b8' }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, background: user.isActive ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: user.isActive ? '#4ade80' : '#f87171' }}>
                          {user.isActive ? '● Aktif' : '● Nonaktif'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#475569', fontSize: '0.78rem' }}>
                        {new Date(user.createdAt).toLocaleDateString('id-ID')}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => handleToggleActive(user)} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', background: user.isActive ? 'rgba(234,179,8,0.15)' : 'rgba(34,197,94,0.15)', color: user.isActive ? '#fbbf24' : '#4ade80' }}>
                            {user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                          <button onClick={() => handleDelete(user)} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* STORAGE SETTINGS */}
        <Card style={{ marginBottom: '1.5rem' }}>
          <SectionTitle icon="📊" title="Pengaturan Storage Widget di Dashboard" />
          <p style={{ color: '#475569', fontSize: '0.82rem', marginBottom: '1.25rem', marginTop: '-0.5rem' }}>
            Konfigurasi ini menentukan tampilan widget storage R2 di halaman <strong style={{ color: '#94a3b8' }}>/dashboard</strong>.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            {/* Toggle tampil di dashboard */}
            <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.875rem 1rem' }}>
              <div>
                <p style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.85rem', margin: 0 }}>Tampilkan Widget Storage di Dashboard</p>
                <p style={{ color: '#475569', fontSize: '0.75rem', margin: '2px 0 0' }}>Jika dimatikan, widget storage tidak akan muncul di halaman dashboard</p>
              </div>
              <button
                onClick={() => setSettings(s => ({ ...s, storage_show_on_dashboard: s.storage_show_on_dashboard === 'true' ? 'false' : 'true' }))}
                style={{ padding: '6px 18px', borderRadius: '999px', border: 'none', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', background: settings.storage_show_on_dashboard === 'true' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.15)', color: settings.storage_show_on_dashboard === 'true' ? '#4ade80' : '#f87171', transition: 'all 0.2s' }}
              >
                {settings.storage_show_on_dashboard === 'true' ? '● Aktif' : '● Nonaktif'}
              </button>
            </div>

            {/* Max GB */}
            <div>
              <label style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', marginBottom: '6px' }}>Kapasitas Maksimal Storage (GB)</label>
              <input
                style={inputStyle}
                type="number"
                min="1"
                max="1000"
                value={settings.storage_max_gb}
                onChange={e => setSettings(s => ({ ...s, storage_max_gb: e.target.value }))}
                placeholder="10"
              />
              <p style={{ color: '#334155', fontSize: '0.72rem', marginTop: '4px' }}>Angka ini ditampilkan sebagai batas di widget dashboard</p>
            </div>

            {/* Warning percent */}
            <div>
              <label style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', marginBottom: '6px' }}>Ambang Peringatan Storage (%)</label>
              <input
                style={inputStyle}
                type="number"
                min="1"
                max="100"
                value={settings.storage_warning_percent}
                onChange={e => setSettings(s => ({ ...s, storage_warning_percent: e.target.value }))}
                placeholder="80"
              />
              <p style={{ color: '#334155', fontSize: '0.72rem', marginTop: '4px' }}>Progress bar berubah warna merah jika melebihi % ini</p>
            </div>
            {/* Response limit */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ color: '#64748b', fontSize: '0.78rem', display: 'block', marginBottom: '6px' }}>Batas Maksimal Laporan Masuk (Response Limit)</label>
              <input
                style={inputStyle}
                type="number"
                min="0"
                value={settings.survey_response_limit}
                onChange={e => setSettings(s => ({ ...s, survey_response_limit: e.target.value }))}
                placeholder="1000"
              />
              <p style={{ color: '#334155', fontSize: '0.72rem', marginTop: '4px' }}>Angka ini ditampilkan di dashboard. Biarkan kosong atau 0 jika tidak ada batas.</p>
            </div>
          </div>

          {settingsMsg && (
            <p style={{ fontSize: '0.83rem', marginBottom: '0.75rem', color: settingsMsg.startsWith('✅') ? '#4ade80' : '#f87171' }}>{settingsMsg}</p>
          )}

          <button
            onClick={handleSaveSettings}
            disabled={settingsSaving}
            style={{ padding: '9px 24px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
          >
            {settingsSaving ? '⏳ Menyimpan...' : '💾 Simpan Pengaturan'}
          </button>
        </Card>

        {/* R2 FILE MANAGER */}
        <Card style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <SectionTitle icon="📁" title="R2 Storage File Manager" />
            <button onClick={fetchR2Files} disabled={r2FilesLoading} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer' }}>
              {r2FilesLoading ? '⏳ Memuat...' : '🔄 Refresh'}
            </button>
          </div>
          <p style={{ color: '#475569', fontSize: '0.82rem', marginBottom: '1rem', marginTop: '-0.5rem' }}>
            Kelola file yang tersimpan di Cloudflare R2 bucket. Total: <strong style={{ color: '#94a3b8' }}>{r2Files.length} file</strong>
          </p>
          <div style={{ borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', position: 'sticky', top: 0, zIndex: 1 }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Nama File</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)', width: '80px' }}>Ukuran</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)', width: '140px' }}>Tanggal</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)', width: '120px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {r2FilesLoading ? (
                    <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#475569' }}>Memuat daftar file...</td></tr>
                  ) : r2Files.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#475569' }}>Tidak ada file di bucket.</td></tr>
                  ) : (
                    r2Files.map((file: any) => (
                      <tr key={file.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ color: '#e2e8f0', fontWeight: 500, wordBreak: 'break-all', fontSize: '0.8rem' }}>{file.key}</span>
                            {file.url && (
                              <a href={file.url} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', fontSize: '0.72rem', textDecoration: 'none' }}>
                                Buka ↗
                              </a>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#94a3b8', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                          {file.size < 1024 ? `${file.size} B` : file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${file.sizeMB} MB`}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center', color: '#475569', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                          {file.lastModified ? new Date(file.lastModified).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleDeleteFile(file.key)}
                            disabled={r2Deleting === file.key}
                            style={{ padding: '4px 12px', borderRadius: '6px', border: 'none', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', background: 'rgba(239,68,68,0.15)', color: '#f87171', opacity: r2Deleting === file.key ? 0.5 : 1 }}
                          >
                            {r2Deleting === file.key ? '⏳ Menghapus...' : '🗑️ Hapus'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <p style={{ color: '#475569', fontSize: '0.72rem', marginTop: '0.75rem', marginBottom: 0 }}>⚠️ Menghapus file bersifat permanen dan tidak dapat dikembalikan.</p>
        </Card>


        {/* LOGIN LOGS */}
        <Card style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <SectionTitle icon="📋" title="Riwayat Login Admin" />
            <button onClick={fetchLogs} style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer' }}>
              🔄 Refresh Log
            </button>
          </div>
          <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', height: '250px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.82rem', color: '#cbd5e1', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)' }}>
            {logsLoading ? (
              <p style={{ color: '#475569' }}>Memuat log...</p>
            ) : loginLogs.length === 0 ? (
              <p style={{ color: '#475569' }}>Belum ada riwayat login.</p>
            ) : (
              loginLogs.map((log: any) => (
                <div key={log.id} style={{ display: 'flex', gap: '10px', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '4px' }}>
                  <span style={{ color: '#64748b', minWidth: '135px' }}>
                    {new Date(log.createdAt).toLocaleString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(',', '')}
                  </span>
                  <span style={{ color: log.status === 'success' ? '#4ade80' : '#f87171', minWidth: '80px' }}>
                    [{log.status === 'success' ? 'SUCCESS' : 'FAILED'}]
                  </span>
                  <span style={{ color: '#60a5fa', minWidth: '80px', fontWeight: 'bold' }}>{log.username}</span>
                  <span style={{ color: '#94a3b8', minWidth: '100px' }}>IP: {log.ipAddress}</span>
                  <span style={{ color: '#475569', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.userAgent}>
                    Agent: {log.userAgent}
                  </span>
                </div>
              ))
            )}
          </div>
          <p style={{ color: '#475569', fontSize: '0.72rem', marginTop: '0.75rem', marginBottom: 0 }}>
            Menampilkan maksimal 50 riwayat percobaan login terakhir.
          </p>
        </Card>

        <p style={{ textAlign: 'center', color: '#1e293b', fontSize: '0.72rem' }}>
          /backend — Hanya untuk administrator sistem
        </p>
      </div>
    </div>
  );
}
