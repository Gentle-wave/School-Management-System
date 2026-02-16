const { AuthorizationError } = require('../libs/errors');
const { ROLES, PERMISSIONS, ROLE_PERMISSIONS } = require('../libs/constants');

class AuthorizationMiddleware {
  static requireRole(...allowedRoles) {
    return (req, res, next) => {
      if (!req.user) {
        return next(new AuthorizationError('Authentication required'));
      }

      const userRole = req.user.role;
      const isAllowed = allowedRoles.includes(userRole);

      if (!isAllowed) {
        return next(new AuthorizationError(`Access denied. Required roles: ${allowedRoles.join(', ')}`));
      }

      next();
    };
  }

  static requirePermission(permission) {
    return (req, res, next) => {
      if (!req.user) {
        return next(new AuthorizationError('Authentication required'));
      }

      const userRole = req.user.role;
      const userPermissions = ROLE_PERMISSIONS[userRole] || [];

      if (!userPermissions.includes(permission)) {
        return next(new AuthorizationError(`Access denied. Required permission: ${permission}`));
      }

      next();
    };
  }

  static requireSchoolAccess() {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return next(new AuthorizationError('Authentication required'));
        }

        const userRole = req.user.role;

        switch (userRole) {
          case ROLES.SUPERADMIN:
            // Superadmin has access to all schools
            return next();
          case ROLES.SCHOOL_ADMINISTRATOR:
            // School administrators can only access their own school
            const schoolId = req.params.schoolId || req.body.schoolId || req.query.schoolId;
            if (!schoolId) {
              return next(new AuthorizationError('School ID is required'));
            }
            if (req.user.schoolId && req.user.schoolId.toString() !== schoolId.toString()) {
              return next(new AuthorizationError('Access denied to this school'));
            }
            return next();
          default:
            return next(new AuthorizationError('Insufficient permissions'));
        }
      } catch (error) {
        next(error);
      }
    };
  }

  static requireResourceOwnership(resourceModel, resourceIdParam = 'id', schoolIdField = 'schoolId') {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return next(new AuthorizationError('Authentication required'));
        }

        const userRole = req.user.role;

        switch (userRole) {
          case ROLES.SUPERADMIN:
            return next();
          case ROLES.SCHOOL_ADMINISTRATOR:
            const resourceId = req.params[resourceIdParam];
            if (!resourceId) {
              return next(new AuthorizationError('Resource ID is required'));
            }

            const resource = await resourceModel.findById(resourceId);
            if (!resource) {
              return next(new AuthorizationError('Resource not found'));
            }

            const resourceSchoolId = resource[schoolIdField]?.toString();
            const userSchoolId = req.user.schoolId?.toString();

            if (resourceSchoolId !== userSchoolId) {
              return next(new AuthorizationError('Access denied to this resource'));
            }

            req.resource = resource;
            return next();
          default:
            return next(new AuthorizationError('Insufficient permissions'));
        }
      } catch (error) {
        next(error);
      }
    };
  }
}

module.exports = AuthorizationMiddleware;
