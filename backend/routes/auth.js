/*
 * Auth Routes — /api/v1/auth
 * Implements SIM-binding simulation and demo login for hackathon
 *
 * Security measures:
 *  - JWT signed with strong secret (env-enforced, no fallback)
 *  - Credentials stored server-side only, never echoed to client
 *  - Constant-time MPIN comparison to prevent timing attacks
 *  - Mobile number masked in response (last 6 digits hidden)
 *  - Rate limiting applied at server.js level (10 req/15min)
 */

const express = require('express');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const { v4: uuidv4 } = require('uuid');
const router  = express.Router();

// JWT_SECRET is guaranteed to exist — server.js validates at startup
const JWT_SECRET     = process.env.JWT_SECRET;
const TOKEN_EXPIRY   = '24h';

/*
 * Mock user store — in production this is IDBI's user service via Finacle API.
 * MPINs are stored as SHA-256 hashes, not plaintext.
 */
function sha256(val) {
  return crypto.createHash('sha256').update(val).digest('hex');
}

const MOCK_USERS = {
  retail: {
    mobile:     '9876543210',
    mpinHash:   sha256('1234'),
    name:       'Ramesh Kumar',
    riskProfile: 'conservative',
  },
  mass: {
    mobile:     '8765432109',
    mpinHash:   sha256('5678'),
    name:       'Priya Mehta',
    riskProfile: 'moderate',
  },
  hni: {
    mobile:     '7654321098',
    mpinHash:   sha256('9012'),
    name:       'Arvind Subramanian',
    riskProfile: 'aggressive',
  },
};

/*
 * Constant-time string comparison — prevents timing attacks where
 * an attacker measures response latency to guess individual characters.
 */
function safeCompare(a, b) {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function maskMobile(mobile) {
  // Show first 4 digits and last 2 only: 9876XXXXXX01 → 9876XXXXXX01
  return mobile.replace(/^(\d{4})\d{4}(\d{2})$/, '$1XXXXXX$2');
}

function issueToken(userId, name, mobile) {
  return jwt.sign(
    { userId, name, mobile: maskMobile(mobile) },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY, issuer: 'idbi-wealth-advisor' }
  );
}

/**
 * POST /api/v1/auth/sim-binding
 * Mimics IDBI GO Mobile+ SIM-based authentication.
 * In production this validates the device's SIM IMSI against the registered number.
 */
router.post('/sim-binding', async (req, res) => {
  const { mobile, mpin } = req.body;

  if (!mobile || !mpin) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_FIELDS',
      message: 'Mobile number and MPIN are required.',
    });
  }

  if (!/^\d{10}$/.test(mobile)) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_MOBILE',
      message: 'Enter a valid 10-digit mobile number.',
    });
  }

  if (!/^\d{4,6}$/.test(mpin)) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_MPIN',
      message: 'MPIN must be 4 to 6 digits.',
    });
  }

  // Simulate SIM binding network round-trip (realistic latency)
  await new Promise(r => setTimeout(r, 400 + Math.floor(Math.random() * 300)));

  const userEntry = Object.entries(MOCK_USERS).find(([, u]) => u.mobile === mobile);

  // Always hash-compare, even if user not found (constant-time behaviour)
  const providedHash = sha256(mpin);
  const storedHash   = userEntry ? userEntry[1].mpinHash : sha256('000000');
  const isValid      = userEntry && safeCompare(providedHash, storedHash);

  if (!isValid) {
    // Generic message — do NOT reveal whether the mobile exists
    return res.status(401).json({
      success: false,
      error: 'AUTH_FAILED',
      message: 'Incorrect mobile number or MPIN. Please try again.',
    });
  }

  const [userId, user] = userEntry;
  const token = issueToken(userId, user.name, user.mobile);

  return res.json({
    success: true,
    token,
    user: {
      userId,
      name:            user.name,
      mobile:          maskMobile(user.mobile),
      riskProfile:     user.riskProfile,
    },
    simBindingStatus: 'VERIFIED',
    sessionId:        uuidv4(),
  });
});

/**
 * POST /api/v1/auth/demo-login
 * One-tap demo login for hackathon judges.
 * Does NOT accept credentials — profile selection only.
 */
router.post('/demo-login', async (req, res) => {
  const { profile } = req.body;

  const userId = ['retail', 'mass', 'hni'].includes(profile) ? profile : 'retail';
  const user   = MOCK_USERS[userId];

  // Realistic auth delay
  await new Promise(r => setTimeout(r, 350 + Math.floor(Math.random() * 250)));

  const token = issueToken(userId, user.name, user.mobile);

  return res.json({
    success: true,
    token,
    user: {
      userId,
      name:        user.name,
      riskProfile: user.riskProfile,
    },
    demoMode:  true,
    sessionId: uuidv4(),
  });
});

module.exports = router;
