const School = require('../models/School');
const { NotFoundError, ConflictError } = require('../libs/errors');
const { CACHE_TTL } = require('../libs/constants');

class SchoolManager {
  constructor({ cache }) {
    this.cache = cache;
  }

  async create(data) {
    const school = new School(data);
    await school.save();

    // Invalidate cache
    await this._invalidateCache();

    return school;
  }

  async getById(schoolId) {
    const cacheKey = `school:${schoolId}`;

    // Try cache first
    let school = await this.cache.string.get({ key: cacheKey });
    if (school) {
      return school;
    }

    school = await School.findById(schoolId);
    if (!school) {
      throw new NotFoundError('School');
    }

    // Cache school data
    await this.cache.string.set({
      key: cacheKey,
      data: JSON.stringify(school.toObject()),
      ttl: CACHE_TTL.MEDIUM,
    });

    return school;
  }

  async update(schoolId, data) {
    const school = await School.findById(schoolId);
    if (!school) {
      throw new NotFoundError('School');
    }

    // Update fields
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && key !== '_id' && key !== '__v') {
        if (typeof data[key] === 'object' && !Array.isArray(data[key])) {
          school[key] = { ...school[key], ...data[key] };
        } else {
          school[key] = data[key];
        }
      }
    });

    await school.save();

    // Invalidate cache
    await this._invalidateCache();
    await this.cache.string.delete({ key: `school:${schoolId}` });

    return school;
  }

  async delete(schoolId) {
    const school = await School.findById(schoolId);
    if (!school) {
      throw new NotFoundError('School');
    }

    // Check if school has classrooms or students
    const Classroom = require('../models/Classroom');
    const Student = require('../models/Student');

    const classroomCount = await Classroom.countDocuments({ schoolId, isActive: true });
    const studentCount = await Student.countDocuments({ schoolId, isActive: true });

    if (classroomCount > 0 || studentCount > 0) {
      throw new ConflictError('Cannot delete school with active classrooms or students');
    }

    school.isActive = false;
    await school.save();

    // Invalidate cache
    await this._invalidateCache();
    await this.cache.string.delete({ key: `school:${schoolId}` });

    return school;
  }

  async list(filters = {}, pagination = {}) {
    const { page = 1, limit = 10, sort = '-createdAt' } = pagination;
    const { search, isActive } = filters;

    const query = {};

    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'address.city': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [schools, total] = await Promise.all([
      School.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      School.countDocuments(query),
    ]);

    return {
      schools,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async _invalidateCache() {
    await this.cache.string.delete({ key: 'schools:list' });
  }
}

module.exports = SchoolManager;
