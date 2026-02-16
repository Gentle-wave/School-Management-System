const SchoolManager = require('../../../managers/SchoolManager');
const { NotFoundError, ConflictError } = require('../../../libs/errors');

// Mock School model
jest.mock('../../../models/School', () => {
  return jest.fn();
});

const School = require('../../../models/School');

// Mock cache
const mockCache = {
  string: {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  },
};

describe('SchoolManager', () => {
  let schoolManager;

  beforeEach(() => {
    schoolManager = new SchoolManager({ cache: mockCache });
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new school', async () => {
      const schoolData = {
        name: 'Test School',
        address: {
          city: 'Test City',
        },
      };

      const mockSchool = {
        _id: '123',
        ...schoolData,
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          _id: '123',
          ...schoolData,
        }),
      };

      School.mockImplementation(() => mockSchool);

      const result = await schoolManager.create(schoolData);

      expect(mockSchool.save).toHaveBeenCalled();
      expect(mockCache.string.delete).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return school from cache if available', async () => {
      const schoolId = '123';
      const cachedSchool = { _id: schoolId, name: 'Cached School' };

      mockCache.string.get.mockResolvedValue(cachedSchool);

      const result = await schoolManager.getById(schoolId);

      expect(result).toEqual(cachedSchool);
      expect(mockCache.string.get).toHaveBeenCalledWith({ key: `school:${schoolId}` });
    });

    it('should fetch from database and cache if not in cache', async () => {
      const schoolId = '123';
      const schoolData = { _id: schoolId, name: 'Test School' };

      mockCache.string.get.mockResolvedValue(null);
      School.findById = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(schoolData),
      });

      const result = await schoolManager.getById(schoolId);

      expect(School.findById).toHaveBeenCalledWith(schoolId);
      expect(mockCache.string.set).toHaveBeenCalled();
    });

    it('should throw NotFoundError if school does not exist', async () => {
      const schoolId = '123';

      mockCache.string.get.mockResolvedValue(null);
      School.findById = jest.fn().mockResolvedValue(null);

      await expect(schoolManager.getById(schoolId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('update', () => {
    it('should update school successfully', async () => {
      const schoolId = '123';
      const updateData = { name: 'Updated School' };

      const mockSchool = {
        _id: schoolId,
        name: 'Original School',
        save: jest.fn().mockResolvedValue(true),
      };

      School.findById = jest.fn().mockResolvedValue(mockSchool);

      const result = await schoolManager.update(schoolId, updateData);

      expect(mockSchool.name).toBe(updateData.name);
      expect(mockSchool.save).toHaveBeenCalled();
    });

    it('should throw NotFoundError if school does not exist', async () => {
      const schoolId = '123';
      const updateData = { name: 'Updated School' };

      School.findById = jest.fn().mockResolvedValue(null);

      await expect(schoolManager.update(schoolId, updateData)).rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('should soft delete school if no active classrooms or students', async () => {
      const schoolId = '123';
      const Classroom = require('../../../models/Classroom');
      const Student = require('../../../models/Student');

      const mockSchool = {
        _id: schoolId,
        isActive: true,
        save: jest.fn().mockResolvedValue(true),
      };

      School.findById = jest.fn().mockResolvedValue(mockSchool);
      Classroom.countDocuments = jest.fn().mockResolvedValue(0);
      Student.countDocuments = jest.fn().mockResolvedValue(0);

      const result = await schoolManager.delete(schoolId);

      expect(mockSchool.isActive).toBe(false);
      expect(mockSchool.save).toHaveBeenCalled();
    });

    it('should throw ConflictError if school has active classrooms', async () => {
      const schoolId = '123';
      const Classroom = require('../../../models/Classroom');
      const Student = require('../../../models/Student');

      const mockSchool = {
        _id: schoolId,
        isActive: true,
      };

      School.findById = jest.fn().mockResolvedValue(mockSchool);
      Classroom.countDocuments = jest.fn().mockResolvedValue(5);
      Student.countDocuments = jest.fn().mockResolvedValue(0);

      await expect(schoolManager.delete(schoolId)).rejects.toThrow(ConflictError);
    });
  });

  describe('list', () => {
    it('should return paginated list of schools', async () => {
      const filters = { isActive: true };
      const pagination = { page: 1, limit: 10, sort: '-createdAt' };

      const mockSchools = [
        { _id: '1', name: 'School 1' },
        { _id: '2', name: 'School 2' },
      ];

      School.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockSchools),
            }),
          }),
        }),
      });
      School.countDocuments = jest.fn().mockResolvedValue(2);

      const result = await schoolManager.list(filters, pagination);

      expect(result.schools).toEqual(mockSchools);
      expect(result.pagination.total).toBe(2);
    });
  });
});
