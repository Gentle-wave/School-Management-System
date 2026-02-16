const AuthMiddleware = require('../../../mws/auth.middleware');
const jwt = require('jsonwebtoken');
const { AuthenticationError } = require('../../../libs/errors');

jest.mock('jsonwebtoken');
jest.mock('../../../models/User', () => {
  return jest.fn();
});

const User = require('../../../models/User');

describe('AuthMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate user with valid token', async () => {
      const token = 'valid-token';
      const decoded = { userId: '123', email: 'test@example.com', role: 'superadmin' };
      const mockUser = {
        _id: '123',
        email: 'test@example.com',
        role: 'superadmin',
        isActive: true,
      };

      req.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockReturnValue(decoded);
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await AuthMiddleware.authenticate(req, res, next);

      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledWith();
    });

    it('should throw AuthenticationError if no token provided', async () => {
      req.headers.authorization = undefined;

      await AuthMiddleware.authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
    });

    it('should throw AuthenticationError if token is invalid', async () => {
      req.headers.authorization = 'Bearer invalid-token';
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await AuthMiddleware.authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
    });

    it('should throw AuthenticationError if token is expired', async () => {
      req.headers.authorization = 'Bearer expired-token';
      jwt.verify.mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      await AuthMiddleware.authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
    });

    it('should throw AuthenticationError if user not found', async () => {
      const token = 'valid-token';
      const decoded = { userId: '123' };

      req.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockReturnValue(decoded);
      User.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await AuthMiddleware.authenticate(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
    });
  });

  describe('optionalAuth', () => {
    it('should proceed without error if no token provided', (done) => {
      req.headers.authorization = undefined;

      AuthMiddleware.optionalAuth(req, res, () => {
        expect(req.user).toBeUndefined();
        expect(next).not.toHaveBeenCalled();
        done();
      });
    });

    it('should set user if valid token provided', (done) => {
      const token = 'valid-token';
      const decoded = { userId: '123' };
      const mockUser = {
        _id: '123',
        email: 'test@example.com',
        isActive: true,
      };

      req.headers.authorization = `Bearer ${token}`;
      jwt.verify.mockReturnValue(decoded);
      User.findById = jest.fn().mockResolvedValue(mockUser);

      AuthMiddleware.optionalAuth(req, res, () => {
        expect(req.user).toEqual(mockUser);
        done();
      });
    });
  });
});
