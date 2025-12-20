const express = require('express');

const router = express.Router();

// Simple contact endpoint (logs to server, ready for integration with email service)
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // In production, integrate with email/SMS/helpdesk service here
    console.log('New contact message:', { name, email, message });

    res.json({ message: 'Thank you for reaching out. Our team will contact you shortly.' });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;






