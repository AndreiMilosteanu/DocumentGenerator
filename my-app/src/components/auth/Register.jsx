import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../constants/documentStructure';

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
      setError('Bitte füllen Sie alle Felder aus');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }
    
    if (password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein');
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
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Registration/login error:', err);
      setError(`${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Neues Konto erstellen
          </h2>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleDirectRegister}>
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
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Passwort"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">Passwort bestätigen</label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Passwort bestätigen"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Registrierung läuft...' : 'Registrieren'}
            </button>
          </div>
          
          <div className="text-sm text-center">
            <span className="text-gray-600">Bereits ein Konto?</span>{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Anmelden
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}; 