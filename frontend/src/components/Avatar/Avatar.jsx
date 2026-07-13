import './Avatar.css';

const STATE_LABELS = {
  idle:      'Ready',
  thinking:  'Analysing...',
  talking:   'Responding',
  happy:     'Positive',
  concerned: 'Caution',
};

// Mouth shapes per state
const MOUTHS = {
  idle:      'M 56 88 Q 75 93 94 88',
  thinking:  'M 59 89 Q 75 89 91 89',
  talking:   'M 55 88 Q 75 95 95 88',
  happy:     'M 52 85 Q 75 99 98 85',
  concerned: 'M 59 91 Q 75 86 91 91',
};

// Eye iris per state
function Iris({ state, cx, cy }) {
  if (state === 'thinking') {
    return <ellipse cx={cx} cy={cy} rx="9" ry="5" fill="#e8eef8" />;
  }
  if (state === 'happy') {
    return (
      <path
        d={`M ${cx - 9} ${cy} Q ${cx} ${cy - 9} ${cx + 9} ${cy}`}
        stroke="#e8eef8"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    );
  }
  if (state === 'concerned') {
    return (
      <>
        <ellipse cx={cx} cy={cy} rx="9" ry="9" fill="#e8eef8" />
        {/* Furrowed brow line above eye */}
        <line
          x1={cx - 6} y1={cy - 13}
          x2={cx + 3} y2={cy - 9}
          stroke="#c0d0ec"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </>
    );
  }
  return <ellipse cx={cx} cy={cy} rx="9" ry="9" fill="#e8eef8" />;
}

export default function Avatar({ state = 'idle' }) {
  const isTalking  = state === 'talking';
  const isThinking = state === 'thinking';

  return (
    <div className="avatar-wrapper">
      {/* State label */}
      <div className={`avatar-state-label ${state}`}>
        {STATE_LABELS[state] || 'Ready'}
      </div>

      {/* SVG Avatar — clean skin, navy suit, works on white bg */}
      <div className="avatar-svg-container">
        <svg
          className="avatar-svg"
          viewBox="0 0 160 160"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            {/* Skin tone — warm medium, looks natural on white bg */}
            <radialGradient id="skinGrad" cx="45%" cy="38%" r="62%">
              <stop offset="0%"   stopColor="#f5c9a0" />
              <stop offset="100%" stopColor="#d4966a" />
            </radialGradient>

            {/* Subtle face shadow */}
            <filter id="faceShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="rgba(0,0,0,0.14)" />
            </filter>

            {/* Navy suit gradient */}
            <linearGradient id="suitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#003087" />
              <stop offset="100%" stopColor="#001f5b" />
            </linearGradient>

            {/* Dark brown hair */}
            <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#3d2610" />
              <stop offset="100%" stopColor="#1e1108" />
            </linearGradient>
          </defs>

          {/* ── Body / Suit ──────────────────────────────── */}
          <ellipse cx="80" cy="150" rx="54" ry="22" fill="url(#suitGrad)" />
          {/* Suit lapels */}
          <path d="M 60 148 L 73 118 L 80 128 L 87 118 L 100 148 Z" fill="#002070" />
          {/* White shirt */}
          <path d="M 70 118 L 80 128 L 90 118 L 86 112 L 80 117 L 74 112 Z" fill="#f8fafc" />
          {/* Tie — IDBI navy */}
          <path d="M 78 120 L 75 132 L 80 135 L 85 132 L 82 120 L 80 122 Z" fill="#003087" />
          {/* Tie knot */}
          <ellipse cx="80" cy="120" rx="4" ry="3" fill="#004aad" />

          {/* ── Neck ────────────────────────────────────── */}
          <rect x="73" y="108" width="14" height="16" rx="3" fill="url(#skinGrad)" />

          {/* ── Head ────────────────────────────────────── */}
          <g className={`avatar-head ${state}`}>

            {/* Face */}
            <ellipse
              cx="80" cy="76"
              rx="46" ry="48"
              fill="url(#skinGrad)"
              filter="url(#faceShadow)"
            />

            {/* Hair — short, professional */}
            <path
              d="M 36 68 Q 38 30 80 26 Q 122 30 124 68
                 Q 116 42 80 40 Q 44 42 36 68 Z"
              fill="url(#hairGrad)"
            />
            {/* Hair part / natural highlight */}
            <path
              d="M 80 26 Q 84 36 83 44"
              stroke="#2a1608"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              opacity="0.5"
            />

            {/* Ears */}
            <ellipse cx="34"  cy="78" rx="6" ry="9" fill="#d4966a" />
            <ellipse cx="126" cy="78" rx="6" ry="9" fill="#d4966a" />
            <ellipse cx="34"  cy="78" rx="3" ry="5" fill="#c0845a" />
            <ellipse cx="126" cy="78" rx="3" ry="5" fill="#c0845a" />

            {/* Eyebrows */}
            <path
              d={state === 'concerned'
                ? 'M 56 55 Q 65 49 72 54'
                : 'M 56 55 Q 65 51 72 55'}
              stroke="#3d2610"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d={state === 'concerned'
                ? 'M 88 54 Q 95 49 104 55'
                : 'M 88 55 Q 95 51 104 55'}
              stroke="#3d2610"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />

            {/* Eye whites */}
            <ellipse cx="64" cy="71" rx="13" ry="12" fill="#ffffff" />
            <ellipse cx="96" cy="71" rx="13" ry="12" fill="#ffffff" />

            {/* Irises — left eye */}
            <g className="avatar-eye avatar-eye-left">
              <Iris state={state} cx={64} cy={71} />
              {/* Pupil */}
              {state !== 'happy' && (
                <ellipse
                  cx={state === 'thinking' ? 62 : 64}
                  cy={71}
                  rx="4" ry="4"
                  fill="#003087"
                />
              )}
              {/* Shine */}
              {state !== 'happy' && (
                <ellipse cx="67" cy="68" rx="2.5" ry="2" fill="white" opacity="0.8" />
              )}
            </g>

            {/* Irises — right eye */}
            <g className="avatar-eye avatar-eye-right">
              <Iris state={state} cx={96} cy={71} />
              {state !== 'happy' && (
                <ellipse
                  cx={state === 'thinking' ? 94 : 96}
                  cy={71}
                  rx="4" ry="4"
                  fill="#003087"
                />
              )}
              {state !== 'happy' && (
                <ellipse cx="99" cy="68" rx="2.5" ry="2" fill="white" opacity="0.8" />
              )}
            </g>

            {/* Nose */}
            <path
              d="M 79 78 Q 76 87 79 90 Q 82 92 85 90 Q 88 87 81 78"
              fill="none"
              stroke="rgba(150,80,40,0.3)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />

            {/* Mouth */}
            <path
              d={MOUTHS[state] || MOUTHS.idle}
              stroke={state === 'happy' ? '#003087' : '#7a4525'}
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />

            {/* ARIA — small clean badge on forehead */}
            <rect
              x="67" y="33" width="26" height="11" rx="5.5"
              fill="#e8eef8"
              stroke="#c0d0ec"
              strokeWidth="1"
            />
            <text
              x="80" y="42"
              textAnchor="middle"
              fill="#003087"
              fontSize="6.5"
              fontWeight="800"
              fontFamily="Manrope, Inter, sans-serif"
              letterSpacing="0.8"
            >
              ARIA
            </text>

          </g>
        </svg>
      </div>

      {/* Sound waves — talking state */}
      <div className={`sound-waves ${isTalking ? 'active' : ''}`}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="sound-wave-bar" />
        ))}
      </div>

      {/* Thinking dots */}
      <div className={`thinking-dots ${isThinking ? 'active' : ''}`}>
        <div className="thinking-dot" />
        <div className="thinking-dot" />
        <div className="thinking-dot" />
      </div>
    </div>
  );
}
