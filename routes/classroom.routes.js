const express = require('express');
const { body, query, param } = require('express-validator');
const ValidationMiddleware = require('../mws/validation.middleware');
const AuthMiddleware = require('../mws/auth.middleware');
const AuthorizationMiddleware = require('../mws/authorization.middleware');
const Classroom = require('../models/Classroom');
const { PERMISSIONS } = require('../libs/constants');

class ClassroomRoutes {
  constructor({ classroomManager }) {
    this.router = express.Router();
    this.classroomManager = classroomManager;
    this._setupRoutes();
  }

  _setupRoutes() {
    // Create classroom
    this.router.post(
      '/',
      AuthMiddleware.authenticate,
      AuthorizationMiddleware.requirePermission(PERMISSIONS.CLASSROOMS.CREATE),
      AuthorizationMiddleware.requireSchoolAccess(),
      [
        body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
        body('schoolId').isMongoId().withMessage('Invalid school ID'),
        body('capacity').isInt({ min: 1, max: 1000 }).withMessage('Capacity must be between 1 and 1000'),
        body('gradeLevel').optional().trim(),
        body('resources').optional().isObject(),
      ],
      ValidationMiddleware.validate,
      ValidationMiddleware.sanitizeInput,
      this._create.bind(this)
    );

    // List classrooms
    this.router.get(
      '/',
      AuthMiddleware.authenticate,
      AuthorizationMiddleware.requirePermission(PERMISSIONS.CLASSROOMS.LIST),
      [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('schoolId').optional().isMongoId(),
        query('search').optional().trim(),
        query('isActive').optional().isBoolean(),
        query('gradeLevel').optional().trim(),
      ],
      ValidationMiddleware.validate,
      this._list.bind(this)
    );

    // Get classroom by ID
    this.router.get(
      '/:id',
      AuthMiddleware.authenticate,
      AuthorizationMiddleware.requirePermission(PERMISSIONS.CLASSROOMS.READ),
      AuthorizationMiddleware.requireResourceOwnership(Classroom, 'id', 'schoolId'),
      [
        param('id').isMongoId().withMessage('Invalid classroom ID'),
      ],
      ValidationMiddleware.validate,
      this._getById.bind(this)
    );

    // Update classroom
    this.router.put(
      '/:id',
      AuthMiddleware.authenticate,
      AuthorizationMiddleware.requirePermission(PERMISSIONS.CLASSROOMS.UPDATE),
      AuthorizationMiddleware.requireResourceOwnership(Classroom, 'id', 'schoolId'),
      [
        param('id').isMongoId().withMessage('Invalid classroom ID'),
        body('name').optional().trim().isLength({ max: 100 }),
        body('capacity').optional().isInt({ min: 1, max: 1000 }),
        body('gradeLevel').optional().trim(),
        body('resources').optional().isObject(),
        body('isActive').optional().isBoolean(),
      ],
      ValidationMiddleware.validate,
      ValidationMiddleware.sanitizeInput,
      this._update.bind(this)
    );

    // Delete classroom
    this.router.delete(
      '/:id',
      AuthMiddleware.authenticate,
      AuthorizationMiddleware.requirePermission(PERMISSIONS.CLASSROOMS.DELETE),
      AuthorizationMiddleware.requireResourceOwnership(Classroom, 'id', 'schoolId'),
      [
        param('id').isMongoId().withMessage('Invalid classroom ID'),
      ],
      ValidationMiddleware.validate,
      this._delete.bind(this)
    );
  }

  async _create(req, res, next) {
    try {
      // For school administrators, automatically set their schoolId
      if (req.user.role === 'school_administrator' && req.user.schoolId) {
        req.body.schoolId = req.user.schoolId.toString();
      }
      const result = await this.classroomManager.create(req.body);
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
      // For school administrators, automatically filter by their school
      let schoolId = req.query.schoolId;
      if (req.user.role === 'school_administrator' && req.user.schoolId) {
        schoolId = req.user.schoolId.toString();
      }

      const filters = {
        schoolId,
        search: req.query.search,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        gradeLevel: req.query.gradeLevel,
      };
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sort: req.query.sort || '-createdAt',
      };
      const result = await this.classroomManager.list(filters, pagination);
      res.status(200).json({
        success: true,
        data: result.classrooms,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async _getById(req, res, next) {
    try {
      const result = await this.classroomManager.getById(req.params.id);
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
      const result = await this.classroomManager.update(req.params.id, req.body);
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
      const result = await this.classroomManager.delete(req.params.id);
      res.status(200).json({
        success: true,
        data: result,
        message: 'Classroom deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ClassroomRoutes;
