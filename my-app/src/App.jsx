import React, { useRef, useState, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { ChatMessages } from './components/ChatMessages'
import { ChatInput } from './components/ChatInput'
import { PdfPreview } from './components/PdfPreview'
import { useConversation } from './hooks/useConversation'
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, documentStructure, API_BASE_URL } from './constants/documentStructure'
import { CreateProjectModal } from './components/CreateProjectModal'

export default function App() {
  const [activeProject, setActiveProject] = useState(null)
  const [activeSection, setActiveSection] = useState(null)
  const [activeSubsection, setActiveSubsection] = useState(null)
  const [activeSectionKey, setActiveSectionKey] = useState(null)
  const [activeSubsectionKey, setActiveSubsectionKey] = useState(null)
  const [inputMessage, setInputMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [fileError, setFileError] = useState('')
  const [isPdfLoaded, setIsPdfLoaded] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [projects, setProjects] = useState([])
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)

  const {
    getCurrentMessages,
    isLoading,
    isStartingConversation,
    isGeneratingPdf,
    isApprovingData,
    pdfUrls,
    startNewConversation,
    startSubsectionConversation,
    selectSubsection,
    sendMessage,
    downloadPdf,
    loadExistingProject,
    activeSubsection: getActiveSubsection,
    subsectionStatus,
    isSubsectionApproved,
    approveSubsectionData
  } = useConversation()

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)

  // Load projects on initial mount
  useEffect(() => {
    fetchProjects()
  }, [])

  // Reset PDF loaded state when project changes or when generating new PDF
  useEffect(() => {
    if (isGeneratingPdf) {
      setIsPdfLoaded(false)
    }
  }, [isGeneratingPdf])

  useEffect(() => {
    setIsPdfLoaded(false)
  }, [activeProject])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && activeProject && activeSectionKey && activeSubsectionKey) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [getCurrentMessages(activeProject?.documentId, activeSectionKey, activeSubsectionKey), 
      activeProject, activeSectionKey, activeSubsectionKey])

  // Fetch user's projects
  const fetchProjects = async () => {
    setIsLoadingProjects(true)
    try {
      console.log('Fetching projects from:', `${API_BASE_URL}/projects/list`);
      
      const response = await fetch(`${API_BASE_URL}/projects/list`)
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch projects:', {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText
        });
        throw new Error(`Failed to fetch projects: ${response.status} - ${errorText}`);
      }
      
      const projectsList = await response.json()
      console.log('Projects fetched successfully:', projectsList);
      
      // Map the API response to our expected format
      const formattedProjects = projectsList.map(project => ({
        id: project.id,
        name: project.name,
        topic: project.topic,
        documentId: project.document_id,
        createdAt: project.created_at || new Date().toISOString(),
        hasPdf: project.has_pdf || false
      }))
      
      console.log('Formatted projects:', formattedProjects);
      setProjects(formattedProjects)
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      // Fallback mock data
      console.log('Using fallback mock data for projects');
      setProjects([
        { id: '123456', name: 'Bauleitplanung Hamburg', topic: 'Baugrundgutachten', documentId: 'doc-123', createdAt: '2023-10-15', hasPdf: true },
        { id: '234567', name: 'Bodenqualität Berlin', topic: 'Bodenuntersuchung', documentId: 'doc-234', createdAt: '2023-11-20', hasPdf: true },
        { id: '345678', name: 'Bauprojekt München', topic: 'Plattendruckversuch', documentId: 'doc-345', createdAt: '2023-12-05', hasPdf: false },
        { id: '456789', name: 'Gutachten Frankfurt', topic: 'Deklarationsanalyse', documentId: 'doc-456', createdAt: '2024-01-10', hasPdf: true }
      ])
    } finally {
      setIsLoadingProjects(false)
    }
  }

  // Find section and subsection details by keys
  const getSectionAndSubsectionTitles = (topic, sectionKey, subsectionKey) => {
    if (!topic || !sectionKey || !subsectionKey) return { sectionTitle: null, subsectionTitle: null };
    
    const topicData = documentStructure[topic];
    if (!topicData) return { sectionTitle: null, subsectionTitle: null };
    
    const section = topicData.sections.find(s => s.key === sectionKey);
    if (!section) return { sectionTitle: null, subsectionTitle: null };
    
    const subsection = section.subsections.find(s => s.key === subsectionKey);
    if (!subsection) return { sectionTitle: null, subsectionTitle: null };
    
    return {
      sectionTitle: section.title,
      subsectionTitle: subsection.title
    };
  }

  // Handle selecting an existing project
  const handleProjectSelect = async (project) => {
    console.log('Selecting project:', project);
    setActiveProject(project)
    
    // Load project data from backend including chat history and PDF status
    const projectDetails = await loadExistingProject(project.id, project.documentId)
    
    // Update PDF loaded state based on the project details
    setIsPdfLoaded(projectDetails.hasPdf)
    
    // Get available subsections
    const availableSubsections = projectDetails.subsections || {};
    console.log('Available subsections:', availableSubsections);
    
    // Log approved subsections
    console.log('Approved subsections for project:', projectDetails.approvedSubsections);
    
    // Get active subsection from conversation hook
    const active = getActiveSubsection(project.documentId);
    console.log('Active subsection from hook:', active);
    
    // If there's an active subsection, use it
    if (active && active.section && active.subsection) {
      console.log('Using active subsection:', active);
      setActiveSectionKey(active.section);
      setActiveSubsectionKey(active.subsection);
      
      // Get section and subsection titles
      const { sectionTitle, subsectionTitle } = getSectionAndSubsectionTitles(
        project.topic, 
        active.section, 
        active.subsection
      );
      
      setActiveSection(sectionTitle);
      setActiveSubsection(subsectionTitle);
      
      // Ensure we have the messages for this subsection
      await selectSubsection(project.documentId, active.section, active.subsection);
    } else {
      // No active subsection, try to find one with an existing conversation
      const subsectionWithConversation = Object.entries(availableSubsections).find(([, details]) => details?.hasConversation);
      
      if (subsectionWithConversation) {
        // Use an existing subsection
        const [subsectionPath, details] = subsectionWithConversation;
        console.log('Found subsection with conversation:', subsectionPath, details);
        
        const [section, subsection] = subsectionPath.split('/');
        setActiveSectionKey(section);
        setActiveSubsectionKey(subsection);
        
        // Get section and subsection titles
        const { sectionTitle, subsectionTitle } = getSectionAndSubsectionTitles(
          project.topic, 
          section, 
          subsection
        );
        
        setActiveSection(sectionTitle);
        setActiveSubsection(subsectionTitle);
        
        // Select this subsection
        await selectSubsection(project.documentId, section, subsection);
      } else {
        // No existing subsections with conversations, use the first section/subsection
        const topicData = documentStructure[project.topic];
        if (topicData && topicData.sections.length > 0) {
          const firstSection = topicData.sections[0];
          const firstSubsection = firstSection.subsections[0];
          
          setActiveSection(firstSection.title);
          setActiveSectionKey(firstSection.key);
          setActiveSubsection(firstSubsection.title);
          setActiveSubsectionKey(firstSubsection.key);
          
          // Start conversation for this subsection
          await startSubsectionConversation(project.documentId, firstSection.key, firstSubsection.key);
        }
      }
    }
  }

  // Handle opening the create project modal
  const handleNewProjectClick = () => {
    setIsCreateModalOpen(true)
  }

  // Handle creating a new project
  const handleCreateProject = async (topicName, projectName) => {
    setIsCreateModalOpen(false)
    setIsLoadingProjects(true)
    
    try {
      console.log('Creating new project:', {
        name: projectName || `Neues ${topicName}`,
        topic: topicName,
        endpoint: `${API_BASE_URL}/projects/create`
      });
      
      // Call the project creation endpoint
      const response = await fetch(`${API_BASE_URL}/projects/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName || `Neues ${topicName}`,
          topic: topicName
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to create project:', {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText
        });
        throw new Error(`Failed to create project: ${response.status} - ${errorText}`);
      }
      
      // Parse the response which contains project details including document_id
      const projectData = await response.json()
      
      console.log('Project created successfully:', projectData);
      
      // Create a new project object from the response
      const newProject = { 
        id: projectData.id, 
        name: projectData.name, 
        topic: projectData.topic,
        documentId: projectData.document_id,
        createdAt: new Date().toISOString(),
        hasPdf: false // New projects start with no PDF
      }
      
      console.log('New project object:', newProject);
      
      // Add project to local state first
      setProjects(prevProjects => {
        const updatedProjects = [...prevProjects, newProject];
        console.log('Updated projects list:', updatedProjects);
        return updatedProjects;
      });
      
      // Set it as the active project
      setActiveProject(newProject)
      
      // Wait a moment to ensure UI updates completely
      await new Promise(resolve => setTimeout(resolve, 50));
      
      console.log('Starting conversation for new project with document_id:', projectData.document_id);
      
      // Start a new conversation using the document_id from the response AFTER updating the UI
      const conversationResult = await startNewConversation(topicName, projectData.document_id)
      
      if (conversationResult.success) {
        console.log('Conversation started successfully for section/subsection:', conversationResult.section, conversationResult.subsection);
        
        // Update the project with any additional info from the conversation result
        setActiveProject(prevProject => ({
          ...prevProject,
          hasPdf: conversationResult.hasPdf
        }))
        
        // Set the active section and subsection based on the API response
        const { section, subsection } = conversationResult;
        setActiveSectionKey(section);
        setActiveSubsectionKey(subsection);
        
        // Get section and subsection titles
        const { sectionTitle, subsectionTitle } = getSectionAndSubsectionTitles(
          topicName, 
          section, 
          subsection
        );
        
        setActiveSection(sectionTitle);
        setActiveSubsection(subsectionTitle);
      } else {
        console.error('Failed to start conversation:', conversationResult.error);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      
      // For development purposes, create a temporary project with mock data
      // This allows us to debug the UI flow even if the backend is not available
      const tempProjectId = `temp-${Date.now()}`;
      const tempDocumentId = `doc-${Date.now()}`;
      
      console.log('Creating temporary project for debug purposes:', {
        id: tempProjectId,
        documentId: tempDocumentId,
        topic: topicName
      });
      
      const tempProject = {
        id: tempProjectId,
        name: projectName || `Neues ${topicName} (Test)`,
        topic: topicName,
        documentId: tempDocumentId,
        createdAt: new Date().toISOString(),
        hasPdf: false
      };
      
      // Add the temporary project to local state
      setProjects(prevProjects => [...prevProjects, tempProject]);
      
      // Set it as the active project
      setActiveProject(tempProject);
      
      // Set default section and subsection
      const topicData = documentStructure[topicName]
      if (topicData && topicData.sections.length > 0) {
        const firstSection = topicData.sections[0];
        const firstSubsection = firstSection.subsections[0];
        
        setActiveSection(firstSection.title);
        setActiveSectionKey(firstSection.key);
        setActiveSubsection(firstSubsection.title);
        setActiveSubsectionKey(firstSubsection.key);
      }
      
      // Show error notification
      alert(`Fehler beim Erstellen des Projekts: ${error.message}. Ein temporäres Projekt wurde für Testzwecke erstellt.`);
    } finally {
      setIsLoadingProjects(false)
    }
  }

  const handleSectionClick = async (sectionTitle, subsectionTitle, sectionKey, subsectionKey) => {
    if (!activeProject) return;
    
    console.log('Switching to section/subsection:', {
      sectionTitle, subsectionTitle, sectionKey, subsectionKey
    });
    
    // Update UI state
    setActiveSection(sectionTitle);
    setActiveSectionKey(sectionKey);
    setActiveSubsection(subsectionTitle);
    setActiveSubsectionKey(subsectionKey);
    
    // Check if this subsection has an existing conversation
    const docSubsections = subsectionStatus[activeProject.documentId] || {};
    const subsectionPath = `${sectionKey}/${subsectionKey}`;
    const hasConversation = docSubsections[subsectionPath]?.hasConversation;
    
    if (hasConversation) {
      // If conversation exists, select it
      console.log('Selecting existing subsection conversation');
      await selectSubsection(activeProject.documentId, sectionKey, subsectionKey);
    } else {
      // If not, start a new conversation for this subsection
      console.log('Starting new subsection conversation');
      await startSubsectionConversation(activeProject.documentId, sectionKey, subsectionKey);
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    const message = inputMessage.trim()
    if (!message || !activeProject) return

    setInputMessage('')
    await sendMessage(message, activeProject.documentId)
  }

  const validateFile = (file) => {
    setFileError('')

    if (!file) return false

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setFileError('Nur PDF und DOCX Dateien sind erlaubt.')
      return false
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError('Die Datei darf nicht größer als 10 MB sein.')
      return false
    }

    return true
  }

  const handleFile = (file) => {
    if (validateFile(file)) {
      setSelectedFile(file)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) handleFile(file)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handlePdfLoad = () => {
    console.log('PDF loaded, enabling subsections')
    setIsPdfLoaded(true)
  }

  const handleDownloadPDF = async () => {
    if (!activeProject) return
    await downloadPdf(activeProject.topic, activeProject.documentId)
  }

  // Get the current active subsection
  const activeSubsectionData = activeProject ? getActiveSubsection(activeProject.documentId) : null;
  
  // Get messages for the current subsection
  const currentMessages = activeProject && activeSectionKey && activeSubsectionKey ? 
    getCurrentMessages(activeProject.documentId, activeSectionKey, activeSubsectionKey) : [];

  // Update the handleApproveData function
  const handleApproveData = async () => {
    if (!activeProject || !activeSectionKey || !activeSubsectionKey) return;
    
    console.log('Approving data for subsection:', {
      documentId: activeProject.documentId,
      section: activeSectionKey,
      subsection: activeSubsectionKey
    });
    
    const result = await approveSubsectionData(
      activeProject.documentId,
      activeSectionKey,
      activeSubsectionKey
    );
    
    if (result.success) {
      console.log('Data approved successfully:', result);
    } else {
      console.error('Failed to approve data:', result.error);
      alert(`Fehler beim Speichern der Daten: ${result.error}`);
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeChapter={activeProject?.topic}
          activeSection={activeSection}
          activeSubsection={activeSubsection}
          activeSectionKey={activeSectionKey}
          activeSubsectionKey={activeSubsectionKey}
          onSectionClick={handleSectionClick}
          isPdfLoaded={isPdfLoaded && !isGeneratingPdf && activeProject && pdfUrls[activeProject.documentId]}
          projects={projects}
          onProjectSelect={handleProjectSelect}
          onNewProjectClick={handleNewProjectClick}
          isLoadingProjects={isLoadingProjects}
          subsectionStatus={activeProject ? subsectionStatus[activeProject.documentId] : {}}
          className="w-72 flex-shrink-0"
        />

        <main className="w-[40%] min-w-[600px] flex flex-col bg-white border-r overflow-hidden">
          <div className="border-b px-8 py-4 flex-shrink-0">
            <div className="flex items-center space-x-2">
              {activeProject ? (
                <>
                  <h1 className="text-xl font-semibold">{activeProject.name}</h1>
                  {activeSection && (
                    <>
                      <span className="text-gray-400">→</span>
                      <h2 className="text-lg text-gray-600">{activeSection}</h2>
                    </>
                  )}
                  {activeSubsection && (
                    <>
                      <span className="text-gray-400">→</span>
                      <h3 className="text-base text-gray-500">{activeSubsection}</h3>
                    </>
                  )}
                </>
              ) : (
                <h1 className="text-xl font-semibold">Wählen Sie ein Projekt aus</h1>
              )}
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            {activeProject ? (
              <>
                <ChatMessages
                  messages={currentMessages}
                  isLoading={isLoading}
                  isStartingConversation={isStartingConversation}
                  messagesEndRef={messagesEndRef}
                />

                <ChatInput
                  inputMessage={inputMessage}
                  onInputChange={(e) => setInputMessage(e.target.value)}
                  onSubmit={handleSendMessage}
                  isLoading={isLoading}
                  hasActiveConversation={!!activeSubsectionData}
                  selectedFile={selectedFile}
                  onFileSelect={handleFileSelect}
                  onFileRemove={() => setSelectedFile(null)}
                  fileError={fileError}
                  dragActive={dragActive}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  fileInputRef={fileInputRef}
                  inputRef={inputRef}
                  onApproveData={handleApproveData}
                  isApprovingData={isApprovingData}
                  isSubsectionApproved={
                    activeProject && activeSectionKey && activeSubsectionKey ? 
                    isSubsectionApproved(activeProject.documentId, activeSectionKey, activeSubsectionKey) : 
                    false
                  }
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p className="mb-2 text-lg">Kein Projekt ausgewählt</p>
                <p className="text-sm">Wählen Sie ein Projekt aus der Seitenleiste aus oder erstellen Sie ein neues Projekt</p>
              </div>
            )}
          </div>
        </main>

        <PdfPreview
          pdfUrl={activeProject ? pdfUrls[activeProject.documentId] : null}
          onDownloadPdf={handleDownloadPDF}
          isGeneratingPdf={isGeneratingPdf}
          activeSection={activeSection}
          activeSubsection={activeSubsection}
          onLoad={handlePdfLoad}
          className="flex-1"
        />
      </div>

      {isCreateModalOpen && (
        <CreateProjectModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreateProject={handleCreateProject}
          documentTypes={Object.keys(documentStructure)}
        />
      )}
    </div>
  )
}