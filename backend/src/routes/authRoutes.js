const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

const OTP = require('../models/OTP');

// Initialize clients once
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send OTP via Email (using nodemailer)
const sendEmailOTP = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'Smart Code Hub <noreply@smartcodehub.com>',
    to: email,
    subject: 'Your Smart Code Hub OTP',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #6366f1; text-align: center;">Smart Code Hub</h2>
        <p style="font-size: 16px; color: #333;">Your verification code is:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h1 style="color: #6366f1; font-size: 36px; letter-spacing: 8px; margin: 0;">${otp}</h1>
        </div>
        <p style="font-size: 14px; color: #666;">This code will expire in 10 minutes.</p>
        <p style="font-size: 12px; color: #999; text-align: center;">If you didn't request this code, please ignore this email.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Send OTP via SMS (using Twilio)
const sendSMSOTP = async (phone, otp) => {
  await twilioClient.messages.create({
    body: `Your Smart Code Hub verification code is: ${otp}. Valid for 10 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone
  });
};

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Request OTP
router.post('/request-otp', [
  body('identifier').notEmpty().trim(),
  body('type').isIn(['email', 'phone']).optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { identifier, type = 'email' } = req.body;
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete existing OTPs for this identifier
    await OTP.deleteMany({ identifier, type });

    // Save new OTP
    const otpDoc = new OTP({
      identifier,
      otp,
      type,
      expiresAt
    });
    await otpDoc.save();

    // Send OTP
    if (type === 'email') {
      await sendEmailOTP(identifier, otp);
    } else {
      await sendSMSOTP(identifier, otp);
    }

    res.json({
      success: true,
      message: `OTP sent successfully to ${identifier}`,
      expiresIn: '10 minutes'
    });

  } catch (error) {
    console.error('OTP Request Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP',
      details: error.message
    });
  }
});

// Verify OTP
router.post('/verify-otp', [
  body('identifier').notEmpty().trim(),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { identifier, otp } = req.body;

    const otpDoc = await OTP.findOne({
      identifier,
      otp,
      verified: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP'
      });
    }

    // Mark as verified
    otpDoc.verified = true;
    await otpDoc.save();

    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { identifier, type: otpDoc.type },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      message: 'OTP verified successfully',
      token,
      identifier
    });

  } catch (error) {
    console.error('OTP Verify Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify OTP'
    });
  }
});

module.exports = router;
