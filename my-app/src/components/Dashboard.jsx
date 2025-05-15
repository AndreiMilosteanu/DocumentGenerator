import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../constants/documentStructure';

export const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { currentUser, getAuthHeader, logout, isAdmin } = useAuth();
  
  console.log('Dashboard rendered with auth state:', { 
    isLoggedIn: !!currentUser,
    userData: currentUser,
    isAdmin
  });
  
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        
        // Use the projects/list endpoint for all users
        const endpoint = `${API_BASE_URL}/projects/list`;
        console.log('Fetching projects from endpoint:', endpoint);
        
        const response = await fetch(endpoint, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Failed to fetch projects:', {
            status: response.status,
            statusText: response.statusText,
            responseText: errorText
          });
          throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`);
        }
        
        const projectsList = await response.json();
        console.log('Projects fetched successfully:', projectsList);
        
        // Map the API response to our expected format
        const formattedProjects = projectsList.map(project => ({
          id: project.id,
          name: project.name,
          topic: project.topic,
          documentId: project.document_id,
          createdAt: project.created_at || new Date().toISOString(),
          hasPdf: project.has_pdf || false,
          createdBy: project.created_by || currentUser.id
        }));
        
        setProjects(formattedProjects);
      } catch (err) {
        console.error('Failed to fetch projects:', err);
        setError('Failed to load projects. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProjects();
  }, [currentUser, getAuthHeader, isAdmin]);
  
  const handleCreateProject = () => {
    navigate('/new-project');
  };
  
  const handleProjectSelect = (project) => {
    navigate(`/project/${project.id}`);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            {isAdmin && (
              <p className="text-sm text-gray-500">
                Admin Mode - All projects are visible
              </p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center px-3 py-1 bg-gray-100 rounded-md">
              <span className="text-sm text-gray-600 mr-1">
                {isAdmin ? 'Admin' : 'User'}:
              </span>
              <span className="text-sm font-medium">
                {currentUser.email}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-sm rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Abmelden
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900">
            {isAdmin ? 'Alle Projekte' : 'Meine Projekte'}
          </h2>
          <button
            onClick={handleCreateProject}
            className="px-4 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Neues Projekt
          </button>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">Keine Projekte gefunden.</p>
            <p className="text-sm text-gray-400 mt-2">Klicken Sie auf "Neues Projekt", um ein Projekt zu erstellen.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <div 
                key={project.id}
                onClick={() => handleProjectSelect(project)}
                className="bg-white shadow rounded-lg p-6 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{project.name}</h3>
                  {project.hasPdf && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">PDF</span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{project.topic}</p>
                <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
                  <span>ID: {project.id.substring(0, 8)}...</span>
                  <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
                {isAdmin && currentUser.id !== project.createdBy && (
                  <div className="mt-2 text-xs text-blue-500">
                    Created by another user
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}; 