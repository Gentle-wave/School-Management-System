const express = require('express');
const { body, query, param } = require('express-validator');
const ValidationMiddleware = require('../mws/validation.middleware');
const AuthMiddleware = require('../mws/auth.middleware');
const AuthorizationMiddleware = require('../mws/authorization.middleware');
const { PERMISSIONS } = require('../libs/constants');

class SchoolRoutes {
  constructor({ schoolManager }) {
    this.router = express.Router();
    this.schoolManager = schoolManager;
    this._setupRoutes();
  }

  _setupRoutes() {
    // Create school (Superadmin only)
    this.router.post(
      '/',
      AuthMiddleware.authenticate,
      AuthorizationMiddleware.requirePermission(PERMISSIONS.SCHOOLS.CREATE),
      [
        body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 200 }),
        body('address.street').optional().trim(),
        body('address.city').optional().trim(),
        body('address.state').optional().trim(),
        body('address.zipCode').optional().trim(),
        body('address.country').optional().trim(),
        body('contact.phone').optional().trim(),
        body('contact.email').optional().isEmail().normalizeEmail(),
      ],
      ValidationMiddleware.validate,
      ValidationMiddleware.sanitizeInput,
      this._create.bind(this)
    );

    // List schools
    this.router.get(
      '/',
      AuthMiddleware.authenticate,
      AuthorizationMiddleware.requirePermission(PERMISSIONS.SCHOOLS.LIST),
      [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('search').optional().trim(),
        query('isActive').optional().isBoolean(),
      ],
      ValidationMiddleware.validate,
      this._list.bind(this)
    );

    // Get school by ID
    this.router.get(
      '/:id',
      AuthMiddleware.authenticate,
      AuthorizationMiddleware.requirePermission(PERMISSIONS.SCHOOLS.READ),
      [
        param('id').isMongoId().withMessage('Invalid school ID'),
      ],
      ValidationMiddleware.validate,
      this._getById.bind(this)
    );

    // Update school
    this.router.put(
      '/:id',
      AuthMiddleware.authenticate,
      AuthorizationMiddleware.requirePermission(PERMISSIONS.SCHOOLS.UPDATE),
      [
        param('id').isMongoId().withMessage('Invalid school ID'),
        body('name').optional().trim().isLength({ max: 200 }),
        body('address').optional().isObject(),
        body('contact').optional().isObject(),
        body('isActive').optional().isBoolean(),
      ],
      ValidationMiddleware.validate,
      ValidationMiddleware.sanitizeInput,
      this._update.bind(this)
    );

    // Delete school
    this.router.delete(
      '/:id',
      AuthMiddleware.authenticate,
      AuthorizationMiddleware.requirePermission(PERMISSIONS.SCHOOLS.DELETE),
      [
        param('id').isMongoId().withMessage('Invalid school ID'),
      ],
      ValidationMiddleware.validate,
      this._delete.bind(this)
    );
  }

  async _create(req, res, next) {
    try {
      const result = await this.schoolManager.create(req.body);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async _list(req, res, next) {
    try {
      const filters = {
        search: req.query.search,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      };
      
      // For school administrators, only show their school
      if (req.user.role === 'school_administrator' && req.user.schoolId) {
        // Get only their school
        const result = await this.schoolManager.getById(req.user.schoolId);
        return res.status(200).json({
          success: true,
          data: [result],
          pagination: {
            page: 1,
            limit: 1,
            total: 1,
            pages: 1,
          },
        });
      }

      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sort: req.query.sort || '-createdAt',
      };
      const result = await this.schoolManager.list(filters, pagination);
      res.status(200).json({
        success: true,
        data: result.schools,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async _getById(req, res, next) {
    try {
      const result = await this.schoolManager.getById(req.params.id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async _update(req, res, next) {
    try {
      const result = await this.schoolManager.update(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async _delete(req, res, next) {
    try {
      const result = await this.schoolManager.delete(req.params.id);
      res.status(200).json({
        success: true,
        data: result,
        message: 'School deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SchoolRoutes;
