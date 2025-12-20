const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    studentName: {
      type: String,
      required: true
    },
    studentEmail: {
      type: String,
      required: true
    },
    courseName: {
      type: String,
      required: true
    },
    issueDate: {
      type: Date,
      required: true
    },
    isValid: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = Certificate;


