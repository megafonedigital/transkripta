import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  // Removed API Key configuration - now handled via environment variables only
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({
    level: '',
    startDate: '',
    endDate: ''
  });
  const [logsLoading, setLogsLoading] = useState(false);

  // API Key configuration removed - using environment variables only

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
    fetchLogs();
    setLoading(false);
  }, [token, filters]);

  // API Key handling functions removed - using environment variables only

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
        {/* API Key configuration removed - using environment variables only */}
         {/* Logs section - now the main content */}
         {true && (
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;