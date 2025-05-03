const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { exec: ytdlp } = require('yt-dlp-exec');

// Criar pasta temporária se não existir
const tempDir = path.join(__dirname, '..', '..', '..', 'temp');

const formatTimestamp = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  const pad = (num, size) => num.toString().padStart(size, '0');
  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(secs, 2)},${pad(ms, 3)}`;
};

const formatVTTTimestamp = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  const pad = (num, size) => num.toString().padStart(size, '0');
  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(secs, 2)}.${pad(ms, 3)}`;
};

const convertToSRT = (segments) => {
  return segments.map((segment, index) => {
    const start = formatTimestamp(segment.start);
    const end = formatTimestamp(segment.end);
    return `${index + 1}\n${start} --> ${end}\n${segment.text}\n`;
  }).join('\n');
};

const convertToVTT = (segments) => {
  const header = 'WEBVTT\n\n';
  const body = segments.map((segment, index) => {
    const start = formatVTTTimestamp(segment.start);
    const end = formatVTTTimestamp(segment.end);
    return `${index + 1}\n${start} --> ${end}\n${segment.text}\n`;
  }).join('\n');
  return header + body;
};

const formatTranscriptionOutput = (transcription, format) => {
  console.log('Transcription:', transcription); // Debug log
  console.log('Format:', format); // Debug log

  if (!transcription || !transcription.segments) {
    console.log('No segments found in transcription'); // Debug log
    return transcription.text || transcription;
  }

  switch (format) {
    case 'srt':
      return convertToSRT(transcription.segments);
    case 'vtt':
      return convertToVTT(transcription.segments);
    default:
      return transcription.text || transcription;
  }
};

// Helper function to retry operations
async function retryOperation(operation, maxRetries = 3, delay = 1000) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${i + 1} failed:`, error.message);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
}

const downloadVideo = async (url) => {
  const tempDir = path.join(__dirname, '..', '..', '..', 'temp');
  
  // Garantir que o diretório temporário existe
  try {
    await fs.mkdir(tempDir, { recursive: true });
  } catch (error) {
    console.error('Error creating temp directory:', error);
  }
  
  const timestamp = Date.now();
  const basePath = path.join(tempDir, `video_${timestamp}`);
  
  console.log('Downloading to:', basePath); // Debug log
  
  try {
    // Configure download options
    const downloadOptions = {
      output: basePath,
      format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: [
        'referer:youtube.com',
        'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ]
    };

    // Download video
    await ytdlp(url, downloadOptions);

    // Encontrar o arquivo baixado (pode ter extensão diferente)
    const files = await fs.readdir(tempDir);
    const downloadedFile = files.find(file => file.startsWith(`video_${timestamp}`));
    
    if (!downloadedFile) {
      console.error('No file found with prefix:', `video_${timestamp}`); // Debug log
      throw new Error('Downloaded file not found');
    }

    const videoPath = path.join(tempDir, downloadedFile);

    // Verificar se o arquivo tem conteúdo
    const stats = await fs.stat(videoPath);
    if (stats.size === 0) {
      console.error('File is empty:', videoPath); // Debug log
      throw new Error('Downloaded file is empty');
    }

    console.log('Download completed successfully:', videoPath); // Debug log
    return videoPath;
  } catch (error) {
    console.error('Error downloading video:', error);
    throw error;
  }
};

const convertToAudio = async (videoPath) => {
  const audioPath = videoPath.replace('.mp4', '.mp3');
  await execAsync(`ffmpeg -i "${videoPath}" -vn -acodec libmp3lame "${audioPath}"`);
  await fs.unlink(videoPath);
  return audioPath;
};

const transcribe = async (req, res) => {
  try {
    const { url, type, title, outputFormat = 'plain' } = req.body;
    const userId = req.user.id;
    let audioPath;

    console.log('Starting transcription with format:', outputFormat); // Debug log

    try {
      if (type === 'youtube' || type === 'instagram') {
        const videoPath = await downloadVideo(url);
        audioPath = await convertToAudio(videoPath);
      } else if (req.file) {
        if (type === 'video') {
          const videoPath = req.file.path;
          audioPath = await convertToAudio(videoPath);
        } else {
          audioPath = req.file.path;
        }
      } else {
        throw new Error('No input provided');
      }

      // Execute whisper command with --output-format json
      const whisperOutput = await execAsync(`whisper "${audioPath}" --model small --output_format json`);
      const jsonFile = audioPath.replace(/\.[^/.]+$/, '.json');
      
      // Read and parse the JSON output
      const rawTranscription = await fs.readFile(jsonFile, 'utf8');
      const transcriptionResult = JSON.parse(rawTranscription);

      console.log('Whisper output:', transcriptionResult); // Debug log

      // Format the content according to the requested output format
      const formattedContent = formatTranscriptionOutput(transcriptionResult, outputFormat);

      console.log('Formatted content:', formattedContent); // Debug log

      // Save to database
      const transcription = await prisma.transcription.create({
        data: {
          title,
          content: formattedContent,
          type,
          userId,
          outputFormat,
        },
      });

      // Cleanup temporary files
      await fs.unlink(audioPath);
      await fs.unlink(jsonFile);
      await fs.rmdir(path.dirname(audioPath));

      res.json(transcription);
    } catch (error) {
      console.error('Processing error:', error);
      if (audioPath) {
        try {
          await fs.unlink(audioPath);
          await fs.rmdir(path.dirname(audioPath));
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
      }
      throw error;
    }
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: 'Erro ao processar a transcrição' });
  }
};

const getTranscriptions = async (req, res) => {
  try {
    const userId = req.user.id;
    const transcriptions = await prisma.transcription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(transcriptions);
  } catch (error) {
    console.error('Error fetching transcriptions:', error);
    res.status(500).json({ error: 'Erro ao buscar transcrições' });
  }
};

const deleteTranscription = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const transcription = await prisma.transcription.findFirst({
      where: { id, userId },
    });

    if (!transcription) {
      return res.status(404).json({ error: 'Transcrição não encontrada' });
    }

    await prisma.transcription.delete({
      where: { id },
    });

    res.json({ message: 'Transcrição excluída com sucesso' });
  } catch (error) {
    console.error('Error deleting transcription:', error);
    res.status(500).json({ error: 'Erro ao excluir transcrição' });
  }
};

module.exports = {
  transcribe,
  getTranscriptions,
  deleteTranscription,
}; 