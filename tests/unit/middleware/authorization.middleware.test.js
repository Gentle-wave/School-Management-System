const AuthorizationMiddleware = require('../../../mws/authorization.middleware');
const { AuthorizationError } = require('../../../libs/errors');
const { ROLES, PERMISSIONS } = require('../../../libs/constants');

describe('AuthorizationMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: null,
      params: {},
      body: {},
      query: {},
    };
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('requireRole', () => {
    it('should allow access for user with required role', () => {
      req.user = { role: ROLES.SUPERADMIN };

      const middleware = AuthorizationMiddleware.requireRole(ROLES.SUPERADMIN);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should deny access for user without required role', () => {
      req.user = { role: ROLES.SCHOOL_ADMINISTRATOR };

      const middleware = AuthorizationMiddleware.requireRole(ROLES.SUPERADMIN);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AuthorizationError));
    });

    it('should deny access if user not authenticated', () => {
      req.user = null;

      const middleware = AuthorizationMiddleware.requireRole(ROLES.SUPERADMIN);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AuthorizationError));
    });
  });

  describe('requirePermission', () => {
    it('should allow access for user with required permission', () => {
      req.user = { role: ROLES.SUPERADMIN };

      const middleware = AuthorizationMiddleware.requirePermission(PERMISSIONS.SCHOOLS.CREATE);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should deny access for user without required permission', () => {
      req.user = { role: ROLES.SCHOOL_ADMINISTRATOR };

      const middleware = AuthorizationMiddleware.requirePermission(PERMISSIONS.SCHOOLS.CREATE);
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AuthorizationError));
    });
  });

  describe('requireSchoolAccess', () => {
    it('should allow superadmin access to any school', async () => {
      req.user = { role: ROLES.SUPERADMIN };
      req.params.schoolId = '123';

      const middleware = AuthorizationMiddleware.requireSchoolAccess();
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should allow school administrator access to their own school', async () => {
      req.user = {
        role: ROLES.SCHOOL_ADMINISTRATOR,
        schoolId: '123',
      };
      req.params.schoolId = '123';

      const middleware = AuthorizationMiddleware.requireSchoolAccess();
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should deny school administrator access to other school', async () => {
      req.user = {
        role: ROLES.SCHOOL_ADMINISTRATOR,
        schoolId: '123',
      };
      req.params.schoolId = '456';

      const middleware = AuthorizationMiddleware.requireSchoolAccess();
      await middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AuthorizationError));
    });
  });
});
