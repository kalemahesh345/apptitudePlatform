import { useState, useEffect } from 'react';
import { FiStar, FiCheck, FiZap, FiCpu, FiFileText, FiTrendingUp, FiAward } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PremiumPage() {
  const { user, isPremium } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [subscribing, setSubscribing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await api.get('/premium/status');
        setSubscription(res.data.subscription);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const handleSubscribe = async (plan) => {
    setSubscribing(true);
    try {
      const res = await api.post('/premium/subscribe', { plan });
      alert(res.data.message);
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Subscription failed');
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  const features = [
    { icon: <FiFileText />, title: 'Unlimited Tests', desc: 'Access all tests without daily limits' },
    { icon: <FiCpu />, title: 'Advanced AI Analytics', desc: 'Deep performance insights & patterns' },
    { icon: <FiTrendingUp />, title: 'Adaptive Testing', desc: 'AI-adjusted difficulty for optimal learning' },
    { icon: <FiZap />, title: 'Unlimited AI Mentor', desc: 'No daily message limits with AI chatbot' },
    { icon: <FiAward />, title: 'PDF Reports', desc: 'Download detailed performance reports' },
    { icon: <FiStar />, title: 'Priority Support', desc: 'Get help faster with premium support' },
  ];

  const plans = [
    { plan: 'monthly', name: 'Monthly', price: '₹199', period: '/month', popular: false },
    { plan: 'quarterly', name: 'Quarterly', price: '₹499', period: '/3 months', popular: true, save: 'Save 16%' },
    { plan: 'yearly', name: 'Yearly', price: '₹1499', period: '/year', popular: false, save: 'Save 37%' }
  ];

  return (
    <div className="fade-in">
      <div className="page-header" style={{ textAlign: 'center' }}>
        <h1>⭐ Premium Plan</h1>
        <p>Unlock your full potential with premium features</p>
      </div>

      {/* Current status */}
      {isPremium && (
        <div className="card" style={{ textAlign: 'center', marginBottom: 32, background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(217,119,6,0.05))', border: '2px solid rgba(245,158,11,0.3)' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>👑</div>
          <h3 style={{ color: 'var(--warning)' }}>You're a Premium Member!</h3>
          {subscription && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>
              Plan: {subscription.plan} | Expires: {new Date(subscription.expires_at).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Features */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 40 }}>
        {features.map((f, i) => (
          <div key={i} className="card" style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: 20 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 'var(--radius-sm)',
              background: 'rgba(245,158,11,0.15)', color: '#fbbf24',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', flexShrink: 0
            }}>{f.icon}</div>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 2 }}>{f.title}</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing */}
      {!isPremium && (
        <>
          <h2 style={{ textAlign: 'center', marginBottom: 24, fontSize: '1.3rem' }}>Choose Your Plan</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, maxWidth: 800, margin: '0 auto' }}>
            {plans.map(p => (
              <div key={p.plan} className="card" style={{
                textAlign: 'center', position: 'relative',
                border: p.popular ? '2px solid var(--accent-primary)' : '1px solid var(--border)',
                transform: p.popular ? 'scale(1.05)' : 'none'
              }}>
                {p.popular && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--accent-gradient)', color: 'white',
                    padding: '4px 16px', borderRadius: 'var(--radius-full)',
                    fontSize: '0.7rem', fontWeight: 700
                  }}>MOST POPULAR</div>
                )}
                <h3 style={{ fontSize: '1rem', marginBottom: 8, marginTop: p.popular ? 8 : 0 }}>{p.name}</h3>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: 4 }}>
                  {p.price}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>{p.period}</span>
                </div>
                {p.save && <div className="badge badge-success" style={{ marginBottom: 12 }}>{p.save}</div>}
                <ul style={{ listStyle: 'none', textAlign: 'left', fontSize: '0.8rem', margin: '16px 0', color: 'var(--text-secondary)' }}>
                  {['Unlimited tests', 'AI Analytics', 'AI Mentor', 'PDF Reports', 'Adaptive Tests'].map(feat => (
                    <li key={feat} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                      <FiCheck style={{ color: 'var(--success)', flexShrink: 0 }} /> {feat}
                    </li>
                  ))}
                </ul>
                <button onClick={() => handleSubscribe(p.plan)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={subscribing}>
                  {subscribing ? 'Processing...' : 'Subscribe'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
