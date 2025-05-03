const express = require('express');
const router = express.Router();
const ytdlp = require('yt-dlp-exec').default;
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');

// Ensure temp directory exists
const tempDir = path.join(__dirname, '../../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

router.post('/', auth.authenticate, async (req, res) => {
  try {
    const { url, platform, audioOnly } = req.body;

    if (!url || !platform) {
      return res.status(400).json({ error: 'URL and platform are required' });
    }

    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const timestamp = Date.now();
    const outputPath = path.join(tempDir, `video_${timestamp}.${audioOnly ? 'mp3' : 'mp4'}`);

    try {
      // Set download options
      const options = {
        output: outputPath,
        format: audioOnly ? 'bestaudio[ext=mp3]/best[ext=mp4]/best' : 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: [
          'referer:youtube.com',
          'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
      };

      // Download video
      await ytdlp(url, options);

      // Verify file exists and has content
      if (!fs.existsSync(outputPath)) {
        throw new Error('Downloaded file not found');
      }

      const stats = fs.statSync(outputPath);
      if (stats.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      // Set response headers
      res.setHeader('Content-Disposition', `attachment; filename="video_${timestamp}.${audioOnly ? 'mp3' : 'mp4'}"`);
      res.setHeader('Content-Type', audioOnly ? 'audio/mpeg' : 'video/mp4');

      // Stream the file
      const fileStream = fs.createReadStream(outputPath);
      fileStream.pipe(res);

      // Clean up after streaming
      fileStream.on('end', () => {
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
      });

      fileStream.on('error', (error) => {
        console.error('Stream error:', error);
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
        res.status(500).json({ error: 'Error streaming file' });
      });

    } catch (error) {
      console.error('Download error:', error);
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
      res.status(500).json({ error: 'Error downloading video' });
    }
  } catch (error) {
    console.error('Error in download route:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 