import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentStructure, API_BASE_URL } from '../constants/documentStructure';
import { useAuth } from '../contexts/AuthContext';

export const CreateProjectForm = () => {
  const [projectName, setProjectName] = useState('');
  const [topicName, setTopicName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { getAuthHeader } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!projectName || !topicName) {
      setError('Bitte füllen Sie alle Felder aus');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Creating new project:', {
        name: projectName,
        topic: topicName,
        endpoint: `${API_BASE_URL}/projects/create`
      });
      
      // Call the project creation endpoint with auth headers
      const headers = {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      };
      
      console.log('Creating project with headers:', {
        contentType: headers['Content-Type'],
        hasAuthHeader: !!headers['Authorization']
      });
      
      const response = await fetch(`${API_BASE_URL}/projects/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: projectName,
          topic: topicName
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to create project:', {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText
        });
        throw new Error(`Failed to create project: ${response.status} - ${errorText}`);
      }
      
      const projectData = await response.json();
      console.log('Project created successfully:', projectData);
      
      // Redirect to the project page
      navigate(`/project/${projectData.id}`);
    } catch (err) {
      console.error('Failed to create project:', err);
      setError('Failed to create project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancel = () => {
    navigate('/dashboard');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Neues Projekt erstellen
          </h2>
        </div>
        
        {error && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="project-name" className="sr-only">Projektname</label>
              <input
                id="project-name"
                name="project-name"
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Projektname"
              />
            </div>
            <div>
              <label htmlFor="topic-name" className="sr-only">Dokumenttyp</label>
              <select
                id="topic-name"
                name="topic-name"
                required
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              >
                <option value="">Dokumenttyp auswählen</option>
                {Object.keys(documentStructure).map((topic) => (
                  <option key={topic} value={topic}>
                    {topic}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleCancel}
              className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Erstellen...' : 'Projekt erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 