import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';
import { FiGrid, FiFileText, FiTrendingUp, FiBookOpen, FiAward, FiStar, FiSettings, FiUsers, FiLogOut, FiSun, FiMoon, FiMenu, FiX, FiCpu, FiBarChart2, FiClipboard } from 'react-icons/fi';

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userLinks = [
    { to: '/dashboard', icon: <FiGrid />, label: 'Dashboard' },
    { to: '/tests', icon: <FiFileText />, label: 'Take Test' },
    { to: '/progress', icon: <FiTrendingUp />, label: 'Progress' },
    { to: '/study', icon: <FiBookOpen />, label: 'Study Materials' },
    { to: '/ai-mentor', icon: <FiCpu />, label: 'AI Mentor' },
    { to: '/leaderboard', icon: <FiAward />, label: 'Leaderboard' },
    { to: '/premium', icon: <FiStar />, label: 'Premium' },
  ];

  const adminLinks = [
    { to: '/admin', icon: <FiGrid />, label: 'Dashboard' },
    { to: '/admin/tests', icon: <FiClipboard />, label: 'Manage Tests' },
    { to: '/admin/questions', icon: <FiFileText />, label: 'Manage Questions' },
    { to: '/admin/results', icon: <FiBarChart2 />, label: 'User Results' },
    { to: '/admin/users', icon: <FiUsers />, label: 'Manage Users' },
    { to: '/admin/study-materials', icon: <FiBookOpen />, label: 'Study Materials' },
  ];

  const linksToShow = isAdmin ? adminLinks : userLinks;
  const menuLabel = isAdmin ? 'Admin' : 'Menu';

  return (
    <>
      {/* Mobile toggle */}
      <button 
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          position: 'fixed', top: 16, left: 16, zIndex: 1001,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '10px',
          color: 'var(--text-primary)', cursor: 'pointer',
          display: 'none'
        }}
      >
        {mobileOpen ? <FiX size={20} /> : <FiMenu size={20} />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 999, display: 'none'
          }}
          className="sidebar-overlay"
        />
      )}

      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`} style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 'var(--sidebar-width)',
        height: '100vh',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
        transition: 'var(--transition)',
        overflowY: 'auto'
      }}>
        {/* Logo */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36,
              background: 'var(--accent-gradient)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 800, fontSize: '1rem'
            }}>A</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>AptitudeAI</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {isAdmin ? 'Admin Panel' : 'Smart Preparation'}
              </div>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '8px 12px 4px' }}>
            {menuLabel}
          </div>
          {linksToShow.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/admin'}
              onClick={() => setMobileOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem', fontWeight: 500,
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                transition: 'var(--transition-fast)',
                textDecoration: 'none'
              })}
            >
              {link.icon}
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* User & Theme */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
          <button onClick={toggleTheme} style={{
            display: 'flex', alignItems: 'center', gap: 12, width: '100%',
            padding: '10px 14px', background: 'none', border: 'none',
            borderRadius: 'var(--radius-sm)', cursor: 'pointer',
            color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500,
            fontFamily: 'var(--font)', transition: 'var(--transition-fast)'
          }}>
            {theme === 'dark' ? <FiSun /> : <FiMoon />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px', marginTop: 4,
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-sm)'
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--accent-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '0.8rem'
            }}>
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.825rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {user?.role}
              </div>
            </div>
            <button onClick={handleLogout} style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', padding: 4, display: 'flex'
            }} title="Logout">
              <FiLogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: block !important; }
          .sidebar-overlay { display: block !important; }
          .sidebar {
            transform: translateX(-100%);
          }
          .sidebar.open {
            transform: translateX(0);
          }
        }
      `}
      </style>
    </>
  );
}
