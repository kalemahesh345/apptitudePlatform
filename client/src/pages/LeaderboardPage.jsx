import { useState, useEffect } from 'react';
import { FiAward } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [period, setPeriod] = useState('alltime');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await api.get('/results/leaderboard', { params: { period } });
        setLeaderboard(res.data.leaderboard);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [period]);

  const getRankClass = (rank) => {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return 'normal';
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>🏆 Leaderboard</h1>
        <p>See how you rank against other students</p>
      </div>

      <div className="tabs" style={{ marginBottom: 24 }}>
        <button className={`tab ${period === 'weekly' ? 'active' : ''}`} onClick={() => setPeriod('weekly')}>This Week</button>
        <button className={`tab ${period === 'monthly' ? 'active' : ''}`} onClick={() => setPeriod('monthly')}>This Month</button>
        <button className={`tab ${period === 'alltime' ? 'active' : ''}`} onClick={() => setPeriod('alltime')}>All Time</button>
      </div>

      <div className="card">
        {leaderboard.length > 0 ? (
          leaderboard.map(entry => (
            <div 
              key={entry.user_id} 
              className="leaderboard-row"
              style={{ background: entry.user_id === user?.id ? 'rgba(99,102,241,0.08)' : 'transparent' }}
            >
              <div className={`rank-badge ${getRankClass(entry.rank)}`}>
                {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
              </div>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--accent-gradient)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 700, fontSize: '0.8rem'
              }}>
                {entry.name?.charAt(0)?.toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  {entry.name} {entry.user_id === user?.id && <span style={{ color: 'var(--accent-primary)', fontSize: '0.75rem' }}>(You)</span>}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  {entry.tests_completed} tests • {entry.avg_accuracy}% accuracy
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{parseFloat(entry.total_score).toFixed(0)}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>points</div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <FiAward size={32} />
            <h3>No entries yet</h3>
            <p>Complete tests to appear on the leaderboard</p>
          </div>
        )}
      </div>
    </div>
  );
}
