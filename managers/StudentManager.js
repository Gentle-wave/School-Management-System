const Student = require('../models/Student');
const Classroom = require('../models/Classroom');
const School = require('../models/School');
const { NotFoundError, ConflictError } = require('../libs/errors');
const { CACHE_TTL } = require('../libs/constants');

class StudentManager {
  constructor({ cache }) {
    this.cache = cache;
  }

  async create(data) {
    const { schoolId, classroomId, firstName, lastName, dateOfBirth } = data;

    // Verify school exists
    const school = await School.findById(schoolId);
    if (!school || !school.isActive) {
      throw new NotFoundError('School');
    }

    // Verify classroom exists and belongs to school if provided
    if (classroomId) {
      const classroom = await Classroom.findById(classroomId);
      if (!classroom || !classroom.isActive) {
        throw new NotFoundError('Classroom');
      }
      if (classroom.schoolId.toString() !== schoolId.toString()) {
        throw new ConflictError('Classroom does not belong to the specified school');
      }
      if (classroom.currentEnrollment >= classroom.capacity) {
        throw new ConflictError('Classroom is at full capacity');
      }
    }

    const student = new Student({
      schoolId,
      classroomId,
      firstName,
      lastName,
      dateOfBirth,
      ...data,
    });

    await student.save();

    // Update classroom enrollment if assigned
    if (classroomId) {
      const ClassroomManager = require('./ClassroomManager');
      const classroomManager = new ClassroomManager({ cache: this.cache });
      await classroomManager.updateEnrollment(classroomId, 1);
    }

    // Invalidate cache
    await this._invalidateCache(schoolId);

    return student;
  }

  async getById(studentId) {
    const cacheKey = `student:${studentId}`;

    // Try cache first
    let student = await this.cache.string.get({ key: cacheKey });
    if (student) {
      return student;
    }

    student = await Student.findById(studentId)
      .populate('schoolId', 'name')
      .populate('classroomId', 'name capacity');
    if (!student) {
      throw new NotFoundError('Student');
    }

    // Cache student data
    await this.cache.string.set({
      key: cacheKey,
      data: JSON.stringify(student.toObject()),
      ttl: CACHE_TTL.MEDIUM,
    });

    return student;
  }

  async update(studentId, data) {
    const student = await Student.findById(studentId);
    if (!student) {
      throw new NotFoundError('Student');
    }

    const oldClassroomId = student.classroomId?.toString();
    const newClassroomId = data.classroomId?.toString();

    // Handle classroom change
    if (newClassroomId && newClassroomId !== oldClassroomId) {
      const newClassroom = await Classroom.findById(newClassroomId);
      if (!newClassroom || !newClassroom.isActive) {
        throw new NotFoundError('Classroom');
      }
      if (newClassroom.schoolId.toString() !== student.schoolId.toString()) {
        throw new ConflictError('Classroom does not belong to the student\'s school');
      }
      if (newClassroom.currentEnrollment >= newClassroom.capacity) {
        throw new ConflictError('Classroom is at full capacity');
      }
    }

    // Update fields
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && key !== '_id' && key !== '__v') {
        if (typeof data[key] === 'object' && !Array.isArray(data[key]) && key !== 'metadata') {
          student[key] = { ...student[key], ...data[key] };
        } else {
          student[key] = data[key];
        }
      }
    });

    await student.save();

    // Update enrollment counts
    if (oldClassroomId !== newClassroomId) {
      const ClassroomManager = require('./ClassroomManager');
      const classroomManager = new ClassroomManager({ cache: this.cache });
      
      if (oldClassroomId) {
        await classroomManager.updateEnrollment(oldClassroomId, -1);
      }
      if (newClassroomId) {
        await classroomManager.updateEnrollment(newClassroomId, 1);
      }
    }

    // Invalidate cache
    await this._invalidateCache(student.schoolId);
    await this.cache.string.delete({ key: `student:${studentId}` });

    return student;
  }

  async delete(studentId) {
    const student = await Student.findById(studentId);
    if (!student) {
      throw new NotFoundError('Student');
    }

    const classroomId = student.classroomId;

    student.isActive = false;
    await student.save();

    // Update classroom enrollment
    if (classroomId) {
      const ClassroomManager = require('./ClassroomManager');
      const classroomManager = new ClassroomManager({ cache: this.cache });
      await classroomManager.updateEnrollment(classroomId, -1);
    }

    // Invalidate cache
    await this._invalidateCache(student.schoolId);
    await this.cache.string.delete({ key: `student:${studentId}` });

    return student;
  }

  async transfer(studentId, newClassroomId) {
    const student = await Student.findById(studentId);
    if (!student || !student.isActive) {
      throw new NotFoundError('Student');
    }

    const oldClassroomId = student.classroomId?.toString();
    const newClassroomIdStr = newClassroomId?.toString();

    if (oldClassroomId === newClassroomIdStr) {
      throw new ConflictError('Student is already in this classroom');
    }

    // Verify new classroom exists and belongs to same school
    if (newClassroomIdStr) {
      const newClassroom = await Classroom.findById(newClassroomId);
      if (!newClassroom || !newClassroom.isActive) {
        throw new NotFoundError('Classroom');
      }
      if (newClassroom.schoolId.toString() !== student.schoolId.toString()) {
        throw new ConflictError('Cannot transfer student to classroom in different school');
      }
      if (newClassroom.currentEnrollment >= newClassroom.capacity) {
        throw new ConflictError('Classroom is at full capacity');
      }
    }

    student.classroomId = newClassroomId || null;
    await student.save();

    // Update enrollment counts
    const ClassroomManager = require('./ClassroomManager');
    const classroomManager = new ClassroomManager({ cache: this.cache });
    
    if (oldClassroomId) {
      await classroomManager.updateEnrollment(oldClassroomId, -1);
    }
    if (newClassroomIdStr) {
      await classroomManager.updateEnrollment(newClassroomId, 1);
    }

    // Invalidate cache
    await this._invalidateCache(student.schoolId);
    await this.cache.string.delete({ key: `student:${studentId}` });

    return student;
  }

  async list(filters = {}, pagination = {}) {
    const { page = 1, limit = 10, sort = '-createdAt' } = pagination;
    const { schoolId, classroomId, search, isActive } = filters;

    const query = {};

    if (schoolId) {
      query.schoolId = schoolId;
    }

    if (classroomId) {
      query.classroomId = classroomId;
    }

    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      Student.find(query)
        .populate('schoolId', 'name')
        .populate('classroomId', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Student.countDocuments(query),
    ]);

    return {
      students,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async _invalidateCache(schoolId) {
    if (schoolId) {
      await this.cache.string.delete({ key: `students:list:${schoolId}` });
    }
    await this.cache.string.delete({ key: 'students:list' });
  }
}

module.exports = StudentManager;
