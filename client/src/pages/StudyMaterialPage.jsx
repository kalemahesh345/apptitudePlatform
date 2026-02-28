import { useState, useEffect } from 'react';
import { FiBookOpen, FiFilter } from 'react-icons/fi';
import api from '../services/api';

export default function StudyMaterialPage() {
  const [materials, setMaterials] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await api.get('/study/topics');
        setTopics(res.data.topics);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTopics();
  }, []);

  useEffect(() => {
    const fetchMaterials = async () => {
      setLoading(true);
      try {
        const params = {};
        if (selectedTopic) params.topic = selectedTopic;
        if (selectedCategory) params.category = selectedCategory;
        const res = await api.get('/study', { params });
        setMaterials(res.data.materials);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, [selectedTopic, selectedCategory]);

  const catIcons = { quantitative: '🔢', logical: '🧠', verbal: '📖', technical: '💻' };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Study Materials</h1>
        <p>Master concepts with curated notes and practice</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <FiFilter style={{ color: 'var(--text-muted)' }} />
        <select className="form-input" style={{ width: 'auto', minWidth: 160 }} value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
          <option value="">All Categories</option>
          <option value="quantitative">Quantitative</option>
          <option value="logical">Logical Reasoning</option>
          <option value="verbal">Verbal Ability</option>
          <option value="technical">Technical</option>
        </select>
        <select className="form-input" style={{ width: 'auto', minWidth: 160 }} value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)}>
          <option value="">All Topics</option>
          {[...new Set(topics.map(t => t.topic))].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : materials.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {materials.map(mat => (
            <div key={mat.id} className="card" style={{ cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === mat.id ? null : mat.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: expandedId === mat.id ? 16 : 0 }}>
                <span style={{ fontSize: '1.5rem' }}>{catIcons[mat.category] || '📚'}</span>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{mat.title}</h3>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <span className="badge badge-primary">{mat.category}</span>
                    <span className="badge badge-info">{mat.topic}</span>
                    <span className="badge badge-warning">{mat.type}</span>
                  </div>
                </div>
                {mat.is_premium && <span className="badge" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#78350f' }}>PREMIUM</span>}
              </div>

              {expandedId === mat.id && mat.content && (
                <div style={{
                  padding: 20, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
                  fontSize: '0.9rem', lineHeight: 1.8, whiteSpace: 'pre-wrap',
                  borderLeft: '3px solid var(--accent-primary)'
                }}>
                  {mat.content}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="icon"><FiBookOpen size={48} /></div>
          <h3>No materials found</h3>
          <p>Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
