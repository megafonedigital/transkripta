// Configuração de variáveis de ambiente
// Funciona tanto em desenvolvimento (process.env) quanto em produção (window._env_)

const getEnvVar = (key, defaultValue = '') => {
  // Em produção, as variáveis são injetadas via window._env_
  if (typeof window !== 'undefined' && window._env_) {
    return window._env_[key] || defaultValue;
  }
  
  // Em desenvolvimento, usa process.env
  return process.env[key] || defaultValue;
};

const config = {
  // APIs Externas removidas - usando apenas Replicate
  
  // Transcription Webhook Configuration
  transcriptionWebhook: {
    url: getEnvVar('REACT_APP_TRANSCRIPTION_WEBHOOK_URL'),
    secret: getEnvVar('REACT_APP_TRANSCRIPTION_WEBHOOK_SECRET'),
    timeout: parseInt(getEnvVar('REACT_APP_TRANSCRIPTION_WEBHOOK_TIMEOUT', '60000')), // ms
  },
  
  // Social Downloader Webhook Configuration
  socialWebhook: {
    url: getEnvVar('REACT_APP_SOCIAL_WEBHOOK_URL'),
    secret: getEnvVar('REACT_APP_SOCIAL_WEBHOOK_SECRET'),
    timeout: parseInt(getEnvVar('REACT_APP_SOCIAL_WEBHOOK_TIMEOUT', '60000')), // ms
  },
  
  // Replicate API Configuration
  replicate: {
    apiToken: getEnvVar('REACT_APP_REPLICATE_API_TOKEN'),
    webhookSecret: getEnvVar('REACT_APP_REPLICATE_WEBHOOK_SECRET'),
    webhookUrl: getEnvVar('REACT_APP_REPLICATE_WEBHOOK_URL'),
  },
  
  // Transcription Service Configuration
  transcription: {
    service: getEnvVar('REACT_APP_TRANSCRIPTION_SERVICE', 'replicate'),
    whisperModel: getEnvVar('REACT_APP_WHISPER_MODEL', 'openai/whisper-large-v3'),
    maxAudioDuration: parseInt(getEnvVar('REACT_APP_MAX_AUDIO_DURATION', '7200')), // segundos (2 horas)
  },
  
  // Configurações da Aplicação
  app: {
    name: getEnvVar('REACT_APP_APP_NAME', 'Transkipta'),
    version: getEnvVar('REACT_APP_APP_VERSION', '2.0.0'),
    environment: getEnvVar('REACT_APP_ENVIRONMENT', 'development'),
    debug: getEnvVar('REACT_APP_DEBUG', 'false') === 'true',
  },
  
  // Configurações de Upload
  upload: {
    maxFileSize: parseInt(getEnvVar('REACT_APP_MAX_FILE_SIZE', '100')) * 1024 * 1024, // MB para bytes
    maxUploadSize: parseInt(getEnvVar('REACT_APP_MAX_UPLOAD_SIZE', '104857600')), // 100MB
    chunkSize: parseInt(getEnvVar('REACT_APP_CHUNK_SIZE', '1048576')), // 1MB
    supportedFormats: getEnvVar('REACT_APP_SUPPORTED_FORMATS', 'mp4,mp3,wav,m4a,webm').split(','),
  },
  
  // Autenticação
  auth: {
    jwtSecret: getEnvVar('REACT_APP_JWT_SECRET', 'default-secret-key'),
    sessionTimeout: parseInt(getEnvVar('REACT_APP_SESSION_TIMEOUT', '3600')), // segundos
    adminUsername: getEnvVar('REACT_APP_ADMIN_USERNAME'),
    adminEmail: getEnvVar('REACT_APP_ADMIN_EMAIL'),
    adminPassword: getEnvVar('REACT_APP_ADMIN_PASSWORD'),
  },
  
  // Configurações de API
  api: {
    timeout: parseInt(getEnvVar('REACT_APP_API_TIMEOUT', '120000')), // ms
  },
  
  // Configurações de Cache
  cache: {
    duration: parseInt(getEnvVar('REACT_APP_CACHE_DURATION', '86400')), // segundos
    enabled: getEnvVar('REACT_APP_ENABLE_CACHE', 'true') === 'true',
  },
  
  // Configurações de UI
  ui: {
    defaultTheme: getEnvVar('REACT_APP_DEFAULT_THEME', 'light'),
    enableDarkMode: getEnvVar('REACT_APP_ENABLE_DARK_MODE', 'true') === 'true',
    defaultLanguage: getEnvVar('REACT_APP_DEFAULT_LANGUAGE', 'pt-BR'),
  },
  
  // Analytics (opcional)
  analytics: {
    enabled: getEnvVar('REACT_APP_ENABLE_ANALYTICS', 'false') === 'true',
    id: getEnvVar('REACT_APP_ANALYTICS_ID'),
  },
  
  // Logs
  logs: {
    level: getEnvVar('REACT_APP_LOG_LEVEL', 'info'),
    enableConsole: getEnvVar('REACT_APP_ENABLE_CONSOLE_LOGS', 'true') === 'true',
  },
};

// Validação de configurações obrigatórias
const validateConfig = () => {
  const requiredKeys = [
    'replicate.apiToken',
    'replicate.webhookSecret',
    'replicate.webhookUrl'
  ];
  
  // Credenciais de administrador são obrigatórias apenas em produção
  if (config.app.environment === 'production') {
    requiredKeys.push(
      'auth.adminUsername',
      'auth.adminEmail',
      'auth.adminPassword'
    );
  }
  
  const missing = [];
  
  requiredKeys.forEach(key => {
    const keys = key.split('.');
    let value = config;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    if (!value) {
      missing.push(key);
    }
  });
  
  if (missing.length > 0) {
    console.warn('Configurações obrigatórias não encontradas:', missing);
    
    if (config.app.environment === 'production') {
      throw new Error(`Configurações obrigatórias não encontradas: ${missing.join(', ')}`);
    }
  }
};

// Validar configurações na inicialização
validateConfig();

// Log de configurações em desenvolvimento
if (config.app.debug && config.logs.enableConsole) {
  console.log('Configurações carregadas:', {
    ...config,
    // Ocultar chaves sensíveis nos logs
    webhook: { ...config.webhook, secret: config.webhook.secret ? '***' : undefined },
    replicate: { 
      ...config.replicate, 
      apiToken: config.replicate.apiToken ? '***' : undefined,
      webhookSecret: config.replicate.webhookSecret ? '***' : undefined,
    },
    auth: { 
      ...config.auth, 
      jwtSecret: '***',
      adminPassword: config.auth.adminPassword ? '***' : undefined,
    },
  });
}

export default config;