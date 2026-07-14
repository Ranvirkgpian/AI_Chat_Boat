// Rate Limiting Middleware — Per-IP request throttling
const requestCounts = new Map();

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000');
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '30');

// Cleanup old entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requestCounts) {
    if (now - data.windowStart > WINDOW_MS) {
      requestCounts.delete(key);
    }
  }
}, 60000);

/**
 * Rate limit middleware
 */
export function rateLimit(req, res, next) {
  const key = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  if (!requestCounts.has(key)) {
    requestCounts.set(key, { count: 1, windowStart: now });
    return next();
  }

  const data = requestCounts.get(key);

  if (now - data.windowStart > WINDOW_MS) {
    // Reset window
    data.count = 1;
    data.windowStart = now;
    return next();
  }

  data.count++;

  if (data.count > MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((WINDOW_MS - (now - data.windowStart)) / 1000),
    });
  }

  next();
}
