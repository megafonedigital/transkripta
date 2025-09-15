import React from 'react';
import { useTheme } from '../context/ThemeContext';

const Logo = ({ size = 'md', showText = true }) => {
  const { isDarkMode } = useTheme();
  
  const sizes = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-12',
    xl: 'h-16'
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`${sizes[size]} aspect-square relative`}>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg transform -rotate-6"></div>
        <div className="absolute inset-0 bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center">
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-purple-600 font-bold" style={{ fontSize: size === 'sm' ? '14px' : size === 'md' ? '18px' : size === 'lg' ? '24px' : '32px' }}>
            TK
          </span>
        </div>
      </div>
      {showText && (
        <span className={`font-semibold ${
          size === 'sm' ? 'text-lg' : size === 'md' ? 'text-xl' : size === 'lg' ? 'text-2xl' : 'text-3xl'
        } text-gray-900 dark:text-white`}>
          Transkipta
        </span>
      )}
    </div>
  );
};

export default Logo; 