import React, { useState, useMemo } from 'react'
import { ChevronRight, ChevronDown, Folder, FolderOpen, Plus, FileText, Loader, AlertCircle } from 'lucide-react'
import { documentStructure } from '../constants/documentStructure'

export const Sidebar = ({ 
  activeChapter, 
  activeSection, 
  activeSubsection,
  onSectionClick,
  isPdfLoaded,
  projects = [], // List of user's projects
  onProjectSelect, // Callback when user selects an existing project
  onNewProjectClick, // Callback when user clicks to create a new project
  isLoadingProjects = false // Loading state for projects
}) => {
  const [lastClickedSubsection, setLastClickedSubsection] = useState(null)
  const [showNotFoundError, setShowNotFoundError] = useState(false)
  const [projectsFolderOpen, setProjectsFolderOpen] = useState(true)
  const [topicFoldersOpen, setTopicFoldersOpen] = useState({})

  // Group projects by their topic using the useMemo hook for performance
  const projectsByTopic = useMemo(() => {
    const groupedProjects = {}
    
    // Initialize with empty arrays for all document types
    Object.keys(documentStructure).forEach(topic => {
      groupedProjects[topic] = []
    })
    
    // Add projects to their respective topics
    projects.forEach(project => {
      if (project.topic && groupedProjects[project.topic]) {
        groupedProjects[project.topic].push(project)
      } else if (project.topic) {
        // If we encounter a topic that's not in our structure, add it
        groupedProjects[project.topic] = [project]
      }
    })
    
    return groupedProjects
  }, [projects])

  const handleSubsectionClick = (sectionTitle, subsection) => {
    if (!isPdfLoaded) return // Do nothing if PDF is not loaded

    // Set this subsection as the last clicked one
    setLastClickedSubsection(subsection)
    
    // Clear any previous error message
    setShowNotFoundError(false)

    // Call the parent handler
    onSectionClick(sectionTitle, subsection)

    // After a delay, if this is still the last clicked subsection,
    // show the error message
    setTimeout(() => {
      if (lastClickedSubsection === subsection) {
        setShowNotFoundError(true)
        setTimeout(() => setShowNotFoundError(false), 3000) // Hide after 3 seconds
      }
    }, 1000) // Wait 1 second for the scroll to happen
  }

  const toggleTopicFolder = (topic) => {
    setTopicFoldersOpen(prev => ({
      ...prev,
      [topic]: !prev[topic]
    }))
  }

  // Count total projects
  const totalProjects = projects.length

  return (
    <aside className="w-72 bg-white border-r p-6 flex flex-col">
      <div className="mb-8">
        <img src="/logo.png" alt="erdbaron" className="h-6" />
      </div>
      <nav className="flex-1">
        <div className="mb-4">
          <div 
            className="flex items-center justify-between cursor-pointer p-2 hover:bg-gray-50 rounded-lg"
            onClick={() => setProjectsFolderOpen(!projectsFolderOpen)}
          >
            <div className="flex items-center space-x-2">
              {projectsFolderOpen ? <FolderOpen className="w-5 h-5 text-blue-600" /> : <Folder className="w-5 h-5 text-gray-600" />}
              <span className="font-medium">Projekte</span>
              {totalProjects > 0 && (
                <span className="bg-gray-100 text-gray-700 text-xs px-2 rounded-full">
                  {totalProjects}
                </span>
              )}
            </div>
            {projectsFolderOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
          
          {projectsFolderOpen && (
            <div className="ml-4 mt-2 space-y-1">
              {/* New Project Button */}
              <button 
                onClick={onNewProjectClick}
                className="flex w-full items-center space-x-2 p-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Neues Projekt erstellen</span>
              </button>
              
              {/* Loading State */}
              {isLoadingProjects && (
                <div className="flex items-center justify-center py-4 text-blue-600">
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  <span className="text-sm">Projekte werden geladen...</span>
                </div>
              )}
              
              {/* No Projects State */}
              {!isLoadingProjects && totalProjects === 0 && (
                <div className="flex items-center justify-center py-4 text-gray-500">
                  <AlertCircle className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="text-sm">Keine Projekte gefunden</span>
                </div>
              )}
              
              {/* Topic Folders */}
              {!isLoadingProjects && (
                <div className="mt-2 space-y-1">
                  {/* Show all topics from documentStructure, even empty ones */}
                  {Object.entries(documentStructure).map(([topic, details]) => (
                    <div key={topic} className="mb-2">
                      <div 
                        className="flex items-center justify-between cursor-pointer p-1 hover:bg-gray-50 rounded"
                        onClick={() => toggleTopicFolder(topic)}
                      >
                        <div className="flex items-center space-x-2 text-sm">
                          {topicFoldersOpen[topic] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          <span>{details.icon}</span>
                          <span>{topic}</span>
                          {projectsByTopic[topic] && projectsByTopic[topic].length > 0 && (
                            <span className="bg-gray-100 text-gray-700 text-xs px-2 rounded-full">
                              {projectsByTopic[topic].length}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Projects under this topic */}
                      {topicFoldersOpen[topic] && projectsByTopic[topic] && (
                        <div className="ml-6 mt-1 space-y-1">
                          {projectsByTopic[topic].length === 0 ? (
                            <div className="text-xs text-gray-400 italic py-1">
                              Keine Projekte in dieser Kategorie
                            </div>
                          ) : (
                            projectsByTopic[topic].map(project => (
                              <div 
                                key={project.id}
                                onClick={() => onProjectSelect(project)}
                                className={`flex items-center space-x-2 p-1 text-sm cursor-pointer hover:text-blue-600 rounded ${
                                  project.id === activeChapter ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
                                }`}
                              >
                                <FileText className="w-3 h-3" />
                                <span>{project.name || `Projekt ${project.id.substring(0, 6)}`}</span>
                                {project.hasPdf && (
                                  <span className="w-2 h-2 bg-green-500 rounded-full" title="PDF verfügbar"></span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
      
      {/* Show sections and subsections only when a project is selected */}
      {activeChapter && (
        <div className="mt-6 text-sm">
          <h2 className="font-semibold mb-3">{activeChapter}</h2>
          <div className="space-y-4">
            {documentStructure[activeChapter]?.sections.map((section) => (
              <div key={section.title}>
                <h3 className="text-gray-600 mb-2">{section.title}</h3>
                <ul className="ml-4 space-y-1 text-gray-500">
                  {section.subsections.map((subsection) => (
                    <li 
                      key={subsection}
                      className={`flex items-center space-x-2 cursor-pointer hover:text-blue-600 ${
                        !isPdfLoaded ? 'opacity-50 cursor-not-allowed' : ''
                      } ${
                        activeSection === section.title && activeSubsection === subsection
                          ? 'text-blue-600'
                          : ''
                      }`}
                      onClick={() => handleSubsectionClick(section.title, subsection)}
                      title={!isPdfLoaded ? 'Warten Sie bis das PDF geladen ist' : ''}
                    >
                      <ChevronRight className="w-4 h-4" />
                      <span>{subsection}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {showNotFoundError && (
        <div className="mt-4 p-2 bg-red-50 text-red-600 text-sm rounded">
          Abschnitt konnte nicht gefunden werden
        </div>
      )}
    </aside>
  )
} 