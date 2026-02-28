import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { FiCheckCircle, FiXCircle, FiClock, FiCpu, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import api from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ResultPage() {
  const { attemptId } = useParams();
  const [result, setResult] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [expandedQ, setExpandedQ] = useState(null);
  const [explaining, setExplaining] = useState(null);
  const [explanations, setExplanations] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await api.get(`/results/${attemptId}`);
        setResult(res.data.result);
        setAnswers(res.data.answers);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [attemptId]);

  const getAIAnalysis = async () => {
    setAnalyzingAI(true);
    try {
      const res = await api.post('/ai/analyze', { attemptId: parseInt(attemptId) });
      setAnalysis(res.data.analysis);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzingAI(false);
    }
  };

  const explainQuestion = async (questionId, userAnswer) => {
    setExplaining(questionId);
    try {
      const res = await api.post('/ai/explain', { questionId, userAnswer });
      setExplanations(prev => ({ ...prev, [questionId]: res.data.explanation }));
    } catch (err) {
      console.error(err);
    } finally {
      setExplaining(null);
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;
  if (!result) return <div className="empty-state"><h3>Result not found</h3></div>;

  // Prepare topic chart data
  const topicMap = {};
  answers.forEach(a => {
    const topic = a.topic || 'General';
    if (!topicMap[topic]) topicMap[topic] = { correct: 0, total: 0 };
    topicMap[topic].total++;
    if (a.is_correct) topicMap[topic].correct++;
  });

  const topicChartData = {
    labels: Object.keys(topicMap),
    datasets: [
      { label: 'Correct', data: Object.values(topicMap).map(v => v.correct), backgroundColor: '#10b981', borderRadius: 4 },
      { label: 'Incorrect', data: Object.values(topicMap).map(v => v.total - v.correct), backgroundColor: '#ef4444', borderRadius: 4 }
    ]
  };

  const isPassed = result.accuracy >= 50;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Test Results</h1>
        <p>{result.test_title}</p>
      </div>

      {/* Score Card */}
      <div className="card" style={{ textAlign: 'center', marginBottom: 24, background: isPassed ? 'var(--success-bg)' : 'var(--danger-bg)', border: `2px solid ${isPassed ? 'var(--success)' : 'var(--danger)'}` }}>
        <div style={{ fontSize: '3rem', fontWeight: 800, color: isPassed ? 'var(--success)' : 'var(--danger)' }}>
          {parseFloat(result.accuracy).toFixed(1)}%
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8 }}>
          {isPassed ? '🎉 Congratulations! You passed!' : '💪 Keep practicing!'}
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Score: {result.score} / {result.total_marks}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green"><FiCheckCircle /></div>
          <div className="stat-info"><h3>{result.correct_count}</h3><p>Correct Answers</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><FiXCircle /></div>
          <div className="stat-info"><h3>{result.incorrect_count}</h3><p>Incorrect Answers</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><FiClock /></div>
          <div className="stat-info"><h3>{result.unanswered_count}</h3><p>Unanswered</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><FiClock /></div>
          <div className="stat-info">
            <h3>{Math.floor((result.time_taken_seconds || 0) / 60)}m {(result.time_taken_seconds || 0) % 60}s</h3>
            <p>Time Taken</p>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Topic Chart */}
        <div className="chart-container">
          <h3>📊 Topic-wise Breakdown</h3>
          <div style={{ height: 250 }}>
            <Bar data={topicChartData} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { labels: { color: '#94a3b8' } } },
              scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,0.08)' }, ticks: { color: '#94a3b8', stepSize: 1 } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
              }
            }} />
          </div>
        </div>

        {/* AI Analysis */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiCpu style={{ color: 'var(--accent-primary)' }} /> AI Analysis
          </h3>
          {analysis ? (
            <div style={{ fontSize: '0.875rem', lineHeight: 1.7 }}>
              <p style={{ marginBottom: 12 }}>{analysis.summary}</p>
              {analysis.strengths && (
                <div style={{ marginBottom: 12 }}>
                  <strong style={{ color: 'var(--success)' }}>Strengths:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {analysis.strengths.map((s, i) => <span key={i} className="badge badge-success">{s}</span>)}
                  </div>
                </div>
              )}
              {analysis.weaknesses && (
                <div style={{ marginBottom: 12 }}>
                  <strong style={{ color: 'var(--danger)' }}>Needs Work:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                    {analysis.weaknesses.map((w, i) => <span key={i} className="badge badge-danger">{w}</span>)}
                  </div>
                </div>
              )}
              {analysis.recommendations && (
                <div>
                  <strong>Recommendations:</strong>
                  <ul style={{ paddingLeft: 20, marginTop: 4, color: 'var(--text-secondary)' }}>
                    {analysis.recommendations.map((r, i) => <li key={i} style={{ marginBottom: 4 }}>{r}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: 12, fontSize: '0.85rem' }}>
                Get AI-powered insights on your performance
              </p>
              <button onClick={getAIAnalysis} className="btn btn-primary" disabled={analyzingAI}>
                <FiCpu /> {analyzingAI ? 'Analyzing...' : 'Analyze with AI'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Answers */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>📝 Detailed Answer Review</h3>
        {answers.map((ans, i) => (
          <div key={ans.id} style={{
            padding: '16px', marginBottom: 12, 
            background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
            border: `1px solid ${ans.is_correct ? 'rgba(16,185,129,0.2)' : ans.selected_option_id ? 'rgba(239,68,68,0.2)' : 'var(--border)'}` 
          }}>
            <div 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }}
              onClick={() => setExpandedQ(expandedQ === i ? null : i)}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  {ans.is_correct ? <FiCheckCircle style={{ color: 'var(--success)', flexShrink: 0 }} /> : <FiXCircle style={{ color: ans.selected_option_id ? 'var(--danger)' : 'var(--warning)', flexShrink: 0 }} />}
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Q{i + 1}. {ans.question_text}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 28 }}>
                  Topic: {ans.topic} | Time: {ans.time_spent_seconds}s
                </div>
              </div>
              {expandedQ === i ? <FiChevronUp /> : <FiChevronDown />}
            </div>

            {expandedQ === i && (
              <div style={{ marginTop: 12, marginLeft: 28, fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {ans.all_options?.map(opt => (
                    <div key={opt.id} style={{
                      padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                      background: opt.is_correct ? 'var(--success-bg)' : opt.id === ans.selected_option_id && !ans.is_correct ? 'var(--danger-bg)' : 'transparent',
                      border: `1px solid ${opt.is_correct ? 'var(--success)' : opt.id === ans.selected_option_id ? 'var(--danger)' : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', gap: 8
                    }}>
                      {opt.is_correct && <FiCheckCircle style={{ color: 'var(--success)' }} />}
                      {opt.id === ans.selected_option_id && !ans.is_correct && <FiXCircle style={{ color: 'var(--danger)' }} />}
                      {opt.option_text}
                    </div>
                  ))}
                </div>

                {ans.explanation && (
                  <div style={{ marginTop: 12, padding: 12, background: 'var(--info-bg)', borderRadius: 'var(--radius-sm)', color: 'var(--info)' }}>
                    <strong>Explanation:</strong> {ans.explanation}
                  </div>
                )}

                {/* AI Explain button */}
                {explanations[ans.question_id] ? (
                  <div style={{ marginTop: 12, padding: 12, background: 'rgba(99,102,241,0.08)', borderRadius: 'var(--radius-sm)', lineHeight: 1.7 }}>
                    <strong style={{ color: 'var(--accent-primary)' }}>🤖 AI Explanation:</strong>
                    <p style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{explanations[ans.question_id].explanation || JSON.stringify(explanations[ans.question_id])}</p>
                  </div>
                ) : (
                  <button 
                    onClick={() => explainQuestion(ans.question_id, ans.selected_answer)}
                    className="btn btn-sm btn-secondary" style={{ marginTop: 8 }}
                    disabled={explaining === ans.question_id}
                  >
                    <FiCpu /> {explaining === ans.question_id ? 'Explaining...' : 'AI Explain'}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
        <Link to="/tests" className="btn btn-primary">Take Another Test</Link>
        <Link to="/dashboard" className="btn btn-secondary">Back to Dashboard</Link>
      </div>
    </div>
  );
}
