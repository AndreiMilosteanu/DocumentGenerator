import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../constants/documentStructure';
import { Edit2, Trash2, MoreVertical, X, Check, Loader } from 'lucide-react';

export const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingProject, setEditingProject] = useState(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState({ message: '', type: '' });
  
  const menuRef = useRef(null);
  const editInputRef = useRef(null);
  
  const { currentUser, getAuthHeader, logout, isAdmin } = useAuth();
  
  console.log('Dashboard rendered with auth state:', { 
    isLoggedIn: !!currentUser,
    userData: currentUser,
    isAdmin
  });
  
  const navigate = useNavigate();
  
  // Handle clicks outside of the dropdown menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Focus the edit input when editing starts
  useEffect(() => {
    if (editingProject && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingProject]);
  
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
    // Don't navigate if we're in edit mode or clicking menu
    if (editingProject === project.id || isMenuOpen === project.id) {
      return;
    }
    navigate(`/project/${project.id}`);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleMenuToggle = (e, projectId) => {
    e.stopPropagation();
    setIsMenuOpen(isMenuOpen === projectId ? null : projectId);
  };
  
  const startEditProject = (e, project) => {
    e.stopPropagation();
    setEditingProject(project.id);
    setNewProjectName(project.name);
    setIsMenuOpen(null);
  };
  
  const cancelEdit = (e) => {
    e.stopPropagation();
    setEditingProject(null);
    setNewProjectName('');
  };
  
  const updateProjectName = async (e, projectId) => {
    e.stopPropagation();
    
    if (!newProjectName.trim()) {
      setActionFeedback({
        message: 'Projektname darf nicht leer sein',
        type: 'error'
      });
      setTimeout(() => setActionFeedback({ message: '', type: '' }), 3000);
      return;
    }
    
    setIsUpdating(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newProjectName.trim()
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to update project name:', {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText
        });
        throw new Error(`Failed to update project: ${response.status} ${response.statusText}`);
      }
      
      // Update the project name in our local state
      setProjects(projects.map(project => 
        project.id === projectId 
          ? { ...project, name: newProjectName.trim() } 
          : project
      ));
      
      setActionFeedback({
        message: 'Projektname erfolgreich aktualisiert',
        type: 'success'
      });
      setTimeout(() => setActionFeedback({ message: '', type: '' }), 3000);
      
    } catch (err) {
      console.error('Failed to update project name:', err);
      setActionFeedback({
        message: 'Fehler beim Aktualisieren des Projektnamens',
        type: 'error'
      });
      setTimeout(() => setActionFeedback({ message: '', type: '' }), 3000);
    } finally {
      setIsUpdating(false);
      setEditingProject(null);
    }
  };
  
  const deleteProject = async (e, projectId) => {
    e.stopPropagation();
    
    if (!confirm('Sind Sie sicher, dass Sie dieses Projekt löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeader()
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to delete project:', {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText
        });
        throw new Error(`Failed to delete project: ${response.status} ${response.statusText}`);
      }
      
      // Remove the deleted project from our local state
      setProjects(projects.filter(project => project.id !== projectId));
      
      setActionFeedback({
        message: 'Projekt erfolgreich gelöscht',
        type: 'success'
      });
      setTimeout(() => setActionFeedback({ message: '', type: '' }), 3000);
      
    } catch (err) {
      console.error('Failed to delete project:', err);
      setActionFeedback({
        message: 'Fehler beim Löschen des Projekts',
        type: 'error'
      });
      setTimeout(() => setActionFeedback({ message: '', type: '' }), 3000);
    } finally {
      setIsDeleting(false);
      setIsMenuOpen(null);
    }
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
        {actionFeedback.message && (
          <div 
            className={`mb-4 px-4 py-2 rounded-md ${
              actionFeedback.type === 'success' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}
          >
            {actionFeedback.message}
          </div>
        )}
        
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
                className={`bg-white shadow rounded-lg p-6 cursor-pointer hover:shadow-md transition-shadow 
                  ${editingProject === project.id ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="flex justify-between items-start">
                  {editingProject === project.id ? (
                    <div className="flex-1 flex items-center space-x-2" onClick={e => e.stopPropagation()}>
                      <input
                        ref={editInputRef}
                        type="text"
                        value={newProjectName}
                        onChange={e => setNewProjectName(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button
                        onClick={e => updateProjectName(e, project.id)}
                        className="p-1 text-green-600 hover:text-green-800"
                        disabled={isUpdating}
                        title="Speichern"
                      >
                        {isUpdating ? <Loader className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Abbrechen"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{project.name}</h3>
                      <div className="relative flex items-center">
                        {project.hasPdf && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mr-2">PDF</span>
                        )}
                        <button 
                          onClick={e => handleMenuToggle(e, project.id)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        
                        {isMenuOpen === project.id && (
                          <div 
                            ref={menuRef}
                            className="absolute top-full right-0 mt-1 w-48 bg-white shadow-lg rounded-md py-1 z-10"
                            onClick={e => e.stopPropagation()}
                          >
                            <button 
                              onClick={e => startEditProject(e, project)}
                              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              <Edit2 className="w-4 h-4 mr-2" />
                              Name bearbeiten
                            </button>
                            <button 
                              onClick={e => deleteProject(e, project.id)}
                              className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                              disabled={isDeleting}
                            >
                              {isDeleting ? (
                                <Loader className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4 mr-2" />
                              )}
                              Projekt löschen
                            </button>
                          </div>
                        )}
                      </div>
                    </>
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