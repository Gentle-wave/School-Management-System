const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AuthenticationError, NotFoundError, ConflictError } = require('../libs/errors');
const { ROLES } = require('../libs/constants');
const config = require('../config/index.config');

class AuthManager {
  constructor({ cache }) {
    this.cache = cache;
  }

  async register(data) {
    const { email, password, role, schoolId } = data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    if (role === ROLES.SCHOOL_ADMINISTRATOR && !schoolId) {
      throw new AuthenticationError('School ID is required for school administrators');
    }

    if (role === ROLES.SUPERADMIN && schoolId) {
      throw new AuthenticationError('Superadmin cannot be associated with a school');
    }

    const user = new User({
      email,
      password,
      role,
      schoolId: role === ROLES.SUPERADMIN ? null : schoolId,
    });

    await user.save();

    await this.cache.string.delete({ key: `user:${user._id}` });

    return this._formatUserResponse(user);
  }

  async login(email, password) {
    const user = await User.findOne({ email }).select('+password');

    if (!user || !user.isActive) {
      throw new AuthenticationError('Invalid credentials');
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    user.lastLogin = new Date();
    await user.save();

    const token = this._generateToken(user);

    return {
      user: this._formatUserResponse(user),
      token,
    };
  }

  async getProfile(userId) {
    const cacheKey = `user:${userId}`;
    
    let user = await this.cache.string.get({ key: cacheKey });
    if (user) {
      return this._formatUserResponse(user);
    }

    user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    await this.cache.string.set({
      key: cacheKey,
      data: JSON.stringify(user.toObject()),
      ttl: 300, // 5 minutes
    });

    return this._formatUserResponse(user);
  }

  async updateProfile(userId, data) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }

    const allowedFields = ['email'];
    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        user[field] = data[field];
      }
    });

    await user.save();

    await this.cache.string.delete({ key: `user:${user._id}` });

    return this._formatUserResponse(user);
  }

  _generateToken(user) {
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      schoolId: user.schoolId ? user.schoolId.toString() : null,
    };

    return jwt.sign(payload, config.dotEnv.JWT_SECRET, {
      expiresIn: config.dotEnv.JWT_EXPIRES_IN,
    });
  }

  _formatUserResponse(user) {
    const userObj = user.toObject ? user.toObject() : user;
    delete userObj.password;
    return userObj;
  }
}

module.exports = AuthManager;
