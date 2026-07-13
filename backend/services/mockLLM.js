// =============================================================
// Mock LLM Service — Professional responses, zero emojis
// Swap in OpenAI by setting OPENAI_API_KEY in .env
// =============================================================

// ── Live OpenAI Integration ──────────────────────────────────
async function callOpenAI(messages, onToken) {
  const { OpenAI } = require('openai');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const stream = await client.chat.completions.create({
    model:       'gpt-4o-mini',
    messages,
    stream:      true,
    max_tokens:  350,
    temperature: 0.65,
  });

  let fullText = '';
  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content || '';
    if (token) { fullText += token; onToken(token); }
  }
  return fullText;
}

// ── Emoji stripper ────────────────────────────────────────────
function removeEmojis(text) {
  return text
    // Unicode emoji ranges
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[\u{2600}-\u{27BF}]/gu, '')
    .replace(/[\u{FE00}-\u{FEFF}]/gu, '')
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    // Common punctuation-adjacent emoji
    .replace(/[⚠️🚨📊💰📈🎯💪⭐✅❌📋📞⚡🔴]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ── ARIA persona ──────────────────────────────────────────────
const ARIA_PERSONA = `You are ARIA, IDBI Bank's AI Wealth Advisor.
You are professional, warm, and precise. You speak like a senior relationship manager, not a chatbot.
Always reference the user's actual portfolio data when giving advice.
Never use emojis. Use plain text only — no icons, no symbols, no decorative characters.
Flag high-risk items with a plain text compliance note in parentheses.
Keep responses clear, structured with bold headers where helpful, under 220 words.`;

// ── Response bank — clean, professional, zero emoji ───────────
const RESPONSES = {
  greeting: [
    "Good day. I am ARIA, your IDBI Wealth Advisor.\n\nYour portfolio currently stands at **Rs.4,87,320**, generating an XIRR of **12.3%** — which is strong performance relative to your aggressive risk profile.\n\nMarkets were marginally lower today. Would you like me to review your Axis Midcap exposure or check whether your SIP schedules are optimally timed?",

    "Welcome back. Your portfolio has grown to **Rs.4,87,320** — a net gain of **Rs.67,320** over your invested capital of Rs.4,20,000.\n\nYour equity allocation currently stands at 78%. I want to flag this is slightly above your target of 75%. Shall we review whether a modest rebalancing makes sense before the quarter end?",
  ],

  sip: [
    "Based on your risk profile and current market conditions, here is my SIP recommendation:\n\n**Increase allocation to:** Mirae Asset Emerging Bluechip — additional Rs.2,000 per month.\nReason: The large and mid cap category is currently underweight relative to your target allocation.\n\n**Maintain existing SIPs in:** HDFC Top 100 and Axis Midcap.\nReason: Both are performing in line with benchmark. No changes recommended at this time.\n\n(Compliance note: SIP recommendations are based on historical performance. Future returns are not guaranteed.)\n\nShall I initiate the additional Rs.2,000 SIP for Mirae Asset right now?",

    "Your total monthly SIP commitment is **Rs.15,000**, which matches your stated budget — you are fully deployed.\n\nThat said, I see a tactical opportunity: the Quant Small Cap Fund has delivered strong momentum this quarter. A Rs.1,000 SIP here could add meaningful alpha over a 3-year horizon.\n\n(Compliance note: Small cap funds carry elevated volatility and are suited to investors with a 5-year or longer horizon. Please review quarterly.)\n\nWould you like me to add this to your watchlist first before committing?",
  ],

  portfolio: [
    "Here is your portfolio summary as of today:\n\n**Total Value:** Rs.4,87,320\n**Total Invested:** Rs.4,20,000\n**Net Gain:** Rs.67,320 (16.03%)\n**XIRR:** 12.3%\n\n**Top performer:** Mirae Asset Emerging Bluechip at +18.7%\n**Needs attention:** SBI Bluechip is returning +6.2%, which is 80 basis points below its benchmark.\n\nYour asset allocation stands at 78% equity, 12% debt, 5% gold, and 5% cash. For your aggressive profile, this is well-positioned — though I would recommend reviewing the SBI Bluechip position next month.\n\nWould you like me to run a deeper analysis on any specific fund?",
  ],

  risk: [
    "Your SEBI-compliant risk suitability assessment:\n\n**Profile: Aggressive**\n- Investment horizon: 7 years or more\n- Risk tolerance: High\n- Income stability: High\n\n**Suitable categories:**\nSmall and mid cap equity funds, sectoral and thematic funds, international equity funds, and Portfolio Management Services if your investable corpus exceeds Rs.50 lakhs.\n\n**Not suitable:** Capital guarantee or principal-protected products — these are too conservative for your profile and will likely underperform your inflation-adjusted return target.\n\nYour current portfolio aligns well with this profile. Would you like fund suggestions within any of these categories?",
  ],

  recommend: [
    "Based on your portfolio gaps and current market positioning, I recommend the following three funds:\n\n**1. Parag Parikh Flexi Cap Fund**\nCategory: Flexi Cap. 5-year return: 22.1%. Adds international diversification which your portfolio currently lacks. Suggested SIP: Rs.2,000 per month.\n\n**2. Quant Small Cap Fund**\nCategory: Small Cap. 5-year return: 31.4%. High risk, high reward — appropriate for your aggressive profile. Suggested SIP: Rs.1,000 per month.\n\n**3. IDBI Flexi Bond Fund**\nCategory: Debt. 3-year return: 7.2%. Reduces your equity concentration and improves liquidity. Suggested SIP: Rs.2,000 per month.\n\n(Compliance note: These are AI-generated suggestions. Please consult your Relationship Manager before committing large amounts.)\n\nWould you like to proceed with any of these?",
  ],

  redeem: [
    "Before I initiate a redemption, let me share the tax implications:\n\n**Holdings under 1 year:** Short-Term Capital Gains at 15%\n**Holdings over 1 year:** Long-Term Capital Gains at 10%, with the first Rs.1 lakh exempt\n\nYour HDFC Top 100 has been held for 14 months, so it qualifies for LTCG treatment.\n\n**My recommendation:** If this is for an emergency need, redeem from your IDBI Liquid Fund first — no exit load and T+1 settlement.\n\n(Note: For redemptions above Rs.5 lakhs, authorization from your Relationship Manager is required.)\n\nShall I initiate from the IDBI Liquid Fund? You have Rs.49,947 available there.",
  ],

  escalate: [
    "I will connect you with your Relationship Manager now.\n\n**Your RM:** Mr. Vikram Nair\n**Direct line:** +91-98100-XXXXX\n**Availability:** Monday to Saturday, 9 AM to 6 PM\n\nI am preparing a context brief for him with your portfolio summary and the key points from our conversation — so you will not need to repeat yourself.\n\nContext brief sent to RM dashboard.\n\nIs there anything else I can assist you with while the connection is being arranged?",
  ],

  tax: [
    "Here is your estimated tax position for FY 2025-26:\n\n**Long-Term Capital Gains (equity held over 1 year):** Rs.12,400 — this falls within the Rs.1 lakh exemption limit, so no tax is applicable.\n**Short-Term Capital Gains (equity held under 1 year):** Rs.3,200 — taxed at 15%, resulting in a tax liability of approximately Rs.480.\n\n**Tax harvesting opportunity:** Your SBI Bluechip position currently shows an unrealised loss of Rs.2,100. If you book this loss now, it can be offset against your STCG, effectively eliminating the Rs.480 tax liability.\n\nThe process: redeem SBI Bluechip partially, crystallise the loss, then reinvest after 31 days.\n\n(Compliance note: This is indicative tax planning. Please consult a Chartered Accountant before filing your return.)\n\nWould you like me to model this in detail?",
  ],

  default: [
    "Thank you for reaching out. As your IDBI Wealth Advisor, I want to ensure the guidance I give you is specific and useful.\n\nBased on your aggressive risk profile and a current portfolio of Rs.4,87,320, my standing recommendations are:\n\n**Stay invested.** SIPs perform best with time. Short-term volatility should not drive redemption decisions.\n**Review quarterly, not daily.** Daily market noise leads to poor decisions.\n**Add international exposure.** Your current portfolio is entirely India-focused. Diversifying 10% to global funds reduces single-market risk.\n\nI can assist you with portfolio analysis, SIP management, fund recommendations, tax planning, or connecting you to your Relationship Manager.\n\nWhat would you like to focus on?",

    "I am here to help you make well-informed wealth decisions. Your portfolio is showing strong momentum this year.\n\nTo give you the most relevant advice, could you share a little more context? For example — are you planning for a specific financial goal, concerned about current market conditions, or looking to deploy fresh capital?\n\nThe more specific you are, the better I can tailor my analysis to your situation.",
  ],
};

// ── Intent detection ─────────────────────────────────────────
function detectIntent(message) {
  const msg = message.toLowerCase();
  if (/(hi|hello|hey|namaste|good morning|good evening|start|begin)/.test(msg)) return 'greeting';
  if (/(sip|systematic|monthly|invest more|add.*sip|increase.*sip)/.test(msg))  return 'sip';
  if (/(portfolio|holdings|my.*fund|how.*doing|performance|xirr|return)/.test(msg)) return 'portfolio';
  if (/(risk|profile|suitability|aggressive|conservative|moderate)/.test(msg))  return 'risk';
  if (/(recommend|suggest|new fund|buy|which fund|best fund|should i)/.test(msg)) return 'recommend';
  if (/(redeem|withdraw|sell|exit|money back)/.test(msg))  return 'redeem';
  if (/(rm|relationship manager|human|agent|escalate|call|speak)/.test(msg))    return 'escalate';
  if (/(tax|capital gain|ltcg|stcg|harvest|filing)/.test(msg))  return 'tax';
  return 'default';
}

function pickResponse(intent) {
  const bank = RESPONSES[intent] || RESPONSES.default;
  return bank[Math.floor(Math.random() * bank.length)];
}

function detectSentiment(text) {
  const positive = /(great|excellent|good|up|gain|profit|strong|recommend|opportunity|momentum)/i;
  const negative = /(risk|warning|volatile|concern|loss|drop|dip|caution|compliance note)/i;
  const thinking = /(analysing|checking|calculating|let me|here is|based on)/i;
  if (positive.test(text) && !negative.test(text)) return 'happy';
  if (negative.test(text)) return 'concerned';
  if (thinking.test(text)) return 'thinking';
  return 'talking';
}

// ── Main export ──────────────────────────────────────────────
async function generateResponse(conversationHistory, userMessage, userContext, onToken) {
  const intent = detectIntent(userMessage);

  // ── LIVE MODE: OpenAI ─────────────────────────────────────
  if (process.env.OPENAI_API_KEY) {
    const systemPrompt = `${ARIA_PERSONA}

User Profile:
- Name: ${userContext.name}
- Risk Profile: ${userContext.riskProfile}
- Portfolio Value: Rs.${userContext.portfolio?.currentValue?.toLocaleString('en-IN') || 'N/A'}
- XIRR: ${userContext.portfolio?.xirr || 'N/A'}%
- Top Holdings: ${userContext.portfolio?.holdings?.slice(0, 3).map(h => h.fundName).join(', ') || 'N/A'}

Critical rules:
1. Never use emojis or unicode symbols in your response.
2. Use Rs. instead of the rupee symbol for TTS compatibility.
3. Keep responses under 220 words.
4. Always end with a clear, specific next action the user can take.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-6),
      { role: 'user', content: userMessage },
    ];

    const rawText = await callOpenAI(messages, onToken);
    const text    = removeEmojis(rawText);
    return { text, sentiment: detectSentiment(text), intent };
  }

  // ── MOCK MODE: Simulate streaming ─────────────────────────
  const rawResponse = pickResponse(intent);
  const response    = removeEmojis(rawResponse);
  const words       = response.split(' ');
  let   fullText    = '';

  for (const word of words) {
    const token = word + ' ';
    fullText += token;
    onToken(token);
    await new Promise(r => setTimeout(r, 28 + Math.random() * 45));
  }

  return { text: fullText.trim(), sentiment: detectSentiment(fullText), intent };
}

module.exports = { generateResponse, detectIntent, detectSentiment };
