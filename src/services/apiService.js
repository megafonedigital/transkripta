import axios from 'axios';
import config from '../config/env';

// Configurações das APIs
const TRANSCRIPTION_WEBHOOK_URL = config.transcriptionWebhook.url;
const TRANSCRIPTION_WEBHOOK_SECRET = config.transcriptionWebhook.secret;
const TRANSCRIPTION_WEBHOOK_TIMEOUT = config.transcriptionWebhook.timeout;
const SOCIAL_WEBHOOK_URL = config.socialWebhook.url;
const SOCIAL_WEBHOOK_SECRET = config.socialWebhook.secret;
const SOCIAL_WEBHOOK_TIMEOUT = config.socialWebhook.timeout;
const API_TIMEOUT = config.api.timeout;

// Transcription Webhook API instance
const transcriptionWebhookApi = axios.create({
  timeout: TRANSCRIPTION_WEBHOOK_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Secret': TRANSCRIPTION_WEBHOOK_SECRET
  }
});

// Social Downloader Webhook API instance
const socialWebhookApi = axios.create({
  timeout: SOCIAL_WEBHOOK_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Secret': SOCIAL_WEBHOOK_SECRET
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
    
    const response = await socialWebhookApi.post(SOCIAL_WEBHOOK_URL, requestData);
    
    console.log('Resposta do webhook:', response.data);
    
    // Nova estrutura de resposta: array com objetos contendo status, url e filename
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      const videoData = response.data[0]; // Pega o primeiro item do array
      
      if ((videoData.status === 'tunnel' || videoData.status === 'redirect') && videoData.url && videoData.filename) {
        return {
          status: videoData.status,
          videoUrl: videoData.url,
          audioUrl: videoData.url, // Mesmo URL para áudio e vídeo
          title: videoData.filename.replace(/\.[^/.]+$/, ''), // Remove extensão do filename
          filename: videoData.filename,
          tunnelUrl: videoData.url, // Mantém compatibilidade
          directUrl: videoData.url
        };
      }
    }
    
    // Fallback para estrutura antiga se necessário
    if (response.data && response.data.success) {
      return {
        videoUrl: response.data.videoUrl,
        audioUrl: response.data.audioUrl,
        title: response.data.title,
        duration: response.data.duration,
        thumbnail: response.data.thumbnail
      };
    }
    
    throw new Error('Webhook não retornou dados válidos');
  } catch (error) {
    console.error('Erro no processamento via webhook:', error);
    throw handleApiError(error);
  }
};

// Download file from URL - Modified for direct redirect on tunnel URLs
export const downloadFromUrl = async (url, filename, isDirect = false) => {
  try {
    console.log('Fazendo download do arquivo:', url);
    
    // If it's a direct tunnel URL, just redirect to it
    if (isDirect) {
      console.log('Redirecionando diretamente para:', url);
      window.open(url, '_blank');
      return;
    }
    
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

// Process tunnel URL for transcription
export const processTunnelUrl = async (tunnelUrl) => {
  try {
    console.log('Processando URL do tunnel para transcrição:', tunnelUrl);
    
    const response = await axios.get(tunnelUrl, {
      responseType: 'blob',
      timeout: API_TIMEOUT * 5, // Mais tempo para arquivos grandes
      onDownloadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Download progress: ${progress}%`);
        }
      }
    });
    
    // Return blob for transcription
    return response.data;
  } catch (error) {
    console.error('Erro ao processar URL do tunnel:', error);
    throw handleApiError(error);
  }
};

// Get direct download link for social download
export const getTunnelDownloadInfo = (videoData) => {
  if ((videoData.status === 'tunnel' || videoData.status === 'redirect') && videoData.tunnelUrl) {
        return {
          downloadUrl: videoData.tunnelUrl,
      filename: videoData.filename,
      title: videoData.title
    };
  }
  
  // Fallback para estrutura antiga
  return {
    downloadUrl: videoData.videoUrl || videoData.audioUrl,
    filename: videoData.title ? `${videoData.title}.mp4` : 'download.mp4',
    title: videoData.title
  };
};

// Webhook processing functions replace previous download methods

// Transcription Functions
// Função transcribeAudio removida - agora usando apenas Replicate Whisper

// Utility Functions

export const validateVideoUrl = (url) => {
  const patterns = {
    youtube: /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)/,
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