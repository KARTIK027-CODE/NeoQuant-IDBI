import { useState } from 'react';
import Avatar from '../components/Avatar/Avatar';
import './Login.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api/v1';

const DEMO_PROFILES = [
  { id: 'retail', label: 'Ramesh Kumar',  desc: 'Retail · Conservative · ₹1.2L portfolio' },
  { id: 'mass',   label: 'Priya Mehta',   desc: 'Mass · Moderate · ₹4.8L portfolio' },
  { id: 'hni',    label: 'Arvind Subramanian', desc: 'HNI · Aggressive · ₹24.5L portfolio' },
];

export default function LoginScreen({ onLogin }) {
  const [mobile,          setMobile]          = useState('');
  const [mpin,            setMpin]            = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [simStatus,       setSimStatus]       = useState(null);
  const [error,           setError]           = useState('');
  const [isSubmitting,    setIsSubmitting]    = useState(false);

  const handleDemoLogin = async (profile) => {
    if (isSubmitting) return;
    setSelectedProfile(profile.id);
    setSimStatus('loading');
    setError('');
    setIsSubmitting(true);

    await new Promise(r => setTimeout(r, 1100));

    try {
      const res  = await fetch(`${API_BASE}/auth/demo-login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ profile: profile.id }),
      });
      const data = await res.json();

      if (data.success) {
        setSimStatus('verified');
        await new Promise(r => setTimeout(r, 600));
        onLogin({ token: data.token, user: data.user, profile: profile.id });
      } else {
        setSimStatus(null);
        setError('Demo login failed. Please try again.');
      }
    } catch {
      setSimStatus('verified');
      await new Promise(r => setTimeout(r, 600));
      onLogin({
        token:   null,
        user:    { name: profile.label, userId: profile.id },
        profile: profile.id,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');

    if (!mobile || !/^\d{10}$/.test(mobile)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    if (!mpin || !/^\d{4,6}$/.test(mpin)) {
      setError('MPIN must be 4 to 6 digits.');
      return;
    }

    setSimStatus('loading');
    setIsSubmitting(true);

    try {
      const res  = await fetch(`${API_BASE}/auth/sim-binding`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mobile, mpin }),
      });
      const data = await res.json();

      if (data.success) {
        setSimStatus('verified');
        setMobile('');
        setMpin('');
        await new Promise(r => setTimeout(r, 600));
        onLogin({ token: data.token, user: data.user });
      } else {
        setSimStatus(null);
        setError(data.message || 'Authentication failed. Please try again.');
      }
    } catch {
      setSimStatus(null);
      setError('Unable to connect. Use a demo profile below to continue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const avatarState = simStatus === 'loading' ? 'thinking' : simStatus === 'verified' ? 'happy' : 'idle';

  return (
    <div className="login-screen" role="main">

      {/* Brand Bar */}
      <div className="login-brand-bar">
        <div className="login-brand-mark">IDBI</div>
        <div>
          <div className="login-brand-name">GO Mobile+</div>
          <div className="login-brand-sub">Wealth Advisor — IDBI Innovate 2026</div>
        </div>
      </div>

      {/* ARIA Avatar */}
      <div className="login-avatar-section">
        <div className="login-avatar-container">
          <Avatar state={avatarState} />
        </div>
        <div className="login-aria-name">ARIA</div>
        <div className="login-aria-desc">AI Wealth Advisor · SEBI Compliant</div>
      </div>

      {/* Form */}
      <div className="login-form-section">

        {/* Status */}
        {simStatus === 'loading' && (
          <div className="sim-binding-status loading" role="status" aria-live="polite">
            <div className="sim-spinner" />
            Verifying SIM binding...
          </div>
        )}
        {simStatus === 'verified' && (
          <div className="sim-binding-status" role="status">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Verified — Signing you in...
          </div>
        )}

        {error && (
          <div className="login-error" role="alert">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* Manual Login */}
        {!simStatus && (
          <form onSubmit={handleManualLogin} autoComplete="off" noValidate style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="login-section-title">Sign In</div>

            <div className="login-input-group">
              <label className="login-input-label" htmlFor="mobile-input">Mobile Number</label>
              <input
                id="mobile-input"
                className="login-input"
                type="tel"
                placeholder="10-digit registered number"
                value={mobile}
                onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                inputMode="numeric"
                autoComplete="tel"
                aria-required="true"
                disabled={isSubmitting}
              />
            </div>

            <div className="login-input-group">
              <label className="login-input-label" htmlFor="mpin-input">MPIN</label>
              <input
                id="mpin-input"
                className="login-input"
                type="password"
                placeholder="4–6 digit PIN"
                value={mpin}
                onChange={e => setMpin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                inputMode="numeric"
                autoComplete="new-password"
                aria-required="true"
                disabled={isSubmitting}
              />
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              className="btn btn-primary btn-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Verifying...' : 'Sign In with SIM Binding'}
            </button>
          </form>
        )}

        {/* Demo Profiles */}
        {!simStatus && (
          <>
            <div className="login-divider">
              <div className="login-divider-line" />
              <span className="login-divider-text">or continue with a demo profile</span>
              <div className="login-divider-line" />
            </div>

            <div className="demo-profiles" role="group" aria-label="Demo investor profiles">
              {DEMO_PROFILES.map(profile => (
                <button
                  key={profile.id}
                  id={`demo-${profile.id}`}
                  className={`demo-profile-btn ${selectedProfile === profile.id ? 'active' : ''}`}
                  onClick={() => handleDemoLogin(profile)}
                  disabled={isSubmitting}
                >
                  <div>
                    <div className="demo-profile-label">{profile.label}</div>
                    <div className="demo-profile-desc">{profile.desc}</div>
                  </div>
                  <svg className="demo-profile-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="login-footer">
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="login-badge">256-bit AES</span>
          <span className="login-badge">SEBI Regulated</span>
          <span className="login-badge">ISO 27001</span>
        </div>
        Production: AWS Bedrock (Claude 3.5 Sonnet) · IDBI AWS Knowledge Partner
      </div>
    </div>
  );
}
