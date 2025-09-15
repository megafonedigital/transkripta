import axios from 'axios';
import config from '../config/env';

// Configurações das APIs
const OPENAI_API_KEY = config.openai.apiKey;
const OPENAI_API_URL = config.openai.baseUrl;
const WEBHOOK_URL = config.webhook.url;
const WEBHOOK_SECRET = config.webhook.secret;
const WEBHOOK_TIMEOUT = config.webhook.timeout;
const API_TIMEOUT = config.api.timeout;

// Create axios instances
const openaiApi = axios.create({
  baseURL: OPENAI_API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Webhook API instance
const webhookApi = axios.create({
  timeout: WEBHOOK_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Secret': WEBHOOK_SECRET
  }
});

// Video Processing Functions via Webhook
export const processVideoUrl = async (url, options = {}) => {
  try {
    console.log('Enviando URL para webhook:', url);
    
    const requestData = {
      url: url,
      format: options.format || 'mp4',
      quality: options.quality || '720p',
      audioOnly: options.audioOnly || false,
      timestamp: Date.now()
    };
    
    console.log('Dados da requisição webhook:', requestData);
    
    const response = await webhookApi.post(WEBHOOK_URL, requestData);
    
    console.log('Resposta do webhook:', response.data);
    
    if (response.data && response.data.success) {
      return {
        videoUrl: response.data.videoUrl,
        audioUrl: response.data.audioUrl,
        title: response.data.title,
        duration: response.data.duration,
        thumbnail: response.data.thumbnail
      };
    }
    
    throw new Error('Webhook não retornou URLs válidas');
  } catch (error) {
    console.error('Erro no processamento via webhook:', error);
    throw handleApiError(error);
  }
};

// Download file from URL
export const downloadFromUrl = async (url, filename) => {
  try {
    console.log('Fazendo download do arquivo:', url);
    
    const response = await axios.get(url, {
      responseType: 'blob',
      timeout: API_TIMEOUT * 3, // Mais tempo para download de arquivos grandes
      onDownloadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Download progress: ${progress}%`);
        }
      }
    });
    
    // Create download link
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    
    return response.data;
  } catch (error) {
    console.error('Erro no download do arquivo:', error);
    throw handleApiError(error);
  }
};

// Webhook processing functions replace previous download methods

// Transcription Functions
export const transcribeAudio = async (audioFile, options = {}) => {
  try {
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', options.model || 'whisper-1');
    
    if (options.language) {
      formData.append('language', options.language);
    }
    
    if (options.prompt) {
      formData.append('prompt', options.prompt);
    }
    
    const response = await openaiApi.post('/audio/transcriptions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return {
      text: response.data.text,
      language: response.data.language || options.language,
      duration: response.data.duration
    };
  } catch (error) {
    console.error('Erro na transcrição:', error);
    throw new Error(`Falha na transcrição: ${error.message}`);
  }
};

// Utility Functions
const extractVideoId = (url) => {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

export const validateVideoUrl = (url) => {
  const patterns = {
    youtube: /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)/,
    instagram: /(?:instagram\.com\/(?:p|reel|tv)\/)/,
    tiktok: /(?:tiktok\.com\/@[^\/]+\/video\/|vm\.tiktok\.com\/)/
  };
  
  for (const [platform, pattern] of Object.entries(patterns)) {
    if (pattern.test(url)) {
      return platform;
    }
  }
  
  return null;
};

// File Processing
export const convertToAudio = async (videoBlob) => {
  return new Promise((resolve, reject) => {
    const audio = document.createElement('audio');
    const url = URL.createObjectURL(videoBlob);
    
    audio.src = url;
    audio.addEventListener('loadedmetadata', () => {
      // For now, we'll return the original blob
      // In a real implementation, you might want to use FFmpeg.js
      resolve(videoBlob);
      URL.revokeObjectURL(url);
    });
    
    audio.addEventListener('error', () => {
      reject(new Error('Erro ao processar o arquivo de áudio'));
      URL.revokeObjectURL(url);
    });
  });
};

// Error Handling
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const message = error.response.data?.message || error.message;
    
    switch (status) {
      case 401:
        return 'Chave de API inválida ou expirada';
      case 403:
        return 'Acesso negado. Verifique suas permissões';
      case 429:
        return 'Limite de requisições excedido. Tente novamente mais tarde';
      case 500:
        return 'Erro interno do servidor';
      default:
        return `Erro ${status}: ${message}`;
    }
  } else if (error.request) {
    // Network error
    return 'Erro de conexão. Verifique sua internet';
  } else {
    // Other error
    return error.message || 'Erro desconhecido';
  }
};