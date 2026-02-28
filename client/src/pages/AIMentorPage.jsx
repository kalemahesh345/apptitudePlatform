import { useState, useEffect, useRef } from 'react';
import { FiSend, FiCpu, FiTrash2, FiBarChart2, FiCalendar, FiHelpCircle, FiMessageCircle } from 'react-icons/fi';
import api from '../services/api';

export default function AIMentorPage() {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    { role: 'assistant', message: "👋 Hi! I'm your AI Study Mentor. I can help you with:\n\n• **Topic explanations** — Ask about any aptitude concept\n• **Practice tips** — Get strategies to improve\n• **Study advice** — Personalized recommendations\n• **Motivation** — Stay on track!\n\nWhat would you like to work on today?" }
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [studyPlan, setStudyPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', message: userMsg }]);
    setSending(true);

    try {
      const res = await api.post('/ai/chat', { message: userMsg, sessionId });
      setSessionId(res.data.sessionId);
      setMessages(prev => [...prev, { role: 'assistant', message: res.data.reply }]);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Sorry, something went wrong. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', message: `⚠️ ${errorMsg}` }]);
    } finally {
      setSending(false);
    }
  };

  const clearChat = () => {
    setMessages([{ role: 'assistant', message: "Chat cleared! How can I help you today?" }]);
    setSessionId(null);
  };

  const getAnalysis = async () => {
    setAnalyzingAI(true);
    try {
      const res = await api.post('/ai/analyze', {});
      setAnalysis(res.data.analysis);
    } catch (err) {
      console.error(err);
      setAnalysis({ summary: 'Unable to generate analysis. Please take some tests first.' });
    } finally {
      setAnalyzingAI(false);
    }
  };

  const getStudyPlan = async () => {
    setLoadingPlan(true);
    try {
      const res = await api.post('/ai/recommend', {});
      setStudyPlan(res.data.recommendation);
    } catch (err) {
      console.error(err);
      setStudyPlan({ plan: 'Unable to generate study plan. Please take some tests first.' });
    } finally {
      setLoadingPlan(false);
    }
  };

  const quickPrompts = [
    "How do I improve my accuracy in Percentages?",
    "Explain the concept of Probability",
    "Give me a practice question on Time & Work",
    "What's a good study plan for logical reasoning?"
  ];

  const tabs = [
    { id: 'chat', label: 'AI Chat', icon: <FiMessageCircle /> },
    { id: 'analysis', label: 'Performance Analysis', icon: <FiBarChart2 /> },
    { id: 'studyplan', label: 'Study Plan', icon: <FiCalendar /> },
  ];

  const renderMarkdown = (text) => {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background:rgba(139,92,246,0.15);padding:2px 6px;border-radius:4px;font-size:0.85em">$1</code>');
  };

  return (
    <div className="fade-in" style={{ height: 'calc(100vh - var(--header-height) - 48px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 700, background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            <FiCpu style={{ WebkitTextFillColor: 'initial', color: 'var(--accent-primary)', marginRight: 8 }} />
            AI Study Mentor
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Powered by AI • Chat, Analyze Performance, Get Study Plans</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: 4 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '10px 16px', border: 'none', borderRadius: 'var(--radius-sm)',
              background: activeTab === tab.id ? 'var(--accent-primary)' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
              fontFamily: 'var(--font)', transition: 'var(--transition-fast)'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <button onClick={clearChat} className="btn btn-sm btn-secondary"><FiTrash2 /> Clear</button>
          </div>
          <div style={{
            flex: 1, overflowY: 'auto', background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)',
            padding: 20, display: 'flex', flexDirection: 'column', gap: 16
          }}>
            {messages.map((msg, i) => (
              <div key={i} className={`chat-bubble ${msg.role}`} style={{ whiteSpace: 'pre-wrap' }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.message) }}
              />
            ))}
            {sending && (
              <div className="chat-bubble assistant" style={{ display: 'flex', gap: 4 }}>
                <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div>
                <span style={{ marginLeft: 8, color: 'var(--text-muted)' }}>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 2 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {quickPrompts.map((prompt, i) => (
                <button key={i} className="btn btn-sm btn-secondary"
                  onClick={() => { setInput(prompt); }}
                  style={{ fontSize: '0.75rem' }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={sendMessage} style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <input
              type="text" value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about aptitude preparation..."
              style={{
                flex: 1, padding: '14px 20px', background: 'var(--bg-card)',
                border: '1px solid var(--border)', borderRadius: 'var(--radius-full)',
                color: 'var(--text-primary)', fontFamily: 'var(--font)', fontSize: '0.9rem', outline: 'none'
              }}
              disabled={sending}
            />
            <button type="submit" className="btn btn-primary" disabled={sending || !input.trim()} style={{ borderRadius: 'var(--radius-full)', padding: '14px 20px' }}>
              <FiSend />
            </button>
          </form>
        </div>
      )}

      {/* Analysis Tab */}
      {activeTab === 'analysis' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {analysis ? (
            <div className="card" style={{ padding: 24, lineHeight: 1.8 }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiBarChart2 style={{ color: 'var(--accent-primary)' }} /> Your Performance Analysis
              </h3>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 20 }}>{analysis.summary}</p>

              {analysis.overallRating && (
                <div style={{ padding: '12px 16px', background: 'rgba(99,102,241,0.08)', borderRadius: 'var(--radius-sm)', marginBottom: 20, fontWeight: 600, color: 'var(--accent-primary)' }}>
                  Overall Rating: {analysis.overallRating}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                {analysis.strengths && (
                  <div style={{ padding: 16, background: 'var(--success-bg)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <h4 style={{ color: 'var(--success)', marginBottom: 10, fontSize: '0.9rem' }}>💪 Strengths</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {analysis.strengths.map((s, i) => <span key={i} className="badge badge-success">{s}</span>)}
                    </div>
                  </div>
                )}
                {analysis.weaknesses && (
                  <div style={{ padding: 16, background: 'var(--danger-bg)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <h4 style={{ color: 'var(--danger)', marginBottom: 10, fontSize: '0.9rem' }}>🎯 Needs Improvement</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {analysis.weaknesses.map((w, i) => <span key={i} className="badge badge-danger">{w}</span>)}
                    </div>
                  </div>
                )}
              </div>

              {analysis.recommendations && (
                <div>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: 10 }}>📌 Recommendations</h4>
                  <ul style={{ paddingLeft: 20, lineHeight: 2, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {analysis.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}

              <button onClick={getAnalysis} className="btn btn-secondary" style={{ marginTop: 16 }}>
                <FiBarChart2 /> Re-analyze
              </button>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>📊</div>
              <h3 style={{ marginBottom: 8 }}>AI Performance Analysis</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
                Get AI-powered insights on your test performance, strengths, weaknesses, and personalized recommendations.
              </p>
              <button onClick={getAnalysis} className="btn btn-primary" disabled={analyzingAI}>
                <FiCpu /> {analyzingAI ? 'Analyzing...' : 'Analyze My Performance'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Study Plan Tab */}
      {activeTab === 'studyplan' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {studyPlan ? (
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiCalendar style={{ color: 'var(--accent-primary)' }} />
                {studyPlan.plan?.title || 'Your Personalized Study Plan'}
              </h3>

              {studyPlan.estimatedImprovement && (
                <div style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.08)', borderRadius: 'var(--radius-sm)', marginBottom: 20, color: 'var(--success)', fontWeight: 600 }}>
                  🚀 Expected: {studyPlan.estimatedImprovement}
                </div>
              )}

              {studyPlan.priorityTopics && (
                <div style={{ marginBottom: 20 }}>
                  <h4 style={{ fontSize: '0.85rem', marginBottom: 8, color: 'var(--text-muted)' }}>Priority Topics</h4>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {studyPlan.priorityTopics.map((t, i) => <span key={i} className="badge badge-warning">{t}</span>)}
                  </div>
                </div>
              )}

              {studyPlan.plan?.days && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {studyPlan.plan.days.map((day, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px',
                      background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)'
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'var(--accent-gradient)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0
                      }}>
                        {day.day}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{day.topic}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          ⏰ {day.duration} {day.resources?.length > 0 ? `• ${day.resources[0]}` : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {typeof studyPlan.plan === 'string' && (
                <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{studyPlan.plan}</p>
              )}

              <button onClick={getStudyPlan} className="btn btn-secondary" style={{ marginTop: 16 }}>
                <FiCalendar /> Generate New Plan
              </button>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>📅</div>
              <h3 style={{ marginBottom: 8 }}>AI Study Plan Generator</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
                Get a personalized 14-day study plan based on your test performance, with daily topics and recommended resources.
              </p>
              <button onClick={getStudyPlan} className="btn btn-primary" disabled={loadingPlan}>
                <FiCpu /> {loadingPlan ? 'Generating Plan...' : 'Generate My Study Plan'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
