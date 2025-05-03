require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { OpenAI } = require('openai');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const multer = require('multer');
const execPromise = util.promisify(exec);
const { PrismaClient } = require('@prisma/client');
const { exec: ytdlp } = require('yt-dlp-exec');
const auth = require('./middleware/auth');

// Initialize Prisma client
const prisma = new PrismaClient();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Constants for cost calculation
const WHISPER_COST_PER_MINUTE = 0.006; // $0.006 per minute
const USD_TO_BRL_RATE = 5.0; // Example rate, should be fetched from an API

// Aumentar o limite de tamanho para 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Logging middleware
const logRequest = async (req, res, next) => {
  const start = Date.now();
  const originalSend = res.send;
  let statusCode;

  res.send = function (data) {
    statusCode = res.statusCode;
    originalSend.apply(res, arguments);
  };

  res.on('finish', async () => {
    if (req.user) {
      try {
        await prisma.systemLog.create({
          data: {
            level: statusCode >= 400 ? 'error' : 'info',
            message: `${req.method} ${req.path}`,
            details: JSON.stringify({
              query: req.query,
              body: req.body,
              duration: Date.now() - start,
              userAgent: req.headers['user-agent']
            }),
            userId: req.user.id,
            route: req.path,
            method: req.method,
            statusCode
          }
        });
      } catch (error) {
        console.error('Error saving log:', error);
      }
    }
  });

  next();
};

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(logRequest);

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (username === 'megafone' && password === 'megatranskipta') {
    try {
      // Check if user exists, if not create it
      let user = await prisma.user.findUnique({
        where: { username }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            username,
            password: 'megatranskripta', // In a real app, you should hash the password
            useCustomKey: false
          }
        });
      }

      const token = jwt.sign({ id: user.id, username }, process.env.JWT_SECRET, { expiresIn: '24h' });
      res.json({ token });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Error during login process' });
    }
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Settings routes
app.put('/settings/api-key', auth, async (req, res) => {
  try {
    const { apiKey, useCustomKey } = req.body;
    const userId = req.user.id;

    await prisma.user.update({
      where: { id: userId },
      data: { 
        openaiApiKey: apiKey,
        useCustomKey: useCustomKey ?? false
      }
    });

    res.json({ message: 'API key settings updated successfully' });
  } catch (error) {
    console.error('Error updating API key:', error);
    res.status(500).json({ error: 'Failed to update API key settings' });
  }
});

app.get('/settings/api-key', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        openaiApiKey: true,
        useCustomKey: true
      }
    });

    // Check if user has their own key or if environment key is available
    const hasCustomKey = !!user?.openaiApiKey;
    const hasSystemKey = !!process.env.OPENAI_API_KEY;
    const isUsingCustomKey = user?.useCustomKey && hasCustomKey;

    res.json({ 
      hasCustomKey,
      hasSystemKey,
      isUsingCustomKey,
      useCustomKey: user?.useCustomKey || false,
      message: isUsingCustomKey ? 
        'Using your custom API key' : 
        (hasSystemKey ? 'Using system default API key' : 'No API key configured')
    });
  } catch (error) {
    console.error('Error fetching API key:', error);
    res.status(500).json({ error: 'Failed to fetch API key status' });
  }
});

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

// Criar pasta temporária se não existir
const tempDir = path.join(__dirname, '..', '..', 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Helper function to download video from any platform
async function downloadVideo(url, options = {}) {
  try {
    // Garantir que o diretório temporário existe
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const timestamp = Date.now();
    const basePath = path.join(tempDir, `video_${timestamp}`);
    
    console.log('Downloading to:', basePath); // Debug log

    // Configure download options
    const downloadOptions = {
      output: basePath,
      format: options.audioOnly ? 
        'bestaudio[ext=mp3]/best[ext=mp4]/best' : 
        `bestvideo[ext=${options.format || 'mp4'}]+bestaudio[ext=m4a]/best[ext=${options.format || 'mp4'}]/best`,
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
    const files = fs.readdirSync(tempDir);
    const downloadedFile = files.find(file => file.startsWith(`video_${timestamp}`));
    
    if (!downloadedFile) {
      console.error('No file found with prefix:', `video_${timestamp}`); // Debug log
      throw new Error('Downloaded file not found');
    }

    const outputPath = path.join(tempDir, downloadedFile);

    // Verificar se o arquivo tem conteúdo
    const stats = fs.statSync(outputPath);
    if (stats.size === 0) {
      console.error('File is empty:', outputPath); // Debug log
      throw new Error('Downloaded file is empty');
    }

    console.log('Download completed successfully:', outputPath); // Debug log
    return outputPath;
  } catch (error) {
    console.error('Error downloading video:', error);
    throw error;
  }
}

// Helper function to handle file upload
async function handleFileUpload(file, type) {
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const tempPath = path.join(tempDir, `${Date.now()}.${type}`);
  await fs.promises.writeFile(tempPath, file.buffer);

  if (type === 'video') {
    const audioPath = path.join(tempDir, `${Date.now()}.mp3`);
    await execPromise(`ffmpeg -i "${tempPath}" -vn -acodec libmp3lame "${audioPath}"`);
    fs.unlinkSync(tempPath);
    return audioPath;
  }

  return tempPath;
}

// Helper function to convert text to SRT format
function convertToSRT(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  let srt = '';
  let counter = 1;
  let currentTime = 0;
  const averageWordsPerMinute = 150; // Assuming average speaking speed
  
  for (let sentence of sentences) {
    sentence = sentence.trim();
    const words = sentence.split(/\s+/);
    const durationInSeconds = (words.length / averageWordsPerMinute) * 60;
    
    const startTime = formatTime(currentTime);
    currentTime += durationInSeconds;
    const endTime = formatTime(currentTime);
    
    srt += `${counter}\n`;
    srt += `${startTime} --> ${endTime}\n`;
    srt += `${sentence}.\n\n`;
    
    counter++;
  }
  
  return srt;
}

// Helper function to convert text to VTT format
function convertToVTT(text) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  let vtt = 'WEBVTT\n\n';
  let currentTime = 0;
  const averageWordsPerMinute = 150; // Assuming average speaking speed
  
  for (let sentence of sentences) {
    sentence = sentence.trim();
    const words = sentence.split(/\s+/);
    const durationInSeconds = (words.length / averageWordsPerMinute) * 60;
    
    const startTime = formatTime(currentTime);
    currentTime += durationInSeconds;
    const endTime = formatTime(currentTime);
    
    vtt += `${startTime} --> ${endTime}\n`;
    vtt += `${sentence}.\n\n`;
  }
  
  return vtt;
}

// Helper function to format time (seconds to HH:MM:SS,mmm)
function formatTime(seconds) {
  const date = new Date(seconds * 1000);
  const hh = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  
  if (seconds < 3600) {
    return `${mm}:${ss},${ms}`;
  }
  return `${hh}:${mm}:${ss},${ms}`;
}

// Helper function to get audio duration using ffmpeg
async function getAudioDuration(filePath) {
  try {
    const { stdout } = await execPromise(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`);
    return parseFloat(stdout.trim());
  } catch (error) {
    console.error('Error getting audio duration:', error);
    throw error;
  }
}

// Helper function to get file size in bytes
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    console.error('Error getting file size:', error);
    return null;
  }
}

// Helper function to calculate word and character counts
function calculateTextMetrics(text) {
  return {
    wordCount: text.trim().split(/\s+/).length,
    characterCount: text.length
  };
}

// Helper function to calculate costs
function calculateCosts(durationInSeconds) {
  const durationInMinutes = Math.ceil(durationInSeconds / 60);
  const costUsd = durationInMinutes * WHISPER_COST_PER_MINUTE;
  const costBrl = costUsd * USD_TO_BRL_RATE;
  return { costUsd, costBrl };
}

// Transcribe route
app.post('/transcribe', auth, upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  try {
    const { url, type, title, outputFormat = 'plain' } = req.body;
    console.log('Received request with outputFormat:', outputFormat);
    let videoPath;
    let audioPath;
    let fileSize = null;

    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // Handle different content types
    switch (type) {
      case 'youtube':
      case 'instagram':
      case 'tiktok':
        videoPath = await downloadVideo(url, { format: 'mp4' });
        // Extract audio from video
        audioPath = path.join(tempDir, `${Date.now()}_audio.mp3`);
        await execPromise(`ffmpeg -i "${videoPath}" -vn -acodec libmp3lame "${audioPath}"`);
        // Clean up video file
        if (fs.existsSync(videoPath)) {
          fs.unlinkSync(videoPath);
        }
        break;

      case 'video':
        if (!req.file) {
          throw new Error('No video file provided');
        }
        videoPath = req.file.path;
        audioPath = path.join(tempDir, `${Date.now()}_audio.mp3`);
        await execPromise(`ffmpeg -i "${videoPath}" -vn -acodec libmp3lame "${audioPath}"`);
        // Clean up video file
        if (fs.existsSync(videoPath)) {
          fs.unlinkSync(videoPath);
        }
        break;

      case 'audio':
        if (!req.file) {
          throw new Error('No audio file provided');
        }
        audioPath = req.file.path;
        break;

      default:
        throw new Error('Invalid content type');
    }

    // Get file size and duration before transcription
    fileSize = getFileSize(audioPath);
    const duration = await getAudioDuration(audioPath);
    const { costUsd, costBrl } = calculateCosts(duration);

    // Transcribe using Whisper
    let transcription = await transcribeAudio(audioPath, req.user.id);
    console.log('Raw transcription received, format:', outputFormat);
    
    // Convert to requested format
    switch (outputFormat) {
      case 'srt':
        console.log('Converting to SRT format');
        transcription = convertToSRT(transcription);
        console.log('SRT conversion result:', transcription.substring(0, 500));
        break;
      case 'vtt':
        console.log('Converting to VTT format');
        transcription = convertToVTT(transcription);
        break;
      default:
        console.log('Keeping plain text format');
    }

    // Calculate processing time and text metrics
    const processingTime = (Date.now() - startTime) / 1000;
    const { wordCount, characterCount } = calculateTextMetrics(transcription);

    // Clean up audio file
    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
    }
    
    // Save to database using Prisma with metrics
    const result = await prisma.transcription.create({
      data: {
        title: title || url,
        type,
        content: transcription,
        outputFormat,
        userId: req.user.id,
        fileSize,
        duration,
        processingTime,
        wordCount,
        characterCount,
        costUsd,
        costBrl,
        isDeleted: false
      }
    });

    console.log('Saved transcription with metrics:', {
      fileSize,
      duration,
      processingTime,
      wordCount,
      characterCount,
      costUsd,
      costBrl
    });

    res.json({ 
      id: result.id,
      title: result.title,
      type: result.type,
      content: result.content,
      outputFormat: result.outputFormat,
      fileSize: result.fileSize,
      duration: result.duration,
      processingTime: result.processingTime,
      wordCount: result.wordCount,
      characterCount: result.characterCount,
      costUsd: result.costUsd,
      costBrl: result.costBrl,
      success: true
    });
  } catch (error) {
    console.error('Error in transcribe route:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get transcriptions route
app.get('/transcriptions', auth, async (req, res) => {
  try {
    const transcriptions = await prisma.transcription.findMany({
      where: { 
        userId: req.user.id,
        isDeleted: false // Adiciona filtro para excluir itens deletados
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(transcriptions);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Error fetching transcriptions' });
  }
});

// Delete transcription route
app.delete('/transcriptions/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const transcription = await prisma.transcription.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!transcription) {
      return res.status(404).json({ error: 'Transcription not found' });
    }

    if (transcription.userId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this transcription' });
    }
    
    // Use soft delete
    await prisma.transcription.update({
      where: { id },
      data: { isDeleted: true }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Error deleting transcription' });
  }
});

// Helper functions
async function transcribeAudio(audioPath, userId) {
  try {
    // Get user's API key settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        openaiApiKey: true,
        useCustomKey: true
      }
    });

    // Determine which API key to use
    if (user?.useCustomKey && user?.openaiApiKey) {
      openai.apiKey = user.openaiApiKey;
    } else {
      openai.apiKey = process.env.OPENAI_API_KEY;
    }

    if (!openai.apiKey) {
      throw new Error('OpenAI API key not configured. Please add your API key in the settings or contact the administrator.');
    }

    const audioFile = fs.createReadStream(audioPath);
    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });
    return response.text;
  } catch (error) {
    console.error('Error in transcribeAudio:', error);
    throw error;
  }
}

// Endpoint para métricas
app.get('/metrics', auth, async (req, res) => {
  try {
    const { range = 'daily' } = req.query;
    const userId = req.user.id;

    // Busca todas as transcrições, incluindo as deletadas
    const transcriptions = await prisma.transcription.findMany({
      where: {
        userId,
        isDeleted: false // Inclui apenas as não deletadas para o dashboard
      },
      select: {
        id: true,
        createdAt: true,
        duration: true,
        costUsd: true,
        costBrl: true,
        type: true
      }
    });

    // Calcula métricas totais
    const totalTranscriptions = transcriptions.length;
    const totalDuration = transcriptions.reduce((sum, t) => sum + (t.duration || 0), 0);
    const totalCostUsd = transcriptions.reduce((sum, t) => sum + (t.costUsd || 0), 0);
    const totalCostBrl = transcriptions.reduce((sum, t) => sum + (t.costBrl || 0), 0);

    // Calcula distribuição por tipo
    const typeDistribution = transcriptions.reduce((acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1;
      return acc;
    }, {});

    // Calcula estatísticas diárias/mensais
    const stats = transcriptions.reduce((acc, t) => {
      const date = new Date(t.createdAt);
      const key = range === 'daily' 
        ? date.toISOString().split('T')[0]
        : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!acc[key]) {
        acc[key] = {
          date: key,
          duration: 0,
          costUsd: 0,
          costBrl: 0
        };
      }

      acc[key].duration += t.duration || 0;
      acc[key].costUsd += t.costUsd || 0;
      acc[key].costBrl += t.costBrl || 0;

      return acc;
    }, {});

    const sortedStats = Object.values(stats).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      totalTranscriptions,
      totalDuration,
      totalCostUsd,
      totalCostBrl,
      typeDistribution,
      [range === 'daily' ? 'dailyStats' : 'monthlyStats']: sortedStats
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Erro ao buscar métricas' });
  }
});

// Logs routes
app.get('/logs', auth, async (req, res) => {
  try {
    const { level, startDate, endDate, limit = 100 } = req.query;
    
    const where = {
      userId: req.user.id,
      ...(level && { level }),
      ...(startDate && endDate && {
        timestamp: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    const logs = await prisma.systemLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit)
    });

    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Error fetching logs' });
  }
});

// Delete logs
app.delete('/logs', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {
      userId: req.user.id,
      ...(startDate && endDate && {
        timestamp: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    await prisma.systemLog.deleteMany({ where });
    
    res.json({ success: true, message: 'Logs deleted successfully' });
  } catch (error) {
    console.error('Error deleting logs:', error);
    res.status(500).json({ error: 'Error deleting logs' });
  }
});

// Endpoint para download de vídeos
app.post('/download', auth, async (req, res) => {
  try {
    const { url, platform, quality, format, audioOnly } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL é obrigatória' });
    }

    let filePath;
    const timestamp = Date.now();

    try {
      switch (platform) {
        case 'youtube':
        case 'instagram':
        case 'tiktok':
          filePath = await downloadVideo(url, { quality, format, audioOnly });
          break;
        default:
          return res.status(400).json({ error: 'Plataforma não suportada' });
      }
    } catch (error) {
      console.error('Error downloading video:', error);
      return res.status(500).json({ error: 'Erro ao baixar o arquivo da plataforma' });
    }

    // Get the file extension from the path
    const fileExtension = path.extname(filePath);
    
    // Enviar o arquivo para download com o formato correto
    const downloadFileName = `video_${timestamp}.${format || 'mp4'}`;
    res.download(filePath, downloadFileName, (err) => {
      if (err) {
        console.error('Error sending file:', err);
      }
      // Limpar o arquivo temporário após o download
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

  } catch (error) {
    console.error('Error in download endpoint:', error);
    res.status(500).json({ error: 'Erro ao processar o download' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 