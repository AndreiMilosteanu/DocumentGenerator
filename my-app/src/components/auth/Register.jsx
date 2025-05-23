import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../constants/documentStructure';
import { Mail, Lock, CheckCircle, AlertCircle, Loader } from 'lucide-react';

export const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Direct registration function to debug the API call
  const handleDirectRegister = async (e) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    try {
      setError('');
      setIsLoading(true);
      
      console.log('Registration attempt with:', { email });
      
      // Make the registration API call directly to debug
      const requestBody = {
        email,
        password
      };
      
      console.log('Registration request:', requestBody);
      
      const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const registerResponseText = await registerResponse.text();
      console.log('Registration response status:', registerResponse.status);
      console.log('Registration response headers:', Object.fromEntries([...registerResponse.headers]));
      console.log('Registration response body:', registerResponseText);
      
      if (!registerResponse.ok) {
        let errorMessage = 'Registration failed';
        try {
          const errorData = JSON.parse(registerResponseText);
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        throw new Error(errorMessage);
      }
      
      console.log('Registration successful, now logging in...');
      
      // Make the login API call directly
      const loginFormData = new URLSearchParams();
      loginFormData.append('username', email);
      loginFormData.append('password', password);
      
      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: loginFormData,
      });
      
      const loginResponseText = await loginResponse.text();
      console.log('Login response status:', loginResponse.status);
      console.log('Login response body:', loginResponseText);
      
      if (!loginResponse.ok) {
        let errorMessage = 'Login after registration failed';
        try {
          const errorData = JSON.parse(loginResponseText);
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        throw new Error(errorMessage);
      }
      
      let userData;
      try {
        userData = JSON.parse(loginResponseText);
      } catch (e) {
        console.error('Failed to parse response:', e);
        throw new Error('Invalid response from server');
      }
      
      console.log('Login after registration successful:', userData);
      
      // Save token and user data to localStorage
      localStorage.setItem('auth_token', userData.access_token);
      localStorage.setItem('user_data', JSON.stringify({
        id: userData.user_id,
        email: userData.email,
        role: userData.role
      }));
      
      // Redirect to dashboard
      const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
      window.location.href = `${baseUrl}/dashboard`;
    } catch (err) {
      console.error('Registration/login error:', err);
      setError(`${err.message}`);
    } finally {
      setIsLoading(false);
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
              Create Account
            </h2>
            <p className="text-amber-100">
              Join our Document Generator platform
            </p>
          </div>
          
          <div className="px-8 py-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl flex items-start space-x-3" role="alert">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}
            
            <form className="space-y-6" onSubmit={handleDirectRegister}>
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
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-erdbaron pl-12 w-full"
                      placeholder="••••••••"
                    />
                  </div>
                  <p className="mt-2 text-xs text-stone-500">
                    Must be at least 8 characters long
                  </p>
                </div>
                
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-semibold text-stone-800 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <CheckCircle className="h-5 w-5 text-stone-400" />
                    </div>
                    <input
                      id="confirm-password"
                      name="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-erdbaron pl-12 w-full"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-erdbaron-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <Loader className="animate-spin mr-3 h-5 w-5 text-white" />
                      Creating account...
                    </span>
                  ) : 'Create Account'}
                </button>
              </div>
              
              <div className="mt-6 pt-6 border-t border-stone-200 text-center">
                <div className="text-sm">
                  <span className="text-stone-600">Already have an account?</span>{' '}
                  <Link to="/login" className="font-semibold text-amber-700 hover:text-amber-800 transition-colors">
                    Sign in
                  </Link>
                </div>
              </div>
            </form>
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