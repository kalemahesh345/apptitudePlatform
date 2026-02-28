import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiFileText, FiClock, FiAward } from 'react-icons/fi';
import api from '../services/api';

export default function AdminTestsPage() {
  const [tests, setTests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: 'Quantitative', difficulty: 'medium',
    duration_minutes: 30, total_marks: 100, is_premium: false, is_adaptive: false
  });

  const categories = ['Quantitative', 'Logical Reasoning', 'Verbal Ability', 'Data Interpretation', 'General Knowledge', 'Mixed'];

  const fetchTests = async () => {
    try {
      const res = await api.get('/tests');
      setTests(res.data.tests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTests(); }, []);

  const openCreate = () => {
    setEditingTest(null);
    setForm({ title: '', description: '', category: 'Quantitative', difficulty: 'medium', duration_minutes: 30, total_marks: 100, is_premium: false, is_adaptive: false });
    setShowModal(true);
  };

  const openEdit = (test) => {
    setEditingTest(test.id);
    setForm({
      title: test.title || '', description: test.description || '',
      category: test.category || 'Quantitative', difficulty: test.difficulty || 'medium',
      duration_minutes: test.duration_minutes || 30, total_marks: test.total_marks || 100,
      is_premium: !!test.is_premium, is_adaptive: !!test.is_adaptive
    });
    setShowModal(true);
  };

  const saveTest = async () => {
    setSaving(true);
    try {
      if (editingTest) {
        await api.put(`/admin/tests/${editingTest}`, form);
      } else {
        await api.post('/admin/tests', form);
      }
      setShowModal(false);
      await fetchTests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save test');
    } finally {
      setSaving(false);
    }
  };

  const deleteTest = async (id) => {
    if (!window.confirm('Are you sure you want to delete this test? All associated questions and attempts will also be deleted.')) return;
    try {
      await api.delete(`/admin/tests/${id}`);
      setTests(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert('Delete failed');
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Manage Tests</h1>
        <p>Create, edit, and manage all aptitude tests</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {tests.length} test{tests.length !== 1 ? 's' : ''} total
        </div>
        <button onClick={openCreate} className="btn btn-primary"><FiPlus /> Create Test</button>
      </div>

      {/* Tests Grid */}
      {tests.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {tests.map(test => (
            <div key={test.id} className="card" style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
              {test.is_premium ? (
                <div style={{ position: 'absolute', top: 12, right: 12 }}>
                  <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>⭐ Premium</span>
                </div>
              ) : null}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                  background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent-primary)', flexShrink: 0
                }}>
                  <FiFileText size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>{test.title}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {test.description || 'No description'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                <span className="badge badge-primary">{test.category}</span>
                <span className={`badge ${test.difficulty === 'easy' ? 'badge-success' : test.difficulty === 'hard' ? 'badge-danger' : 'badge-warning'}`}>
                  {test.difficulty}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 16, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiClock size={13} /> {test.duration_minutes} min</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FiAward size={13} /> {test.total_marks} marks</span>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => openEdit(test)} className="btn btn-sm btn-secondary" style={{ flex: 1 }}><FiEdit2 /> Edit</button>
                <button onClick={() => deleteTest(test.id)} className="btn btn-sm btn-danger"><FiTrash2 /></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="icon">📝</div>
          <h3>No tests created yet</h3>
          <p>Create your first test to get started</p>
          <button onClick={openCreate} className="btn btn-primary" style={{ marginTop: 16 }}><FiPlus /> Create Test</button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h2>{editingTest ? 'Edit Test' : 'Create New Test'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Title</label>
                <input className="form-input" placeholder="e.g. Quantitative Aptitude Mock Test 1" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-input" placeholder="Brief description of the test..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Category</label>
                  <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Difficulty</label>
                  <select className="form-input" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <input className="form-input" type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="form-group">
                  <label>Total Marks</label>
                  <input className="form-input" type="number" value={form.total_marks} onChange={e => setForm({ ...form, total_marks: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={form.is_premium} onChange={e => setForm({ ...form, is_premium: e.target.checked })} />
                  Premium Only
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={form.is_adaptive} onChange={e => setForm({ ...form, is_adaptive: e.target.checked })} />
                  Adaptive Test
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveTest} disabled={saving || !form.title.trim()}>
                {saving ? 'Saving...' : editingTest ? 'Update Test' : 'Create Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
