import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMetrics, getTranscriptions } from '../services/storageService';
import { 
  ClockIcon, 
  DocumentTextIcon,
  CurrencyDollarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Metrics = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState({
    totalTranscriptions: 0,
    totalDuration: 0,
    totalCostUsd: 0,
    totalCostBrl: 0,
    typeDistribution: {},
    dailyStats: [],
    monthlyStats: []
  });

  const [timeRange, setTimeRange] = useState('daily');

  useEffect(() => {
    loadMetrics();
  }, [timeRange]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      
      // Get metrics from storage
      const metricsData = getMetrics();
      const transcriptions = getTranscriptions();
      
      // Calculate metrics from transcriptions
      const calculatedMetrics = calculateMetricsFromData(transcriptions, metricsData);
      
      setMetrics(calculatedMetrics);
    } catch (err) {
      console.error('Error loading metrics:', err);
      setError('Erro ao carregar métricas');
    } finally {
      setLoading(false);
    }
  };
  
  const calculateMetricsFromData = (transcriptions, metricsData) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Filter recent transcriptions
    const recentTranscriptions = transcriptions.filter(t => 
      new Date(t.createdAt) >= thirtyDaysAgo
    );
    
    // Calculate totals
    const totalTranscriptions = transcriptions.length;
    const totalDuration = transcriptions.reduce((sum, t) => sum + (t.duration || 0), 0);
    const totalWords = transcriptions.reduce((sum, t) => sum + (t.wordCount || 0), 0);
    
    // Estimate costs (approximate values)
    const costPerMinute = 0.0023; // Replicate Whisper pricing
    const totalCostUsd = (totalDuration / 60) * costPerMinute;
    const totalCostBrl = totalCostUsd * 5.2; // Approximate USD to BRL
    
    // Type distribution
    const typeDistribution = transcriptions.reduce((acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1;
      return acc;
    }, {});
    
    // Daily stats for the last 30 days
    const dailyStats = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayTranscriptions = transcriptions.filter(t => 
        t.createdAt.split('T')[0] === dateStr
      );
      
      dailyStats.push({
        date: dateStr,
        transcriptions: dayTranscriptions.length,
        duration: dayTranscriptions.reduce((sum, t) => sum + (t.duration || 0), 0),
        cost: (dayTranscriptions.reduce((sum, t) => sum + (t.duration || 0), 0) / 60) * costPerMinute
      });
    }
    
    // Monthly stats for the last 12 months
    const monthlyStats = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const monthTranscriptions = transcriptions.filter(t => 
        t.createdAt.substring(0, 7) === monthStr
      );
      
      monthlyStats.push({
        month: monthStr,
        transcriptions: monthTranscriptions.length,
        duration: monthTranscriptions.reduce((sum, t) => sum + (t.duration || 0), 0),
        cost: (monthTranscriptions.reduce((sum, t) => sum + (t.duration || 0), 0) / 60) * costPerMinute
      });
    }
    
    return {
      totalTranscriptions,
      totalDuration,
      totalCostUsd,
      totalCostBrl,
      totalWords,
      typeDistribution,
      dailyStats,
      monthlyStats
    };
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatCurrency = (value, currency = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(value);
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: timeRange === 'daily' ? 'Uso Diário' : 'Uso Mensal'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const prepareChartData = () => {
    const stats = timeRange === 'daily' ? metrics.dailyStats : metrics.monthlyStats;
    const labels = stats.map(stat => stat.date);
    
    return {
      labels,
      datasets: [
        {
          label: 'Duração (minutos)',
          data: stats.map(stat => Math.round(stat.duration / 60)), // Convert seconds to minutes
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Custo (R$)',
          data: stats.map(stat => stat.costBrl),
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-4">{error}</div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Métricas de Uso</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeRange('daily')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === 'daily'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
            }`}
          >
            Diário
          </button>
          <button
            onClick={() => setTimeRange('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === 'monthly'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
            }`}
          >
            Mensal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-indigo-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total de Transcrições</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {metrics.totalTranscriptions}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tempo Total</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatDuration(metrics.totalDuration)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Custo Total (USD)</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatCurrency(metrics.totalCostUsd || 0, 'USD')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Custo Total (BRL)</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {formatCurrency(metrics.totalCostBrl || 0, 'BRL')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Histórico de Uso</h3>
        <div className="h-80">
          <Line options={chartOptions} data={prepareChartData()} />
        </div>
      </div>

      {Object.keys(metrics.typeDistribution).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Distribuição por Tipo</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(metrics.typeDistribution).map(([type, count]) => (
              <div key={type} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">{type}</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Metrics;