import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Dashboard() {
  const [data, setData] = useState<Awaited<ReturnType<typeof api.getDashboard>> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getDashboard().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!data) return <div>Yükleniyor...</div>;

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Toplam Lisans</div>
          <div className="value">{data.totalLicenses}</div>
        </div>
        <div className="stat-card">
          <div className="label">Aktif Lisans</div>
          <div className="value" style={{ color: '#28a745' }}>{data.activeLicenses}</div>
        </div>
        <div className="stat-card">
          <div className="label">Süresi Dolan</div>
          <div className="value" style={{ color: '#dc3545' }}>{data.expiredLicenses}</div>
        </div>
        <div className="stat-card">
          <div className="label">30 Gün İçinde Bitecek</div>
          <div className="value" style={{ color: '#ffc107' }}>{data.expiringSoon}</div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 16, fontSize: 16 }}>Programlara Göre Lisans Sayısı</h2>
        {data.licensesByProgram.length === 0 ? (
          <p className="empty">Henüz lisans yok</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Program</th>
                <th>App Code</th>
                <th>Lisans Sayısı</th>
              </tr>
            </thead>
            <tbody>
              {data.licensesByProgram.map((p) => (
                <tr key={p.programId}>
                  <td>{p.programName}</td>
                  <td><code>{p.appCode}</code></td>
                  <td>{p.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
