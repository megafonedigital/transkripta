import axios from 'axios';
import config from '../config/env';

// Configurações das APIs
const OPENAI_API_KEY = config.openai.apiKey;
const OPENAI_API_URL = config.openai.baseUrl;
// RAPIDAPI removido conforme solicitado
const COBALT_API_URL = config.cobalt.apiUrl;
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

// RapidAPI removido - usando apenas Cobalt API

const cobaltApi = axios.create({
  baseURL: COBALT_API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Video Download Functions
export const downloadVideo = async (url, platform) => {
  try {
    let downloadUrl;
    
    // Priorizar Cobalt como serviço principal
    try {
      console.log('Tentando download via Cobalt...');
      downloadUrl = await downloadFromCobalt(url);
    } catch (cobaltError) {
      console.warn('Falha no Cobalt, tentando alternativas:', cobaltError.message);
      
      // RapidAPI removido - sem fallback adicional
      throw cobaltError;
    }
    
    if (!downloadUrl) {
      throw new Error('Não foi possível obter URL de download');
    }
    
    console.log('URL de download obtida:', downloadUrl);
    
    // Download the actual file
    const response = await axios.get(downloadUrl, {
      responseType: 'blob',
      timeout: API_TIMEOUT * 2, // Mais tempo para download de arquivos grandes
      onDownloadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Download progress: ${progress}%`);
        }
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Erro no download do vídeo:', error);
    throw handleApiError(error);
  }
};

// Função downloadFromYoutube removida - RAPIDAPI não será mais usado

const downloadFromCobalt = async (url) => {
  try {
    console.log('Iniciando download via Cobalt para URL:', url);
    
    const requestData = {
      url: url,
      vCodec: 'h264',
      vQuality: '720',
      aFormat: 'mp3',
      isAudioOnly: false,
      isAudioMuted: false,
      dubLang: false,
      filenamePattern: 'classic'
    };
    
    console.log('Dados da requisição Cobalt:', requestData);
    
    const response = await cobaltApi.post('/api/json', requestData);
    
    console.log('Resposta do Cobalt:', response.data);
    
    if (response.data) {
      // Cobalt pode retornar diferentes formatos de resposta
      if (response.data.url) {
        return response.data.url;
      } else if (response.data.picker && response.data.picker.length > 0) {
        // Se houver múltiplas opções, pegar a primeira
        return response.data.picker[0].url;
      } else if (response.data.audio) {
        // Se for apenas áudio
        return response.data.audio;
      }
    }
    
    throw new Error('URL de download não encontrada na resposta do Cobalt');
  } catch (error) {
    console.error('Erro detalhado no Cobalt:', error.response?.data || error.message);
    
    if (error.response?.status === 400) {
      throw new Error('URL inválida ou não suportada pelo Cobalt');
    } else if (error.response?.status === 429) {
      throw new Error('Limite de requisições excedido no Cobalt');
    } else if (error.response?.status >= 500) {
      throw new Error('Erro interno do servidor Cobalt');
    }
    
    throw new Error(`Erro no download via Cobalt: ${error.message}`);
   }
 };

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