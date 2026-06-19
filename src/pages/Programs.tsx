import { FormEvent, useEffect, useState } from 'react';
import { api, Program } from '../api';

export default function Programs() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    appCode: '',
    name: '',
    description: '',
    defaultLicenseDays: 365,
    defaultMaxDevices: 1,
  });
  const [error, setError] = useState('');

  const load = () => api.getPrograms().then(setPrograms).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.createProgram(form);
      setShowForm(false);
      setForm({ appCode: '', name: '', description: '', defaultLicenseDays: 365, defaultMaxDevices: 1 });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Programlar</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'İptal' : 'Yeni Program'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showForm && (
        <div className="card">
          <h2 style={{ marginBottom: 16, fontSize: 16 }}>Yeni Program</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>App Code</label>
                <input value={form.appCode} onChange={(e) => setForm({ ...form, appCode: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Program Adı</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label>Açıklama</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Varsayılan Lisans Günü</label>
                <input type="number" value={form.defaultLicenseDays} onChange={(e) => setForm({ ...form, defaultLicenseDays: +e.target.value })} />
              </div>
              <div className="form-group">
                <label>Varsayılan Max Cihaz</label>
                <input type="number" value={form.defaultMaxDevices} onChange={(e) => setForm({ ...form, defaultMaxDevices: +e.target.value })} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Kaydet</button>
          </form>
        </div>
      )}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>App Code</th>
              <th>Ad</th>
              <th>Varsayılan Gün</th>
              <th>Max Cihaz</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {programs.map((p) => (
              <tr key={p.id}>
                <td><code>{p.appCode}</code></td>
                <td>{p.name}</td>
                <td>{p.defaultLicenseDays}</td>
                <td>{p.defaultMaxDevices}</td>
                <td>
                  <span className={`badge ${p.isActive ? 'badge-active' : 'badge-passive'}`}>
                    {p.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
