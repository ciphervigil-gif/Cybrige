const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    videoUrl: { type: String }, // Could be local or remote URL
    order: { type: Number, default: 0 }
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    duration: { type: String, required: true },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    modules: [moduleSchema],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;


