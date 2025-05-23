import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL, documentStructure } from '../constants/documentStructure';
import { Edit2, Trash2, MoreVertical, X, Check, Loader, Plus, LogOut, FileText } from 'lucide-react';
import { CreateProjectModal } from './CreateProjectModal';
import { ApiTestButton } from './ApiTestButton';

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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const menuRef = useRef(null);
  const editInputRef = useRef(null);
  
  const { currentUser, getAuthHeader, logout, isAdmin } = useAuth();
  
  console.log('Dashboard rendered with auth state:', { 
    isLoggedIn: !!currentUser,
    userData: currentUser,
    isAdmin
  });
  
  const navigate = useNavigate();
  
  // Define fetchProjects function
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
  
  // Fetch projects on component mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        await fetchProjects();
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    };
    
    loadProjects();
    // Removing fetchProjects from the dependency array to avoid circular dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, getAuthHeader, isAdmin]);
  
  const handleCreateProject = () => {
    // Open the create project modal instead of navigating
    setIsCreateModalOpen(true);
  };
  
  const handleCreateProjectSubmit = async (selectedType, projectName) => {
    try {
      // Make sure we have valid values for required fields
      if (!selectedType) {
        throw new Error('Dokumenttyp ist erforderlich');
      }
      
      // Ensure we have a valid name, using a default if empty
      const nameToUse = projectName && projectName.trim() 
        ? projectName.trim() 
        : `Neues ${selectedType} Projekt`;
      
      // Prepare request body with required fields
      const requestObj = {
        name: nameToUse,
        topic: selectedType
      };
      
      console.log('Creating project with data:', requestObj);
      
      // Make the API call with the fetch API
      const response = await fetch(`${API_BASE_URL}/projects/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(requestObj)
      });
      
      // Get response text for debugging
      const responseText = await response.text();
      
      // Log everything for debugging
      console.log('Response status:', response.status);
      console.log('Response text:', responseText);
      
      // Handle errors
      if (!response.ok) {
        console.error('Project creation failed:', {
          status: response.status,
          text: responseText,
          request: requestObj
        });
        throw new Error(`Failed to create project: ${response.status} - ${responseText}`);
      }
      
      // Parse JSON response
      let projectData;
      try {
        projectData = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response:', e);
        throw new Error('Invalid response from server');
      }
      
      console.log('Project created:', projectData);
      
      // Refresh the projects list
      await fetchProjects();
      
      // Navigate to the new project
      navigate(`/project/${projectData.id}`);
    } catch (err) {
      console.error('Project creation error:', err);
      setActionFeedback({
        message: `Fehler beim Erstellen des Projekts: ${err.message}`,
        type: 'error'
      });
      setTimeout(() => setActionFeedback({ message: '', type: '' }), 5000);
      throw err; // Rethrow to let the modal handle it
    }
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

  // Get the icon for a document type
  const getDocumentIcon = (topic) => {
    return documentStructure[topic]?.icon || '📄';
  };
  
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {/* Erdbaron Logo */}
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-sm border border-stone-200">
                  <img 
                    src="/erdbaron-logo.png" 
                    alt="Erdbaron Logo" 
                    className="w-14 h-14 object-contain"
                  />
                </div>
                <div className="text-stone-800">
                  <h1 className="text-lg font-bold">erdbaron®</h1>
                  <p className="text-xs text-stone-600 -mt-1">Document Generator</p>
                </div>
              </div>
              <div className="h-8 w-px bg-stone-300 mx-4"></div>
              <div>
                <h2 className="text-xl font-semibold text-stone-800">Dashboard</h2>
                {isAdmin && (
                  <p className="text-sm text-amber-600 font-medium">
                    Admin Mode - All projects visible
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center px-4 py-2 bg-stone-100 rounded-xl border border-stone-200">
                <span className="text-sm text-stone-600 mr-2">
                  {isAdmin ? 'Admin' : 'User'}:
                </span>
                <span className="text-sm font-semibold text-stone-800">
                  {currentUser.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="btn-erdbaron-ghost flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Development tool for API testing */}
        {import.meta.env.DEV && <ApiTestButton />}
        
        {actionFeedback.message && (
          <div className={`mb-6 p-4 rounded-xl border ${
            actionFeedback.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {actionFeedback.message}
          </div>
        )}
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-2xl font-bold text-stone-800 mb-2">
              {isAdmin ? 'All Projects' : 'My Projects'}
            </h3>
            <p className="text-stone-600">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'} total
            </p>
          </div>
          <button
            onClick={handleCreateProject}
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-3 border-2 border-amber-500 hover:border-amber-400"
          >
            <div className="w-6 h-6 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-lg">New Project</span>
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 flex items-center space-x-3" role="alert">
            <div className="w-5 h-5 text-red-500">⚠</div>
            <span>{error}</span>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
              </div>
              <p className="text-stone-700 font-medium">Loading projects...</p>
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-stone-200">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-stone-400" />
            </div>
            <h3 className="text-lg font-semibold text-stone-800 mb-2">No projects found</h3>
            <p className="text-stone-600 mb-6">Get started by creating your first project.</p>
            <button
              onClick={handleCreateProject}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 inline-flex items-center space-x-3 border-2 border-amber-500 hover:border-amber-400"
            >
              <div className="w-6 h-6 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-lg">Create Project</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map(project => (
              <div 
                key={project.id}
                onClick={() => handleProjectSelect(project)}
                className={`bg-white border-2 border-stone-200 rounded-2xl shadow-lg hover:shadow-xl hover:border-amber-300 p-6 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${
                  editingProject === project.id ? 'ring-4 ring-amber-400 shadow-2xl border-amber-400' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center text-2xl border border-amber-200 shadow-sm">
                      {getDocumentIcon(project.topic)}
                    </div>
                    <div className="flex-1">
                      {editingProject === project.id ? (
                        <div className="flex items-center space-x-2" onClick={e => e.stopPropagation()}>
                          <input
                            ref={editInputRef}
                            type="text"
                            value={newProjectName}
                            onChange={e => setNewProjectName(e.target.value)}
                            className="input-erdbaron flex-1 text-sm"
                            autoFocus
                          />
                          <button
                            onClick={e => updateProjectName(e, project.id)}
                            className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                            disabled={isUpdating}
                            title="Save"
                          >
                            {isUpdating ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <h4 className="font-bold text-stone-800 text-lg mb-1 line-clamp-2 leading-tight">{project.name}</h4>
                      )}
                    </div>
                  </div>
                  
                  {editingProject !== project.id && (
                    <div className="relative flex items-center space-x-2">
                      {project.hasPdf && (
                        <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-semibold border border-green-200">PDF</span>
                      )}
                      <button 
                        onClick={e => handleMenuToggle(e, project.id)}
                        className="text-stone-500 hover:text-stone-700 hover:bg-stone-100 p-2 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {isMenuOpen === project.id && (
                        <div 
                          ref={menuRef}
                          className="absolute top-full right-0 mt-2 w-48 bg-white shadow-2xl rounded-xl py-2 z-10 border-2 border-stone-200"
                          onClick={e => e.stopPropagation()}
                        >
                          <button 
                            onClick={e => startEditProject(e, project)}
                            className="flex w-full items-center px-4 py-3 text-sm text-stone-700 hover:bg-amber-50 transition-colors"
                          >
                            <Edit2 className="w-4 h-4 mr-3 text-amber-600" />
                            Edit name
                          </button>
                          <div className="h-px bg-stone-200 mx-2"></div>
                          <button 
                            onClick={e => deleteProject(e, project.id)}
                            className="flex w-full items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <Loader className="w-4 h-4 mr-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 mr-3" />
                            )}
                            Delete project
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="mb-4 p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <p className="text-sm font-semibold text-amber-700 mb-2">{project.topic}</p>
                  <div className="flex justify-between items-center text-xs text-stone-500">
                    <span className="font-mono bg-stone-200 px-2 py-1 rounded">ID: {project.id.substring(0, 8)}...</span>
                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {isAdmin && currentUser.id !== project.createdBy && (
                  <div className="mt-4 pt-3 border-t-2 border-blue-100">
                    <div className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-lg inline-block">
                      Created by another user
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      
      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <CreateProjectModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreateProject={handleCreateProjectSubmit}
          documentTypes={Object.keys(documentStructure)}
        />
      )}
    </div>
  );
}; 