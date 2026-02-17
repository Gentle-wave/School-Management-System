const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true,
  },
  classroomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    default: null,
    index: true,
  },
  enrollmentDate: {
    type: Date,
    default: Date.now,
  },
  contact: {
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    guardianName: {
      type: String,
      trim: true,
    },
    guardianPhone: {
      type: String,
      trim: true,
    },
  },
  address: {
    street: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    zipCode: {
      type: String,
      trim: true,
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  metadata: {
    type: Map,
    of: String,
    default: {},
  },
}, {
  timestamps: true,
});

studentSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

studentSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

studentSchema.index({ schoolId: 1, isActive: 1 });
studentSchema.index({ classroomId: 1 });
studentSchema.index({ studentId: 1 });
studentSchema.index({ lastName: 1, firstName: 1 });
studentSchema.index({ enrollmentDate: -1 });

studentSchema.set('toJSON', { virtuals: true });

// Pre-save hook to generate studentId if not provided
studentSchema.pre('save', async function (next) {
  if (!this.studentId && this.isNew) {
    const School = mongoose.model('School');
    const school = await School.findById(this.schoolId);
    if (school) {
      const year = new Date().getFullYear();
      const count = await mongoose.model('Student').countDocuments({ schoolId: this.schoolId });
      this.studentId = `${school.name.substring(0, 3).toUpperCase()}-${year}-${String(count + 1).padStart(4, '0')}`;
    }
  }
  next();
});

module.exports = mongoose.model('Student', studentSchema);
