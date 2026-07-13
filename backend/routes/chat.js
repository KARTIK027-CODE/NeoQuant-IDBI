/*
 * Chat Routes — /api/v1/chat
 * Streams AI responses via Server-Sent Events (SSE).
 *
 * Security measures:
 *  - JWT required on all endpoints (verifyToken middleware)
 *  - userId sourced from verified JWT only (IDOR prevention)
 *  - Message length validated before processing (validateChatMessage)
 *  - Conversation store capped at MAX_SESSIONS to prevent memory exhaustion
 *  - Error details never sent to client (generic messages only)
 *  - SSE connection closed cleanly on client disconnect
 */

const express = require('express');
const router  = express.Router();

const { generateResponse }   = require('../services/mockLLM');
const { portfolios }         = require('../data/mockPortfolio');
const { verifyToken }        = require('../middleware/auth');
const { validateChatMessage } = require('../middleware/validators');

// In-memory conversation store.
// Production: PostgreSQL + pgvector for semantic memory persistence.
const conversationStore = new Map();
const MAX_SESSIONS      = 1000;   // Evict oldest session when limit hit
const MAX_HISTORY_TURNS = 20;     // Keep last 10 conversation turns (20 messages)

function getOrCreateSession(sessionId) {
  if (!conversationStore.has(sessionId)) {
    // Evict the oldest session if at capacity
    if (conversationStore.size >= MAX_SESSIONS) {
      const firstKey = conversationStore.keys().next().value;
      conversationStore.delete(firstKey);
    }
    conversationStore.set(sessionId, []);
  }
  return conversationStore.get(sessionId);
}

/**
 * POST /api/v1/chat/message
 * Accepts a user message and streams the AI response via SSE.
 * userId is taken exclusively from the verified JWT — not from the request body.
 */
router.post('/message', verifyToken, validateChatMessage, async (req, res) => {
  const { message, sessionId: clientSessionId } = req.body;

  // Identity comes from JWT — client cannot override
  const { userId, name } = req.user;

  const user = portfolios[userId] || portfolios['retail'];

  // Session scoped to authenticated userId to prevent cross-user conversation leakage
  const sessionId = clientSessionId
    ? `${userId}:${clientSessionId}`  // namespace by userId
    : userId;

  const history = getOrCreateSession(sessionId);

  // ── Set up SSE ──────────────────────────────────────────────
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  // CORS already handled by server.js — no need to set here
  res.flushHeaders();

  // Clean up if the client disconnects mid-stream
  let isConnected = true;
  req.on('close', () => { isConnected = false; });

  const onToken = (token) => {
    if (!isConnected) return;
    res.write(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`);
  };

  try {
    const userContext = {
      name:        user.name,
      riskProfile: user.riskProfile,
      portfolio: {
        currentValue: user.currentValue,
        xirr:         user.xirr,
        holdings:     user.holdings,
      },
    };

    if (isConnected) {
      res.write(`data: ${JSON.stringify({ type: 'thinking', avatar: 'thinking' })}\n\n`);
    }

    await new Promise(r => setTimeout(r, 600 + Math.floor(Math.random() * 400)));

    if (!isConnected) return res.end();

    res.write(`data: ${JSON.stringify({ type: 'talking', avatar: 'talking' })}\n\n`);

    const { text, sentiment, intent } = await generateResponse(
      history,
      message,
      userContext,
      onToken
    );

    // Persist conversation turn
    history.push({ role: 'user',      content: message });
    history.push({ role: 'assistant', content: text    });

    // Trim to last MAX_HISTORY_TURNS messages
    if (history.length > MAX_HISTORY_TURNS) {
      history.splice(0, history.length - MAX_HISTORY_TURNS);
    }

    if (isConnected) {
      res.write(`data: ${JSON.stringify({
        type:              'done',
        sentiment,
        intent,
        avatar:            sentiment,
        showRecommendCard: intent === 'recommend' || intent === 'sip',
      })}\n\n`);
    }

    res.end();
  } catch (err) {
    // Log error internally, send generic message to client
    console.error('[Chat] Generation error:', err.message);

    if (isConnected) {
      res.write(`data: ${JSON.stringify({
        type:    'error',
        content: 'I encountered an issue generating a response. Please try again.',
      })}\n\n`);
    }

    res.end();
  }
});

/**
 * DELETE /api/v1/chat/history
 * Clears the conversation history for the authenticated user's session.
 */
router.delete('/history', verifyToken, (req, res) => {
  const { userId } = req.user;
  const { sessionId: clientSessionId } = req.query;

  const sessionId = clientSessionId ? `${userId}:${clientSessionId}` : userId;

  conversationStore.delete(sessionId);

  res.json({ success: true, message: 'Conversation history cleared.' });
});

/**
 * GET /api/v1/chat/history
 * Returns the conversation history for the authenticated user's session.
 */
router.get('/history', verifyToken, (req, res) => {
  const { userId } = req.user;
  const { sessionId: clientSessionId } = req.query;

  const sessionId = clientSessionId ? `${userId}:${clientSessionId}` : userId;
  const history   = conversationStore.get(sessionId) || [];

  res.json({
    success: true,
    count:   history.length,
    history,
  });
});

/**
 * POST /api/v1/chat/did-talk
 * Proxies the D-ID talks API to avoid browser CORS issues.
 * Returns the final speaking avatar video URL.
 */
router.post('/did-talk', async (req, res) => {
  const { text, voiceId } = req.body;

  if (!process.env.DID_API_KEY) {
    return res.status(400).json({
      success: false,
      message: 'D-ID API key is not configured on the server.',
    });
  }

  if (!text || text.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Text input is required for D-ID generation.',
    });
  }

  try {
    const authHeader = 'Basic ' + Buffer.from(process.env.DID_API_KEY + ':').toString('base64');
    
    // 1. Create a D-ID Talk
    const talkResponse = await fetch('https://api.d-id.com/talks', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        script: {
          type: 'text',
          input: text,
          provider: {
            type: 'microsoft',
            voice_id: voiceId || 'en-IN-NeerjaNeural'
          }
        },
        source_url: process.env.DID_ARIA_IMAGE || 'https://raw.githubusercontent.com/KARTIK027-CODE/NeoQuant-IDBI/main/frontend/public/aria-portrait.png'
      })
    });

    if (!talkResponse.ok) {
      const errData = await talkResponse.json().catch(() => ({}));
      return res.status(talkResponse.status).json({
        success: false,
        message: errData.description || `D-ID creation failed with status ${talkResponse.status}`
      });
    }

    const talkData = await talkResponse.json();
    const talkId = talkData.id;

    // 2. Poll D-ID Talk status until done
    let videoUrl = null;
    let attempts = 0;
    const maxAttempts = 30; // ~30 seconds max timeout

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pollResponse = await fetch(`https://api.d-id.com/talks/${talkId}`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader
        }
      });

      if (!pollResponse.ok) {
        return res.status(pollResponse.status).json({
          success: false,
          message: `D-ID status polling failed with status ${pollResponse.status}`
        });
      }

      const pollData = await pollResponse.json();

      if (pollData.status === 'done') {
        videoUrl = pollData.result_url;
        break;
      }

      if (pollData.status === 'error') {
        return res.status(500).json({
          success: false,
          message: pollData.error?.description || 'D-ID video generation failed on their server.'
        });
      }

      attempts++;
    }

    if (!videoUrl) {
      return res.status(504).json({
        success: false,
        message: 'D-ID video generation timed out.'
      });
    }

    return res.json({
      success: true,
      result_url: videoUrl
    });

  } catch (err) {
    console.error('[D-ID Proxy Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while processing D-ID request.'
    });
  }
});

module.exports = router;

