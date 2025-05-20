import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { Dashboard } from './components/Dashboard';
import { PrivateRoute } from './components/auth/PrivateRoute';
import { CreateProjectForm } from './components/CreateProjectForm';
import ProjectView from './components/ProjectView';

// Get the base URL from Vite's import.meta.env
const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, '');

const AuthApp = () => {
  return (
    <BrowserRouter basename={BASE_URL}>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Protected routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/new-project" element={<CreateProjectForm />} />
            <Route path="/project/:id" element={<ProjectView />} />
          </Route>
          
          {/* Admin-only routes */}
          <Route element={<PrivateRoute adminOnly={true} />}>
            <Route path="/admin" element={<Dashboard />} />
          </Route>
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AuthApp; 