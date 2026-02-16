const rateLimit = require('express-rate-limit');
const config = require('../config/index.config');

class RateLimitMiddleware {
  static createLimiter(options = {}) {
    return rateLimit({
      windowMs: options.windowMs || config.dotEnv.RATE_LIMIT_WINDOW_MS,
      max: options.max || config.dotEnv.RATE_LIMIT_MAX_REQUESTS,
      message: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests from this IP, please try again later.',
        },
      },
      standardHeaders: true,
      legacyHeaders: false,
      ...options,
    });
  }

  static strict() {
    return this.createLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 50, // 50 requests per window
    });
  }

  static auth() {
    return this.createLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 login attempts per window
      skipSuccessfulRequests: true,
    });
  }
}

module.exports = RateLimitMiddleware;
