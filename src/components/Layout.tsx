import { NavLink, useNavigate } from 'react-router-dom';
import { clearToken } from '../api';

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h1>Woontegra Lisans</h1>
        <nav>
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/programs">Programlar</NavLink>
          <NavLink to="/customers">Müşteriler</NavLink>
          <NavLink to="/licenses">Lisanslar</NavLink>
        </nav>
        <div style={{ padding: '20px', marginTop: 'auto' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout} style={{ width: '100%' }}>
            Çıkış
          </button>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}
