/*
 * Auth Middleware — verifyToken
 * Validates JWT on protected routes.
 * Extracts userId from the signed token only — never from request body.
 *
 * Usage: router.get('/route', verifyToken, handler)
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Authentication required. Please log in.',
    });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'idbi-wealth-advisor',
    });

    // Attach verified identity to request — routes use req.user.userId only
    req.user = {
      userId: decoded.userId,
      name:   decoded.name,
    };

    next();
  } catch (err) {
    const isExpired = err.name === 'TokenExpiredError';
    return res.status(401).json({
      success: false,
      error: isExpired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
      message: isExpired
        ? 'Your session has expired. Please log in again.'
        : 'Invalid authentication token.',
    });
  }
}

module.exports = { verifyToken };
