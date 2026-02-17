const { AppError } = require('../libs/errors');
const config = require('../config/index.config');

class ErrorHandlerMiddleware {
  static handle(err, req, res, next) {
    let error = { ...err };
    error.message = err.message;

    if (config.dotEnv.ENV === 'development') {
      console.error('Error:', err);
    }

    if (err.name === 'CastError') {
      const message = 'Resource not found';
      error = new AppError(message, 404, 'NOT_FOUND');
    }

    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      const message = `${field} already exists`;
      error = new AppError(message, 409, 'DUPLICATE_ERROR');
    }

    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      const message = `Validation Error: ${messages.join(', ')}`;
      error = new AppError(message, 400, 'VALIDATION_ERROR');
    }

    if (err.name === 'JsonWebTokenError') {
      error = new AppError('Invalid token', 401, 'AUTHENTICATION_ERROR');
    }

    if (err.name === 'TokenExpiredError') {
      error = new AppError('Token expired', 401, 'AUTHENTICATION_ERROR');
    }

    const statusCode = error.statusCode || 500;
    const code = error.code || 'INTERNAL_SERVER_ERROR';
    const message = error.message || 'Internal Server Error';

    const response = {
      success: false,
      error: {
        code,
        message,
      },
    };

    if (config.dotEnv.ENV === 'development') {
      response.error.stack = err.stack;
      if (error.errors) {
        response.error.errors = error.errors;
      }
    } else if (error.errors) {
      response.error.errors = error.errors;
    }

    res.status(statusCode).json(response);
  }

  static notFound(req, res, next) {
    const error = new AppError(`Route ${req.originalUrl} not found`, 404, 'NOT_FOUND');
    next(error);
  }
}

module.exports = ErrorHandlerMiddleware;
