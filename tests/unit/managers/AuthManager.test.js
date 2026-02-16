const AuthManager = require('../../../managers/AuthManager');
const { AuthenticationError, ConflictError } = require('../../../libs/errors');
const { ROLES } = require('../../../libs/constants');

// Mock User model
jest.mock('../../../models/User', () => {
  return jest.fn();
});

const User = require('../../../models/User');

// Mock cache
const mockCache = {
  string: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  },
};

describe('AuthManager', () => {
  let authManager;

  beforeEach(() => {
    authManager = new AuthManager({ cache: mockCache });
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new superadmin user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        role: ROLES.SUPERADMIN,
      };

      User.findOne = jest.fn().mockResolvedValue(null);
      const mockUser = {
        _id: '123',
        email: userData.email,
        role: userData.role,
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          _id: '123',
          email: userData.email,
          role: userData.role,
        }),
      };
      User.mockImplementation(() => mockUser);

      const result = await authManager.register(userData);

      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(mockCache.string.delete).toHaveBeenCalled();
    });

    it('should throw ConflictError if user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        role: ROLES.SUPERADMIN,
      };

      User.findOne = jest.fn().mockResolvedValue({ _id: '123' });

      await expect(authManager.register(userData)).rejects.toThrow(ConflictError);
    });

    it('should throw error if school administrator registered without schoolId', async () => {
      const userData = {
        email: 'admin@example.com',
        password: 'password123',
        role: ROLES.SCHOOL_ADMINISTRATOR,
      };

      User.findOne = jest.fn().mockResolvedValue(null);

      await expect(authManager.register(userData)).rejects.toThrow(AuthenticationError);
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      const mockUser = {
        _id: '123',
        email,
        role: ROLES.SUPERADMIN,
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          _id: '123',
          email,
          role: ROLES.SUPERADMIN,
        }),
      };

      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await authManager.login(email, password);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(mockUser.comparePassword).toHaveBeenCalledWith(password);
    });

    it('should throw AuthenticationError with invalid credentials', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(authManager.login(email, password)).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError with wrong password', async () => {
      const email = 'test@example.com';
      const password = 'wrongpassword';

      const mockUser = {
        _id: '123',
        email,
        role: ROLES.SUPERADMIN,
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await expect(authManager.login(email, password)).rejects.toThrow(AuthenticationError);
    });
  });
});
