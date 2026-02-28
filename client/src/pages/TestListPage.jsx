import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiPlay, FiFilter } from 'react-icons/fi';
import api from '../services/api';

export default function TestListPage() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const params = {};
        if (categoryFilter) params.category = categoryFilter;
        if (difficultyFilter) params.difficulty = difficultyFilter;
        const res = await api.get('/tests', { params });
        setTests(res.data.tests);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, [categoryFilter, difficultyFilter]);

  const startTest = async (testId) => {
    navigate(`/test/${testId}`);
  };

  const diffColors = { easy: 'badge-success', medium: 'badge-warning', hard: 'badge-danger' };
  const catIcons = { quantitative: '🔢', logical: '🧠', verbal: '📖', technical: '💻' };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Aptitude Tests</h1>
        <p>Choose a test to challenge yourself</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <FiFilter style={{ color: 'var(--text-muted)' }} />
        <select className="form-input" style={{ width: 'auto', minWidth: 160 }} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          <option value="quantitative">Quantitative</option>
          <option value="logical">Logical Reasoning</option>
          <option value="verbal">Verbal Ability</option>
          <option value="technical">Technical</option>
        </select>
        <select className="form-input" style={{ width: 'auto', minWidth: 140 }} value={difficultyFilter} onChange={e => setDifficultyFilter(e.target.value)}>
          <option value="">All Levels</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {/* Test Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {tests.map(test => (
          <div key={test.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: '1.6rem' }}>{catIcons[test.category] || '📝'}</span>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{test.title}</h3>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <span className="badge badge-primary">{test.category}</span>
                  <span className={`badge ${diffColors[test.difficulty]}`}>{test.difficulty}</span>
                </div>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16, flex: 1 }}>
              {test.description}
            </p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 16, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FiClock /> {test.duration_minutes} min
                </span>
                <span>{test.total_marks} marks</span>
              </div>
              <button onClick={() => startTest(test.id)} className="btn btn-primary btn-sm">
                <FiPlay /> Start
              </button>
            </div>
            {!!test.is_premium && (
              <div style={{
                position: 'absolute', top: 12, right: 12,
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#78350f', padding: '2px 8px', borderRadius: 'var(--radius-full)',
                fontSize: '0.65rem', fontWeight: 700
              }}>PREMIUM</div>
            )}
          </div>
        ))}
      </div>

      {tests.length === 0 && (
        <div className="empty-state">
          <div className="icon">📝</div>
          <h3>No tests available</h3>
          <p>Check back later or adjust your filters</p>
        </div>
      )}
    </div>
  );
}
