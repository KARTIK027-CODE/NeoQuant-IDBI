/*
 * Input Validation Middleware
 * Centralised validators for all request inputs.
 * Validates types, ranges, and character sets before touching any business logic.
 */

const MAX_MESSAGE_LENGTH  = 1000;
const MIN_SIP_AMOUNT      = 100;
const MAX_SIP_AMOUNT      = 100000;
const FUND_NAME_PATTERN   = /^[a-zA-Z0-9\s\-&().,']+$/;

/**
 * Validates the chat message body.
 * Rejects empty, oversized, or structurally invalid input.
 */
function validateChatMessage(req, res, next) {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'INVALID_INPUT',
      message: 'Message must be a non-empty string.',
    });
  }

  const trimmed = message.trim();

  if (trimmed.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'EMPTY_MESSAGE',
      message: 'Message cannot be empty.',
    });
  }

  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({
      success: false,
      error: 'MESSAGE_TOO_LONG',
      message: `Message exceeds the maximum length of ${MAX_MESSAGE_LENGTH} characters.`,
    });
  }

  // Attach sanitised message back onto request
  req.body.message = trimmed;
  next();
}

/**
 * Validates the SIP initiation body.
 * Ensures fund name is safe and amount is within acceptable range.
 */
function validateSipRequest(req, res, next) {
  const { fundName, amount, sipDate } = req.body;

  if (!fundName || typeof fundName !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'INVALID_FUND_NAME',
      message: 'Fund name is required.',
    });
  }

  if (!FUND_NAME_PATTERN.test(fundName.trim())) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_FUND_NAME',
      message: 'Fund name contains invalid characters.',
    });
  }

  const parsedAmount = parseInt(amount, 10);
  if (!parsedAmount || isNaN(parsedAmount)) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_AMOUNT',
      message: 'Amount must be a valid number.',
    });
  }

  if (parsedAmount < MIN_SIP_AMOUNT || parsedAmount > MAX_SIP_AMOUNT) {
    return res.status(400).json({
      success: false,
      error: 'AMOUNT_OUT_OF_RANGE',
      message: `SIP amount must be between ₹${MIN_SIP_AMOUNT} and ₹${MAX_SIP_AMOUNT.toLocaleString('en-IN')}.`,
    });
  }

  if (sipDate !== undefined) {
    const day = parseInt(sipDate, 10);
    if (isNaN(day) || day < 1 || day > 28) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_SIP_DATE',
        message: 'SIP date must be between 1 and 28.',
      });
    }
  }

  // Attach sanitised values
  req.body.fundName  = fundName.trim();
  req.body.amount    = parsedAmount;
  req.body.sipDate   = sipDate ? parseInt(sipDate, 10) : 5;
  next();
}

module.exports = { validateChatMessage, validateSipRequest };
