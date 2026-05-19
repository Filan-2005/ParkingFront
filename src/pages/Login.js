// src/pages/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, loading, error, setError } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const u = await login(username, password);
    if (!u) return;
    const dest = { Admin: '/admin', Attendant: '/attendant', Viewer: '/viewer' }[u.role] || '/viewer';
    navigate(dest, { replace: true });
  }

  return (
    <div className="login-page">
      {/* Left branding panel */}
      <div className="login-left">
        <div className="login-brand">
          <div className="login-brand-logo">
            <div className="brand-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="3"/>
                <path d="M8 6v12M8 12h6a3 3 0 000-6H8"/>
              </svg>
            </div>
            <h1>Smart Parking</h1>
          </div>
          <p>
            A complete parking management platform for modern facilities.
            Monitor lots, issue tickets, and track revenue — all in one place.
          </p>
          <div className="feature-list">
            {[
              'Multi-lot management',
              'Real-time spot availability',
              'Automated tariff pricing',
              'Role-based access control',
              'Revenue & analytics',
            ].map(f => (
              <div key={f} className="feature-item">
                <div className="feature-dot" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right login form */}
      <div className="login-right">
        <div className="login-form-wrap">
          <h2>Welcome back</h2>
          <p className="sub">Sign in to your account to continue</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field" style={{ marginBottom: 18 }}>
              <label>Username</label>
              <input
                className="input"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(''); }}
                placeholder="Enter your username"
                autoComplete="username"
                autoFocus
              />
            </div>
            <div className="field" style={{ marginBottom: 28 }}>
              <label>Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading || !username || !password}>
              {loading
                ? <><span className="spinner" style={{ width: 14, height: 14, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /> Signing in...</>
                : 'Sign in'
              }
            </button>
          </form>

          <p style={{ marginTop: 32, fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>
            Smart Parking · Graduation Project
          </p>
        </div>
      </div>
    </div>
  );
}
