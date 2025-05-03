import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState({
    hasCustomKey: false,
    hasSystemKey: false,
    isUsingCustomKey: false,
    useCustomKey: false,
    message: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    level: '',
    startDate: '',
    endDate: ''
  });
  const [logsLoading, setLogsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const fetchApiKeyStatus = async () => {
    try {
      const response = await axios.get('http://localhost:3000/settings/api-key', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKeyStatus(response.data);
      if (response.data.hasCustomKey) {
        setApiKey('••••••••••••••••••••••');
      }
      setLoading(false);
    } catch (err) {
      setError('Erro ao carregar configurações');
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      setError(null);
      const params = { ...filters, limit: 100 };
      const response = await axios.get('http://localhost:3000/logs', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setLogs(response.data);
    } catch (err) {
      setError('Erro ao carregar logs');
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeyStatus();
    fetchLogs();
  }, [token, filters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await axios.put('http://localhost:3000/settings/api-key', 
        { apiKey, useCustomKey: keyStatus.useCustomKey },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Configurações salvas com sucesso!');
      fetchApiKeyStatus();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCustomKey = () => {
    setKeyStatus(prev => ({ ...prev, useCustomKey: !prev.useCustomKey }));
  };

  const handleDeleteLogs = async () => {
    if (!window.confirm('Tem certeza que deseja excluir os logs?')) return;
    try {
      setLoading(true);
      await axios.delete('http://localhost:3000/logs', {
        headers: { Authorization: `Bearer ${token}` },
        params: { startDate: filters.startDate, endDate: filters.endDate }
      });
      await fetchLogs();
    } catch (err) {
      setError('Erro ao excluir logs');
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'error': return 'text-red-500 dark:text-red-400';
      case 'warning': return 'text-yellow-500 dark:text-yellow-400';
      default: return 'text-green-500 dark:text-green-400';
    }
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Data inválida';
      return date.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    } catch {
      return 'Erro ao formatar data';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow w-full text-gray-900 dark:text-white p-8">
        <h2 className="text-2xl font-bold mb-6">Configurações</h2>
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            className={`px-4 py-2 text-sm font-medium focus:outline-none transition-colors duration-200 ${activeTab === 0 ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300'}`}
            onClick={() => setActiveTab(0)}
          >API Key</button>
          <button
            className={`ml-4 px-4 py-2 text-sm font-medium focus:outline-none transition-colors duration-200 ${activeTab === 1 ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300'}`}
            onClick={() => setActiveTab(1)}
          >Logs</button>
        </div>
        {activeTab === 0 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Chave da API</label>
              <div className="relative flex items-center">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  className="block w-full rounded-lg border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-900 dark:text-white px-4 py-3 pr-12"
                  placeholder="Cole sua chave da API"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 text-gray-500 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-300"
                  tabIndex={-1}
                >
                  {showKey ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm2.121-2.121A9.969 9.969 0 0122 12c0 5.523-4.477 10-10 10S2 17.523 2 12c0-2.21.72-4.25 1.938-5.879" /></svg>
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                id="useCustomKey"
                type="checkbox"
                checked={keyStatus.useCustomKey}
                onChange={handleToggleCustomKey}
                className="h-5 w-5 text-indigo-600 border-gray-300 rounded dark:bg-gray-900 dark:border-gray-700 focus:ring-indigo-500"
              />
              <label htmlFor="useCustomKey" className="text-sm text-gray-700 dark:text-gray-300">Usar chave personalizada</label>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full flex justify-center items-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
            >
              {saving ? (
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
              ) : (
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              )}
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
            {error && <div className="rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-200 px-4 py-2 text-sm">{error}</div>}
            {success && <div className="rounded bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-200 px-4 py-2 text-sm">{success}</div>}
          </form>
        )}
        {activeTab === 1 && (
          <div>
            <h3 className="text-lg font-medium mb-4">Logs do Sistema</h3>
            <form className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Nível</label>
                <select
                  value={filters.level}
                  onChange={e => setFilters({ ...filters, level: e.target.value })}
                  className="block w-full rounded-lg border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-900 dark:text-white px-4 py-3"
                >
                  <option value="">Todos</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Data Inicial</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                  className="block w-full rounded-lg border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-900 dark:text-white px-4 py-3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Data Final</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                  className="block w-full rounded-lg border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-900 dark:text-white px-4 py-3"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleDeleteLogs}
                  className="w-full flex justify-center items-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  Limpar Logs
                </button>
              </div>
            </form>
            <div className="overflow-x-auto rounded-lg shadow">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                <thead className="bg-gray-100 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Data</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nível</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mensagem</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatDate(log.timestamp)}</td>
                      <td className={`px-4 py-2 whitespace-nowrap text-sm ${getLevelColor(log.level)}`}>{log.level}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">{log.message}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">{JSON.stringify(log.details)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {error && <div className="rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-200 px-4 py-2 text-sm mt-4">{error}</div>}
            {success && <div className="rounded bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-200 px-4 py-2 text-sm mt-4">{success}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings; 