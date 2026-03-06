import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiClock, FiChevronLeft, FiChevronRight, FiAlertTriangle, FiCamera, FiCameraOff } from 'react-icons/fi';
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
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [showTabModal, setShowTabModal] = useState(false);
  const startTimeRef = useRef(Date.now());
  const questionStartRef = useRef(Date.now());
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Start camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 200, height: 150, facingMode: 'user' },
          audio: false 
        });
        streamRef.current = stream;
        // Assign stream to video element immediately if available
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setCameraActive(true);
      } catch (err) {
        console.error('Camera access denied:', err);
        setCameraError(true);
      }
    };
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Re-assign stream to video element whenever cameraActive changes or component re-renders
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive]);

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

  // Anti-cheat: tab switch detection with enforcement
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden && attempt) {
        const newCount = tabSwitchCount + 1;
        setTabSwitchCount(newCount);
        setShowTabModal(true);

        // Report to server
        try {
          const res = await api.post('/tests/tab-switch', {
            attemptId: attempt.id,
            tabSwitchCount: newCount
          });
          if (res.data.autoSubmit) {
            handleSubmit(true);
            return;
          }
        } catch (err) {
          console.error('Tab switch report error:', err);
        }

        if (newCount >= 3) {
          handleSubmit(true);
        }
      }
    };

    // Prevent keyboard shortcuts
    const handleKeyDown = (e) => {
      // Block Ctrl+C, Ctrl+A, Ctrl+V, Ctrl+P, Ctrl+S, F12
      if (
        (e.ctrlKey && ['c', 'a', 'v', 'p', 's', 'u'].includes(e.key.toLowerCase())) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // Block Alt+Tab notification
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
      }

      // Block PrintScreen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
      }
    };

    // Prevent right-click
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    // Prevent copy
    const handleCopy = (e) => {
      e.preventDefault();
      return false;
    };

    // Prevent paste
    const handlePaste = (e) => {
      e.preventDefault();
      return false;
    };

    // Prevent cut
    const handleCut = (e) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
    };
  }, [attempt, tabSwitchCount]);

  // Prevent leaving page
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'You have a test in progress. Are you sure you want to leave?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
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
    
    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
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
    <div className="fade-in" style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}>
      {/* Tab Switch Warning Modal */}
      {showTabModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column'
        }}>
          <div style={{
            background: 'var(--bg-primary)', padding: '40px', borderRadius: 'var(--radius-lg)',
            textAlign: 'center', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            border: '2px solid var(--danger)'
          }}>
            <FiAlertTriangle style={{ fontSize: 48, color: 'var(--danger)', marginBottom: 16 }} />
            <h2 style={{ color: 'var(--danger)', marginBottom: 12, fontSize: '1.4rem' }}>
              ⚠️ Tab Switch Detected!
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 8, fontSize: '1rem' }}>
              You have switched tabs <strong style={{ color: 'var(--danger)', fontSize: '1.2rem' }}>{tabSwitchCount}</strong> time{tabSwitchCount > 1 ? 's' : ''}.
            </p>
            <p style={{ color: 'var(--danger)', fontWeight: 600, marginBottom: 20, fontSize: '0.95rem' }}>
              {tabSwitchCount >= 2 
                ? '🚫 ONE MORE TAB SWITCH AND YOUR TEST WILL BE AUTO-SUBMITTED!' 
                : `You are allowed maximum 2 tab switches. After 3, your test will be auto-submitted.`}
            </p>
            <div style={{
              background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)',
              padding: '12px', marginBottom: 20
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: i <= tabSwitchCount ? 'var(--danger)' : 'var(--bg-secondary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: i <= tabSwitchCount ? '#fff' : 'var(--text-muted)',
                    fontWeight: 700, fontSize: '0.9rem',
                    border: `2px solid ${i <= tabSwitchCount ? 'var(--danger)' : 'var(--border)'}`
                  }}>
                    {i <= tabSwitchCount ? '✗' : i}
                  </div>
                ))}
              </div>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowTabModal(false)}
              style={{ padding: '10px 40px', fontSize: '1rem' }}
            >
              I Understand, Continue Test
            </button>
          </div>
        </div>
      )}

      {/* Camera Preview */}
      <div style={{
        position: 'fixed', bottom: 20, right: 20, zIndex: 100,
        borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        border: '3px solid var(--accent-primary)',
        background: '#000'
      }}>
        {/* Always render video so ref is available */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: 180, height: 135, objectFit: 'cover', display: 'block',
            visibility: cameraActive ? 'visible' : 'hidden',
            position: cameraActive ? 'relative' : 'absolute'
          }}
        />
        {!cameraActive && (
          <div style={{
            width: 180, height: 135,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 6,
            background: 'var(--bg-tertiary)'
          }}>
            <FiCameraOff style={{ fontSize: 24, color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {cameraError ? 'Camera blocked' : 'Starting...'}
            </span>
          </div>
        )}
        <div style={{
          position: 'absolute', top: 4, left: 4,
          display: 'flex', alignItems: 'center', gap: 4,
          background: cameraActive ? 'rgba(239,68,68,0.9)' : 'rgba(100,100,100,0.9)',
          color: '#fff', padding: '2px 8px', borderRadius: 12,
          fontSize: '0.6rem', fontWeight: 600
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: cameraActive ? '#fff' : '#888',
            animation: cameraActive ? 'pulse 1.5s infinite' : 'none'
          }} />
          {cameraActive ? 'LIVE' : 'OFF'}
        </div>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{attempt?.test_title}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Question {currentIndex + 1} of {questions.length}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {tabSwitchCount > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'rgba(239,68,68,0.15)', padding: '4px 10px',
              borderRadius: 'var(--radius-sm)', color: 'var(--danger)',
              fontSize: '0.75rem', fontWeight: 600
            }}>
              <FiAlertTriangle /> Tab: {tabSwitchCount}/3
            </div>
          )}
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

          {/* Camera Status */}
          <div style={{
            marginTop: 12, padding: '10px', borderRadius: 'var(--radius-sm)',
            background: cameraActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${cameraActive ? 'var(--success)' : 'var(--danger)'}`,
            display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem'
          }}>
            {cameraActive ? <FiCamera style={{ color: 'var(--success)' }} /> : <FiCameraOff style={{ color: 'var(--danger)' }} />}
            <span style={{ color: cameraActive ? 'var(--success)' : 'var(--danger)' }}>
              {cameraActive ? 'Camera Active' : 'Camera Inactive'}
            </span>
          </div>

          {/* Anti-cheat status */}
          <div style={{
            marginTop: 8, padding: '10px', borderRadius: 'var(--radius-sm)',
            background: tabSwitchCount > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
            border: `1px solid ${tabSwitchCount > 0 ? 'var(--danger)' : 'var(--success)'}`,
            fontSize: '0.75rem',
            color: tabSwitchCount > 0 ? 'var(--danger)' : 'var(--success)'
          }}>
            <FiAlertTriangle style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Tab Switches: {tabSwitchCount} / 3
          </div>
        </div>
      </div>
    </div>
  );
}
