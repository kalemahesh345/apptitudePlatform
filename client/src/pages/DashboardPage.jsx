import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { FiFileText, FiTarget, FiTrendingUp, FiAward, FiZap, FiChevronRight } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler);

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/results/dashboard');
        setStats(res.data);
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  const scoreData = {
    labels: (stats?.recentScores || []).map((s, i) => s.title?.substring(0, 12) || `Test ${i + 1}`).reverse(),
    datasets: [{
      label: 'Score',
      data: (stats?.recentScores || []).map(s => s.accuracy).reverse(),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#6366f1',
      pointBorderWidth: 2,
      pointRadius: 4
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, max: 100, grid: { color: 'rgba(148,163,184,0.08)' }, ticks: { color: '#94a3b8' } },
      x: { grid: { display: false }, ticks: { color: '#94a3b8', maxRotation: 45 } }
    }
  };

  const topicData = {
    labels: (stats?.topicStats || []).slice(0, 6).map(t => t.topic),
    datasets: [{
      data: (stats?.topicStats || []).slice(0, 6).map(t => t.accuracy),
      backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'],
      borderWidth: 0
    }]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 12, usePointStyle: true } }
    },
    cutout: '65%'
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p>Here's your preparation overview</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple"><FiFileText /></div>
          <div className="stat-info">
            <h3>{stats?.stats?.totalTests || 0}</h3>
            <p>Tests Attempted</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FiTarget /></div>
          <div className="stat-info">
            <h3>{stats?.stats?.avgAccuracy || 0}%</h3>
            <p>Average Accuracy</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><FiTrendingUp /></div>
          <div className="stat-info">
            <h3>{stats?.stats?.avgScore || 0}</h3>
            <p>Average Score</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><FiAward /></div>
          <div className="stat-info">
            <h3>{stats?.stats?.bestScore || 0}</h3>
            <p>Best Score</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2">
        <div className="chart-container">
          <h3>📈 Score Trend</h3>
          <div style={{ height: 260 }}>
            {stats?.recentScores?.length > 0 ? (
              <Line data={scoreData} options={chartOptions} />
            ) : (
              <div className="empty-state">
                <p>Take a test to see your score trends</p>
              </div>
            )}
          </div>
        </div>

        <div className="chart-container">
          <h3>📊 Topic-wise Performance</h3>
          <div style={{ height: 260 }}>
            {stats?.topicStats?.length > 0 ? (
              <Doughnut data={topicData} options={doughnutOptions} />
            ) : (
              <div className="empty-state">
                <p>Complete tests to see topic breakdown</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Strong / Weak Topics */}
      <div className="grid-2" style={{ marginTop: 24 }}>
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiZap style={{ color: 'var(--success)' }} /> Strong Topics
          </h3>
          {stats?.strongTopics?.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {stats.strongTopics.map(topic => (
                <span key={topic} className="badge badge-success">{topic}</span>
              ))}
            </div>
          ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Complete more tests to identify strengths</p>}
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiTarget style={{ color: 'var(--danger)' }} /> Needs Improvement
          </h3>
          {stats?.weakTopics?.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {stats.weakTopics.map(topic => (
                <span key={topic} className="badge badge-danger">{topic}</span>
              ))}
            </div>
          ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No weak areas identified yet</p>}
        </div>
      </div>

      {/* Recent Tests */}
      <div className="card" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: '1rem' }}>📝 Recent Tests</h3>
          <Link to="/tests" className="btn btn-sm btn-secondary">View All <FiChevronRight /></Link>
        </div>
        {stats?.recentScores?.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Test</th>
                <th>Category</th>
                <th>Score</th>
                <th>Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentScores.slice(0, 5).map((test, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{test.title}</td>
                  <td><span className="badge badge-primary">{test.category}</span></td>
                  <td>{test.score}</td>
                  <td>
                    <span className={`badge ${test.accuracy >= 70 ? 'badge-success' : test.accuracy >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                      {parseFloat(test.accuracy).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <div className="icon">📝</div>
            <h3>No tests yet</h3>
            <p>Start your first test to track your progress</p>
            <Link to="/tests" className="btn btn-primary" style={{ marginTop: 16 }}>Take a Test</Link>
          </div>
        )}
      </div>
    </div>
  );
}
