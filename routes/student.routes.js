const express = require('express');
const { body, query, param } = require('express-validator');
const ValidationMiddleware = require('../mws/validation.middleware');
const AuthMiddleware = require('../mws/auth.middleware');
const AuthorizationMiddleware = require('../mws/authorization.middleware');
const Student = require('../models/Student');
const { PERMISSIONS } = require('../libs/constants');

class StudentRoutes {
  constructor({ studentManager }) {
    this.router = express.Router();
    this.studentManager = studentManager;
    this._setupRoutes();
  }

  _setupRoutes() {
    // Create student
    this.router.post(
      '/',
      AuthMiddleware.authenticate,
      AuthorizationMiddleware.requirePermission(PERMISSIONS.STUDENTS.CREATE),
      AuthorizationMiddleware.requireSchoolAccess(),
      [
        body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 100 }),
        body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ max: 100 }),
        body('dateOfBirth').isISO8601().withMessage('Invalid date of birth'),
        body('schoolId').isMongoId().withMessage('Invalid school ID'),
        body('classroomId').optional().isMongoId().withMessage('Invalid classroom ID'),
        body('contact.email').optional().isEmail().normalizeEmail(),
        body('contact.phone').optional().trim(),
        body('contact.guardianName').optional().trim(),
        body('contact.guardianPhone').optional().trim(),
        body('address').optional().isObject(),
      ],
      ValidationMiddleware.validate,
      ValidationMiddleware.sanitizeInput,
      this._create.bind(this)
    );

    // List students
    this.router.get(
      '/',
      AuthMiddleware.authenticate,
      AuthorizationMiddleware.requirePermission(PERMISSIONS.STUDENTS.LIST),
      [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 100 }),
        query('schoolId').optional().isMongoId(),
        query('classroomId').optional().isMongoId(),
        query('search').optional().trim(),
        query('isActive').optional().isBoolean(),
      ],
      ValidationMiddleware.validate,
      this._list.bind(this)
    );

    // Get student by ID
    this.router.get(
      '/:id',
      AuthMiddleware.authenticate,
      AuthorizationMiddleware.requirePermission(PERMISSIONS.STUDENTS.READ),
      AuthorizationMiddleware.requireResourceOwnership(Student, 'id', 'schoolId'),
      [
        param('id').isMongoId().withMessage('Invalid student ID'),
      ],
      ValidationMiddleware.validate,
      this._getById.bind(this)
    );

    // Update student
    this.router.put(
      '/:id',
      AuthMiddleware.authenticate,
      AuthorizationMiddleware.requirePermission(PERMISSIONS.STUDENTS.UPDATE),
      AuthorizationMiddleware.requireResourceOwnership(Student, 'id', 'schoolId'),
      [
        param('id').isMongoId().withMessage('Invalid student ID'),
        body('firstName').optional().trim().isLength({ max: 100 }),
        body('lastName').optional().trim().isLength({ max: 100 }),
        body('dateOfBirth').optional().isISO8601(),
        body('classroomId').optional().isMongoId(),
        body('contact').optional().isObject(),
        body('address').optional().isObject(),
        body('isActive').optional().isBoolean(),
      ],
      ValidationMiddleware.validate,
      ValidationMiddleware.sanitizeInput,
      this._update.bind(this)
    );

    // Delete student
    this.router.delete(
      '/:id',
      AuthMiddleware.authenticate,
      AuthorizationMiddleware.requirePermission(PERMISSIONS.STUDENTS.DELETE),
      AuthorizationMiddleware.requireResourceOwnership(Student, 'id', 'schoolId'),
      [
        param('id').isMongoId().withMessage('Invalid student ID'),
      ],
      ValidationMiddleware.validate,
      this._delete.bind(this)
    );

    // Transfer student
    this.router.post(
      '/:id/transfer',
      AuthMiddleware.authenticate,
      AuthorizationMiddleware.requirePermission(PERMISSIONS.STUDENTS.TRANSFER),
      AuthorizationMiddleware.requireResourceOwnership(Student, 'id', 'schoolId'),
      [
        param('id').isMongoId().withMessage('Invalid student ID'),
        body('classroomId').optional().isMongoId().withMessage('Invalid classroom ID'),
      ],
      ValidationMiddleware.validate,
      this._transfer.bind(this)
    );
  }

  async _create(req, res, next) {
    try {
      // For school administrators, automatically set their schoolId
      if (req.user.role === 'school_administrator' && req.user.schoolId) {
        req.body.schoolId = req.user.schoolId.toString();
      }
      const result = await this.studentManager.create(req.body);
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
        classroomId: req.query.classroomId,
        search: req.query.search,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      };
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sort: req.query.sort || '-createdAt',
      };
      const result = await this.studentManager.list(filters, pagination);
      res.status(200).json({
        success: true,
        data: result.students,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async _getById(req, res, next) {
    try {
      const result = await this.studentManager.getById(req.params.id);
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
      const result = await this.studentManager.update(req.params.id, req.body);
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
      const result = await this.studentManager.delete(req.params.id);
      res.status(200).json({
        success: true,
        data: result,
        message: 'Student deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async _transfer(req, res, next) {
    try {
      const { classroomId } = req.body;
      const result = await this.studentManager.transfer(req.params.id, classroomId);
      res.status(200).json({
        success: true,
        data: result,
        message: 'Student transferred successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = StudentRoutes;
