import React, { createContext, useState, useContext, useEffect } from 'react';
import { API_BASE_URL } from '../constants/documentStructure';

// Create context
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check for existing token on load
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    console.log('Checking for existing auth token on load...');
    
    if (token && userData) {
      try {
        const userObj = JSON.parse(userData);
        console.log('Found existing token and user data:', {
          tokenStart: token.substring(0, 20) + '...',
          user: userObj
        });
        setCurrentUser(userObj);
      } catch (e) {
        console.error('Failed to parse user data:', e);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
      }
    } else {
      console.log('No existing token found');
    }
    
    setLoading(false);
  }, []);

  // Register a new user
  const register = async (email, password) => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Registering with:', { email });
      console.log('Registration URL:', `${API_BASE_URL}/auth/register`);
      
      const requestBody = { email, password };
      console.log('Registration request body:', requestBody);
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const responseText = await response.text();
      console.log('Registration response status:', response.status);
      console.log('Registration response headers:', Object.fromEntries([...response.headers]));
      console.log('Registration response body:', responseText);
      
      if (!response.ok) {
        let errorMessage = 'Registration failed';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          console.error('Failed to parse error response:', e);
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      let userData;
      try {
        userData = JSON.parse(responseText);
        console.log('Registration successful:', userData);
      } catch (e) {
        console.error('Failed to parse response:', e);
        throw new Error('Invalid response from server');
      }
      
      return userData;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (email, password) => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Logging in with:', { email });
      console.log('Login URL:', `${API_BASE_URL}/auth/login`);
      
      // Create form data instead of JSON
      const formData = new URLSearchParams();
      formData.append('username', email); // API expects username field
      formData.append('password', password);
      
      console.log('Login request params:', formData.toString());
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });
      
      const responseText = await response.text();
      console.log('Login response status:', response.status);
      console.log('Login response headers:', Object.fromEntries([...response.headers]));
      console.log('Login response body:', responseText);
      
      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          console.error('Failed to parse error response:', e);
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Login successful:', data);
      } catch (e) {
        console.error('Failed to parse response:', e);
        throw new Error('Invalid response from server');
      }
      
      // Save token and user data to localStorage
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('user_data', JSON.stringify({
        id: data.user_id,
        email: data.email,
        role: data.role
      }));
      
      setCurrentUser({
        id: data.user_id,
        email: data.email,
        role: data.role
      });
      
      console.log('Login successful and state updated:', {
        token: data.access_token.substring(0, 20) + '...',
        user: {
          id: data.user_id,
          email: data.email,
          role: data.role
        }
      });
      
      return data;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setCurrentUser(null);
  };

  // Helper to get auth header for API requests
  const getAuthHeader = () => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      return {};
    }
    
    // Check if token is expired by parsing JWT
    try {
      // JWT tokens have three parts separated by dots
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('Invalid token format, not a JWT token');
        return { 'Authorization': `Bearer ${token}` };
      }
      
      // The second part contains payload, which we decode
      const payload = JSON.parse(atob(parts[1]));
      
      // Check expiration (exp claim is in seconds)
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        console.warn('Token has expired, clearing auth data');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        setCurrentUser(null);
        return {};
      }
      
      return { 'Authorization': `Bearer ${token}` };
    } catch (error) {
      console.error('Error parsing JWT token:', error);
      return { 'Authorization': `Bearer ${token}` };
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    register,
    login,
    logout,
    getAuthHeader,
    isAdmin: currentUser?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  return useContext(AuthContext);
}; 