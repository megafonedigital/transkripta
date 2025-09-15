import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { processVideoUrl, downloadFromUrl, getTunnelDownloadInfo, validateVideoUrl, handleApiError } from '../services/apiService';

const Download = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { token } = useAuth();
  const [quality, setQuality] = useState('best');
  const [format, setFormat] = useState('mp4');
  const [audioOnly, setAudioOnly] = useState(false);

  const handleDownload = async () => {
    if (!url) {
      setError('Por favor, insira a URL do vídeo');
      return;
    }
    
    // Validate URL
    const detectedPlatform = validateVideoUrl(url);
    if (!detectedPlatform) {
      setError('URL inválida ou plataforma não suportada');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Process video URL via webhook
      const videoData = await processVideoUrl(url, {
        format: format,
        quality: quality,
        audioOnly: audioOnly
      });
      
      // Get download info based on new tunnel structure
      const downloadInfo = getTunnelDownloadInfo(videoData);
      
      if (!downloadInfo.downloadUrl) {
        throw new Error(`URL de download não disponível`);
      }
      
      // Use filename from tunnel response or generate one
      let filename = downloadInfo.filename;
      if (audioOnly && !filename.toLowerCase().includes('.mp3')) {
        // If requesting audio only, ensure proper extension
        const baseName = filename.replace(/\.[^/.]+$/, '');
        filename = `${baseName}.mp3`;
      }
      
      // Download file
      await downloadFromUrl(downloadInfo.downloadUrl, filename);
      
      setSuccess('Download concluído com sucesso!');
    } catch (error) {
      console.error('Erro no download:', error);
      setError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const getQualityOptions = () => {
    return [
      { value: 'best', label: 'Melhor qualidade' },
      { value: '1080p', label: '1080p' },
      { value: '720p', label: '720p' },
      { value: '480p', label: '480p' },
      { value: '360p', label: '360p' },
      { value: 'high', label: 'Alta qualidade' },
      { value: 'medium', label: 'Qualidade média' }
    ];
  };

  const getFormatOptions = () => {
    if (audioOnly) return [{ value: 'mp3', label: 'MP3' }];
    return [
      { value: 'mp4', label: 'MP4' },
      { value: 'webm', label: 'WebM' },
      { value: 'mkv', label: 'MKV' }
    ];
  };

  return (
    <div className="p-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow w-full text-gray-900 dark:text-white p-8">
        <h2 className="text-2xl font-bold mb-6">Downloader</h2>
        <form onSubmit={e => { e.preventDefault(); handleDownload(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">URL do Vídeo</label>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-900 dark:text-white px-4 py-3 transition duration-150 ease-in-out"
              placeholder="Cole a URL do vídeo"
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Qualidade</label>
              <select
                value={quality}
                onChange={e => setQuality(e.target.value)}
                className="block w-full rounded-lg border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-900 dark:text-white px-4 py-3"
              >
                {getQualityOptions().map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Formato</label>
              <select
                value={format}
                onChange={e => setFormat(e.target.value)}
                className="block w-full rounded-lg border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-900 dark:text-white px-4 py-3"
              >
                {getFormatOptions().map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <input
              id="audioOnly"
              type="checkbox"
              checked={audioOnly}
              onChange={e => {
                setAudioOnly(e.target.checked);
                if (e.target.checked) setFormat('mp3');
              }}
              className="h-5 w-5 text-indigo-600 border-gray-300 rounded dark:bg-gray-900 dark:border-gray-700 focus:ring-indigo-500"
            />
            <label htmlFor="audioOnly" className="text-sm text-gray-700 dark:text-gray-300">Apenas áudio</label>
          </div>
          {error && <div className="rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-200 px-4 py-2 text-sm">{error}</div>}
          {success && <div className="rounded bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-200 px-4 py-2 text-sm">{success}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
            ) : (
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" /></svg>
            )}
            {loading ? 'Baixando...' : 'Baixar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Download;