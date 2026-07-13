import { useState, useRef, useEffect, useCallback } from 'react';
import './Chat.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api/v1';

const CUSTOMERS = {
  retail: {
    name: 'Ramesh Kumar',
    segment: 'Retail',
    age: 34,
    income: 45000,
    savingsRate: 8,
    riskProfile: 'Conservative',
    goal: 'Child Education',
    horizon: 10,
    allocation: { fd: 30, ppf: 25, debt_mf: 30, gold: 15 },
    nudge: "You spent ₹3,200 on food delivery last month. Redirecting that to a recurring SIP in IDBI Liquid Fund would secure ₹3.8L for your child's college."
  },
  mass: {
    name: 'Priya Mehta',
    segment: 'Mass Affluent',
    age: 42,
    income: 95000,
    savingsRate: 15,
    riskProfile: 'Moderate',
    goal: 'Retirement',
    horizon: 15,
    allocation: { hybrid: 40, sgb: 30, balanced: 30 },
    nudge: "Increasing your monthly hybrid mutual fund allocation by 5% offsets future inflation by ₹12L at retirement."
  },
  hni: {
    name: 'Arvind Subramanian',
    segment: 'High Net Worth (HNI)',
    age: 51,
    income: 350000,
    savingsRate: 35,
    riskProfile: 'Aggressive',
    goal: 'Wealth Creation',
    horizon: 5,
    allocation: { equity_mf: 70, stocks: 20, gold: 10 },
    nudge: "Since you are in the high-income bracket, optimizing your capital gains tax through tax-loss harvesting could save ₹1.4L annually."
  }
};

const LANGUAGES = [
  { code: 'en-IN', label: 'English', voice: 'en-IN-NeerjaNeural' },
  { code: 'hi-IN', label: 'हिंदी', voice: 'hi-IN-SwaraNeural' },
  { code: 'ta-IN', label: 'தமிழ்', voice: 'ta-IN-PallaviNeural' },
  { code: 'te-IN', label: 'తెలుగు', voice: 'te-IN-ShrutiNeural' },
];

const QUICK_PROMPTS = [
  'How is my portfolio doing?',
  'Should I increase my SIP?',
  'Recommend new funds for me',
  'Give me tax planning tips',
  'Connect me to a Relationship Manager',
];

function renderMarkdown(raw) {
  if (!raw) return '';
  const e = raw
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  return e
    .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.*?)\*/g,'<em>$1</em>')
    .replace(/^&gt;\s(.*)$/gm,'<blockquote>$1</blockquote>')
    .replace(/\n/g,'<br/>');
}

export default function ChatScreen({ authToken, profileId }) {
  const customer = CUSTOMERS[profileId] || CUSTOMERS.retail;

  // Active state variables
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [lang, setLang] = useState('en-IN');
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeRMCard, setActiveRMCard] = useState(null);
  const [activeWhyCard, setActiveWhyCard] = useState(null);
  const [didError, setDidError] = useState(null);

  // Onboarding Assessment Flow State
  const [onboardingActive, setOnboardingActive] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState({});

  const videoRef = useRef(null);
  const msgsEndRef = useRef(null);

  // Auto-scroll messages
  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = lang;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  // Load Initial Greeting
  useEffect(() => {
    resetChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  const addAuditLog = (action, details, recommendation = 'N/A') => {
    const logEntry = {
      timestamp: new Date().toLocaleTimeString('en-IN'),
      segment: customer.segment,
      user: customer.name,
      action,
      details,
      recommendation,
      status: 'DB_SAVED_SECURE'
    };
    setAuditLogs(prev => [logEntry, ...prev]);
  };

  const resetChat = () => {
    setOnboardingActive(false);
    setOnboardingStep(0);
    setOnboardingData({});
    setActiveRMCard(null);
    setActiveWhyCard(null);
    setVideoUrl(null);
    setDidError(null);

    const initialText = `Namaste ${customer.name}. I am ARIA, your IDBI Digital Wealth Advisor. I see your target goal is ${customer.goal} over a ${customer.horizon}-year horizon. Based on your ${customer.riskProfile} risk profile, how can I help you optimize your assets today?`;

    setMessages([
      {
        id: 'init',
        role: 'assistant',
        content: initialText,
        nudge: customer.nudge
      }
    ]);
    addAuditLog('Session Initialize', 'Auto-loaded customer segment data');
    speakResponse(initialText);
  };

  // Speaks using D-ID API (primary) or Browser Speech Synthesis (fallback)
  const speakResponse = async (text) => {
    setIsGeneratingVideo(true);
    setVideoUrl(null);

    const activeLang = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

    try {
      const res = await fetch(`${API_BASE}/chat/did-talk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          voiceId: activeLang.voice
        })
      });

      const data = await res.json();
      if (data.success && data.result_url) {
        setVideoUrl(data.result_url);
        addAuditLog('D-ID Video Generated', `Rendered talking avatar video for audio stream`);
      } else {
        throw new Error(data.message || 'D-ID failed or bypassed');
      }
    } catch (err) {
      console.warn('[D-ID Fallback to Browser Speech]:', err.message);
      setDidError(err.message.includes('402') ? 'D-ID API Key credits exhausted (402 Payment Required)' : err.message);
      // Fallback: Use Browser Speech Synthesis
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        window.speechSynthesis.speak(utterance);
        addAuditLog('Browser TTS Fallback', 'Speech rendered locally via Web Speech API');
      }
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // Onboarding On-Screen Steps Flow
  const startOnboarding = () => {
    setOnboardingActive(true);
    setOnboardingStep(1);
    setOnboardingData({});
    setMessages(prev => [
      ...prev,
      {
        id: `onb-start-${Date.now()}`,
        role: 'assistant',
        content: "Let's re-assess your risk suitability. Question 1: What is your current age?"
      }
    ]);
    speakResponse("Let's re-assess your risk suitability. Question 1: What is your current age?");
  };

  const handleOnboardingAnswer = (answer, value) => {
    // Record answer
    const nextData = { ...onboardingData };
    let questionText = '';

    if (onboardingStep === 1) {
      nextData.age = value;
      questionText = "Question 2: What is your average monthly investable savings?";
      setOnboardingStep(2);
    } else if (onboardingStep === 2) {
      nextData.savings = value;
      questionText = "Question 3: What is your primary financial goal? (Retirement, Education, or Wealth Creation)";
      setOnboardingStep(3);
    } else if (onboardingStep === 3) {
      nextData.goal = value;
      questionText = "Question 4: What is your investment horizon? (Short-term: <5 years, Long-term: >5 years)";
      setOnboardingStep(4);
    } else if (onboardingStep === 4) {
      nextData.horizon = value;
      questionText = "Question 5: If the stock market drops 20%, what would you do? (Sell everything to protect capital, Do nothing and wait, or Buy more at a discount)";
      setOnboardingStep(5);
    } else if (onboardingStep === 5) {
      nextData.reaction = value;
      setOnboardingActive(false);
      setOnboardingStep(0);
      calculateSuitabilityResult(nextData);
      return;
    }

    setOnboardingData(nextData);

    setMessages(prev => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', content: answer },
      { id: `a-${Date.now()}`, role: 'assistant', content: questionText }
    ]);
    speakResponse(questionText);
  };

  const calculateSuitabilityResult = (data) => {
    let risk = 'Moderate';
    let allocation = {};
    let reason = '';

    const isLongTerm = data.horizon === 'long';

    if (data.reaction === 'sell') {
      risk = 'Conservative';
      if (isLongTerm) {
        allocation = { 'Public Provident Fund (PPF)': 40, 'NPS Govt Scheme': 30, 'Debt Mutual Funds': 30 };
        reason = 'Long-term conservative horizon leverages tax-free compounding via PPF and NPS while keeping portfolio volatility low.';
      } else {
        allocation = { 'Fixed Deposit (FD)': 50, 'Recurring Deposit': 30, 'Liquid Funds': 20 };
        reason = 'Short-term conservative goal prioritizes absolute capital protection and highly liquid bank instruments.';
      }
    } else if (data.reaction === 'buy') {
      risk = 'Aggressive';
      allocation = { 'Equity Mutual Funds': 70, 'Direct Equity Stocks': 20, 'Sovereign Gold': 10 };
      reason = 'Aggressive profile coupled with buy-on-dips appetite allows maximizing equity market compounding.';
    } else {
      risk = 'Moderate';
      allocation = { 'Balanced Hybrid Funds': 40, 'Sovereign Gold Bonds': 30, 'Balanced Advantage Funds': 30 };
      reason = 'Moderate profile maintains balanced allocation between equity growth and sovereign gold safety.';
    }

    const allocText = Object.entries(allocation).map(([k, v]) => `${k}: ${v}%`).join(', ');
    const resultMsg = `Based on your responses, you have a **${risk}** risk profile. Your recommended asset allocation is: ${allocText}. Reason: ${reason}`;

    setMessages(prev => [
      ...prev,
      { id: `u-f-${Date.now()}`, role: 'user', content: `Submitted risk questionnaire` },
      {
        id: `a-f-${Date.now()}`,
        role: 'assistant',
        content: resultMsg,
        allocationCard: { risk, allocation, reason }
      }
    ]);

    addAuditLog('Calculated Suitability', `Risk calculated: ${risk}`, allocText);
    speakResponse(`Suitability assessment complete. You have a ${risk} risk profile. I have generated your target allocation plan.`);
  };

  // Handles standard chat messages
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    setInputText('');
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', content: text }]);

    addAuditLog('User Message Sent', `Message: "${text}"`);

    // Check Escalation triggers
    const triggerEscalation = 
      customer.riskProfile === 'Aggressive' && profileId === 'hni' ||
      /pms|aif|stock|direct stock|real estate/i.test(text);

    if (triggerEscalation) {
      const rmMsg = `Since you are requesting specialized high-yield instruments (PMS/AIF/Direct Equities), I am escalating this to our Senior Wealth Manager, Mr. Vikram Nair. A context brief of your portfolio has been securely pushed to his desk.`;
      setMessages(prev => [
        ...prev,
        { id: `a-rm-${Date.now()}`, role: 'assistant', content: rmMsg }
      ]);
      setActiveRMCard({
        name: 'Vikram Nair',
        title: 'Senior Wealth Director',
        contact: '+91-98100-54321',
        email: 'vikram.nair@idbiwealth.com',
        context: `Query on specialized wealth products / HNI status verification`
      });
      addAuditLog('RM Escalation Triggered', 'Transferred client query to Senior RM due to asset request / HNI segment');
      speakResponse(rmMsg);
      return;
    }

    // Default smart mock advice per segment
    let responseText = '';
    if (/sip|invest/i.test(text)) {
      if (profileId === 'retail') {
        responseText = `For your retail profile, I recommend increasing your monthly SIP in Mirae Asset Emerging Bluechip by Rs. 2,000. This fills the current underweight gap in your equity holdings.`;
      } else if (profileId === 'mass') {
        responseText = `Your current SIP profile is solid. I suggest allocating an additional Rs. 5,000 to balanced advantage funds to capitalize on market corrections without exposing capital to high volatility.`;
      } else {
        responseText = `As an HNI client, you should route additional investable surpluses into tax-efficient arbitrage funds or dynamic asset allocation schemes.`;
      }
    } else if (/portfolio|current/i.test(text)) {
      responseText = `Your current asset allocation shows a concentration in fixed interest deposits. Rebalancing into dynamic hybrid debt mutual funds will increase after-tax returns by roughly 2.1 percent annually.`;
    } else {
      responseText = `Understood. IDBI Digital Wealth recommends maintaining your current systematic SIP contributions. Consistent compounding over the next 5 years remains your optimal path.`;
    }

    setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: responseText }]);
    speakResponse(responseText);
  };

  const handleQuickPrompt = (prompt) => {
    handleSendMessage(prompt);
  };

  return (
    <div className="chat-screen-mvp">
      {/* Top Header */}
      <div className="chat-header-bar">
        <div className="header-left">
          <div className="idbi-logo-mini">IDBI</div>
          <div>
            <div className="avatar-header-title">WealthMate AI</div>
            <div className="avatar-header-status">
              <span className="live-status-dot" />
              {isGeneratingVideo ? 'Generating response...' : 'Online (NeerjaNeural)'}
            </div>
          </div>
        </div>

        <div className="header-right">
          <select 
            className="lang-selector-mini"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
          >
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
          <button 
            className={`btn-audit-logs ${showAuditLogs ? 'active' : ''}`}
            onClick={() => setShowAuditLogs(!showAuditLogs)}
          >
            Logs
          </button>
        </div>
      </div>

      {/* Main Avatar / Video Display */}
      <div className="avatar-display-section">
        {/* Live Call Overlay Badges */}
        <div className="avatar-call-overlay-top">
          <div className="avatar-call-badge live">
            <span className="live-status-dot-active" />
            <span>SECURE VIDEO CONNECT</span>
          </div>
          <div className="avatar-call-badge bandwidth">
            <span>HD 1080p</span>
          </div>
        </div>

        {didError && (
          <div className="avatar-error-banner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '12px', height: '12px', marginRight: '6px', flexShrink: 0 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01" />
            </svg>
            <span>{didError}</span>
          </div>
        )}

        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            className="did-avatar-video-render"
            autoPlay
            playsInline
            controls={false}
          />
        ) : (
          <div className="fallback-avatar-lottie">
            <img src="/aria-portrait.png" alt="ARIA Portrait" className="fallback-portrait" />
          </div>
        )}

        <div className="avatar-call-overlay-bottom">
          <span className="advisor-name-tag">Digital Advisor: ARIA</span>
          <div className="sound-waves-indicator">
            {isGeneratingVideo && <div className="spinner-mini" />}
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="chat-messages-container">
        {messages.map((m) => (
          <div key={m.id} className={`message-bubble-row ${m.role}`}>
            {m.role === 'assistant' && (
              <div className="aria-bubble-icon">A</div>
            )}
            <div className="message-content-wrapper">
              <div className="message-text-card">
                <p dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />
                
                {m.nudge && (
                  <div className="behavioral-nudge-box">
                    <span className="nudge-title">Behavioral Saving Nudge</span>
                    <p className="nudge-text">{m.nudge}</p>
                  </div>
                )}

                {/* On-screen allocation card result */}
                {m.allocationCard && (
                  <div className="suitability-result-card">
                    <span className="result-card-risk">Risk Assessment: {m.allocationCard.risk}</span>
                    <div className="result-alloc-list">
                      {Object.entries(m.allocationCard.allocation).map(([asset, pct]) => (
                        <div key={asset} className="result-alloc-row">
                          <span>{asset}</span>
                          <span className="alloc-pct-bold">{pct}%</span>
                        </div>
                      ))}
                    </div>
                    <button 
                      className="btn-why-recommend"
                      onClick={() => setActiveWhyCard(m.allocationCard)}
                    >
                      Why this recommendation?
                    </button>
                  </div>
                )}
              </div>
              <span className="sebi-disclaimer-sub">SEBI Regulated Advisory · INA000012345</span>
            </div>
          </div>
        ))}
        <div ref={msgsEndRef} />
      </div>

      {/* Assessment/Quiz Onboarding Buttons */}
      {onboardingActive && (
        <div className="assessment-onboarding-hud">
          {onboardingStep === 1 && (
            <div className="hud-buttons-grid">
              <button onClick={() => handleOnboardingAnswer("25 Years Old", 25)}>25 Years</button>
              <button onClick={() => handleOnboardingAnswer("35 Years Old", 35)}>35 Years</button>
              <button onClick={() => handleOnboardingAnswer("45 Years Old", 45)}>45 Years</button>
              <button onClick={() => handleOnboardingAnswer("55+ Years Old", 55)}>55+ Years</button>
            </div>
          )}
          {onboardingStep === 2 && (
            <div className="hud-buttons-grid">
              <button onClick={() => handleOnboardingAnswer("Under ₹10,000", 10000)}>Under ₹10k</button>
              <button onClick={() => handleOnboardingAnswer("₹10,000 - ₹30,000", 30000)}>₹10k - ₹30k</button>
              <button onClick={() => handleOnboardingAnswer("₹30,000 - ₹70,000", 70000)}>₹30k - ₹70k</button>
              <button onClick={() => handleOnboardingAnswer("₹70,000+", 100000)}>₹70k+</button>
            </div>
          )}
          {onboardingStep === 3 && (
            <div className="hud-buttons-grid">
              <button onClick={() => handleOnboardingAnswer("Retirement planning", "retirement")}>Retirement</button>
              <button onClick={() => handleOnboardingAnswer("Child's education", "education")}>Education</button>
              <button onClick={() => handleOnboardingAnswer("Wealth creation", "wealth")}>Wealth Creation</button>
            </div>
          )}
          {onboardingStep === 4 && (
            <div className="hud-buttons-grid">
              <button onClick={() => handleOnboardingAnswer("Short term (<5 years)", "short")}>Short (&lt;5y)</button>
              <button onClick={() => handleOnboardingAnswer("Long term (>5 years)", "long")}>Long (&gt;5y)</button>
            </div>
          )}
          {onboardingStep === 5 && (
            <div className="hud-buttons-grid">
              <button onClick={() => handleOnboardingAnswer("Sell everything to protect capital", "sell")}>Sell Out</button>
              <button onClick={() => handleOnboardingAnswer("Do nothing and wait", "hold")}>Hold Steady</button>
              <button onClick={() => handleOnboardingAnswer("Buy more at a discount", "buy")}>Buy Discount</button>
            </div>
          )}
        </div>
      )}

      {/* Action Tray */}
      {!onboardingActive && (
        <div className="chat-actions-tray">
          <button className="tray-btn-onboard" onClick={startOnboarding}>
            ⚡ Restart Onboarding Risk Quiz
          </button>
          <div className="chat-quick-chips">
            {QUICK_PROMPTS.map((p, idx) => (
              <button 
                key={idx} 
                className="chip-prompt-item"
                onClick={() => handleQuickPrompt(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form 
        className="chat-input-form-bar"
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
      >
        <input
          type="text"
          className="chat-text-input-field"
          placeholder="Ask ARIA about asset allocation, SIPs..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={onboardingActive}
        />
        <button
          type="button"
          onClick={toggleListening}
          className={`chat-mic-btn ${isListening ? 'listening' : ''}`}
          title={isListening ? "Stop listening" : "Start speaking"}
          disabled={onboardingActive}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="chat-mic-icon" style={{ width: '16px', height: '16px' }}>
            {isListening ? (
              <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
            ) : (
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z M19 10v1a7 7 0 0 1-14 0v-1 M12 18v4 M8 22h8" />
            )}
          </svg>
        </button>
        <button 
          type="submit" 
          className="chat-submit-btn-arrow"
          disabled={onboardingActive || !inputText.trim()}
        >
          Send
        </button>
      </form>

      {/* Modal - RM Escalation Card */}
      {activeRMCard && (
        <div className="modal-overlay-mvp" onClick={() => setActiveRMCard(null)}>
          <div className="modal-card-body rm-escalation-card" onClick={e => e.stopPropagation()}>
            <div className="rm-header-row">
              <span className="rm-tag">Senior RM Connected</span>
              <button className="close-modal-btn" onClick={() => setActiveRMCard(null)}>×</button>
            </div>
            <div className="rm-profile-detail">
              <div className="rm-profile-pic">VN</div>
              <div>
                <span className="rm-profile-name">{activeRMCard.name}</span>
                <span className="rm-profile-title">{activeRMCard.title}</span>
              </div>
            </div>
            <div className="rm-contact-details">
              <div><strong>Call RM:</strong> {activeRMCard.contact}</div>
              <div><strong>Email:</strong> {activeRMCard.email}</div>
              <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <strong>Client Query context:</strong> {activeRMCard.context}
              </div>
            </div>
            <div className="rm-actions-row">
              <button className="btn-rm-action primary" onClick={() => alert("Connecting virtual video conference...")}>
                Video Call RM Now
              </button>
              <button className="btn-rm-action" onClick={() => alert("Meeting scheduled successfully!")}>
                Schedule Meet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Why This Recommendation Card */}
      {activeWhyCard && (
        <div className="modal-overlay-mvp" onClick={() => setActiveWhyCard(null)}>
          <div className="modal-card-body why-recommendation-card" onClick={e => e.stopPropagation()}>
            <div className="why-header-row">
              <span className="why-title-tag">Investment Rationale</span>
              <button className="close-modal-btn" onClick={() => setActiveWhyCard(null)}>×</button>
            </div>
            <p className="why-desc-text">
              <strong>Risk Level:</strong> {activeWhyCard.risk} <br />
              <strong>Rationale:</strong> {activeWhyCard.reason}
            </p>
            <div className="why-metrics-grid">
              <div className="metric-box">
                <span className="m-val">9.8%</span>
                <span className="m-lbl">Target Returns</span>
              </div>
              <div className="metric-box">
                <span className="m-val">Low-Mod</span>
                <span className="m-lbl">Volatility</span>
              </div>
              <div className="metric-box">
                <span className="m-val">Liquid</span>
                <span className="m-lbl">Liquidity</span>
              </div>
            </div>
            <span className="sebi-compliance-note">
              Calculated using the IDBI Wealth allocation engine in accordance with SEBI circular SEBI/HO/IMD/DF2/CIR/P/2021.
            </span>
          </div>
        </div>
      )}

      {/* Slideout - Audit Logs Viewer */}
      {showAuditLogs && (
        <div className="audit-logs-slideout">
          <div className="audit-logs-header">
            <span>SEBI Audit Log Viewer</span>
            <button onClick={() => setShowAuditLogs(false)}>Close</button>
          </div>
          <div className="audit-logs-list">
            {auditLogs.length === 0 ? (
              <div className="audit-empty-state">No audit logs recorded for this session.</div>
            ) : (
              auditLogs.map((log, idx) => (
                <div key={idx} className="audit-log-item">
                  <div className="audit-log-time-row">
                    <span className="log-time">{log.timestamp}</span>
                    <span className="log-status">{log.status}</span>
                  </div>
                  <div className="log-body">
                    <div><strong>Action:</strong> {log.action}</div>
                    <div><strong>Details:</strong> {log.details}</div>
                    {log.recommendation !== 'N/A' && (
                      <div className="log-rec-badge">Rec: {log.recommendation}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
