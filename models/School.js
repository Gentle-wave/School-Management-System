const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
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
    country: {
      type: String,
      trim: true,
      default: 'USA',
    },
  },
  contact: {
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
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

// Indexes for faster queries
schoolSchema.index({ name: 1 });
schoolSchema.index({ 'address.city': 1 });
schoolSchema.index({ isActive: 1 });
schoolSchema.index({ createdAt: -1 });

module.exports = mongoose.model('School', schoolSchema);
