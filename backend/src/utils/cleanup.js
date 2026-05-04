const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const File = require('../models/File');

const startCleanupJob = () => {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    console.log('🧹 Running file cleanup job...');

    try {
      const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');

      // Find expired files in database
      const expiredFiles = await File.find({
        expiresAt: { $lt: new Date() }
      });

      let deletedCount = 0;

      for (const file of expiredFiles) {
        const filePath = path.join(uploadDir, file.filename);

        // Delete physical file
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }

      // Delete expired records from database
      await File.deleteMany({
        expiresAt: { $lt: new Date() }
      });

      console.log(`✅ Cleanup complete. Deleted ${deletedCount} files.`);

    } catch (error) {
      console.error('❌ Cleanup job error:', error);
    }
  });

  console.log('⏰ File cleanup job scheduled (runs every hour)');
};

module.exports = { startCleanupJob };
