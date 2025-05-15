import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../constants/documentStructure';
import { Mail, Lock, Loader, AlertCircle } from 'lucide-react';

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Anmelden
            </h2>
            <p className="mt-2 text-blue-100">
              Willkommen zurück bei Ihrem Dokumentgenerator
            </p>
          </div>
          
          <div className="px-6 py-8">
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start" role="alert">
                <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}
            
            <form className="space-y-6" onSubmit={handleDirectLogin}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
                    E-Mail-Adresse
                  </label>
                  <div className="relative rounded-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email-address"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Passwort
                  </label>
                  <div className="relative rounded-md">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 ease-in-out"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <Loader className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                      Wird angemeldet...
                    </span>
                  ) : 'Anmelden'}
                </button>
              </div>
            </form>
            
            <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col items-center">
              <div className="text-sm text-center">
                <span className="text-gray-600">Noch kein Konto?</span>{' '}
                <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                  Registrieren
                </Link>
              </div>
              
              <button 
                onClick={checkApiConnection}
                className="mt-4 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                API-Verbindung testen ({API_BASE_URL})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 