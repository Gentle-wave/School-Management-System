const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true,
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    max: 1000,
  },
  currentEnrollment: {
    type: Number,
    default: 0,
    min: 0,
  },
  gradeLevel: {
    type: String,
    trim: true,
  },
  resources: {
    type: Map,
    of: String,
    default: {},
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

classroomSchema.virtual('availableSpots').get(function () {
  return Math.max(0, this.capacity - this.currentEnrollment);
});

// Indexes
classroomSchema.index({ schoolId: 1, name: 1 }, { unique: true });
classroomSchema.index({ schoolId: 1, isActive: 1 });
classroomSchema.index({ gradeLevel: 1 });

classroomSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Classroom', classroomSchema);
