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
      
      // Use the correct base URL for redirects
      const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
      window.location.href = `${baseUrl}/dashboard`;
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-stone-50 to-amber-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-200">
          {/* Header with Erdbaron branding */}
          <div className="bg-gradient-to-r from-amber-700 to-orange-600 px-8 py-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-28 h-28 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <img 
                  src="/erdbaron-logo.png" 
                  alt="Erdbaron Logo" 
                  className="w-24 h-24 object-contain"
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
              erdbaron®
            </h1>
            <h2 className="text-xl font-semibold text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-amber-100">
              Sign in to your Document Generator
            </p>
          </div>
          
          <div className="px-8 py-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl flex items-start space-x-3" role="alert">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}
            
            <form className="space-y-6" onSubmit={handleDirectLogin}>
              <div className="space-y-5">
                <div>
                  <label htmlFor="email-address" className="block text-sm font-semibold text-stone-800 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-stone-400" />
                    </div>
                    <input
                      id="email-address"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-erdbaron pl-12 w-full"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-stone-800 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-stone-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-erdbaron pl-12 w-full"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-erdbaron-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <Loader className="animate-spin mr-3 h-5 w-5 text-white" />
                      Signing in...
                    </span>
                  ) : 'Sign In'}
                </button>
              </div>
            </form>
            
            <div className="mt-8 pt-6 border-t border-stone-200 text-center space-y-4">
              <div className="text-sm">
                <span className="text-stone-600">Don't have an account?</span>{' '}
                <Link to="/register" className="font-semibold text-amber-700 hover:text-amber-800 transition-colors">
                  Sign up
                </Link>
              </div>
              
              <button 
                onClick={checkApiConnection}
                className="text-xs text-stone-500 hover:text-stone-700 transition-colors underline"
              >
                Test API Connection ({API_BASE_URL})
              </button>
            </div>
          </div>
        </div>
        
        {/* Footer branding */}
        <div className="text-center mt-8">
          <p className="text-stone-500 text-sm">
            Powered by <span className="font-semibold text-amber-700">erdbaron®</span> Document Generator
          </p>
        </div>
      </div>
    </div>
  );
}; 