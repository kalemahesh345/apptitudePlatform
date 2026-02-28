import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { FiUsers, FiFileText, FiActivity, FiTrendingUp, FiAward } from 'react-icons/fi';
import api from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/dashboard');
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  const passFailData = {
    labels: ['Passed', 'Failed'],
    datasets: [{
      data: [stats?.testStats?.passed || 0, stats?.testStats?.failed || 0],
      backgroundColor: ['#10b981', '#ef4444'],
      borderWidth: 0
    }]
  };

  const topicData = {
    labels: (stats?.popularTopics || []).map(t => t.topic),
    datasets: [{
      label: 'Attempts',
      data: (stats?.popularTopics || []).map(t => t.attempt_count),
      backgroundColor: 'rgba(99, 102, 241, 0.6)',
      borderRadius: 4
    }]
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Platform overview and management</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple"><FiUsers /></div>
          <div className="stat-info"><h3>{stats?.totalUsers || 0}</h3><p>Total Users</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FiActivity /></div>
          <div className="stat-info"><h3>{stats?.activeUsers || 0}</h3><p>Active (7d)</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><FiFileText /></div>
          <div className="stat-info"><h3>{stats?.totalTests || 0}</h3><p>Total Tests</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><FiTrendingUp /></div>
          <div className="stat-info"><h3>{parseFloat(stats?.testStats?.avg_accuracy || 0).toFixed(1)}%</h3><p>Avg Accuracy</p></div>
        </div>
      </div>

      <div className="grid-2">
        <div className="chart-container">
          <h3>📊 Pass / Fail Ratio</h3>
          <div style={{ height: 250, display: 'flex', justifyContent: 'center' }}>
            <Doughnut data={passFailData} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } },
              cutout: '65%'
            }} />
          </div>
        </div>

        <div className="chart-container">
          <h3>🔥 Popular Topics</h3>
          <div style={{ height: 250 }}>
            <Bar data={topicData} options={{
              responsive: true, maintainAspectRatio: false, indexAxis: 'y',
              plugins: { legend: { display: false } },
              scales: {
                x: { grid: { color: 'rgba(148,163,184,0.08)' }, ticks: { color: '#94a3b8' } },
                y: { grid: { display: false }, ticks: { color: '#94a3b8' } }
              }
            }} />
          </div>
        </div>
      </div>

      {/* Recent Attempts */}
      <div className="card" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: '1rem' }}>📝 Recent Submissions</h3>
          <Link to="/admin/questions" className="btn btn-sm btn-primary">Manage Questions</Link>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Student</th><th>Test</th><th>Score</th><th>Accuracy</th><th>Date</th></tr>
          </thead>
          <tbody>
            {(stats?.recentAttempts || []).map(a => (
              <tr key={a.id}>
                <td style={{ fontWeight: 500 }}>{a.user_name}</td>
                <td>{a.test_title}</td>
                <td>{a.score}/{a.total_marks}</td>
                <td><span className={`badge ${a.accuracy >= 50 ? 'badge-success' : 'badge-danger'}`}>{parseFloat(a.accuracy).toFixed(1)}%</span></td>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(a.completed_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
