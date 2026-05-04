const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true,
    unique: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  otp: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  qrCode: {
    type: String,
    required: true
  },
  downloadUrl: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  uploadedBy: {
    ip: String,
    userAgent: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for automatic expiration
fileSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('File', fileSchema);
