import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiUpload, FiX, FiDownload } from 'react-icons/fi';
import api from '../services/api';

export default function AdminQuestionsPage() {
  const [tests, setTests] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingQ, setEditingQ] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    test_id: '', question_text: '', explanation: '', topic: '', difficulty: 'medium', marks: 1,
    options: [
      { option_text: '', is_correct: true },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false }
    ]
  });

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await api.get('/tests');
        setTests(res.data.tests);
        setLoading(false);
      } catch (err) { console.error(err); setLoading(false); }
    };
    fetchTests();
  }, []);

  useEffect(() => {
    if (!selectedTestId) { setQuestions([]); return; }
    const fetchQuestions = async () => {
      try {
        const res = await api.get(`/tests/${selectedTestId}`);
        const qRes = await api.post(`/tests/${selectedTestId}/start`);
        setQuestions(qRes.data.questions || []);
      } catch (err) { console.error(err); }
    };
    fetchQuestions();
  }, [selectedTestId]);

  const openCreate = () => {
    setEditingQ(null);
    setForm({
      test_id: selectedTestId, question_text: '', explanation: '', topic: '', difficulty: 'medium', marks: 1,
      options: [
        { option_text: '', is_correct: true },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false }
      ]
    });
    setShowModal(true);
  };

  const openEdit = (q) => {
    setEditingQ(q.id);
    setForm({
      test_id: q.test_id || selectedTestId,
      question_text: q.question_text,
      explanation: q.explanation || '',
      topic: q.topic || '',
      difficulty: q.difficulty || 'medium',
      marks: q.marks || 1,
      options: q.options?.length >= 4 ? q.options.map(o => ({ option_text: o.option_text, is_correct: o.is_correct })) : [
        { option_text: '', is_correct: true },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false }
      ]
    });
    setShowModal(true);
  };

  const handleOptionChange = (index, field, value) => {
    setForm(prev => {
      const options = [...prev.options];
      if (field === 'is_correct') {
        options.forEach((o, i) => o.is_correct = i === index);
      } else {
        options[index][field] = value;
      }
      return { ...prev, options };
    });
  };

  const saveQuestion = async () => {
    try {
      if (editingQ) {
        await api.put(`/admin/questions/${editingQ}`, form);
      } else {
        await api.post('/admin/questions', form);
      }
      setShowModal(false);
      if (selectedTestId) {
        const qRes = await api.post(`/tests/${selectedTestId}/start`);
        setQuestions(qRes.data.questions || []);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save question');
    }
  };

  const deleteQuestion = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.delete(`/admin/questions/${id}`);
      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (err) {
      alert('Delete failed');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const validTypes = ['.csv', '.xlsx', '.xls'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validTypes.includes(ext)) {
      alert('Please upload a CSV or Excel (.xlsx) file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/admin/questions/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(res.data.message + (res.data.errors?.length ? `\n${res.data.errors.length} errors occurred.` : ''));
      // Refresh questions
      if (selectedTestId) {
        const qRes = await api.post(`/tests/${selectedTestId}/start`);
        setQuestions(qRes.data.questions || []);
      }
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.message || 'Unknown error'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const downloadTemplate = async () => {
    try {
      const res = await api.get('/admin/questions/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'questions_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download template');
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Question Management</h1>
        <p>Add, edit, and manage test questions</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="form-input" style={{ width: 'auto', minWidth: 240 }} value={selectedTestId} onChange={e => setSelectedTestId(e.target.value)}>
          <option value="">Select a Test</option>
          {tests.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
        <button onClick={openCreate} className="btn btn-primary btn-sm" disabled={!selectedTestId}><FiPlus /> Add Question</button>
        <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', opacity: uploading ? 0.6 : 1 }}>
          <FiUpload /> {uploading ? 'Uploading...' : 'Upload CSV/Excel'}
          <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading} />
        </label>
        <button onClick={downloadTemplate} className="btn btn-sm" style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: 6
        }}>
          <FiDownload /> Download Excel Template
        </button>
      </div>

      {/* Upload Instructions */}
      <div style={{
        background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
        padding: '14px 18px', marginBottom: 20, fontSize: '0.8rem',
        border: '1px solid var(--border)'
      }}>
        <strong style={{ color: 'var(--accent-primary)' }}>📝 Bulk Upload Instructions:</strong>
        <ul style={{ margin: '8px 0 0 16px', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
          <li>Download the Excel template using the green button above</li>
          <li>Fill in your questions — columns: <code>test_id, question, option_a, option_b, option_c, option_d, correct_answer (A/B/C/D), explanation, topic, difficulty, marks, negative_marks</code></li>
          <li>Upload the filled Excel (.xlsx) or CSV file</li>
        </ul>
      </div>

      {/* Questions List */}
      {questions.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {questions.map((q, i) => (
            <div key={q.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 6 }}>
                    Q{i + 1}. {q.question_text}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {q.options?.map((opt, oi) => (
                      <span key={oi} className={`badge ${opt.is_correct ? 'badge-success' : 'badge-info'}`} style={{ fontSize: '0.7rem' }}>
                        {String.fromCharCode(65 + oi)}. {opt.option_text?.substring(0, 30)}
                      </span>
                    ))}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 4 }}>
                    Topic: {q.topic} | Difficulty: {q.difficulty} | Marks: {q.marks}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => openEdit(q)} className="btn btn-sm btn-secondary"><FiEdit2 /></button>
                  <button onClick={() => deleteQuestion(q.id)} className="btn btn-sm btn-danger"><FiTrash2 /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : selectedTestId ? (
        <div className="empty-state"><h3>No questions in this test</h3><p>Add questions to get started</p></div>
      ) : (
        <div className="empty-state"><h3>Select a test</h3><p>Choose a test to manage its questions</p></div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h2>{editingQ ? 'Edit Question' : 'Add Question'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Question Text</label>
                <textarea className="form-input" value={form.question_text} onChange={e => setForm({ ...form, question_text: e.target.value })} rows={3} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Topic</label>
                  <input className="form-input" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} />
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
              <div className="form-group">
                <label>Options (select correct answer)</label>
                {form.options.map((opt, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <input type="radio" name="correct" checked={opt.is_correct} onChange={() => handleOptionChange(i, 'is_correct')} />
                    <input className="form-input" placeholder={`Option ${String.fromCharCode(65 + i)}`} value={opt.option_text} onChange={e => handleOptionChange(i, 'option_text', e.target.value)} />
                  </div>
                ))}
              </div>
              <div className="form-group">
                <label>Explanation</label>
                <textarea className="form-input" value={form.explanation} onChange={e => setForm({ ...form, explanation: e.target.value })} rows={2} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveQuestion}>{editingQ ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
