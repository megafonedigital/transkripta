import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth) * 100;
      const y = (clientY / window.innerHeight) * 100;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (error) {
      setError(error.message || 'Credenciais inválidas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div 
        className="absolute inset-0 transition-all duration-300 ease-in-out"
        style={{
          background: isDarkMode
            ? `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgb(79, 70, 229) 0%, rgb(17, 24, 39) 50%, rgb(17, 24, 39) 100%)`
            : `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, rgb(99, 102, 241) 0%, rgb(244, 244, 245) 50%, rgb(244, 244, 245) 100%)`,
        }}
      >
        {/* Animated Shapes */}
        <div className="absolute inset-0">
          <div className="absolute w-96 h-96 -left-12 -top-12 bg-indigo-500/30 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute w-96 h-96 -right-12 -top-12 bg-blue-500/30 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute w-96 h-96 -bottom-12 left-1/2 transform -translate-x-1/2 bg-purple-500/30 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Login Form */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
              Transkipta
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Faça login para começar a transcrever
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-4 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:focus:ring-indigo-400 transition-colors duration-200"
                placeholder="Nome de usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none relative block w-full px-3 py-4 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:focus:ring-indigo-400 transition-colors duration-200"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-100 dark:bg-red-900/50 rounded-lg py-2">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login; 