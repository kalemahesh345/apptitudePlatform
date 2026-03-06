import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiDownload, FiEye, FiSearch, FiFilter, FiBarChart2 } from 'react-icons/fi';
import api from '../services/api';

export default function AdminResultsPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await api.get('/admin/results');
        setResults(res.data.results || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const downloadPDF = async (attemptId, userName, testTitle) => {
    setDownloading(attemptId);
    try {
      const res = await api.get(`/admin/results/${attemptId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `Report_${userName.replace(/\s+/g, '_')}_${testTitle.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download PDF report');
      console.error(err);
    } finally {
      setDownloading(null);
    }
  };

  const categories = [...new Set(results.map(r => r.category).filter(Boolean))];

  const filtered = results.filter(r => {
    const matchSearch = !search ||
      r.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.test_title?.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !filterCategory || r.category === filterCategory;
    return matchSearch && matchCategory;
  });

  // Summary stats
  const totalAttempts = results.length;
  const avgAccuracy = results.length > 0 ? (results.reduce((s, r) => s + (parseFloat(r.accuracy) || 0), 0) / results.length).toFixed(1) : 0;
  const passCount = results.filter(r => parseFloat(r.accuracy) >= 50).length;

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>User Test Results</h1>
        <p>View all user test submissions and download PDF reports</p>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon purple"><FiBarChart2 /></div>
          <div className="stat-info"><h3>{totalAttempts}</h3><p>Total Submissions</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><FiBarChart2 /></div>
          <div className="stat-info"><h3>{avgAccuracy}%</h3><p>Avg Accuracy</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FiBarChart2 /></div>
          <div className="stat-info"><h3>{passCount}</h3><p>Passed (≥50%)</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><FiBarChart2 /></div>
          <div className="stat-info"><h3>{totalAttempts - passCount}</h3><p>Failed</p></div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <FiSearch style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-input" placeholder="Search by student name, email, or test..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 40 }}
          />
        </div>
        <select className="form-input" style={{ width: 'auto', minWidth: 160 }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Results Table */}
      {filtered.length > 0 ? (
        <div className="card" style={{ overflow: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Test</th>
                <th>Category</th>
                <th>Score</th>
                <th>Accuracy</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 500 }}>{r.user_name}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{r.email}</td>
                  <td>{r.test_title}</td>
                  <td><span className="badge badge-primary">{r.category}</span></td>
                  <td>{r.score}/{r.total_marks}</td>
                  <td>
                    <span className={`badge ${r.accuracy >= 70 ? 'badge-success' : r.accuracy >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                      {parseFloat(r.accuracy).toFixed(1)}%
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {r.completed_at ? new Date(r.completed_at).toLocaleDateString() : '-'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Link to={`/results/${r.id}`} className="btn btn-sm btn-secondary" title="View Details">
                        <FiEye />
                      </Link>
                      <button
                        onClick={() => downloadPDF(r.id, r.user_name, r.test_title)}
                        className="btn btn-sm btn-primary"
                        disabled={downloading === r.id}
                        title="Download PDF Report"
                      >
                        {downloading === r.id ? '...' : <FiDownload />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="icon">📊</div>
          <h3>No results found</h3>
          <p>{search || filterCategory ? 'Try adjusting your filters' : 'No test submissions yet'}</p>
        </div>
      )}
    </div>
  );
}
