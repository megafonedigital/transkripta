import config from '../config/env';

/**
 * Serviço para integração com Replicate Whisper API
 * Suporta processamento assíncrono para arquivos grandes sem timeout
 */
class ReplicateService {
  constructor() {
    this.baseUrl = 'https://api.replicate.com/v1';
    this.apiToken = config.replicate.apiToken;
    this.webhookUrl = config.replicate.webhookUrl;
    this.whisperModel = config.transcription.whisperModel;
  }

  /**
   * Verifica se o serviço está configurado corretamente
   */
  isConfigured() {
    return !!(this.apiToken && this.webhookUrl && this.whisperModel);
  }

  /**
   * Cria uma predição para transcrição de áudio
   * @param {string} audioUrl - URL do arquivo de áudio
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Object>} - Dados da predição criada
   */
  async createTranscription(audioUrl, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('Replicate service não está configurado. Verifique as variáveis de ambiente.');
    }

    const payload = {
      version: this.whisperModel.split(':')[1], // Extrai o version ID
      input: {
        audio: audioUrl,
        model: 'large-v3',
        translate: options.translate || false,
        language: options.language || null,
        temperature: options.temperature || 0,
        transcription: options.transcription || 'plain text',
        suppress_tokens: options.suppress_tokens || '-1',
        logprob_threshold: options.logprob_threshold || -1.0,
        no_speech_threshold: options.no_speech_threshold || 0.6,
        condition_on_previous_text: options.condition_on_previous_text !== false,
        compression_ratio_threshold: options.compression_ratio_threshold || 2.4,
        temperature_increment_on_fallback: options.temperature_increment_on_fallback || 0.2
      },
      webhook: this.webhookUrl,
      webhook_events_filter: ['start', 'output', 'logs', 'completed']
    };

    try {
      const response = await fetch(`${this.baseUrl}/predictions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Erro na API Replicate: ${response.status} - ${errorData.detail || response.statusText}`);
      }

      const prediction = await response.json();
      
      // Salvar informações da predição no localStorage para acompanhamento
      this.savePredictionInfo(prediction.id, {
        id: prediction.id,
        status: prediction.status,
        audioUrl,
        createdAt: new Date().toISOString(),
        model: this.whisperModel,
        options
      });

      return prediction;
    } catch (error) {
      console.error('Erro ao criar transcrição:', error);
      throw error;
    }
  }

  /**
   * Consulta o status de uma predição
   * @param {string} predictionId - ID da predição
   * @returns {Promise<Object>} - Status atual da predição
   */
  async getPredictionStatus(predictionId) {
    if (!this.isConfigured()) {
      throw new Error('Replicate service não está configurado.');
    }

    try {
      const response = await fetch(`${this.baseUrl}/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Erro ao consultar predição: ${response.status} - ${errorData.detail || response.statusText}`);
      }

      const prediction = await response.json();
      
      // Atualizar informações salvas
      this.updatePredictionInfo(predictionId, {
        status: prediction.status,
        output: prediction.output,
        error: prediction.error,
        logs: prediction.logs,
        updatedAt: new Date().toISOString()
      });

      return prediction;
    } catch (error) {
      console.error('Erro ao consultar status da predição:', error);
      throw error;
    }
  }

  /**
   * Cancela uma predição em andamento
   * @param {string} predictionId - ID da predição
   * @returns {Promise<Object>} - Resultado do cancelamento
   */
  async cancelPrediction(predictionId) {
    if (!this.isConfigured()) {
      throw new Error('Replicate service não está configurado.');
    }

    try {
      const response = await fetch(`${this.baseUrl}/predictions/${predictionId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Erro ao cancelar predição: ${response.status} - ${errorData.detail || response.statusText}`);
      }

      const result = await response.json();
      
      // Atualizar status local
      this.updatePredictionInfo(predictionId, {
        status: 'canceled',
        updatedAt: new Date().toISOString()
      });

      return result;
    } catch (error) {
      console.error('Erro ao cancelar predição:', error);
      throw error;
    }
  }

  /**
   * Salva informações da predição no localStorage
   * @param {string} predictionId - ID da predição
   * @param {Object} info - Informações da predição
   */
  savePredictionInfo(predictionId, info) {
    try {
      const predictions = this.getAllPredictions();
      predictions[predictionId] = info;
      localStorage.setItem('replicate_predictions', JSON.stringify(predictions));
    } catch (error) {
      console.warn('Erro ao salvar informações da predição:', error);
    }
  }

  /**
   * Atualiza informações da predição no localStorage
   * @param {string} predictionId - ID da predição
   * @param {Object} updates - Atualizações
   */
  updatePredictionInfo(predictionId, updates) {
    try {
      const predictions = this.getAllPredictions();
      if (predictions[predictionId]) {
        predictions[predictionId] = { ...predictions[predictionId], ...updates };
        localStorage.setItem('replicate_predictions', JSON.stringify(predictions));
      }
    } catch (error) {
      console.warn('Erro ao atualizar informações da predição:', error);
    }
  }

  /**
   * Obtém informações de uma predição específica
   * @param {string} predictionId - ID da predição
   * @returns {Object|null} - Informações da predição
   */
  getPredictionInfo(predictionId) {
    try {
      const predictions = this.getAllPredictions();
      return predictions[predictionId] || null;
    } catch (error) {
      console.warn('Erro ao obter informações da predição:', error);
      return null;
    }
  }

  /**
   * Obtém todas as predições salvas
   * @returns {Object} - Todas as predições
   */
  getAllPredictions() {
    try {
      const stored = localStorage.getItem('replicate_predictions');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('Erro ao obter predições:', error);
      return {};
    }
  }

  /**
   * Remove predições antigas (mais de 7 dias)
   */
  cleanupOldPredictions() {
    try {
      const predictions = this.getAllPredictions();
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      Object.keys(predictions).forEach(id => {
        const prediction = predictions[id];
        const createdAt = new Date(prediction.createdAt);
        
        if (createdAt < sevenDaysAgo) {
          delete predictions[id];
        }
      });
      
      localStorage.setItem('replicate_predictions', JSON.stringify(predictions));
    } catch (error) {
      console.warn('Erro ao limpar predições antigas:', error);
    }
  }

  /**
   * Obtém predições ativas (em processamento)
   * @returns {Array} - Lista de predições ativas
   */
  getActivePredictions() {
    try {
      const predictions = this.getAllPredictions();
      return Object.values(predictions).filter(p => 
        ['starting', 'processing'].includes(p.status)
      );
    } catch (error) {
      console.warn('Erro ao obter predições ativas:', error);
      return [];
    }
  }
}

// Instância singleton
const replicateService = new ReplicateService();

// Limpar predições antigas na inicialização
replicateService.cleanupOldPredictions();

export default replicateService;