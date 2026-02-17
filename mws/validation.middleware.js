const { validationResult } = require('express-validator');
const { ValidationError } = require('../libs/errors');

class ValidationMiddleware {
  static validate(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value,
      }));
      return next(new ValidationError('Validation failed', errorMessages));
    }

    next();
  }

  static sanitizeInput(req, res, next) {
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (req.body[key] === undefined) {
          delete req.body[key];
        }
      });
    }

    const trimStrings = (obj) => {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = obj[key].trim();
        } else if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          trimStrings(obj[key]);
        }
      }
    };

    if (req.body) trimStrings(req.body);
    if (req.query) trimStrings(req.query);

    next();
  }
}

module.exports = ValidationMiddleware;
