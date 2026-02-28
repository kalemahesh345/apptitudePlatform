import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { FiTrendingUp, FiCpu } from 'react-icons/fi';
import api from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function ProgressPage() {
  const [progress, setProgress] = useState([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [trends, setTrends] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [loadingRec, setLoadingRec] = useState(false);
  const [period, setPeriod] = useState('weekly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [progRes, trendRes] = await Promise.all([
          api.get('/progress'),
          api.get('/progress/trends', { params: { period } })
        ]);
        setProgress(progRes.data.progress);
        setOverallProgress(progRes.data.overallProgress);
        setTrends(trendRes.data.trends);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [period]);

  const getStudyPlan = async () => {
    setLoadingRec(true);
    try {
      const res = await api.post('/ai/recommend');
      setRecommendation(res.data.recommendation);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRec(false);
    }
  };

  const trendData = {
    labels: trends.map(t => t.period),
    datasets: [{
      label: 'Avg Accuracy',
      data: trends.map(t => parseFloat(t.avg_accuracy)),
      borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#6366f1'
    }]
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Your Progress</h1>
        <p>Track your improvement over time</p>
      </div>

      {/* Overall Progress */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: '1rem' }}>Overall Mastery</h3>
          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{overallProgress}%</span>
        </div>
        <div className="progress-bar" style={{ height: 12 }}>
          <div className="progress-fill" style={{ width: `${overallProgress}%` }}></div>
        </div>
      </div>

      <div className="grid-2">
        {/* Trend Chart */}
        <div className="chart-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>📈 Performance Trend</h3>
            <div className="tabs" style={{ marginBottom: 0, border: 'none' }}>
              <button className={`tab ${period === 'weekly' ? 'active' : ''}`} onClick={() => setPeriod('weekly')}>Weekly</button>
              <button className={`tab ${period === 'monthly' ? 'active' : ''}`} onClick={() => setPeriod('monthly')}>Monthly</button>
            </div>
          </div>
          <div style={{ height: 250 }}>
            {trends.length > 0 ? (
              <Line data={trendData} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true, max: 100, grid: { color: 'rgba(148,163,184,0.08)' }, ticks: { color: '#94a3b8' } },
                  x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                }
              }} />
            ) : <div className="empty-state"><p>Complete more tests to see trends</p></div>}
          </div>
        </div>

        {/* AI Study Plan */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiCpu style={{ color: 'var(--accent-primary)' }} /> AI Study Plan
          </h3>
          {recommendation ? (
            <div style={{ fontSize: '0.85rem' }}>
              <h4 style={{ marginBottom: 12, color: 'var(--accent-primary)' }}>{recommendation.plan?.title || 'Your Study Plan'}</h4>
              {recommendation.priorityTopics && (
                <div style={{ marginBottom: 12 }}>
                  <strong>Priority Topics:</strong>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                    {recommendation.priorityTopics.map((t, i) => <span key={i} className="badge badge-warning">{t}</span>)}
                  </div>
                </div>
              )}
              {recommendation.plan?.days && (
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {recommendation.plan.days.slice(0, 7).map((day, i) => (
                    <div key={i} style={{ padding: '8px 12px', borderLeft: '3px solid var(--accent-primary)', marginBottom: 8, background: 'var(--bg-tertiary)', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}>
                      <strong>Day {day.day}:</strong> {day.topic} <span style={{ color: 'var(--text-muted)' }}>({day.duration})</span>
                    </div>
                  ))}
                </div>
              )}
              <p style={{ marginTop: 12, color: 'var(--success)', fontWeight: 500 }}>
                {recommendation.estimatedImprovement}
              </p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>Generate a personalized study roadmap</p>
              <button onClick={getStudyPlan} className="btn btn-primary" disabled={loadingRec}>
                <FiCpu /> {loadingRec ? 'Generating...' : 'Get AI Study Plan'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Topic Progress */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>📚 Topic-wise Progress</h3>
        {progress.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {progress.map(p => (
              <div key={p.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{p.topic}</span>
                    <span className={`badge ${p.skill_level === 'expert' ? 'badge-success' : p.skill_level === 'advanced' ? 'badge-info' : p.skill_level === 'intermediate' ? 'badge-warning' : 'badge-danger'}`} style={{ marginLeft: 8 }}>
                      {p.skill_level}
                    </span>
                  </div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {parseFloat(p.accuracy).toFixed(1)}% | {p.tests_taken} tests
                  </span>
                </div>
                <div className="progress-bar">
                  <div className={`progress-fill ${p.accuracy >= 70 ? 'green' : p.accuracy >= 40 ? 'orange' : 'red'}`} style={{ width: `${Math.min(p.accuracy, 100)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>Complete tests to track topic-wise progress</p>
          </div>
        )}
      </div>
    </div>
  );
}
