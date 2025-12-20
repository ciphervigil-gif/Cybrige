const express = require('express');
const path = require('path');
const fs = require('fs');
const Course = require('../models/Course');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/videos/:courseSlug/:moduleIndex - protected streaming endpoint
router.get('/:courseSlug/:moduleIndex', auth(true), async (req, res) => {
  try {
    const { courseSlug, moduleIndex } = req.params;
    const course = await Course.findOne({ slug: courseSlug, isActive: true }).lean();
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const index = parseInt(moduleIndex, 10);
    const module = course.modules && course.modules[index];
    if (!module || !module.videoUrl) {
      return res.status(404).json({ message: 'Module or video not found' });
    }

    // Resolve video path (for demo assumes videos located in /server/media relative to project)
    const videoPath = path.join(__dirname, '..', '..', 'media', module.videoUrl.replace(/^\/media\//, ''));
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ message: 'Video file missing on server' });
    }

    // Basic streaming with range support
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4'
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4'
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (err) {
    console.error('Video streaming error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


