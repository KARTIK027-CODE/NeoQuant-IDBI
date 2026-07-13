import { useState, useEffect } from 'react';
import LoginScreen    from './screens/Login';
import PortfolioScreen from './screens/Portfolio';
import ChatScreen     from './screens/Chat';
import './index.css';

// ── Nav Icons ─────────────────────────────────────────────────
const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const PortfolioIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6"  y1="20" x2="6"  y2="14"/>
  </svg>
);

const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const TransactIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9"/>
    <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
    <polyline points="7 23 3 19 7 15"/>
    <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
  </svg>
);

const ProfileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const NAV_ITEMS = [
  { id: 'home',      label: 'Home',      Icon: HomeIcon },
  { id: 'portfolio', label: 'Portfolio', Icon: PortfolioIcon },
  { id: 'chat',      label: 'ARIA',      Icon: ChatIcon },
  { id: 'transact',  label: 'Transact',  Icon: TransactIcon },
  { id: 'profile',   label: 'Profile',   Icon: ProfileIcon },
];

// ── Status Bar ────────────────────────────────────────────────
function StatusBar() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: false,
      }));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="status-bar">
      <div className="status-time">{time}</div>
      <div className="status-icons">
        {/* Signal bars */}
        <svg width="16" height="14" viewBox="0 0 20 16" fill="currentColor">
          <rect x="0"  y="10" width="3" height="6"  rx="1" opacity="0.35"/>
          <rect x="4"  y="7"  width="3" height="9"  rx="1" opacity="0.55"/>
          <rect x="8"  y="4"  width="3" height="12" rx="1" opacity="0.75"/>
          <rect x="12" y="1"  width="3" height="15" rx="1" opacity="1"/>
        </svg>
        {/* WiFi */}
        <svg width="16" height="14" viewBox="0 0 24 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M1 6a15.1 15.1 0 0 1 22 0"/>
          <path d="M5 10a10 10 0 0 1 14 0"/>
          <path d="M8.5 14a5.5 5.5 0 0 1 7 0"/>
          <circle cx="12" cy="18" r="1.2" fill="currentColor" stroke="none"/>
        </svg>
        {/* Battery */}
        <svg width="22" height="14" viewBox="0 0 26 14" fill="none">
          <rect x="0" y="1" width="22" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
          <rect x="22.5" y="4.5" width="2.5" height="5" rx="1" fill="currentColor" opacity="0.5"/>
          <rect x="2" y="3" width="16" height="8" rx="1.5" fill="currentColor"/>
        </svg>
      </div>
    </div>
  );
}

// ── Coming Soon stub ──────────────────────────────────────────
function ComingSoon({ label, onLogout }) {
  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      height:         '100%',
      gap:            '12px',
      padding:        '40px 24px',
      background:     'var(--surface)',
    }}>
      <div style={{
        width:           '56px',
        height:          '56px',
        borderRadius:    '14px',
        border:          '1.5px solid var(--border-strong)',
        background:      'var(--surface-3)',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        color:           'var(--text-muted)',
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="7" width="20" height="14" rx="2"/>
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
          <line x1="12" y1="12" x2="12" y2="16"/>
          <line x1="10" y1="14" x2="14" y2="14"/>
        </svg>
      </div>
      <div style={{
        fontFamily:    'var(--font-heading)',
        fontSize:      '16px',
        fontWeight:    '700',
        color:         'var(--text-primary)',
        letterSpacing: '-0.3px',
      }}>
        {label}
      </div>
      <div style={{
        fontSize:   '13px',
        color:      'var(--text-muted)',
        textAlign:  'center',
        maxWidth:   '220px',
        lineHeight: '1.6',
      }}>
        Available in the production build. This demo focuses on the ARIA advisory experience.
      </div>
      {onLogout && (
        <button
          className="btn btn-outline btn-sm"
          onClick={onLogout}
          style={{ marginTop: '8px' }}
        >
          Sign Out
        </button>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab,  setActiveTab]  = useState('portfolio');
  const [authData,   setAuthData]   = useState(null);

  const handleLogin = (data) => {
    setAuthData(data);
    setIsLoggedIn(true);
    setActiveTab('portfolio');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAuthData(null);
    setActiveTab('portfolio');
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'portfolio':
        return (
          <PortfolioScreen
            onOpenChat={() => setActiveTab('chat')}
            profileId={authData?.profile || 'retail'}
            user={authData?.user}
          />
        );
      case 'chat':
        return (
          <ChatScreen
            authToken={authData?.token}
            userId={authData?.user?.userId}
            profileId={authData?.profile || 'retail'}
            user={authData?.user}
          />
        );
      case 'home':
        return <ComingSoon label="Home Dashboard" />;
      case 'transact':
        return <ComingSoon label="Transactions" />;
      case 'profile':
        return <ComingSoon label="Profile & Settings" onLogout={handleLogout} />;
      default:
        return null;
    }
  };

  // ── Login view ──────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="app-shell">
        <div className="phone-frame">
          <StatusBar />
          <div className="screen">
            <LoginScreen onLogin={handleLogin} />
          </div>
        </div>
      </div>
    );
  }

  // ── Main app view ───────────────────────────────────────────
  return (
    <div className="app-shell">
      <div className="phone-frame">
        <StatusBar />
        <div className="screen">
          {renderScreen()}
        </div>
        <nav className="nav-bar" role="navigation" aria-label="Main navigation">
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button
              key={id}
              id={`nav-${id}`}
              className={`nav-item ${activeTab === id ? 'active' : ''}`}
              onClick={() => setActiveTab(id)}
              aria-label={label}
              aria-current={activeTab === id ? 'page' : undefined}
            >
              <Icon />
              <span className="nav-label">{label}</span>
              {/* ARIA notification dot */}
              {id === 'chat' && activeTab !== 'chat' && (
                <span style={{
                  position:     'absolute',
                  top:          '6px',
                  right:        '8px',
                  width:        '6px',
                  height:       '6px',
                  borderRadius: '50%',
                  background:   'var(--red)',
                  border:       '1.5px solid var(--surface)',
                }} />
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
