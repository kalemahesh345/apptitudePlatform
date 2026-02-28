import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiClock, FiChevronLeft, FiChevronRight, FiAlertTriangle } from 'react-icons/fi';
import api from '../services/api';

export default function TestTakingPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tabWarning, setTabWarning] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const startTimeRef = useRef(Date.now());
  const questionStartRef = useRef(Date.now());

  // Start test
  useEffect(() => {
    const initTest = async () => {
      try {
        const res = await api.post(`/tests/${testId}/start`);
        setAttempt(res.data.attempt);
        setQuestions(res.data.questions);
        const duration = res.data.attempt.duration_minutes || res.data.attempt.test_duration || 30;
        setTimeLeft(parseInt(duration) * 60);
        setLoading(false);
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to start test');
        navigate('/tests');
      }
    };
    initTest();
  }, [testId]);

  // Timer
  useEffect(() => {
    if (!attempt || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [attempt]);

  // Anti-cheat: tab switch detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => prev + 1);
        setTabWarning(true);
        setTimeout(() => setTabWarning(false), 3000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const selectOption = useCallback(async (questionId, optionId) => {
    const timeSpent = Math.floor((Date.now() - questionStartRef.current) / 1000);
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    
    try {
      await api.post('/tests/answer', {
        attemptId: attempt.id,
        questionId,
        optionId,
        timeSpent
      });
    } catch (err) {
      console.error('Save answer error:', err);
    }
  }, [attempt]);

  const handleSubmit = async (auto = false) => {
    if (submitting) return;
    if (!auto && !window.confirm('Are you sure you want to submit the test?')) return;
    
    setSubmitting(true);
    const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);
    
    try {
      const res = await api.post(`/tests/${attempt.id}/submit`, { timeTaken });
      navigate(`/results/${attempt.id}`);
    } catch (err) {
      alert('Submit failed: ' + (err.response?.data?.message || 'Unknown error'));
      setSubmitting(false);
    }
  };

  const goToQuestion = (index) => {
    questionStartRef.current = Date.now();
    setCurrentIndex(index);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  const currentQ = questions[currentIndex];
  const timerClass = timeLeft <= 60 ? 'danger' : timeLeft <= 300 ? 'warning' : '';

  return (
    <div className="fade-in">
      {/* Tab warning */}
      {tabWarning && (
        <div className="alert alert-error" style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 999, boxShadow: 'var(--shadow-lg)' }}>
          <FiAlertTriangle /> Warning: Tab switch detected! ({tabSwitchCount} times)
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{attempt?.test_title}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Question {currentIndex + 1} of {questions.length}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className={`timer ${timerClass}`}>
            <FiClock /> {formatTime(timeLeft)}
          </div>
          <button onClick={() => handleSubmit(false)} className="btn btn-danger btn-sm" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Test'}
          </button>
        </div>
      </div>

      <div className="test-layout">
        {/* Question Panel */}
        <div className="question-panel">
          <div className="question-text">
            <span style={{ color: 'var(--accent-primary)', fontWeight: 700, marginRight: 8 }}>
              Q{currentIndex + 1}.
            </span>
            {currentQ?.question_text}
          </div>

          <div className="option-list">
            {currentQ?.options?.map((opt, i) => (
              <div
                key={opt.id}
                className={`option-item ${answers[currentQ.id] === opt.id ? 'selected' : ''}`}
                onClick={() => selectOption(currentQ.id, opt.id)}
              >
                <div className="option-marker">
                  {String.fromCharCode(65 + i)}
                </div>
                <span>{opt.option_text}</span>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
            <button
              className="btn btn-secondary"
              onClick={() => goToQuestion(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
            >
              <FiChevronLeft /> Previous
            </button>
            <button
              className="btn btn-primary"
              onClick={() => goToQuestion(Math.min(questions.length - 1, currentIndex + 1))}
              disabled={currentIndex === questions.length - 1}
            >
              Next <FiChevronRight />
            </button>
          </div>
        </div>

        {/* Navigation Panel */}
        <div className="nav-panel">
          <h3>Questions</h3>
          <div className="question-nav-grid">
            {questions.map((q, i) => (
              <button
                key={q.id}
                className={`q-nav-btn ${i === currentIndex ? 'active' : ''} ${answers[q.id] ? 'answered' : ''}`}
                onClick={() => goToQuestion(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          
          <div style={{ marginTop: 20, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--success)' }}></div> Answered
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--accent-primary)' }}></div> Current
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}></div> Not visited
            </div>
          </div>

          <div style={{ marginTop: 16, padding: '12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
            <strong>Answered:</strong> {Object.keys(answers).length} / {questions.length}
          </div>
        </div>
      </div>
    </div>
  );
}
