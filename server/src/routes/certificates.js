const express = require('express');
const Certificate = require('../models/Certificate');

const router = express.Router();

// POST /api/certificates/verify
router.post('/verify', async (req, res) => {
  try {
    const { certificateId } = req.body;
    if (!certificateId) {
      return res.status(400).json({ message: 'Certificate ID is required' });
    }

    const cert = await Certificate.findOne({ certificateId });
    if (!cert) {
      return res.json({ valid: false, message: 'Certificate not found' });
    }

    res.json({
      valid: !!cert.isValid,
      certificateId: cert.certificateId,
      studentName: cert.studentName,
      courseName: cert.courseName,
      issueDate: cert.issueDate,
      status: cert.isValid ? 'Valid' : 'Invalid'
    });
  } catch (err) {
    console.error('Certificate verify error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;






