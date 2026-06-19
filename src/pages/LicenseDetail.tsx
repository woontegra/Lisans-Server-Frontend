import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, LicenseDetail } from '../api';

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === 'ACTIVE' ? 'badge-active' : status === 'EXPIRED' ? 'badge-expired' : 'badge-passive';
  const label =
    status === 'ACTIVE' ? 'Aktif' : status === 'EXPIRED' ? 'Süresi Doldu' : 'Pasif';
  return <span className={`badge ${cls}`}>{label}</span>;
}

const EVENT_LABELS: Record<string, string> = {
  LICENSE_CREATED: 'Lisans Oluşturuldu',
  LICENSE_EXTENDED: 'Lisans Uzatıldı',
  LICENSE_DISABLED: 'Lisans Pasif',
  LICENSE_ENABLED: 'Lisans Aktif',
  ACTIVATED: 'Aktivasyon',
  VALIDATED: 'Doğrulama',
  DEVICE_RESET: 'Cihaz Sıfırlama',
  PASSWORD_REGENERATED: 'Şifre Yenilendi',
  MAIL_SENT: 'Mail Gönderildi',
  VALIDATION_FAILED: 'Doğrulama Başarısız',
};

export default function LicenseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [license, setLicense] = useState<LicenseDetail | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [extendDays, setExtendDays] = useState(365);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [mailPassword, setMailPassword] = useState('');

  const load = () => {
    if (!id) return;
    api.getLicense(id).then(setLicense).catch((e) => setError(e.message));
  };

  useEffect(() => { load(); }, [id]);

  const handleExtend = async () => {
    if (!id) return;
    try {
      await api.extendLicense(id, extendDays);
      setMessage(`${extendDays} gün uzatıldı`);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
    }
  };

  const handleEnable = async () => {
    if (!id) return;
    await api.enableLicense(id);
    setMessage('Lisans aktif yapıldı');
    load();
  };

  const handleDisable = async () => {
    if (!id) return;
    await api.disableLicense(id);
    setMessage('Lisans pasif yapıldı');
    load();
  };

  const handleResetDevices = async () => {
    if (!id || !confirm('Tüm cihazlar sıfırlanacak. Emin misiniz?')) return;
    await api.resetDevices(id);
    setMessage('Cihazlar sıfırlandı');
    load();
  };

  const handleRegeneratePassword = async () => {
    if (!id || !confirm('Aktivasyon şifresi yenilenecek. Emin misiniz?')) return;
    const result = await api.regeneratePassword(id);
    setNewPassword(result.activationPassword);
    setMessage(result.warning);
    load();
  };

  const handleSendMail = async () => {
    if (!id || !mailPassword) {
      setError('Mail göndermek için aktivasyon şifresi girin');
      return;
    }
    const result = await api.sendMail(id, mailPassword);
    if (result.sent) {
      setMessage('Mail gönderildi');
    } else {
      setError(result.error || 'Mail gönderilemedi');
    }
    load();
  };

  if (error && !license) return <div className="alert alert-error">{error}</div>;
  if (!license) return <div>Yükleniyor...</div>;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link to="/licenses">&larr; Lisanslara Dön</Link>
      </div>

      <h1 className="page-title">Lisans Detay</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {newPassword && (
        <div className="alert alert-warning">
          <strong>Yeni Aktivasyon Şifresi:</strong>
          <div className="credential-box">
            <div className="item">{newPassword}</div>
          </div>
          <p>Bu şifre bir daha düz yazı gösterilmeyecektir. Lütfen kaydedin.</p>
        </div>
      )}

      <div className="card">
        <h2 style={{ marginBottom: 16, fontSize: 16 }}>Lisans Bilgileri</h2>
        <div className="detail-grid">
          <div className="detail-item">
            <label>Lisans Anahtarı</label>
            <span><code>{license.licenseKey}</code></span>
          </div>
          <div className="detail-item">
            <label>Durum</label>
            <span><StatusBadge status={license.effectiveStatus} /></span>
          </div>
          <div className="detail-item">
            <label>Program</label>
            <span>{license.program.name} ({license.program.appCode})</span>
          </div>
          <div className="detail-item">
            <label>Kaynak</label>
            <span>{license.source}</span>
          </div>
          <div className="detail-item">
            <label>Başlangıç</label>
            <span>{new Date(license.startsAt).toLocaleDateString('tr-TR')}</span>
          </div>
          <div className="detail-item">
            <label>Bitiş</label>
            <span>{new Date(license.expiresAt).toLocaleDateString('tr-TR')} ({license.daysUntilExpiry} gün)</span>
          </div>
          <div className="detail-item">
            <label>Cihaz</label>
            <span>{license.activeDeviceCount} / {license.maxDevices}</span>
          </div>
          {license.notes && (
            <div className="detail-item">
              <label>Not</label>
              <span>{license.notes}</span>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 16, fontSize: 16 }}>Müşteri Bilgileri</h2>
        <div className="detail-grid">
          <div className="detail-item">
            <label>Ad</label>
            <span>{license.customer.name}</span>
          </div>
          <div className="detail-item">
            <label>E-posta</label>
            <span>{license.customer.email}</span>
          </div>
          <div className="detail-item">
            <label>Telefon</label>
            <span>{license.customer.phone || '-'}</span>
          </div>
          <div className="detail-item">
            <label>Şirket</label>
            <span>{license.customer.companyName || '-'}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 16, fontSize: 16 }}>İşlemler</h2>
        <div className="actions">
          <input
            type="number"
            value={extendDays}
            onChange={(e) => setExtendDays(+e.target.value)}
            style={{ width: 100, padding: '8px' }}
            min={1}
          />
          <button className="btn btn-primary btn-sm" onClick={handleExtend}>Uzat (gün)</button>
          {license.status === 'PASSIVE' ? (
            <button className="btn btn-success btn-sm" onClick={handleEnable}>Aktif Yap</button>
          ) : (
            <button className="btn btn-danger btn-sm" onClick={handleDisable}>Pasif Yap</button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={handleResetDevices}>Cihazları Sıfırla</button>
          <button className="btn btn-secondary btn-sm" onClick={handleRegeneratePassword}>Şifre Yenile</button>
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            placeholder="Aktivasyon şifresi (mail için)"
            value={mailPassword}
            onChange={(e) => setMailPassword(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', border: '1px solid #d0d5dd', borderRadius: 6 }}
          />
          <button className="btn btn-primary btn-sm" onClick={handleSendMail}>Mail Gönder</button>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 16, fontSize: 16 }}>Cihazlar</h2>
        {license.devices.length === 0 ? (
          <p className="empty">Kayıtlı cihaz yok</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Cihaz Adı</th>
                <th>Platform</th>
                <th>Versiyon</th>
                <th>İlk Aktivasyon</th>
                <th>Son Doğrulama</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {license.devices.map((d) => (
                <tr key={d.id}>
                  <td>{d.deviceName || d.deviceHash.slice(0, 12) + '...'}</td>
                  <td>{d.platform || '-'}</td>
                  <td>{d.appVersion || '-'}</td>
                  <td>{new Date(d.firstActivatedAt).toLocaleString('tr-TR')}</td>
                  <td>{new Date(d.lastValidatedAt).toLocaleString('tr-TR')}</td>
                  <td>
                    <span className={`badge ${d.status === 'ACTIVE' ? 'badge-active' : 'badge-passive'}`}>
                      {d.status === 'ACTIVE' ? 'Aktif' : 'İptal'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 16, fontSize: 16 }}>Loglar</h2>
        {license.events.length === 0 ? (
          <p className="empty">Log kaydı yok</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Olay</th>
                <th>Mesaj</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {license.events.map((e) => (
                <tr key={e.id}>
                  <td>{new Date(e.createdAt).toLocaleString('tr-TR')}</td>
                  <td>{EVENT_LABELS[e.eventType] || e.eventType}</td>
                  <td>{e.message || '-'}</td>
                  <td>{e.ipAddress || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
