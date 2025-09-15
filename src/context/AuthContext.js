import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  login as authLogin, 
  logout as authLogout, 
  getCurrentUser, 
  isAuthenticated,
  getToken,
  refreshSession
} from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const initAuth = () => {
      try {
        const currentUser = getCurrentUser();
        const currentToken = getToken();
        
        if (currentUser && currentToken) {
          setUser(currentUser);
          setToken(currentToken);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
    
    // Set up session refresh interval
    const refreshInterval = setInterval(() => {
      if (isAuthenticated()) {
        refreshSession();
      }
    }, 5 * 60 * 1000); // Refresh every 5 minutes
    
    return () => clearInterval(refreshInterval);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authLogin(username, password);
      
      setToken(response.token);
      setUser(response.user);
      
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  };

  const logout = () => {
    authLogout();
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: isAuthenticated(),
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};