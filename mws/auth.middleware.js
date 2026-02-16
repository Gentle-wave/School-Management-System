const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AuthenticationError } = require('../libs/errors');
const config = require('../config/index.config');

class AuthMiddleware {
  static async authenticate(req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AuthenticationError('No token provided');
      }

      const token = authHeader.substring(7);

      let decoded;
      try {
        decoded = jwt.verify(token, config.dotEnv.JWT_SECRET);
      } catch (err) {
        switch (err.name) {
          case 'TokenExpiredError':
            throw new AuthenticationError('Token has expired');
          case 'JsonWebTokenError':
            throw new AuthenticationError('Invalid token');
          default:
            throw new AuthenticationError('Token verification failed');
        }
      }

      const user = await User.findById(decoded.userId).select('+password');
      if (!user || !user.isActive) {
        throw new AuthenticationError('User not found or inactive');
      }

      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  }

  static optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, config.dotEnv.JWT_SECRET);
      User.findById(decoded.userId)
        .then(user => {
          if (user && user.isActive) {
            req.user = user;
          }
          next();
        })
        .catch(() => next());
    } catch {
      next();
    }
  }
}

module.exports = AuthMiddleware;
