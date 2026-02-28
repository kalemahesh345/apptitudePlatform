import { useState, useEffect } from 'react';
import { FiUsers, FiSearch, FiShield, FiStar, FiUser } from 'react-icons/fi';
import api from '../services/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingRole, setUpdatingRole] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/admin/users');
        setUsers(res.data.users || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const updateRole = async (userId, newRole) => {
    setUpdatingRole(userId);
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role');
    } finally {
      setUpdatingRole(null);
    }
  };

  const filtered = users.filter(u =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'ADMIN').length;
  const premiumCount = users.filter(u => u.role === 'PREMIUM').length;
  const regularCount = users.filter(u => u.role === 'USER').length;

  const getRoleIcon = (role) => {
    switch (role) {
      case 'ADMIN': return <FiShield />;
      case 'PREMIUM': return <FiStar />;
      default: return <FiUser />;
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN': return 'badge-danger';
      case 'PREMIUM': return 'badge-warning';
      default: return 'badge-info';
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>User Management</h1>
        <p>Manage platform users and their roles</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon purple"><FiUsers /></div>
          <div className="stat-info"><h3>{totalUsers}</h3><p>Total Users</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><FiShield /></div>
          <div className="stat-info"><h3>{adminCount}</h3><p>Admins</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><FiStar /></div>
          <div className="stat-info"><h3>{premiumCount}</h3><p>Premium</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><FiUser /></div>
          <div className="stat-info"><h3>{regularCount}</h3><p>Regular Users</p></div>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
        <FiSearch style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          className="form-input" placeholder="Search users by name or email..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 40 }}
        />
      </div>

      {/* Users Table */}
      {filtered.length > 0 ? (
        <div className="card" style={{ overflow: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Current Role</th>
                <th>Joined</th>
                <th>Change Role</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr key={user.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'var(--accent-gradient)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0
                      }}>
                        {user.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 500 }}>{user.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{user.email}</td>
                  <td>
                    <span className={`badge ${getRoleBadge(user.role)}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {getRoleIcon(user.role)} {user.role}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                  </td>
                  <td>
                    <select
                      className="form-input"
                      style={{ width: 'auto', minWidth: 120, padding: '6px 10px', fontSize: '0.8rem' }}
                      value={user.role}
                      onChange={e => updateRole(user.id, e.target.value)}
                      disabled={updatingRole === user.id}
                    >
                      <option value="USER">USER</option>
                      <option value="PREMIUM">PREMIUM</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="icon">👥</div>
          <h3>No users found</h3>
          <p>Try adjusting your search</p>
        </div>
      )}
    </div>
  );
}
