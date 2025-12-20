const express = require('express');
const Course = require('../models/Course');
const auth = require('../middleware/auth');

const router = express.Router();

// Seed default courses once (simple helper, could be removed in production)
router.post('/seed', async (req, res) => {
  try {
    const existing = await Course.countDocuments();
    if (existing > 0) {
      return res.status(400).json({ message: 'Courses already seeded' });
    }

    const courses = [
      {
        title: 'Ethical Hacking',
        slug: 'ethical-hacking',
        description: 'Learn penetration testing, vulnerability assessment, and ethical hacking methodologies.',
        duration: '10 weeks',
        level: 'Intermediate',
        modules: [
          {
            title: 'Introduction to Ethical Hacking',
            description: 'Overview, legal aspects, and methodologies.',
            videoUrl: '/media/ethical-hacking/module1.mp4',
            order: 1
          },
          {
            title: 'Reconnaissance & Scanning',
            description: 'Information gathering and network mapping.',
            videoUrl: '/media/ethical-hacking/module2.mp4',
            order: 2
          }
        ]
      },
      {
        title: 'SOC Analyst',
        slug: 'soc-analyst',
        description: 'Train to become a Security Operations Center (SOC) analyst with hands-on labs.',
        duration: '8 weeks',
        level: 'Beginner',
        modules: [
          {
            title: 'SOC Fundamentals',
            description: 'SOC structure, tools, and responsibilities.',
            videoUrl: '/media/soc-analyst/module1.mp4',
            order: 1
          }
        ]
      },
      {
        title: 'GRC (Governance, Risk & Compliance)',
        slug: 'grc',
        description: 'Understand cybersecurity governance, risk management, and compliance frameworks.',
        duration: '6 weeks',
        level: 'Beginner',
        modules: [
          {
            title: 'Cybersecurity Governance',
            description: 'Policies, standards, and frameworks.',
            videoUrl: '/media/grc/module1.mp4',
            order: 1
          }
        ]
      },
      {
        title: 'Blue Team / Red Team',
        slug: 'blue-red-team',
        description: 'Dual perspective training for offensive and defensive security teams.',
        duration: '12 weeks',
        level: 'Advanced',
        modules: [
          {
            title: 'Red Team Planning',
            description: 'Offensive simulations and campaign design.',
            videoUrl: '/media/blue-red-team/module1.mp4',
            order: 1
          },
          {
            title: 'Blue Team Defense',
            description: 'Detection engineering and incident response.',
            videoUrl: '/media/blue-red-team/module2.mp4',
            order: 2
          }
        ]
      }
    ];

    const created = await Course.insertMany(courses);
    res.status(201).json({ message: 'Courses seeded', count: created.length });
  } catch (err) {
    console.error('Seed courses error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/courses - public list
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true }).select('-modules.videoUrl');
    res.json(courses);
  } catch (err) {
    console.error('Get courses error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/courses/:slug - detailed view (modules without raw video URLs)
router.get('/:slug', async (req, res) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug, isActive: true }).lean();
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    // Hide actual video URLs here, they are retrieved via secure /videos route
    const safeModules = (course.modules || []).map((m) => ({
      title: m.title,
      description: m.description,
      order: m.order
    }));
    res.json({ ...course, modules: safeModules });
  } catch (err) {
    console.error('Get course error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/courses/:slug/modules - protected: returns module metadata & secure endpoints
router.get('/:slug/modules', auth(true), async (req, res) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug, isActive: true }).lean();
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    const modules = (course.modules || []).map((m, index) => ({
      index,
      title: m.title,
      description: m.description,
      order: m.order,
      // Frontend will call this endpoint to stream video
      videoEndpoint: `/api/videos/${course.slug}/${index}`
    }));
    res.json({ course: { title: course.title, slug: course.slug, duration: course.duration }, modules });
  } catch (err) {
    console.error('Get course modules error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


