const Classroom = require('../models/Classroom');
const School = require('../models/School');
const { NotFoundError, ConflictError } = require('../libs/errors');
const { CACHE_TTL } = require('../libs/constants');

class ClassroomManager {
  constructor({ cache }) {
    this.cache = cache;
  }

  async create(data) {
    const { schoolId, name, capacity } = data;

    const school = await School.findById(schoolId);
    if (!school || !school.isActive) {
      throw new NotFoundError('School');
    }

    const existingClassroom = await Classroom.findOne({ schoolId, name, isActive: true });
    if (existingClassroom) {
      throw new ConflictError('Classroom with this name already exists in this school');
    }

    const classroom = new Classroom({
      schoolId,
      name,
      capacity,
      currentEnrollment: 0,
      ...data,
    });

    await classroom.save();

    await this._invalidateCache(schoolId);

    return classroom;
  }

  async getById(classroomId) {
    const cacheKey = `classroom:${classroomId}`;

    let classroom = await this.cache.string.get({ key: cacheKey });
    if (classroom) {
      return classroom;
    }

    classroom = await Classroom.findById(classroomId).populate('schoolId', 'name');
    if (!classroom) {
      throw new NotFoundError('Classroom');
    }

    await this.cache.string.set({
      key: cacheKey,
      data: JSON.stringify(classroom.toObject()),
      ttl: CACHE_TTL.MEDIUM,
    });

    return classroom;
  }

  async update(classroomId, data) {
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      throw new NotFoundError('Classroom');
    }

    if (data.capacity !== undefined && data.capacity < classroom.currentEnrollment) {
      throw new ConflictError(`Cannot set capacity below current enrollment (${classroom.currentEnrollment})`);
    }

    if (data.name && data.name !== classroom.name) {
      const existingClassroom = await Classroom.findOne({
        schoolId: classroom.schoolId,
        name: data.name,
        isActive: true,
        _id: { $ne: classroomId },
      });
      if (existingClassroom) {
        throw new ConflictError('Classroom with this name already exists in this school');
      }
    }

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && key !== '_id' && key !== '__v' && key !== 'currentEnrollment') {
        if (typeof data[key] === 'object' && !Array.isArray(data[key])) {
          classroom[key] = { ...classroom[key], ...data[key] };
        } else {
          classroom[key] = data[key];
        }
      }
    });

    await classroom.save();

    await this._invalidateCache(classroom.schoolId);
    await this.cache.string.delete({ key: `classroom:${classroomId}` });

    return classroom;
  }

  async delete(classroomId) {
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      throw new NotFoundError('Classroom');
    }

    const Student = require('../models/Student');
    const studentCount = await Student.countDocuments({ classroomId, isActive: true });

    if (studentCount > 0) {
      throw new ConflictError('Cannot delete classroom with active students');
    }

    classroom.isActive = false;
    await classroom.save();

    await this._invalidateCache(classroom.schoolId);
    await this.cache.string.delete({ key: `classroom:${classroomId}` });

    return classroom;
  }

  async list(filters = {}, pagination = {}) {
    const { page = 1, limit = 10, sort = '-createdAt' } = pagination;
    const { schoolId, search, isActive, gradeLevel } = filters;

    const query = {};

    if (schoolId) {
      query.schoolId = schoolId;
    }

    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    if (gradeLevel) {
      query.gradeLevel = gradeLevel;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [classrooms, total] = await Promise.all([
      Classroom.find(query)
        .populate('schoolId', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Classroom.countDocuments(query),
    ]);

    return {
      classrooms,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateEnrollment(classroomId, delta) {
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      throw new NotFoundError('Classroom');
    }

    const newEnrollment = classroom.currentEnrollment + delta;
    if (newEnrollment < 0) {
      throw new ConflictError('Enrollment cannot be negative');
    }
    if (newEnrollment > classroom.capacity) {
      throw new ConflictError(`Enrollment exceeds capacity (${classroom.capacity})`);
    }

    classroom.currentEnrollment = newEnrollment;
    await classroom.save();

    await this._invalidateCache(classroom.schoolId);
    await this.cache.string.delete({ key: `classroom:${classroomId}` });

    return classroom;
  }

  async _invalidateCache(schoolId) {
    if (schoolId) {
      await this.cache.string.delete({ key: `classrooms:list:${schoolId}` });
    }
    await this.cache.string.delete({ key: 'classrooms:list' });
  }
}

module.exports = ClassroomManager;
