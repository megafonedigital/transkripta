import config from '../config/env';

/**
 * Serviço para verificação e processamento de webhooks do Replicate
 * Implementa verificação HMAC SHA-256 para autenticidade
 */
class WebhookService {
  constructor() {
    this.webhookSecret = config.replicate.webhookSecret;
  }

  /**
   * Verifica se o webhook está configurado
   */
  isConfigured() {
    return !!this.webhookSecret;
  }

  /**
   * Verifica a autenticidade de um webhook usando HMAC SHA-256
   * @param {string} payload - Corpo da requisição (raw)
   * @param {string} webhookId - ID do webhook (header webhook-id)
   * @param {string} webhookTimestamp - Timestamp do webhook (header webhook-timestamp)
   * @param {string} webhookSignature - Assinatura do webhook (header webhook-signature)
   * @returns {boolean} - True se o webhook for válido
   */
  async verifyWebhook(payload, webhookId, webhookTimestamp, webhookSignature) {
    if (!this.isConfigured()) {
      console.warn('Webhook secret não configurado');
      return false;
    }

    try {
      // Verificar timestamp para prevenir replay attacks (tolerância de 5 minutos)
      const currentTime = Math.floor(Date.now() / 1000);
      const webhookTime = parseInt(webhookTimestamp);
      const timeDiff = Math.abs(currentTime - webhookTime);
      
      if (timeDiff > 300) { // 5 minutos
        console.warn('Webhook timestamp muito antigo ou futuro:', timeDiff);
        return false;
      }

      // Construir o conteúdo assinado: id.timestamp.payload
      const signedContent = `${webhookId}.${webhookTimestamp}.${payload}`;
      
      // Extrair a chave base64 (remover prefixo whsec_)
      const secretKey = this.webhookSecret.startsWith('whsec_') 
        ? this.webhookSecret.substring(6) 
        : this.webhookSecret;
      
      // Calcular HMAC SHA-256
      const expectedSignature = await this.calculateHMAC(signedContent, secretKey);
      
      // Extrair assinaturas do header (formato: "v1,signature1 v1,signature2")
      const signatures = webhookSignature.split(' ').map(sig => {
        const parts = sig.split(',');
        return parts.length === 2 ? parts[1] : sig;
      });
      
      // Verificar se alguma assinatura coincide (comparação segura)
      return signatures.some(sig => this.secureCompare(expectedSignature, sig));
      
    } catch (error) {
      console.error('Erro ao verificar webhook:', error);
      return false;
    }
  }

  /**
   * Calcula HMAC SHA-256
   * @param {string} data - Dados para assinar
   * @param {string} key - Chave secreta (base64)
   * @returns {Promise<string>} - Assinatura HMAC em base64
   */
  async calculateHMAC(data, key) {
    // Converter chave base64 para ArrayBuffer
    const keyBuffer = this.base64ToArrayBuffer(key);
    
    // Converter dados para ArrayBuffer
    const dataBuffer = new TextEncoder().encode(data);
    
    // Importar chave para WebCrypto
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // Calcular HMAC
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer);
    
    // Converter para base64
    return this.arrayBufferToBase64(signature);
  }

  /**
   * Converte base64 para ArrayBuffer
   * @param {string} base64 - String base64
   * @returns {ArrayBuffer} - ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Converte ArrayBuffer para base64
   * @param {ArrayBuffer} buffer - ArrayBuffer
   * @returns {string} - String base64
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Comparação segura de strings para prevenir timing attacks
   * @param {string} a - Primeira string
   * @param {string} b - Segunda string
   * @returns {boolean} - True se as strings forem iguais
   */
  secureCompare(a, b) {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }

  /**
   * Processa um webhook do Replicate
   * @param {Object} webhookData - Dados do webhook
   * @returns {Object} - Resultado do processamento
   */
  processWebhook(webhookData) {
    try {
      const { id, status, output, error, logs } = webhookData;
      
      // Atualizar informações da predição no localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        const predictions = JSON.parse(localStorage.getItem('replicate_predictions') || '{}');
        
        if (predictions[id]) {
          predictions[id] = {
            ...predictions[id],
            status,
            output,
            error,
            logs,
            updatedAt: new Date().toISOString(),
            webhookReceived: true
          };
          
          localStorage.setItem('replicate_predictions', JSON.stringify(predictions));
          
          // Disparar evento customizado para notificar componentes
          window.dispatchEvent(new CustomEvent('replicateWebhookReceived', {
            detail: { predictionId: id, status, output, error }
          }));
        }
      }
      
      return {
        success: true,
        predictionId: id,
        status,
        message: this.getStatusMessage(status)
      };
      
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Obtém mensagem amigável para o status
   * @param {string} status - Status da predição
   * @returns {string} - Mensagem amigável
   */
  getStatusMessage(status) {
    const messages = {
      'starting': 'Iniciando processamento...',
      'processing': 'Processando transcrição...',
      'succeeded': 'Transcrição concluída com sucesso!',
      'failed': 'Erro no processamento da transcrição',
      'canceled': 'Processamento cancelado'
    };
    
    return messages[status] || `Status: ${status}`;
  }

  /**
   * Extrai texto da transcrição do output do Whisper
   * @param {Object} output - Output da predição
   * @returns {string} - Texto transcrito
   */
  extractTranscriptionText(output) {
    if (!output) return '';
    
    // O Whisper pode retornar diferentes formatos
    if (typeof output === 'string') {
      return output;
    }
    
    if (output.text) {
      return output.text;
    }
    
    if (output.transcription) {
      return output.transcription;
    }
    
    if (output.segments && Array.isArray(output.segments)) {
      return output.segments.map(segment => segment.text || '').join(' ');
    }
    
    return JSON.stringify(output);
  }

  /**
   * Obtém informações detalhadas da transcrição
   * @param {Object} output - Output da predição
   * @returns {Object} - Informações detalhadas
   */
  getTranscriptionDetails(output) {
    if (!output) return null;
    
    return {
      text: this.extractTranscriptionText(output),
      segments: output.segments || [],
      language: output.language || 'unknown',
      duration: output.duration || null,
      wordCount: this.extractTranscriptionText(output).split(/\s+/).length
    };
  }
}

// Instância singleton
const webhookService = new WebhookService();

export default webhookService;