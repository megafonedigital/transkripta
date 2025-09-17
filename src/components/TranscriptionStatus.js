import React, { useState, useEffect } from 'react';
import replicateService from '../services/replicateService';
import webhookService from '../services/webhookService';

/**
 * Componente para exibir e gerenciar status de transcrições em andamento
 */
const TranscriptionStatus = ({ onTranscriptionComplete }) => {
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carregar predições do localStorage na inicialização
  useEffect(() => {
    loadPredictions();
    
    // Listener para webhooks recebidos
    const handleWebhookReceived = (event) => {
      const { predictionId, status, output, error } = event.detail;
      
      setPredictions(prev => ({
        ...prev,
        [predictionId]: {
          ...prev[predictionId],
          status,
          output,
          error,
          updatedAt: new Date().toISOString(),
          webhookReceived: true
        }
      }));
      
      // Notificar conclusão se necessário
      if (status === 'succeeded' && output && onTranscriptionComplete) {
        const transcriptionText = webhookService.extractTranscriptionText(output);
        const details = webhookService.getTranscriptionDetails(output);
        
        onTranscriptionComplete({
          predictionId,
          text: transcriptionText,
          details,
          output
        });
      }
    };
    
    window.addEventListener('replicateWebhookReceived', handleWebhookReceived);
    
    // Polling para verificar status (fallback caso webhook falhe)
    const pollInterval = setInterval(() => {
      checkPendingPredictions();
    }, 10000); // Verificar a cada 10 segundos
    
    return () => {
      window.removeEventListener('replicateWebhookReceived', handleWebhookReceived);
      clearInterval(pollInterval);
    };
  }, [onTranscriptionComplete]);

  /**
   * Carrega predições do localStorage
   */
  const loadPredictions = () => {
    try {
      const stored = replicateService.getPredictions();
      setPredictions(stored);
    } catch (error) {
      console.error('Erro ao carregar predições:', error);
      setError('Erro ao carregar histórico de transcrições');
    }
  };

  /**
   * Verifica status de predições pendentes via API
   */
  const checkPendingPredictions = async () => {
    const pendingPredictions = Object.entries(predictions).filter(
      ([id, prediction]) => 
        ['starting', 'processing'].includes(prediction.status) &&
        !prediction.webhookReceived
    );
    
    if (pendingPredictions.length === 0) return;
    
    setLoading(true);
    
    try {
      for (const [predictionId] of pendingPredictions) {
        const updatedPrediction = await replicateService.getPrediction(predictionId);
        
        if (updatedPrediction) {
          setPredictions(prev => ({
            ...prev,
            [predictionId]: {
              ...prev[predictionId],
              ...updatedPrediction,
              updatedAt: new Date().toISOString()
            }
          }));
          
          // Notificar conclusão se necessário
          if (updatedPrediction.status === 'succeeded' && updatedPrediction.output && onTranscriptionComplete) {
            const transcriptionText = webhookService.extractTranscriptionText(updatedPrediction.output);
            const details = webhookService.getTranscriptionDetails(updatedPrediction.output);
            
            onTranscriptionComplete({
              predictionId,
              text: transcriptionText,
              details,
              output: updatedPrediction.output
            });
          }
        }
      }
    } catch (error) {
      console.error('Erro ao verificar predições:', error);
      setError('Erro ao verificar status das transcrições');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cancela uma predição
   */
  const cancelPrediction = async (predictionId) => {
    try {
      setLoading(true);
      await replicateService.cancelPrediction(predictionId);
      
      setPredictions(prev => ({
        ...prev,
        [predictionId]: {
          ...prev[predictionId],
          status: 'canceled',
          updatedAt: new Date().toISOString()
        }
      }));
    } catch (error) {
      console.error('Erro ao cancelar predição:', error);
      setError('Erro ao cancelar transcrição');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Remove uma predição do histórico
   */
  const removePrediction = (predictionId) => {
    setPredictions(prev => {
      const updated = { ...prev };
      delete updated[predictionId];
      
      // Atualizar localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('replicate_predictions', JSON.stringify(updated));
      }
      
      return updated;
    });
  };

  /**
   * Limpa predições antigas (concluídas há mais de 24h)
   */
  const clearOldPredictions = () => {
    replicateService.cleanupOldPredictions();
    loadPredictions();
  };

  /**
   * Obtém ícone para o status
   */
  const getStatusIcon = (status) => {
    switch (status) {
      case 'starting':
        return '🔄';
      case 'processing':
        return '⚙️';
      case 'succeeded':
        return '✅';
      case 'failed':
        return '❌';
      case 'canceled':
        return '⏹️';
      default:
        return '❓';
    }
  };

  /**
   * Obtém cor para o status
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'starting':
      case 'processing':
        return '#2196F3';
      case 'succeeded':
        return '#4CAF50';
      case 'failed':
        return '#F44336';
      case 'canceled':
        return '#FF9800';
      default:
        return '#757575';
    }
  };

  /**
   * Formata duração
   */
  const formatDuration = (createdAt, updatedAt) => {
    if (!createdAt) return '';
    
    const start = new Date(createdAt);
    const end = updatedAt ? new Date(updatedAt) : new Date();
    const duration = Math.floor((end - start) / 1000);
    
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
  };

  const predictionList = Object.entries(predictions).sort(
    ([, a], [, b]) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  if (predictionList.length === 0) {
    return (
      <div className="transcription-status empty">
        <p>Nenhuma transcrição em andamento</p>
      </div>
    );
  }

  return (
    <div className="transcription-status">
      <div className="status-header">
        <h3>Status das Transcrições</h3>
        <div className="status-actions">
          <button 
            onClick={clearOldPredictions}
            className="btn-secondary"
            title="Limpar transcrições antigas"
          >
            🗑️ Limpar
          </button>
          <button 
            onClick={loadPredictions}
            className="btn-secondary"
            disabled={loading}
            title="Atualizar status"
          >
            {loading ? '🔄' : '↻'} Atualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="predictions-list">
        {predictionList.map(([predictionId, prediction]) => (
          <div key={predictionId} className="prediction-item">
            <div className="prediction-header">
              <span 
                className="status-indicator"
                style={{ color: getStatusColor(prediction.status) }}
              >
                {getStatusIcon(prediction.status)} {webhookService.getStatusMessage(prediction.status)}
              </span>
              <div className="prediction-actions">
                {['starting', 'processing'].includes(prediction.status) && (
                  <button
                    onClick={() => cancelPrediction(predictionId)}
                    className="btn-cancel"
                    disabled={loading}
                    title="Cancelar transcrição"
                  >
                    ⏹️
                  </button>
                )}
                <button
                  onClick={() => removePrediction(predictionId)}
                  className="btn-remove"
                  title="Remover do histórico"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="prediction-details">
              <div className="detail-item">
                <strong>ID:</strong> {predictionId.substring(0, 8)}...
              </div>
              <div className="detail-item">
                <strong>Arquivo:</strong> {prediction.audioUrl ? 
                  prediction.audioUrl.split('/').pop() : 'N/A'
                }
              </div>
              <div className="detail-item">
                <strong>Duração:</strong> {formatDuration(prediction.createdAt, prediction.updatedAt)}
              </div>
              {prediction.webhookReceived && (
                <div className="detail-item">
                  <span className="webhook-badge">📡 Webhook recebido</span>
                </div>
              )}
            </div>
            
            {prediction.error && (
              <div className="prediction-error">
                <strong>Erro:</strong> {prediction.error}
              </div>
            )}
            
            {prediction.output && prediction.status === 'succeeded' && (
              <div className="prediction-output">
                <strong>Resultado:</strong>
                <div className="transcription-preview">
                  {webhookService.extractTranscriptionText(prediction.output).substring(0, 200)}...
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .transcription-status {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 16px;
          margin: 16px 0;
        }
        
        .status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .status-header h3 {
          margin: 0;
          color: #333;
        }
        
        .status-actions {
          display: flex;
          gap: 8px;
        }
        
        .btn-secondary {
          background: #6c757d;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        
        .btn-secondary:hover {
          background: #5a6268;
        }
        
        .btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .predictions-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .prediction-item {
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          padding: 12px;
        }
        
        .prediction-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .status-indicator {
          font-weight: 500;
          font-size: 14px;
        }
        
        .prediction-actions {
          display: flex;
          gap: 4px;
        }
        
        .btn-cancel, .btn-remove {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 3px;
          font-size: 14px;
        }
        
        .btn-cancel:hover {
          background: #fff3cd;
        }
        
        .btn-remove:hover {
          background: #f8d7da;
        }
        
        .prediction-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 8px;
          font-size: 12px;
          color: #6c757d;
        }
        
        .detail-item strong {
          color: #495057;
        }
        
        .webhook-badge {
          background: #d4edda;
          color: #155724;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 11px;
        }
        
        .prediction-error {
          background: #f8d7da;
          color: #721c24;
          padding: 8px;
          border-radius: 4px;
          margin-top: 8px;
          font-size: 12px;
        }
        
        .prediction-output {
          margin-top: 8px;
          font-size: 12px;
        }
        
        .transcription-preview {
          background: #e9ecef;
          padding: 8px;
          border-radius: 4px;
          margin-top: 4px;
          font-style: italic;
          color: #495057;
        }
        
        .empty {
          text-align: center;
          color: #6c757d;
          padding: 32px;
        }
      `}</style>
    </div>
  );
};

export default TranscriptionStatus;