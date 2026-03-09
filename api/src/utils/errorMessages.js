// ============================================================
// USER-FRIENDLY ERROR MESSAGES
// ============================================================
// Maps technical errors to user-friendly messages

export const ERROR_MESSAGES = {
  // Authentication errors
  UNAUTHORIZED: {
    code: 401,
    message: 'Please log in to continue',
    technical: 'Invalid or missing authentication token'
  },
  TOKEN_EXPIRED: {
    code: 401,
    message: 'Your session has expired. Please log in again.',
    technical: 'JWT token expired'
  },

  // Credit errors
  INSUFFICIENT_CREDITS: {
    code: 402,
    message: 'You don\'t have enough credits. Purchase credits to continue analyzing songs.',
    technical: 'User balance is 0'
  },
  CREDIT_INIT_FAILED: {
    code: 500,
    message: 'We couldn\'t initialize your account. Please contact support.',
    technical: 'Failed to create user_credits record'
  },

  // Rate limiting
  RATE_LIMIT_EXCEEDED: {
    code: 429,
    message: 'You\'re making requests too quickly. Please wait a moment and try again.',
    technical: 'Rate limit: 60 requests per minute exceeded'
  },

  // Payment errors
  PAYMENT_FAILED: {
    code: 500,
    message: 'Payment processing failed. Please try again or contact support.',
    technical: 'Stripe checkout session creation failed'
  },
  WEBHOOK_VERIFICATION_FAILED: {
    code: 400,
    message: 'Payment verification failed. Please contact support if you were charged.',
    technical: 'Stripe webhook signature verification failed'
  },
  INVALID_PRICE_TIER: {
    code: 400,
    message: 'Invalid credit package selected. Please choose 10, 20, or 50 credits.',
    technical: 'Invalid tier or priceId'
  },

  // Analysis errors
  SONG_NOT_FOUND: {
    code: 404,
    message: 'We couldn\'t find lyrics for this song. Try searching for a different version or artist.',
    technical: 'Lyrics not found or too short'
  },
  LYRICS_TOO_SHORT: {
    code: 404,
    message: 'The lyrics for this song are too short for analysis. Instrumental songs cannot be analyzed.',
    technical: 'Lyrics length < 50 characters'
  },
  GUIDE_NOT_LOADED: {
    code: 500,
    message: 'Analysis guide not available. Please try again later.',
    technical: 'Philosophical guide not found in KV storage'
  },
  AI_MODEL_ERROR: {
    code: 500,
    message: 'AI analysis failed. Your credit has been refunded. Please try again.',
    technical: 'OpenAI/Gemini/Grok API error'
  },
  AI_TIMEOUT: {
    code: 504,
    message: 'Analysis took too long. Your credit has been refunded. Please try again.',
    technical: 'AI model timeout'
  },

  // Input validation
  INVALID_INPUT: {
    code: 400,
    message: 'Invalid song or artist name. Please check your input.',
    technical: 'Input validation failed'
  },
  MISSING_REQUIRED_FIELD: {
    code: 400,
    message: 'Missing required information. Please provide both song name and artist.',
    technical: 'Required field missing'
  },
  INPUT_TOO_LONG: {
    code: 400,
    message: 'Song or artist name is too long. Maximum 200 characters.',
    technical: 'Input length exceeded maximum'
  },

  // Generic errors
  INTERNAL_ERROR: {
    code: 500,
    message: 'Something went wrong on our end. Please try again later.',
    technical: 'Internal server error'
  },
  DATABASE_ERROR: {
    code: 500,
    message: 'Database error. Please try again later.',
    technical: 'Supabase query failed'
  },
  NETWORK_ERROR: {
    code: 503,
    message: 'Network error. Please check your connection and try again.',
    technical: 'External service unreachable'
  },
};

/**
 * Get user-friendly error message
 * @param {string} errorKey - Error key from ERROR_MESSAGES
 * @param {object} context - Additional context for the error
 * @returns {object} Error response object
 */
export function getUserFriendlyError(errorKey, context = {}) {
  const error = ERROR_MESSAGES[errorKey] || ERROR_MESSAGES.INTERNAL_ERROR;

  return {
    error: error.message,
    code: error.code,
    ...context
  };
}

/**
 * Log technical error details (server-side only)
 * @param {string} errorKey - Error key
 * @param {Error} originalError - Original error object
 * @param {object} context - Additional context
 */
export function logTechnicalError(errorKey, originalError, context = {}) {
  const error = ERROR_MESSAGES[errorKey] || ERROR_MESSAGES.INTERNAL_ERROR;

  console.error('[Error]', {
    key: errorKey,
    technical: error.technical,
    original: originalError?.message || originalError,
    context,
    timestamp: new Date().toISOString()
  });
}

/**
 * Wrap error response with user-friendly message
 * @param {string} errorKey - Error key
 * @param {Error} originalError - Original error
 * @param {object} additionalData - Additional data to include
 * @returns {object} Complete error response
 */
export function createErrorResponse(errorKey, originalError = null, additionalData = {}) {
  const error = ERROR_MESSAGES[errorKey] || ERROR_MESSAGES.INTERNAL_ERROR;

  // Log technical details server-side
  if (originalError) {
    logTechnicalError(errorKey, originalError, additionalData);
  }

  // Return user-friendly message
  return {
    error: error.message,
    errorCode: errorKey,
    ...additionalData
  };
}
