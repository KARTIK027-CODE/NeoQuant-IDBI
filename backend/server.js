/*
 * IDBI Innovate 2026 — Conversational Wealth Advisor Backend
 * Security hardened for fintech prototype demonstration
 *
 * Architecture: Express REST + SSE streaming
 * Auth: JWT (HS256), 24h expiry
 * AI: Mock engine → drop-in OpenAI GPT-4o mini / AWS Bedrock
 */

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes   = require('./routes/auth');
const wealthRoutes = require('./routes/wealth');
const chatRoutes   = require('./routes/chat');

// ── Startup Validation ─────────────────────────────────────────
// Refuse to start with a weak JWT secret in any environment
if (!process.env.JWT_SECRET) {
  console.error('\n[FATAL] JWT_SECRET environment variable is not set.');
  console.error('        Create a backend/.env file with:');
  console.error('        JWT_SECRET=' + generateSecretHint());
  console.error('        Never use the default or a short string in production.\n');
  process.exit(1);
}

function generateSecretHint() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  return Array.from({ length: 48 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

const app  = express();
const PORT = process.env.PORT || 3001;

// Permitted origin for CORS — never wildcard in fintech
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';

// ── Security Headers (helmet) ──────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // disabled for API — set on frontend separately
  crossOriginEmbedderPolicy: false,
}));

// Remove fingerprinting headers
app.disable('x-powered-by');

// ── CORS — Locked to allowed origin only ──────────────────────
app.use(cors({
  origin: ALLOWED_ORIGIN,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
  credentials: false,
}));

// ── Body Parser — Strict size limits ──────────────────────────
// Prevents payload inflation attacks
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ── Rate Limiters ──────────────────────────────────────────────
// Auth endpoints — strict: 10 attempts per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many login attempts. Please wait 15 minutes and try again.',
  },
  skipSuccessfulRequests: true, // don't penalise successful logins
});

// Chat endpoint — moderate: 60 messages per minute
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Message rate limit exceeded. Please slow down.',
  },
});

// General API limiter
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Structured Request Logger ──────────────────────────────────
// Logs method, path category, and response time — not raw params
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const category = req.path.split('/')[3] || 'root'; // e.g., 'auth', 'wealth'
    console.log(`[${new Date().toISOString()}] ${req.method} /${category} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// ── Routes ────────────────────────────────────────────────────
app.use('/api/v1/auth',   authLimiter,    authRoutes);
app.use('/api/v1/chat',   chatLimiter,    chatRoutes);
app.use('/api/v1/wealth', generalLimiter, wealthRoutes);

// ── Health Check — No internal config exposed ─────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'IDBI Wealth Advisor API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── 404 Handler ───────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'NOT_FOUND' });
});

// ── Global Error Handler ──────────────────────────────────────
// Never leak stack traces to the response
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred. Please try again.',
  });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n[IDBI Wealth Advisor] Server started`);
  console.log(`  Port:    ${PORT}`);
  console.log(`  CORS:    ${ALLOWED_ORIGIN}`);
  console.log(`  AI mode: ${process.env.OPENAI_API_KEY ? 'OpenAI (live)' : 'Mock local'}`);
  console.log(`  Health:  http://localhost:${PORT}/health\n`);
});
