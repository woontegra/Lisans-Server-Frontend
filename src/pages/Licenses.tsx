import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, Customer, LicenseListItem, Program } from '../api';

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'ACTIVE' ? 'badge-active' : status === 'EXPIRED' ? 'badge-expired' : 'badge-passive';
  const label =
    status === 'ACTIVE' ? 'Aktif' : status === 'EXPIRED' ? 'Süresi Doldu' : 'Pasif';
  return <span className={`badge ${cls}`}>{label}</span>;
}

export default function Licenses() {
  const [licenses, setLicenses] = useState<LicenseListItem[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [programId, setProgramId] = useState('');
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [createdCreds, setCreatedCreds] = useState<{ licenseKey: string; activationPassword: string; warning: string } | null>(null);

  const [form, setForm] = useState({
    customerMode: 'existing' as 'existing' | 'new',
    customerId: '',
    newCustomer: { name: '', email: '', phone: '', companyName: '' },
    programId: '',
    dateMode: 'days' as 'days' | 'date',
    licenseDays: 365,
    expiresAt: '',
    maxDevices: 1,
    notes: '',
    sendMail: false,
  });

  const load = () => {
    api
      .getLicenses({ search: search || undefined, programId: programId || undefined, status: status || undefined })
      .then(setLicenses)
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    api.getPrograms().then(setPrograms);
    api.getCustomers().then(setCustomers);
    load();
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const payload: Parameters<typeof api.createLicense>[0] = {
        programId: form.programId,
        maxDevices: form.maxDevices,
        notes: form.notes || undefined,
        sendMail: form.sendMail,
      };

      if (form.customerMode === 'existing') {
        payload.customerId = form.customerId;
      } else {
        payload.newCustomer = form.newCustomer;
      }

      if (form.dateMode === 'days') {
        payload.licenseDays = form.licenseDays;
      } else if (form.expiresAt) {
        payload.expiresAt = form.expiresAt;
      }

      const result = await api.createLicense(payload);
      setCreatedCreds({
        licenseKey: result.license.licenseKey,
        activationPassword: result.activationPassword,
        warning: result.warning,
      });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Lisanslar</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'İptal' : 'Yeni Lisans'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {createdCreds && (
        <div className="alert alert-warning">
          <strong>Lisans oluşturuldu!</strong>
          <div className="credential-box">
            <div className="item"><strong>Lisans Anahtarı:</strong> {createdCreds.licenseKey}</div>
            <div className="item"><strong>Aktivasyon Şifresi:</strong> {createdCreds.activationPassword}</div>
          </div>
          <p>{createdCreds.warning}</p>
          <button className="btn btn-secondary btn-sm" onClick={() => setCreatedCreds(null)}>Kapat</button>
        </div>
      )}

      {showForm && (
        <div className="card">
          <h2 style={{ marginBottom: 16, fontSize: 16 }}>Yeni Lisans Oluştur</h2>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Müşteri</label>
              <select
                value={form.customerMode}
                onChange={(e) => setForm({ ...form, customerMode: e.target.value as 'existing' | 'new' })}
              >
                <option value="existing">Mevcut müşteri seç</option>
                <option value="new">Yeni müşteri oluştur</option>
              </select>
            </div>

            {form.customerMode === 'existing' ? (
              <div className="form-group">
                <label>Müşteri Seç</label>
                <select
                  value={form.customerId}
                  onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                  required
                >
                  <option value="">Seçin...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="form-row">
                <div className="form-group">
                  <label>Ad Soyad</label>
                  <input
                    value={form.newCustomer.name}
                    onChange={(e) => setForm({ ...form, newCustomer: { ...form.newCustomer, name: e.target.value } })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>E-posta</label>
                  <input
                    type="email"
                    value={form.newCustomer.email}
                    onChange={(e) => setForm({ ...form, newCustomer: { ...form.newCustomer, email: e.target.value } })}
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Program</label>
              <select
                value={form.programId}
                onChange={(e) => {
                  const prog = programs.find((p) => p.id === e.target.value);
                  setForm({
                    ...form,
                    programId: e.target.value,
                    licenseDays: prog?.defaultLicenseDays || 365,
                    maxDevices: prog?.defaultMaxDevices || 1,
                  });
                }}
                required
              >
                <option value="">Seçin...</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Süre Belirleme</label>
              <select
                value={form.dateMode}
                onChange={(e) => setForm({ ...form, dateMode: e.target.value as 'days' | 'date' })}
              >
                <option value="days">Gün sayısı</option>
                <option value="date">Bitiş tarihi</option>
              </select>
            </div>

            {form.dateMode === 'days' ? (
              <div className="form-group">
                <label>Lisans Süresi (gün)</label>
                <input
                  type="number"
                  value={form.licenseDays}
                  onChange={(e) => setForm({ ...form, licenseDays: +e.target.value })}
                  min={1}
                />
              </div>
            ) : (
              <div className="form-group">
                <label>Bitiş Tarihi</label>
                <input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Maksimum Cihaz</label>
              <input
                type="number"
                value={form.maxDevices}
                onChange={(e) => setForm({ ...form, maxDevices: +e.target.value })}
                min={1}
              />
            </div>

            <div className="form-group">
              <label>Not</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={form.sendMail}
                  onChange={(e) => setForm({ ...form, sendMail: e.target.checked })}
                />{' '}
                Mail gönder
              </label>
            </div>

            <button type="submit" className="btn btn-primary">Lisans Oluştur</button>
          </form>
        </div>
      )}

      <div className="filters">
        <input
          placeholder="Ara (lisans anahtarı, müşteri)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
        />
        <select value={programId} onChange={(e) => setProgramId(e.target.value)}>
          <option value="">Tüm Programlar</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tüm Durumlar</option>
          <option value="ACTIVE">Aktif</option>
          <option value="PASSIVE">Pasif</option>
          <option value="EXPIRED">Süresi Doldu</option>
        </select>
        <button className="btn btn-secondary" onClick={load}>Filtrele</button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Lisans Anahtarı</th>
              <th>Müşteri</th>
              <th>Program</th>
              <th>Bitiş Tarihi</th>
              <th>Cihaz</th>
              <th>Durum</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {licenses.length === 0 ? (
              <tr><td colSpan={7} className="empty">Lisans bulunamadı</td></tr>
            ) : (
              licenses.map((l) => (
                <tr key={l.id}>
                  <td><code>{l.licenseKey}</code></td>
                  <td>{l.customer.name}</td>
                  <td>{l.program.name}</td>
                  <td>{new Date(l.expiresAt).toLocaleDateString('tr-TR')}</td>
                  <td>{l.program.productType === 'SAAS' ? 'SaaS' : `${l.activeDeviceCount}/${l.maxDevices}`}</td>
                  <td><StatusBadge status={l.effectiveStatus} /></td>
                  <td>
                    <Link to={`/licenses/${l.id}`} className="btn btn-secondary btn-sm">Detay</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
