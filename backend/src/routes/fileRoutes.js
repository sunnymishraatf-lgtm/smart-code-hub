const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const File = require('../models/File');

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024 // 100MB
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types but log them
    console.log('Uploading file:', file.originalname, 'Type:', file.mimetype);
    cb(null, true);
  }
});

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Upload file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (parseInt(process.env.FILE_EXPIRY_HOURS) || 24));

    const downloadUrl = `${req.protocol}://${req.get('host')}/api/files/download/${otp}`;

    // Generate QR Code
    const qrCodeDataUrl = await QRCode.toDataURL(downloadUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#6366f1',
        light: '#ffffff'
      }
    });

    const fileDoc = new File({
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      otp,
      qrCode: qrCodeDataUrl,
      downloadUrl,
      expiresAt,
      uploadedBy: {
        ip: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    await fileDoc.save();

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        id: fileDoc._id,
        originalName: fileDoc.originalName,
        size: fileDoc.size,
        otp: fileDoc.otp,
        qrCode: fileDoc.qrCode,
        downloadUrl: fileDoc.downloadUrl,
        expiresAt: fileDoc.expiresAt,
        expiresIn: `${process.env.FILE_EXPIRY_HOURS || 24} hours`
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload file',
      details: error.message
    });
  }
});

// Download file by OTP
router.get('/download/:otp', async (req, res) => {
  try {
    const { otp } = req.params;

    const fileDoc = await File.findOne({ otp });

    if (!fileDoc) {
      return res.status(404).json({ error: 'Invalid OTP or file expired' });
    }

    if (new Date() > fileDoc.expiresAt) {
      return res.status(410).json({ error: 'File has expired' });
    }

    const filePath = path.join(uploadDir, fileDoc.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Increment download count
    fileDoc.downloadCount += 1;
    await fileDoc.save();

    res.setHeader('Content-Disposition', `attachment; filename="${fileDoc.originalName}"`);
    res.setHeader('Content-Type', fileDoc.mimeType);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download file',
      details: error.message
    });
  }
});

// Verify OTP (for frontend validation)
router.get('/verify/:otp', async (req, res) => {
  try {
    const { otp } = req.params;

    const fileDoc = await File.findOne({ otp }).select('-qrCode');

    if (!fileDoc) {
      return res.status(404).json({ 
        valid: false,
        error: 'Invalid OTP' 
      });
    }

    if (new Date() > fileDoc.expiresAt) {
      return res.status(410).json({ 
        valid: false,
        error: 'File has expired' 
      });
    }

    res.json({
      valid: true,
      data: {
        originalName: fileDoc.originalName,
        size: fileDoc.size,
        expiresAt: fileDoc.expiresAt,
        downloadUrl: fileDoc.downloadUrl
      }
    });

  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({
      valid: false,
      error: 'Failed to verify OTP'
    });
  }
});

// Get file info
router.get('/info/:id', async (req, res) => {
  try {
    const fileDoc = await File.findById(req.params.id);

    if (!fileDoc) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({
      success: true,
      data: {
        originalName: fileDoc.originalName,
        size: fileDoc.size,
        downloadCount: fileDoc.downloadCount,
        expiresAt: fileDoc.expiresAt,
        createdAt: fileDoc.createdAt
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to get file info' });
  }
});

module.exports = router;
