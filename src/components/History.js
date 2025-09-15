import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getTranscriptions, deleteTranscription, updateTranscription } from '../services/storageService';
import { 
  DocumentDuplicateIcon, 
  TrashIcon, 
  XMarkIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

const History = () => {
  const [transcriptions, setTranscriptions] = useState([]);
  const [filteredTranscriptions, setFilteredTranscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTranscription, setSelectedTranscription] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const { token } = useAuth();
  const { isDarkMode } = useTheme();
  const [message, setMessage] = useState(null);

  const formatLabels = {
    plain: 'Texto',
    srt: 'SRT',
    vtt: 'VTT',
    all: 'Todos os Formatos'
  };

  const typeLabels = {
    youtube: 'YouTube',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    video: 'Arquivo de Vídeo',
    audio: 'Arquivo de Áudio',
    all: 'Todos os Tipos'
  };

  const formatColors = {
    plain: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    srt: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    vtt: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  };

  useEffect(() => {
    loadTranscriptions();
  }, []);

  useEffect(() => {
    filterTranscriptions();
  }, [searchTerm, selectedFormat, selectedType, transcriptions]);

  const filterTranscriptions = () => {
    let filtered = [...transcriptions];

    // Aplicar filtro de pesquisa
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar filtro de formato
    if (selectedFormat !== 'all') {
      filtered = filtered.filter(t => t.outputFormat === selectedFormat);
    }

    // Aplicar filtro de tipo
    if (selectedType !== 'all') {
      filtered = filtered.filter(t => t.type === selectedType);
    }

    setFilteredTranscriptions(filtered);
  };

  const loadTranscriptions = async () => {
    try {
      const data = getTranscriptions();
      console.log('Loaded transcriptions:', data);
      setTranscriptions(data);
      setFilteredTranscriptions(data);
    } catch (err) {
      console.error('Load error:', err);
      setError('Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja excluir esta transcrição?')) {
      return;
    }

    try {
      deleteTranscription(id);
      
      // Atualiza a lista local removendo o item deletado
      setTranscriptions(prev => prev.filter(t => t.id !== id));
      setFilteredTranscriptions(prev => prev.filter(t => t.id !== id));
      
      // Se o item selecionado foi deletado, limpa a seleção
      if (selectedTranscription?.id === id) {
        setSelectedTranscription(null);
      }
      
      // Mostra mensagem de sucesso
      setMessage({ type: 'success', text: 'Transcrição excluída com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao excluir transcrição' });
      console.error('Error deleting transcription:', err);
    }
  };

  const copyToClipboard = (e, text) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
  };

  const formatContent = (content, format) => {
    console.log('Formatting content with format:', format);
    if (format === 'plain') {
      console.log('Using plain text format');
      return content;
    }
    
    console.log('Processing SRT/VTT format');
    const formattedContent = content.split('\n').map((line, index) => {
      if (line.includes('-->')) {
        return `\n${line}\n`;
      }
      return line;
    }).join('\n');
    
    console.log('Formatted content sample:', formattedContent.substring(0, 500));
    return formattedContent;
  };

  const downloadTranscription = (transcription) => {
    const filename = `${transcription.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${transcription.outputFormat}`;
    let content = transcription.content;
    let extension;

    switch (transcription.outputFormat) {
      case 'srt':
        extension = '.srt';
        break;
      case 'vtt':
        extension = '.vtt';
        break;
      default:
        extension = '.txt';
        content = transcription.content;
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}${extension}`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-4">{error}</div>
    );
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Histórico</h2>
      <div className="flex flex-col md:flex-row gap-4 w-full mb-8">
        {/* Barra de pesquisa */}
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar transcrições..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:text-white px-4 py-2"
            />
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-4">
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:text-white px-4 py-2"
          >
            <option value="all">Todos os Formatos</option>
            <option value="plain">Texto Simples</option>
            <option value="srt">SRT (Legendas)</option>
            <option value="vtt">VTT (Web Video)</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:text-white px-4 py-2"
          >
            <option value="all">Todos os Tipos</option>
            <option value="youtube">YouTube</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="video">Arquivo de Vídeo</option>
            <option value="audio">Arquivo de Áudio</option>
          </select>
        </div>
      </div>

      {filteredTranscriptions.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          {transcriptions.length === 0 
            ? 'Nenhuma transcrição encontrada' 
            : 'Nenhuma transcrição corresponde aos filtros selecionados'}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTranscriptions.map((transcription) => (
            <div
              key={transcription.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer"
              onClick={() => setSelectedTranscription(transcription)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400">
                      {transcription.title}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${formatColors[transcription.outputFormat]}`}>
                      {formatLabels[transcription.outputFormat]}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                      {typeLabels[transcription.type]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(transcription.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadTranscription(transcription);
                    }}
                    className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                    title="Baixar transcrição"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={(e) => copyToClipboard(e, transcription.content)}
                    className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                    title="Copiar conteúdo"
                  >
                    <DocumentDuplicateIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(transcription.id, e)}
                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    title="Excluir transcrição"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTranscription && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedTranscription(null)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white flex items-center">
                    {selectedTranscription.title}
                  </h3>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${formatColors[selectedTranscription.outputFormat]}`}>
                      {formatLabels[selectedTranscription.outputFormat]}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                      {typeLabels[selectedTranscription.type]}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => downloadTranscription(selectedTranscription)}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 dark:text-indigo-200 bg-indigo-100 dark:bg-indigo-900 hover:bg-indigo-200 dark:hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Baixar
                  </button>
                  <button
                    onClick={() => copyToClipboard(null, selectedTranscription.content)}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 dark:text-indigo-200 bg-indigo-100 dark:bg-indigo-900 hover:bg-indigo-200 dark:hover:bg-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                    Copiar
                  </button>
                  <button
                    onClick={() => setSelectedTranscription(null)}
                    className="inline-flex items-center px-2 py-1 border border-transparent text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="prose prose-indigo max-w-none dark:prose-invert overflow-y-auto bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4" style={{ maxHeight: 'calc(80vh - 200px)' }}>
                <pre className="whitespace-pre-wrap text-gray-900 dark:text-gray-100 text-sm">{selectedTranscription.content}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;