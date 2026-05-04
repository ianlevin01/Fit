import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  LayoutDashboard, Utensils, Dumbbell, User, LogOut, Menu, Flame, History,
} from 'lucide-react';

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/food', icon: Utensils, label: 'Cargar comida' },
  { to: '/activity', icon: Dumbbell, label: 'Cargar actividad' },
  { to: '/history', icon: History, label: 'Historial' },
  { to: '/profile', icon: User, label: 'Mi perfil' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 10 }}
        />
      )}

      <aside style={{
        width: 240, background: 'var(--surface)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', padding: '24px 0',
        position: 'fixed', top: 0, left: open ? 0 : -240,
        height: '100vh', zIndex: 20, transition: 'left 0.25s',
      }}
        className="sidebar-desktop"
      >
        <div style={{ padding: '0 20px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Flame size={28} color="var(--accent)" />
          <span style={{ fontWeight: 700, fontSize: 20, color: 'var(--text)' }}>FitTracker</span>
        </div>

        <nav style={{ flex: 1 }}>
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 20px', textDecoration: 'none',
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                background: isActive ? 'var(--accent-subtle)' : 'transparent',
                borderRight: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s',
              })}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{user?.name}</div>
          <button onClick={handleLogout} className="btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', gap: 8 }}>
            <LogOut size={16} /> Salir
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, marginLeft: 0, display: 'flex', flexDirection: 'column' }} className="main-content">
        <header style={{
          height: 56, background: 'var(--surface)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16,
          position: 'sticky', top: 0, zIndex: 5,
        }}>
          <button onClick={() => setOpen(true)} className="btn-ghost icon-btn">
            <Menu size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Flame size={20} color="var(--accent)" />
            <span style={{ fontWeight: 700, color: 'var(--text)' }}>FitTracker</span>
          </div>
        </header>
        <main style={{ flex: 1, padding: 24, maxWidth: 900, width: '100%', margin: '0 auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
