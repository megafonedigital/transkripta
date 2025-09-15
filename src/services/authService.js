import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';
import config from '../config/env';

// Local Authentication Service
const JWT_SECRET = config.auth.jwtSecret;
const SESSION_TIMEOUT = config.auth.sessionTimeout;

// Simple JWT-like token generation (for demo purposes)
const generateToken = (userData) => {
  const payload = {
    ...userData,
    exp: Date.now() + SESSION_TIMEOUT,
    iat: Date.now()
  };
  
  // In a real app, you'd use a proper JWT library
  return btoa(JSON.stringify(payload));
};

const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token));
  } catch (error) {
    return null;
  }
};

// Default users (in a real app, this would be handled by a proper auth service)
const DEFAULT_USERS = [
  {
    id: 1,
    username: process.env.REACT_APP_ADMIN_USERNAME || 'admin',
    email: process.env.REACT_APP_ADMIN_EMAIL || 'admin@transkipta.com',
    password: process.env.REACT_APP_ADMIN_PASSWORD || 'admin123', // In production, this would be hashed
    role: 'admin'
  },
  {
    id: 2,
    username: process.env.REACT_APP_USER_USERNAME || 'user',
    email: process.env.REACT_APP_USER_EMAIL || 'user@transkipta.com',
    password: process.env.REACT_APP_USER_PASSWORD || 'user123',
    role: 'user'
  }
];

// Storage keys
const STORAGE_KEYS = {
  TOKEN: 'transkipta_token',
  USER: 'transkipta_user',
  USERS: 'transkipta_users'
};

// Initialize default users if not exists
const initializeUsers = () => {
  const existingUsers = localStorage.getItem(STORAGE_KEYS.USERS);
  if (!existingUsers) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
  }
};

// Authentication functions
export const login = async (username, password) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        initializeUsers();
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        
        const user = users.find(u => 
          (u.username === username || u.email === username) && u.password === password
        );
        
        if (user) {
          const token = generateToken({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          });
          
          const userData = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          };
          
          localStorage.setItem(STORAGE_KEYS.TOKEN, token);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
          
          resolve({ token, user: userData });
        } else {
          reject(new Error('Credenciais inválidas'));
        }
      } catch (error) {
        reject(new Error('Erro interno de autenticação'));
      }
    }, 500); // Simulate network delay
  });
};

export const logout = () => {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
};

export const getCurrentUser = () => {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    
    if (!token || !userStr) {
      return null;
    }
    
    const tokenData = decodeToken(token);
    if (!tokenData || tokenData.exp < Date.now()) {
      // Token expired
      logout();
      return null;
    }
    
    return JSON.parse(userStr);
  } catch (error) {
    logout();
    return null;
  }
};

export const getToken = () => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  if (!token) return null;
  
  const tokenData = decodeToken(token);
  if (!tokenData || tokenData.exp < Date.now()) {
    logout();
    return null;
  }
  
  return token;
};

export const isAuthenticated = () => {
  return getCurrentUser() !== null;
};

export const hasRole = (requiredRole) => {
  const user = getCurrentUser();
  if (!user) return false;
  
  const roleHierarchy = {
    'user': 1,
    'admin': 2
  };
  
  const userLevel = roleHierarchy[user.role] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;
  
  return userLevel >= requiredLevel;
};

// User management functions
export const registerUser = async (userData) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        initializeUsers();
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        
        // Check if user already exists
        const existingUser = users.find(u => 
          u.username === userData.username || u.email === userData.email
        );
        
        if (existingUser) {
          reject(new Error('Usuário já existe'));
          return;
        }
        
        const newUser = {
          id: Date.now(),
          username: userData.username,
          email: userData.email,
          password: userData.password, // In production, hash this
          role: userData.role || 'user',
          createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        
        resolve({ message: 'Usuário criado com sucesso' });
      } catch (error) {
        reject(new Error('Erro ao criar usuário'));
      }
    }, 500);
  });
};

export const updateUserProfile = async (userId, updateData) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
          reject(new Error('Usuário não encontrado'));
          return;
        }
        
        // Update user data
        users[userIndex] = {
          ...users[userIndex],
          ...updateData,
          updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        
        // Update current user if it's the same user
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.id === userId) {
          const updatedUser = { ...currentUser, ...updateData };
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
        }
        
        resolve({ message: 'Perfil atualizado com sucesso' });
      } catch (error) {
        reject(new Error('Erro ao atualizar perfil'));
      }
    }, 500);
  });
};

// Session management
export const refreshSession = () => {
  const user = getCurrentUser();
  if (user) {
    const token = generateToken(user);
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    return true;
  }
  return false;
};

export const getSessionTimeRemaining = () => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  if (!token) return 0;
  
  const tokenData = decodeToken(token);
  if (!tokenData) return 0;
  
  const remaining = tokenData.exp - Date.now();
  return Math.max(0, remaining);
};

// Initialize on import
initializeUsers();