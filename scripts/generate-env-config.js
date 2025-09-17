#!/usr/bin/env node

/**
 * Script para gerar env-config.js a partir das variáveis de ambiente
 * Lê o arquivo .env e gera os arquivos env-config.js para public/ e build/
 */

const fs = require('fs');
const path = require('path');

// Função para ler e parsear o arquivo .env
function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    console.error(`❌ Arquivo .env não encontrado em: ${envPath}`);
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    // Remove comentários e linhas vazias
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const equalIndex = line.indexOf('=');
      if (equalIndex > 0) {
        const key = line.substring(0, equalIndex).trim();
        const value = line.substring(equalIndex + 1).trim();
        envVars[key] = value;
      }
    }
  });

  return envVars;
}

// Função para gerar o conteúdo do env-config.js
function generateEnvConfig(envVars) {
  const configContent = 'window._env_ = {\n' +
    '  // Replicate API Configuration\n' +
    "  REPLICATE_API_TOKEN: '" + (envVars.REPLICATE_API_TOKEN || 'r8_temp_token_for_development') + "',\n" +
    "  REPLICATE_WEBHOOK_SECRET: '" + (envVars.REPLICATE_WEBHOOK_SECRET || 'whsec_temp_secret_for_development') + "',\n" +
    "  REPLICATE_WEBHOOK_URL: '" + (envVars.REPLICATE_WEBHOOK_URL || 'https://transkripta.megafone.digital/api/webhooks/replicate') + "',\n" +
    '  \n' +
    '  // Transcription Webhook Configuration\n' +
    "  REACT_APP_TRANSCRIPTION_WEBHOOK_URL: '" + (envVars.REACT_APP_TRANSCRIPTION_WEBHOOK_URL || 'https://your-legacy-webhook.com/api/process') + "',\n" +
    "  REACT_APP_TRANSCRIPTION_WEBHOOK_SECRET: '" + (envVars.REACT_APP_TRANSCRIPTION_WEBHOOK_SECRET || 'your_legacy_webhook_secret_key') + "',\n" +
    "  REACT_APP_TRANSCRIPTION_WEBHOOK_TIMEOUT: '" + (envVars.REACT_APP_TRANSCRIPTION_WEBHOOK_TIMEOUT || '60000') + "',\n" +
    '  \n' +
    '  // Social Downloader Webhook Configuration\n' +
    "  REACT_APP_SOCIAL_WEBHOOK_URL: '" + (envVars.REACT_APP_SOCIAL_WEBHOOK_URL || 'https://your-social-webhook.com/api/download') + "',\n" +
    "  REACT_APP_SOCIAL_WEBHOOK_SECRET: '" + (envVars.REACT_APP_SOCIAL_WEBHOOK_SECRET || 'your_social_webhook_secret_key') + "',\n" +
    "  REACT_APP_SOCIAL_WEBHOOK_TIMEOUT: '" + (envVars.REACT_APP_SOCIAL_WEBHOOK_TIMEOUT || '60000') + "',\n" +
    '  \n' +
    '  // Transcription Service Configuration\n' +
    "  REACT_APP_TRANSCRIPTION_SERVICE: '" + (envVars.REACT_APP_TRANSCRIPTION_SERVICE || 'replicate') + "',\n" +
    "  REACT_APP_WHISPER_MODEL: '" + (envVars.REACT_APP_WHISPER_MODEL || 'openai/whisper-large-v3') + "',\n" +
    "  REACT_APP_MAX_AUDIO_DURATION: '" + (envVars.REACT_APP_MAX_AUDIO_DURATION || '7200') + "',\n" +
    '  \n' +
    '  // Application Configuration\n' +
    "  REACT_APP_ENVIRONMENT: '" + (envVars.REACT_APP_ENVIRONMENT || 'development') + "',\n" +
    "  REACT_APP_DEBUG: '" + (envVars.REACT_APP_DEBUG || 'false') + "',\n" +
    "  REACT_APP_API_TIMEOUT: '" + (envVars.REACT_APP_API_TIMEOUT || '30000') + "',\n" +
    "  REACT_APP_MAX_FILE_SIZE: '" + (envVars.REACT_APP_MAX_FILE_SIZE || '100000000') + "',\n" +
    "  REACT_APP_SUPPORTED_FORMATS: '" + (envVars.REACT_APP_SUPPORTED_FORMATS || 'mp4,mp3,wav,m4a') + "',\n" +
    '  \n' +
    '  // Authentication\n' +
    "  REACT_APP_JWT_SECRET: '" + (envVars.REACT_APP_JWT_SECRET || 'your_jwt_secret_for_local_auth') + "',\n" +
    "  REACT_APP_SESSION_TIMEOUT: '" + (envVars.REACT_APP_SESSION_TIMEOUT || '3600000') + "',\n" +
    '  \n' +
    '  // Admin Credentials\n' +
    "  REACT_APP_ADMIN_USERNAME: '" + (envVars.REACT_APP_ADMIN_USERNAME || '') + "',\n" +
    "  REACT_APP_ADMIN_EMAIL: '" + (envVars.REACT_APP_ADMIN_EMAIL || '') + "',\n" +
    "  REACT_APP_ADMIN_PASSWORD: '" + (envVars.REACT_APP_ADMIN_PASSWORD || '') + "',\n" +
    '  \n' +
    '  // Logs\n' +
    "  REACT_APP_LOG_LEVEL: '" + (envVars.REACT_APP_LOG_LEVEL || 'error') + "'\n" +
    '};\n';

  return configContent;
}

// Função principal
function main() {
  console.log('🔧 Gerando arquivos env-config.js...');
  
  const projectRoot = path.resolve(__dirname, '..');
  const envPath = path.join(projectRoot, '.env');
  
  // Carregar variáveis do .env
  const envVars = loadEnvFile(envPath);
  console.log(`✅ Carregadas ${Object.keys(envVars).length} variáveis do .env`);
  
  // Gerar conteúdo do env-config.js
  const configContent = generateEnvConfig(envVars);
  
  // Escrever arquivo para public/
  const publicPath = path.join(projectRoot, 'public', 'env-config.js');
  fs.writeFileSync(publicPath, configContent, 'utf8');
  console.log(`✅ Gerado: ${publicPath}`);
  
  // Escrever arquivo para build/ (se existir)
  const buildPath = path.join(projectRoot, 'build', 'env-config.js');
  if (fs.existsSync(path.dirname(buildPath))) {
    fs.writeFileSync(buildPath, configContent, 'utf8');
    console.log(`✅ Gerado: ${buildPath}`);
  } else {
    console.log(`⚠️  Diretório build/ não existe, pulando: ${buildPath}`);
  }
  
  console.log('🎉 Arquivos env-config.js gerados com sucesso!');
  console.log('💡 Agora as configurações serão carregadas dinamicamente do .env');
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { loadEnvFile, generateEnvConfig };