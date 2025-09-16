import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { HomeIcon, DocumentTextIcon, ArrowLeftOnRectangleIcon, SunIcon, MoonIcon, ChartBarIcon, Cog6ToothIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import NewTranscription from '../components/NewTranscription';
import History from '../components/History';
import Metrics from '../components/Metrics';
import Settings from '../components/Settings';
import Download from '../components/Download';

const Dashboard = () => {
  const { logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('metrics');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 shadow-lg flex-shrink-0">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 bg-indigo-600 dark:bg-indigo-700 px-4">
            <h1 className="text-white text-xl font-bold">Transkipta</h1>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors duration-200"
              title={isDarkMode ? "Modo Claro" : "Modo Escuro"}
            >
              {isDarkMode ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-md w-full transition-colors duration-200 ${
                activeTab === 'metrics'
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <ChartBarIcon className="mr-3 h-5 w-5" />
              Métricas
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-md w-full transition-colors duration-200 ${
                activeTab === 'new'
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <HomeIcon className="mr-3 h-5 w-5" />
              Nova Transcrição
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-md w-full transition-colors duration-200 ${
                activeTab === 'history'
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <DocumentTextIcon className="mr-3 h-5 w-5" />
              Histórico
            </button>
            <button
              onClick={() => setActiveTab('download')}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-md w-full transition-colors duration-200 ${
                activeTab === 'download'
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <GlobeAltIcon className="mr-3 h-5 w-5" />
              Social Downloader
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-md w-full transition-colors duration-200 ${
                activeTab === 'settings'
                  ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Cog6ToothIcon className="mr-3 h-5 w-5" />
              Configurações
            </button>
          </nav>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md w-full transition-colors duration-200"
            >
              <ArrowLeftOnRectangleIcon className="mr-3 h-5 w-5" />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {activeTab === 'new' && <NewTranscription />}
          {activeTab === 'history' && <History />}
          {activeTab === 'metrics' && <Metrics />}
          {activeTab === 'settings' && <Settings />}
          {activeTab === 'download' && <Download />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;