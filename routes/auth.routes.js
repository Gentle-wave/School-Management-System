const express = require('express');
const { body } = require('express-validator');
const ValidationMiddleware = require('../mws/validation.middleware');
const RateLimitMiddleware = require('../mws/rateLimit.middleware');
const AuthMiddleware = require('../mws/auth.middleware');

class AuthRoutes {
  constructor({ authManager }) {
    this.router = express.Router();
    this.authManager = authManager;
    this._setupRoutes();
  }

  _setupRoutes() {
    // Register
    this.router.post(
      '/register',
      RateLimitMiddleware.strict(),
      [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('role').isIn(['superadmin', 'school_administrator']).withMessage('Invalid role'),
        body('schoolId').optional().isMongoId().withMessage('Invalid school ID'),
      ],
      ValidationMiddleware.validate,
      ValidationMiddleware.sanitizeInput,
      this._register.bind(this)
    );

    // Login
    this.router.post(
      '/login',
      RateLimitMiddleware.auth(),
      [
        body('email').isEmail().normalizeEmail(),
        body('password').notEmpty().withMessage('Password is required'),
      ],
      ValidationMiddleware.validate,
      ValidationMiddleware.sanitizeInput,
      this._login.bind(this)
    );

    // Get profile
    this.router.get(
      '/profile',
      AuthMiddleware.authenticate,
      this._getProfile.bind(this)
    );

    // Update profile
    this.router.put(
      '/profile',
      AuthMiddleware.authenticate,
      [
        body('email').optional().isEmail().normalizeEmail(),
      ],
      ValidationMiddleware.validate,
      ValidationMiddleware.sanitizeInput,
      this._updateProfile.bind(this)
    );
  }

  async _register(req, res, next) {
    try {
      const result = await this.authManager.register(req.body);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async _login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await this.authManager.login(email, password);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async _getProfile(req, res, next) {
    try {
      const result = await this.authManager.getProfile(req.user._id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async _updateProfile(req, res, next) {
    try {
      const result = await this.authManager.updateProfile(req.user._id, req.body);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthRoutes;
