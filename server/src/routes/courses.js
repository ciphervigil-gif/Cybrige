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
        title: 'Penetration Testing',
        slug: 'penetration-testing',
        description: 'End-to-end penetration testing engagements covering web, network, and cloud targets.',
        duration: '9 weeks',
        level: 'Intermediate',
        modules: [
          {
            title: 'PT Engagement Planning',
            description: 'Scoping, rules of engagement, and methodology.',
            videoUrl: '/media/penetration-testing/module1.mp4',
            order: 1
          },
          {
            title: 'Exploitation & Reporting',
            description: 'Privilege escalation, post-exploitation, and reporting.',
            videoUrl: '/media/penetration-testing/module2.mp4',
            order: 2
          }
        ]
      },
      {
        title: 'Bug Bounty',
        slug: 'bug-bounty',
        description: 'Learn how to discover, exploit, and responsibly disclose vulnerabilities on modern platforms.',
        duration: '8 weeks',
        level: 'Intermediate',
        modules: [
          {
            title: 'Bug Hunting Fundamentals',
            description: 'Reconnaissance and vulnerability discovery patterns.',
            videoUrl: '/media/bug-bounty/module1.mp4',
            order: 1
          },
          {
            title: 'Reporting & Disclosure',
            description: 'Crafting effective reports and responsible disclosure.',
            videoUrl: '/media/bug-bounty/module2.mp4',
            order: 2
          }
        ]
      },
      {
        title: 'Active Directory Security',
        slug: 'active-directory-security',
        description: 'Secure and assess Active Directory environments against modern attack paths.',
        duration: '7 weeks',
        level: 'Intermediate',
        modules: [
          {
            title: 'AD Fundamentals & Hardening',
            description: 'Core components, attack paths, and baseline hardening.',
            videoUrl: '/media/active-directory-security/module1.mp4',
            order: 1
          },
          {
            title: 'Detection & Response',
            description: 'Monitoring, detection engineering, and remediation.',
            videoUrl: '/media/active-directory-security/module2.mp4',
            order: 2
          }
        ]
      },
      {
        title: 'API Security',
        slug: 'api-security',
        description: 'Secure APIs against common and advanced threats with hands-on testing.',
        duration: '6 weeks',
        level: 'Intermediate',
        modules: [
          {
            title: 'API Threat Modeling',
            description: 'Understanding API architectures and threat surfaces.',
            videoUrl: '/media/api-security/module1.mp4',
            order: 1
          },
          {
            title: 'Testing & Hardening',
            description: 'Authentication, authorization, and injection defenses for APIs.',
            videoUrl: '/media/api-security/module2.mp4',
            order: 2
          }
        ]
      },
      {
        title: 'Android Security',
        slug: 'android-security',
        description: 'Assess and secure Android applications with modern static and dynamic techniques.',
        duration: '6 weeks',
        level: 'Intermediate',
        modules: [
          {
            title: 'Android App Attack Surface',
            description: 'App components, storage, and common vulnerabilities.',
            videoUrl: '/media/android-security/module1.mp4',
            order: 1
          },
          {
            title: 'Exploitation & Mitigations',
            description: 'Reversing, dynamic analysis, and mitigation strategies.',
            videoUrl: '/media/android-security/module2.mp4',
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



