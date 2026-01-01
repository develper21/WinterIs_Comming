import rateLimit, { MemoryStore } from "express-rate-limit";

// #region RateLimiterConfig
// Check environment variable to enable/disable rate limiting
// Set ENABLE_RATE_LIMIT=false in .env for development/testing
const isRateLimitEnabled = process.env.ENABLE_RATE_LIMIT !== "false";

// Middleware to conditionally apply rate limiting
const conditionalRateLimit = (limiter) => {
  return (req, res, next) => {
    if (isRateLimitEnabled) {
      limiter(req, res, next);
    } else {
      // Log that rate limiting is bypassed
      console.log(`[RATE_LIMIT_DISABLED] ${req.method} ${req.path} - Rate limiting bypassed for development`);
      next();
    }
  };
};

// #region LoginRateLimiter
// Prevents brute force attacks by limiting login attempts
// Default: 5 attempts per 15 minutes
// Disable: Set ENABLE_RATE_LIMIT=false in .env
const loginLimiterConfig = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 attempts per windowMs
  message: "Too many login attempts. Please try again in 15 minutes.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req, res) => {
    // Don't rate limit if it's a GET request
    return req.method === "GET";
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many login attempts. Please try again in 15 minutes.",
      data: null
    });
  }
});

export const loginLimiter = conditionalRateLimit(loginLimiterConfig);

// #region GeneralApiRateLimiter
// Moderate rate limiting for general API endpoints
const apiLimiterConfig = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // Max 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false
});

export const apiLimiter = conditionalRateLimit(apiLimiterConfig);

// #region RegisterRateLimiter
// Strict rate limiting for registration endpoints
const registerLimiterConfig = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Max 5 registration attempts per hour
  message: "Too many accounts created from this IP, please try again after an hour.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many registration attempts. Please try again later.",
      data: null
    });
  }
});

export const registerLimiter = conditionalRateLimit(registerLimiterConfig);

// #region StrictRateLimiter
// Very strict rate limiting for sensitive operations
const strictLimiterConfig = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // Max 3 requests per minute
  message: "Too many requests. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false
});

export const strictLimiter = conditionalRateLimit(strictLimiterConfig);
