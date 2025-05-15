import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../constants/documentStructure';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Direct login function to debug the API call
  const handleDirectLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Bitte geben Sie E-Mail und Passwort ein');
      return;
    }
    
    try {
      setError('');
      setIsLoading(true);
      
      console.log('Login attempt with:', { email });
      
      // Make the API call directly to debug
      const formData = new URLSearchParams();
      formData.append('username', email); // API expects username field for email
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
        }
        throw new Error(errorMessage);
      }
      
      let userData;
      try {
        userData = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response:', e);
        throw new Error('Invalid response from server');
      }
      
      console.log('Login successful:', userData);
      
      // Save token and user data to localStorage
      localStorage.setItem('auth_token', userData.access_token);
      localStorage.setItem('user_data', JSON.stringify({
        id: userData.user_id,
        email: userData.email,
        role: userData.role
      }));
      
      console.log('Redirecting to dashboard...');
      
      // Force reload to ensure the context is updated with the new auth state
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Login error:', err);
      setError(`${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkApiConnection = async () => {
    try {
      setError('');
      console.log('Testing API connection to:', API_BASE_URL);
      
      // Check if the FastAPI docs are available, indicating the backend is running
      const response = await fetch(`${API_BASE_URL}/docs`, {
        method: 'GET',
      });
      
      console.log('API test response status:', response.status);
      
      if (response.ok) {
        alert(`API appears to be running! Status: ${response.status}\nAPI documentation is available at ${API_BASE_URL}/docs`);
      } else {
        alert(`API responded with status: ${response.status}\nAPI may be running but /docs endpoint is not available.`);
      }
    } catch (err) {
      console.error('API connection test failed:', err);
      setError(`API connection test failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Anmelden
          </h2>
          <div className="mt-2 text-center">
            <button 
              onClick={checkApiConnection}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Test API Connection ({API_BASE_URL})
            </button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleDirectLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">E-Mail-Adresse</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="E-Mail-Adresse"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Passwort</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Passwort"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Wird angemeldet...' : 'Anmelden'}
            </button>
          </div>
          
          <div className="text-sm text-center">
            <span className="text-gray-600">Noch kein Konto?</span>{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              Registrieren
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}; 