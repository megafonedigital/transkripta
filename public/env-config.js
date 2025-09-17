window._env_ = {
  // Replicate API Configuration
  REPLICATE_API_TOKEN: 'r8_your-replicate-api-token-here',
  REPLICATE_WEBHOOK_SECRET: 'whsec_your-webhook-signing-secret-here',
  REPLICATE_WEBHOOK_URL: 'https://your-domain.com/api/webhooks/replicate',
  
  // Transcription Webhook Configuration
  REACT_APP_TRANSCRIPTION_WEBHOOK_URL: 'https://your-webhook-url.com/api/process',
  REACT_APP_TRANSCRIPTION_WEBHOOK_SECRET: 'your-webhook-secret-key-here',
  REACT_APP_TRANSCRIPTION_WEBHOOK_TIMEOUT: '60000',
  
  // Social Downloader webhook
  REACT_APP_SOCIAL_WEBHOOK_URL: 'https://your-social-webhook.com/api/download',
  REACT_APP_SOCIAL_WEBHOOK_SECRET: 'your_social_webhook_secret_key',
  REACT_APP_SOCIAL_WEBHOOK_TIMEOUT: '60000',
  
  // Transcription Service Configuration
  REACT_APP_TRANSCRIPTION_SERVICE: 'replicate',
  REACT_APP_WHISPER_MODEL: 'openai/whisper-large-v3',
  REACT_APP_MAX_AUDIO_DURATION: '7200',
  // Application Configuration
  REACT_APP_ENVIRONMENT: 'production',
  REACT_APP_DEBUG: 'false',
  REACT_APP_API_TIMEOUT: '30000',
  REACT_APP_MAX_FILE_SIZE: '100000000',
  REACT_APP_SUPPORTED_FORMATS: 'mp4,mp3,wav,m4a',
  // Authentication
  REACT_APP_JWT_SECRET: 'your_jwt_secret_for_local_auth',
  REACT_APP_SESSION_TIMEOUT: '3600000',
  // Admin Credentials - CONFIGURE ESTAS VARIÁVEIS NO SEU AMBIENTE
  REACT_APP_ADMIN_USERNAME: '',
  REACT_APP_ADMIN_EMAIL: '',
  REACT_APP_ADMIN_PASSWORD: '',
  REACT_APP_LOG_LEVEL: 'info'
};