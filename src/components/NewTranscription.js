import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { processVideoUrl, downloadFromUrl, validateVideoUrl, convertToAudio, processTunnelUrl, handleApiError } from '../services/apiService';
import replicateService from '../services/replicateService';
import config from '../config/env';
import { saveTranscription, updateMetrics, addLog } from '../services/storageService';
import { 
  DocumentDuplicateIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const sourceTypes = [
  { 
    id: 'social', 
    name: 'Redes Sociais',
    icon: (
      <div className="flex space-x-1">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
        </svg>
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
      </div>
    ),
    placeholder: 'Cole o link do vídeo (YouTube, Instagram ou TikTok)',
    color: 'text-indigo-600 dark:text-indigo-500',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
    borderColor: 'border-indigo-200 dark:border-indigo-800'
  },
  { 
    id: 'file', 
    name: 'Arquivo',
    icon: <DocumentDuplicateIcon className="w-8 h-8" />,
    placeholder: 'Selecione um arquivo de vídeo ou áudio',
    color: 'text-green-600 dark:text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800'
  }
];

const NewTranscription = () => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState('social');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [outputFormat, setOutputFormat] = useState('plain');
  const [transcriptionService, setTranscriptionService] = useState('replicate');
  const { token } = useAuth();
  const { isDarkMode } = useTheme();

  const updateProgressStatus = (type, stage) => {
    const progressStages = {
      social: {
        start: { progress: 0, status: 'Preparando...' },
        download: { progress: 20, status: 'Baixando vídeo das redes sociais...' },
        convert: { progress: 50, status: 'Convertendo vídeo para áudio...' },
        transcribe: { progress: 70, status: 'Transcrevendo áudio...' },
        complete: { progress: 100, status: 'Concluído!' }
      },
      video: {
        start: { progress: 0, status: 'Preparando...' },
        upload: { progress: 20, status: 'Enviando vídeo...' },
        convert: { progress: 50, status: 'Convertendo vídeo para áudio...' },
        transcribe: { progress: 70, status: 'Transcrevendo áudio...' },
        complete: { progress: 100, status: 'Concluído!' }
      },
      audio: {
        start: { progress: 0, status: 'Preparando...' },
        upload: { progress: 20, status: 'Enviando áudio...' },
        transcribe: { progress: 50, status: 'Transcrevendo áudio...' },
        complete: { progress: 100, status: 'Concluído!' }
      }
    };

    // Verificação de segurança para evitar erros de runtime
    if (!progressStages[type]) {
      console.warn(`Tipo de progresso não encontrado: ${type}. Usando configuração padrão.`);
      setProgress(0);
      setStatus('Preparando...');
      return;
    }

    if (!progressStages[type][stage]) {
      console.warn(`Estágio de progresso não encontrado: ${stage} para tipo ${type}. Usando configuração padrão.`);
      setProgress(0);
      setStatus('Processando...');
      return;
    }

    const stageInfo = progressStages[type][stage];
     setProgress(stageInfo.progress);
     setStatus(stageInfo.status);
   };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    
    console.log('Submitting form with outputFormat:', outputFormat);
    updateProgressStatus(type, 'start');

    try {
      let audioFile;
      let videoBlob;
      const startTime = Date.now();

      // Step 1: Get audio file
      if (type === 'social') {
        // Validate URL
        const platform = validateVideoUrl(url);
        if (!platform) {
          throw new Error('URL inválida ou plataforma não suportada');
        }

        updateProgressStatus(type, 'download');
        
        // Process video URL via webhook
        const videoData = await processVideoUrl(url, { audioOnly: true });
        
        updateProgressStatus(type, 'convert');
        
        // Process tunnel URL or download audio file from webhook response
        if (videoData.status === 'tunnel' && videoData.tunnelUrl) {
          // Use tunnel URL directly for transcription
          const audioBlob = await processTunnelUrl(videoData.tunnelUrl);
          audioFile = new File([audioBlob], videoData.filename || `audio_${Date.now()}.mp3`, { type: 'audio/mpeg' });
        } else if (videoData.audioUrl) {
          // Fallback para estrutura antiga
          const audioBlob = await downloadFromUrl(videoData.audioUrl);
          audioFile = new File([audioBlob], `audio_${Date.now()}.mp3`, { type: 'audio/mpeg' });
        } else {
          throw new Error('URL de áudio não disponível');
        }
        
      } else if (type === 'file') {
        updateProgressStatus(type, 'upload');
        
        // Check if file is video or audio and process accordingly
        const fileType = file.type;
        if (fileType.startsWith('video/')) {
          // Convert video file to audio
          updateProgressStatus(type, 'convert');
          audioFile = await convertToAudio(file);
        } else if (fileType.startsWith('audio/')) {
          // Use audio file directly
          audioFile = file;
        } else {
          throw new Error('Tipo de arquivo não suportado. Use apenas arquivos de vídeo ou áudio.');
        }
      }

      // Step 2: Transcribe audio
      updateProgressStatus(type, 'transcribe');
      
      // Use Replicate Whisper for all transcriptions
      if (!replicateService.isConfigured()) {
        throw new Error('Serviço Replicate não configurado. Verifique as variáveis de ambiente.');
      }
      
      // Upload audio file to a temporary URL (you'll need to implement this)
      // For now, we'll assume the audio is already accessible via URL
      let audioUrl;
      
      if (type === 'social' && (videoData.status === 'tunnel' && videoData.tunnelUrl)) {
        // Use tunnel URL directly
        audioUrl = videoData.tunnelUrl;
      } else if (type === 'social' && videoData.audioUrl) {
        // Use webhook audio URL
        audioUrl = videoData.audioUrl;
      } else {
        // For file uploads, we need to upload to a temporary service
        // This is a placeholder - you'll need to implement file upload
        throw new Error('Upload de arquivos locais para Replicate ainda não implementado. Use URLs de redes sociais.');
      }
      
      const replicateOptions = {
        language: 'pt',
        translate: false,
        transcription: outputFormat === 'plain' ? 'plain text' : outputFormat
      };
      
      // Create async transcription
      const prediction = await replicateService.createTranscription(audioUrl, replicateOptions);
      
      // For async processing, we'll return a different result
      const transcriptionResult = {
        text: 'Transcrição iniciada com sucesso! O processamento está sendo feito de forma assíncrona.',
        predictionId: prediction.id,
        status: 'processing',
        isAsync: true,
        language: 'pt'
      };
      
      // Step 3: Save transcription
      const duration = Math.round((Date.now() - startTime) / 1000);
      
      const transcriptionData = {
        title: title,
        content: transcriptionResult.text,
        type: type,
        platform: type === 'youtube' || type === 'instagram' || type === 'tiktok' ? type : 'file',
        url: url || null,
        fileName: file?.name || null,
        outputFormat: outputFormat,
        duration: duration,
        language: transcriptionResult.language || 'pt',
        wordCount: transcriptionResult.isAsync ? 0 : transcriptionResult.text.split(' ').length,
        status: transcriptionResult.isAsync ? 'processing' : 'completed',
        predictionId: transcriptionResult.predictionId || null,
        service: 'replicate'
      };

      const savedTranscription = saveTranscription(transcriptionData);
      
      // Update metrics
      updateMetrics({
        type: 'transcription',
        duration: duration
      });
      
      // Add log
      addLog({
        level: 'info',
        message: `Transcrição criada: ${title}`,
        details: {
          transcriptionId: savedTranscription.id,
          type: type,
          duration: duration
        }
      });

      updateProgressStatus(type, 'complete');
      
      setResult({
        ...savedTranscription,
        content: transcriptionResult.text
      });
      
      console.log('Transcription completed:', savedTranscription);
      
      // Reset form
      setUrl('');
      setTitle('');
      setFile(null);
      
    } catch (err) {
      console.error('Error:', err);
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      
      // Log error
      addLog({
        level: 'error',
        message: 'Erro na transcrição',
        details: {
          error: err.message,
          type: type,
          title: title
        }
      });
      
      // Update error metrics
      updateMetrics({
        type: 'error'
      });
      
    } finally {
      setLoading(false);
      setTimeout(() => {
        setProgress(0);
        setStatus('');
      }, 2000);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result.content);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleTypeChange = (e) => {
    setType(e.target.value);
    setFile(null);
    setUrl('');
  };

  return (
    <div className="p-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden w-full">
        <div className="p-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Nova Transcrição</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Transforme áudio em texto com facilidade. Suporte para vídeos do YouTube, Instagram, TikTok e arquivos locais.
          </p>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Título e Formato de Saída */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
              <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Título da Transcrição
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:text-white px-4 py-3 transition duration-150 ease-in-out"
                  placeholder="Digite um título para a transcrição"
                  required
                />
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl">
                <label htmlFor="outputFormat" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Formato de Saída
                </label>
                <select
                  id="outputFormat"
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                  className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:text-white px-4 py-3 transition duration-150 ease-in-out"
                >
                  <option value="plain">Texto Simples</option>
                  <option value="srt">SRT (Legendas)</option>
                  <option value="vtt">VTT (Web Video Text Tracks)</option>
                </select>
              </div>

            </div>
            {/* Tipo de Conteúdo em linha */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Tipo de Conteúdo
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {sourceTypes.map((source) => (
                  <button
                    key={source.id}
                    type="button"
                    onClick={() => {
                      setType(source.id);
                      setFile(null);
                      setUrl('');
                    }}
                    className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                      type === source.id 
                        ? `${source.borderColor} ${source.color} ${source.bgColor} shadow-md`
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className={`${type === source.id ? source.color : 'text-gray-400 dark:text-gray-500'}`}>{source.icon}</div>
                    <span className={`mt-2 text-sm font-medium ${type === source.id ? source.color : 'text-gray-900 dark:text-white'}`}>{source.name}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* URL ou Upload de Arquivo ocupando toda a largura */}
            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl">
              {(type === 'social') ? (
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL ou Link
                  </label>
                  <input
                    type="text"
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:text-white px-4 py-3 transition duration-150 ease-in-out"
                    placeholder={sourceTypes.find(s => s.id === type)?.placeholder}
                    required
                  />
                </div>
              ) : (
                <div>
                  <label htmlFor="file" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Selecione um arquivo de vídeo ou áudio
                  </label>
                  <input
                    type="file"
                    id="file"
                    onChange={handleFileChange}
                    accept="video/*,audio/*"
                    className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400
                      file:mr-4 file:py-3 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-indigo-50 file:text-indigo-700
                      hover:file:bg-indigo-100
                      dark:file:bg-indigo-900 dark:file:text-indigo-200
                      dark:hover:file:bg-indigo-800
                      transition duration-150 ease-in-out"
                    required
                  />
                </div>
              )}
            </div>
            {/* Botão de enviar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" />
                  Processando...
                </>
              ) : (
                'Transcrever'
              )}
            </button>
            {/* Status/Progresso */}
            {error && (
              <div className="flex items-center space-x-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-4 rounded-xl">
                <XCircleIcon className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}
            {loading && (
              <div className="space-y-4 bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-indigo-700 dark:text-indigo-200">{status}</span>
                  <span className="text-sm font-medium text-indigo-700 dark:text-indigo-200">{progress}%</span>
                </div>
                <div className="w-full bg-indigo-200 dark:bg-indigo-700 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-in-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
            {/* Resultado */}
            {result && (
              <div className="mt-8 bg-white dark:bg-gray-900/50 shadow-lg rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white flex items-center">
                      <CheckCircleIcon className="h-6 w-6 text-green-500 mr-2" />
                      {result.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Transcrição concluída com sucesso
                    </p>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-indigo-700 dark:text-indigo-200 bg-indigo-100 dark:bg-indigo-900 hover:bg-indigo-200 dark:hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                    Copiar
                  </button>
                </div>
                <div className="prose prose-indigo max-w-none max-h-96 overflow-y-auto dark:prose-invert bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-gray-900 dark:text-gray-100 text-sm">{result.content}</pre>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewTranscription;