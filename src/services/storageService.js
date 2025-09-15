// Local Storage Service for Transcriptions, History, and Metrics

// Storage keys
const STORAGE_KEYS = {
  TRANSCRIPTIONS: 'transkipta_transcriptions',
  HISTORY: 'transkipta_history',
  METRICS: 'transkipta_metrics',
  SETTINGS: 'transkipta_settings',
  LOGS: 'transkipta_logs'
};

// Utility functions
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

// Transcription Management
export const saveTranscription = (transcriptionData) => {
  try {
    const transcriptions = getTranscriptions();
    const newTranscription = {
      id: generateId(),
      ...transcriptionData,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp()
    };
    
    transcriptions.push(newTranscription);
    localStorage.setItem(STORAGE_KEYS.TRANSCRIPTIONS, JSON.stringify(transcriptions));
    
    // Also save to history
    addToHistory({
      type: 'transcription',
      action: 'created',
      transcriptionId: newTranscription.id,
      title: transcriptionData.title || 'Nova Transcrição',
      platform: transcriptionData.platform,
      duration: transcriptionData.duration
    });
    
    return newTranscription;
  } catch (error) {
    console.error('Erro ao salvar transcrição:', error);
    throw new Error('Falha ao salvar transcrição');
  }
};

export const getTranscriptions = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TRANSCRIPTIONS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Erro ao carregar transcrições:', error);
    return [];
  }
};

export const getTranscriptionById = (id) => {
  const transcriptions = getTranscriptions();
  return transcriptions.find(t => t.id === id) || null;
};

export const updateTranscription = (id, updateData) => {
  try {
    const transcriptions = getTranscriptions();
    const index = transcriptions.findIndex(t => t.id === id);
    
    if (index === -1) {
      throw new Error('Transcrição não encontrada');
    }
    
    transcriptions[index] = {
      ...transcriptions[index],
      ...updateData,
      updatedAt: getCurrentTimestamp()
    };
    
    localStorage.setItem(STORAGE_KEYS.TRANSCRIPTIONS, JSON.stringify(transcriptions));
    
    addToHistory({
      type: 'transcription',
      action: 'updated',
      transcriptionId: id,
      title: transcriptions[index].title || 'Transcrição Atualizada'
    });
    
    return transcriptions[index];
  } catch (error) {
    console.error('Erro ao atualizar transcrição:', error);
    throw error;
  }
};

export const deleteTranscription = (id) => {
  try {
    const transcriptions = getTranscriptions();
    const index = transcriptions.findIndex(t => t.id === id);
    
    if (index === -1) {
      throw new Error('Transcrição não encontrada');
    }
    
    const deleted = transcriptions.splice(index, 1)[0];
    localStorage.setItem(STORAGE_KEYS.TRANSCRIPTIONS, JSON.stringify(transcriptions));
    
    addToHistory({
      type: 'transcription',
      action: 'deleted',
      transcriptionId: id,
      title: deleted.title || 'Transcrição Deletada'
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao deletar transcrição:', error);
    throw error;
  }
};

// History Management
export const addToHistory = (historyItem) => {
  try {
    const history = getHistory();
    const newItem = {
      id: generateId(),
      ...historyItem,
      timestamp: getCurrentTimestamp()
    };
    
    history.unshift(newItem); // Add to beginning
    
    // Keep only last 1000 items
    if (history.length > 1000) {
      history.splice(1000);
    }
    
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    return newItem;
  } catch (error) {
    console.error('Erro ao adicionar ao histórico:', error);
  }
};

export const getHistory = (limit = null) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
    const history = stored ? JSON.parse(stored) : [];
    
    return limit ? history.slice(0, limit) : history;
  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
    return [];
  }
};

export const clearHistory = () => {
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
    return true;
  } catch (error) {
    console.error('Erro ao limpar histórico:', error);
    throw new Error('Falha ao limpar histórico');
  }
};

// Metrics Management
export const updateMetrics = (metricData) => {
  try {
    const metrics = getMetrics();
    const today = new Date().toISOString().split('T')[0];
    
    // Update daily metrics
    if (!metrics.daily[today]) {
      metrics.daily[today] = {
        transcriptions: 0,
        duration: 0,
        apiCalls: 0,
        errors: 0
      };
    }
    
    // Update metrics based on type
    switch (metricData.type) {
      case 'transcription':
        metrics.daily[today].transcriptions += 1;
        metrics.daily[today].duration += metricData.duration || 0;
        metrics.total.transcriptions += 1;
        metrics.total.duration += metricData.duration || 0;
        break;
      case 'api_call':
        metrics.daily[today].apiCalls += 1;
        metrics.total.apiCalls += 1;
        break;
      case 'error':
        metrics.daily[today].errors += 1;
        metrics.total.errors += 1;
        break;
    }
    
    metrics.lastUpdated = getCurrentTimestamp();
    localStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(metrics));
    
    return metrics;
  } catch (error) {
    console.error('Erro ao atualizar métricas:', error);
  }
};

export const getMetrics = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.METRICS);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Initialize default metrics
    const defaultMetrics = {
      total: {
        transcriptions: 0,
        duration: 0,
        apiCalls: 0,
        errors: 0
      },
      daily: {},
      lastUpdated: getCurrentTimestamp()
    };
    
    localStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(defaultMetrics));
    return defaultMetrics;
  } catch (error) {
    console.error('Erro ao carregar métricas:', error);
    return {
      total: { transcriptions: 0, duration: 0, apiCalls: 0, errors: 0 },
      daily: {},
      lastUpdated: getCurrentTimestamp()
    };
  }
};

// Settings Management
export const saveSettings = (settings) => {
  try {
    const currentSettings = getSettings();
    const updatedSettings = {
      ...currentSettings,
      ...settings,
      updatedAt: getCurrentTimestamp()
    };
    
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
    return updatedSettings;
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    throw new Error('Falha ao salvar configurações');
  }
};

export const getSettings = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Default settings
    const defaultSettings = {
      theme: 'light',
      language: 'pt-BR',
      autoSave: true,
      notifications: true,
      apiKeys: {
        openai: ''
        // rapidapi removido conforme solicitado
      },
      transcriptionSettings: {
        model: 'whisper-1',
        language: 'auto',
        prompt: ''
      },
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp()
    };
    
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));
    return defaultSettings;
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);
    return {};
  }
};

// Logs Management
export const addLog = (logData) => {
  try {
    const logs = getLogs();
    const newLog = {
      id: generateId(),
      ...logData,
      timestamp: getCurrentTimestamp()
    };
    
    logs.unshift(newLog);
    
    // Keep only last 500 logs
    if (logs.length > 500) {
      logs.splice(500);
    }
    
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
    return newLog;
  } catch (error) {
    console.error('Erro ao adicionar log:', error);
  }
};

export const getLogs = (level = null, limit = null) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LOGS);
    let logs = stored ? JSON.parse(stored) : [];
    
    if (level) {
      logs = logs.filter(log => log.level === level);
    }
    
    return limit ? logs.slice(0, limit) : logs;
  } catch (error) {
    console.error('Erro ao carregar logs:', error);
    return [];
  }
};

export const clearLogs = () => {
  try {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([]));
    return true;
  } catch (error) {
    console.error('Erro ao limpar logs:', error);
    throw new Error('Falha ao limpar logs');
  }
};

// Data Export/Import
export const exportData = () => {
  try {
    const data = {
      transcriptions: getTranscriptions(),
      history: getHistory(),
      metrics: getMetrics(),
      settings: getSettings(),
      logs: getLogs(),
      exportedAt: getCurrentTimestamp()
    };
    
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    throw new Error('Falha ao exportar dados');
  }
};

export const importData = (jsonData) => {
  try {
    const data = JSON.parse(jsonData);
    
    if (data.transcriptions) {
      localStorage.setItem(STORAGE_KEYS.TRANSCRIPTIONS, JSON.stringify(data.transcriptions));
    }
    
    if (data.history) {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(data.history));
    }
    
    if (data.metrics) {
      localStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(data.metrics));
    }
    
    if (data.settings) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
    }
    
    if (data.logs) {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(data.logs));
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao importar dados:', error);
    throw new Error('Falha ao importar dados');
  }
};

// Storage cleanup
export const clearAllData = () => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.error('Erro ao limpar dados:', error);
    throw new Error('Falha ao limpar dados');
  }
};