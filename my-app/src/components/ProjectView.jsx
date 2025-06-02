import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { PdfPreview } from './PdfPreview';
import { EditSectionDataModal } from './EditSectionDataModal';
import { CoverPageEditor } from './CoverPageEditor';
import { useConversation } from '../hooks/useConversation';
import { useFileUpload } from '../hooks/useFileUpload';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE, documentStructure, API_BASE_URL } from '../constants/documentStructure';

const ProjectView = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const { getAuthHeader } = useAuth();
  
  const [activeProject, setActiveProject] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [activeSubsection, setActiveSubsection] = useState(null);
  const [activeSectionKey, setActiveSectionKey] = useState(null);
  const [activeSubsectionKey, setActiveSubsectionKey] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState('');
  const [isPdfLoaded, setIsPdfLoaded] = useState(false);
  const [projectLoading, setProjectLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Cover page state
  const [isDeckblattActive, setIsDeckblattActive] = useState(false);
  
  // New state for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [sectionData, setSectionData] = useState('');
  const [isFetchingSectionData, setIsFetchingSectionData] = useState(false);

  const {
    getCurrentMessages,
    isLoading: isMessageLoading,
    isStartingConversation,
    isGeneratingPdf,
    isApprovingData,
    pdfUrls,
    selectSubsection,
    sendMessage,
    downloadPdf,
    loadExistingProject,
    activeSubsection: getActiveSubsection,
    subsectionStatus,
    isSubsectionApproved,
    startSubsectionConversation,
    fetchSubsectionMessages,
    fetchPdfPreview,
    setMessages,
    setIsLoading
  } = useConversation();

  const {
    isUploading,
    uploadFileWithMessage,
    resetCache: resetFileCache
  } = useFileUpload();

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Function to fetch section data for the active subsection
  const fetchSectionData = async () => {
    if (!activeProject?.documentId || !activeSectionKey || !activeSubsectionKey) {
      console.error('Cannot fetch section data - missing documentId, section, or subsection');
      return null;
    }
    
    setIsFetchingSectionData(true);
    
    try {
      const url = `${API_BASE_URL}/conversation/${activeProject.documentId}/section-data/${activeSectionKey}/${activeSubsectionKey}`;
      console.log('Fetching section data from:', url);
      
      const response = await fetch(url, {
        headers: {
          ...getAuthHeader(),
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch section data:', {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText
        });
        throw new Error(`Failed to fetch section data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Section data fetched successfully:', data);
      
      return data;
    } catch (error) {
      console.error('Error fetching section data:', error);
      return null;
    } finally {
      setIsFetchingSectionData(false);
    }
  };
  
  // Function to update section data
  const updateSectionData = async (value) => {
    if (!activeProject?.documentId || !activeSectionKey || !activeSubsectionKey) {
      console.error('Cannot update section data - missing documentId, section, or subsection');
      throw new Error('Missing required data');
    }
    
    try {
      const url = `${API_BASE_URL}/conversation/${activeProject.documentId}/section-data/${activeSectionKey}/${activeSubsectionKey}`;
      console.log('Updating section data at:', url);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ value }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to update section data:', {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText
        });
        throw new Error(`Failed to update section data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Section data updated successfully:', data);
      
      return data;
    } catch (error) {
      console.error('Error updating section data:', error);
      throw error;
    }
  };
  
  // Function to update and approve section data in one step
  const updateAndApproveSectionData = async (value, notifyAssistant = true) => {
    if (!activeProject?.documentId || !activeSectionKey || !activeSubsectionKey) {
      console.error('Cannot update and approve section data - missing documentId, section, or subsection');
      throw new Error('Missing required data');
    }
    
    try {
      const url = `${API_BASE_URL}/conversation/${activeProject.documentId}/update-and-approve/${activeSectionKey}/${activeSubsectionKey}`;
      console.log('Updating and approving section data at:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({ 
          value,
          notify_assistant: notifyAssistant
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to update and approve section data:', {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText
        });
        throw new Error(`Failed to update and approve section data: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Section data updated and approved successfully:', data);
      
      // Refresh the PDF after approval
      await fetchPdfPreview(activeProject.documentId);
      
      return data;
    } catch (error) {
      console.error('Error updating and approving section data:', error);
      throw error;
    }
  };

  // Function to handle opening the edit modal
  const handleEditSectionData = async () => {
    try {
      // Fetch the current section data
      const data = await fetchSectionData();
      
      if (data) {
        // Set the data in state for the modal
        setSectionData(data.value || '');
        
        // Open the modal
        setIsEditModalOpen(true);
      }
    } catch (error) {
      console.error('Error preparing to edit section data:', error);
    }
  };
  
  // Function to handle updating section data from the modal
  const handleUpdateSectionData = async (value) => {
    try {
      await updateSectionData(value);
      // Update local state
      setSectionData(value);
      return true;
    } catch (error) {
      console.error('Error updating section data:', error);
      throw error;
    }
  };
  
  // Function to handle updating and approving section data from the modal
  const handleUpdateAndApproveSectionData = async (value, notifyAssistant) => {
    try {
      await updateAndApproveSectionData(value, notifyAssistant);
      // Update local state
      setSectionData(value);
      return true;
    } catch (error) {
      console.error('Error updating and approving section data:', error);
      throw error;
    }
  };

  // Load project details when component mounts
  useEffect(() => {
    const fetchProjectDetails = async () => {
      console.log('%c [ProjectView] fetchProjectDetails - START', 'background: #ec4899; color: white', { projectId });
      setProjectLoading(true);
      setError('');
      
      try {
        // Fetch project details with auth header
        console.log('%c [ProjectView] Fetching project details', 'background: #ec4899; color: white', { projectId });
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch project: ${response.status}`);
        }
        
        const projectData = await response.json();
        console.log('%c [ProjectView] Project data fetched', 'background: #ec4899; color: white', projectData);
        
        // Format project data
        const formattedProject = {
          id: projectData.id,
          name: projectData.name,
          topic: projectData.topic,
          documentId: projectData.document_id,
          createdAt: projectData.created_at || new Date().toISOString(),
          hasPdf: projectData.has_pdf || false,
          createdBy: projectData.created_by
        };
        
        setActiveProject(formattedProject);
        
        // Load project data including conversation history and PDF status
        console.log('%c [ProjectView] Loading existing project data', 'background: #ec4899; color: white', { 
          projectId, documentId: formattedProject.documentId 
        });
        await loadExistingProject(projectId, formattedProject.documentId);
        
        // Update PDF loaded state
        setIsPdfLoaded(formattedProject.hasPdf);
        
        // Check if there's an existing active conversation from the hook state
        const active = getActiveSubsection(formattedProject.documentId);
        console.log('%c [ProjectView] Active subsection from hook state:', 'background: #ec4899; color: white', active);
        
        // If there's an active subsection, use it to update the UI
        if (active && active.section && active.subsection) {
          // Set the active keys first
          setActiveSectionKey(active.section);
          setActiveSubsectionKey(active.subsection);
          
          // Get section and subsection titles
          const { sectionTitle, subsectionTitle } = getSectionAndSubsectionTitles(
            formattedProject.topic, 
            active.section, 
            active.subsection
          );
          
          setActiveSection(sectionTitle);
          setActiveSubsection(subsectionTitle);
          
          console.log('%c [ProjectView] Set active subsection in UI:', 'background: #ec4899; color: white', {
            sectionKey: active.section,
            subsectionKey: active.subsection,
            sectionTitle,
            subsectionTitle
          });
        } else {
          // No active subsection exists - this is intended for first project creation
          // Don't select any section/subsection by default
          console.log('%c [ProjectView] No active subsection found, not selecting any subsection', 'background: #ec4899; color: white');
        }
        
        console.log('%c [ProjectView] fetchProjectDetails - COMPLETE', 'background: #ec4899; color: white');
      } catch (err) {
        console.error('%c [ProjectView] Failed to load project:', 'background: #ef4444; color: white', err);
        setError('Failed to load project. Please try again later.');
      } finally {
        setProjectLoading(false);
      }
    };
    
    fetchProjectDetails();
  }, [projectId, getAuthHeader]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && activeProject && activeSectionKey && activeSubsectionKey) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      
      // Debug messages changing
      const messages = getCurrentMessages(activeProject.documentId, activeSectionKey, activeSubsectionKey);
      console.log('%c [ProjectView] Messages changed:', 'background: #ec4899; color: white', {
        documentId: activeProject.documentId, 
        section: activeSectionKey, 
        subsection: activeSubsectionKey,
        messagesCount: messages.length
      });
    }
  }, [getCurrentMessages(activeProject?.documentId, activeSectionKey, activeSubsectionKey), 
      activeProject, activeSectionKey, activeSubsectionKey]);

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
  };

  const handleSubsectionClick = async (sectionTitle, subsectionTitle, sectionKey, subsectionKey) => {
    console.log('%c [ProjectView] handleSubsectionClick - START', 'background: #a855f7; color: white', {
      sectionTitle, subsectionTitle, sectionKey, subsectionKey
    });
    
    if (!activeProject) {
      console.log('%c [ProjectView] handleSubsectionClick - No active project', 'background: #a855f7; color: white');
      return;
    }
    
    // Don't allow clicking on subsections if PDF is not loaded
    if (!isPdfLoaded && activeProject.hasPdf) {
      console.log('%c [ProjectView] PDF not loaded yet, waiting before allowing subsection selection', 'background: #a855f7; color: white');
      return;
    }
    
    // Check if this is the currently active subsection - no need to do anything in that case
    if (activeSectionKey === sectionKey && activeSubsectionKey === subsectionKey) {
      console.log('%c [ProjectView] This subsection is already active, skipping', 'background: #a855f7; color: white', {
        section: sectionKey,
        subsection: subsectionKey
      });
      return;
    }
    
    // Update the UI state first
    setActiveSection(sectionTitle);
    setActiveSubsection(subsectionTitle);
    setActiveSectionKey(sectionKey);
    setActiveSubsectionKey(subsectionKey);
    
    // Deactivate cover page when selecting a subsection
    setIsDeckblattActive(false);
    
    // Check if this subsection already has a conversation
    const key = `${sectionKey}/${subsectionKey}`;
    const subStatus = subsectionStatus[activeProject.documentId] || {};
    const hasConversation = subStatus[key]?.hasConversation || false;
    
    console.log('%c [ProjectView] Subsection status check', 'background: #a855f7; color: white', {
      documentId: activeProject.documentId,
      sectionKey,
      subsectionKey,
      key,
      hasConversation,
      subsectionStatus: subStatus
    });
    
    try {
      if (hasConversation) {
        // If conversation exists, select it
        console.log('%c [ProjectView] Selecting existing subsection conversation', 'background: #a855f7; color: white', {
          documentId: activeProject.documentId,
          sectionKey,
          subsectionKey
        });
        
        const selectionResult = await selectSubsection(activeProject.documentId, sectionKey, subsectionKey);
        console.log('%c [ProjectView] Subsection selection result', 'background: #a855f7; color: white', selectionResult);
        
        // Check if we have messages, if not we'll need to fetch them
        const currentMessages = getCurrentMessages(activeProject.documentId, sectionKey, subsectionKey);
        if (currentMessages.length === 0 && selectionResult.hasConversation) {
          // If we don't have messages locally but the conversation exists, fetch them
          console.log('%c [ProjectView] No messages found locally for existing conversation, fetching them', 'background: #a855f7; color: white');
          await fetchSubsectionMessages(activeProject.documentId, sectionKey, subsectionKey);
        }
      } else {
        // Otherwise start a new conversation for this subsection
        console.log('%c [ProjectView] Starting new subsection conversation', 'background: #a855f7; color: white', {
          documentId: activeProject.documentId,
          sectionKey,
          subsectionKey
        });
        
        const conversationResult = await startSubsectionConversation(activeProject.documentId, sectionKey, subsectionKey);
        console.log('%c [ProjectView] New subsection conversation result', 'background: #a855f7; color: white', conversationResult);
      }
      
      // Log the messages after selection/initialization
      const messages = getCurrentMessages(activeProject.documentId, sectionKey, subsectionKey);
      console.log('%c [ProjectView] Messages after subsection handling', 'background: #a855f7; color: white', {
        messageCount: messages.length,
        messages: messages.map(m => ({ role: m.role, content_preview: m.content.substring(0, 50), source: m.source }))
      });
    } catch (error) {
      console.error('%c [ProjectView] Error handling subsection click:', 'background: #ef4444; color: white', error);
    }
    
    console.log('%c [ProjectView] handleSubsectionClick - COMPLETE', 'background: #a855f7; color: white');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!inputMessage.trim() && !selectedFile) || !activeProject) return;
    
    // Store message locally to allow clearing input immediately
    const messageToSend = inputMessage.trim();
    
    // Clear message input immediately for better user experience
    setInputMessage('');
    
    // Get message key for this subsection
    const messageKey = `${activeProject.documentId}/${activeSectionKey}/${activeSubsectionKey}`;
    
    try {
      if (selectedFile) {
        // If we have a file, use the uploadFileWithMessage endpoint
        console.log('ProjectView: Sending message with file:', {
          documentId: activeProject.documentId,
          fileName: selectedFile.name,
          hasMessage: !!messageToSend
        });
        
        // Show loading state by setting isLoading
        setIsLoading(true);
        
        // Add user's message to conversation immediately
        if (messageToSend) {
          setMessages(prev => ({
            ...prev,
            [messageKey]: [...(prev[messageKey] || []), {
              role: 'user',
              content: messageToSend,
              timestamp: new Date().toISOString()
            }]
          }));
        } else {
          // If no text message, add a placeholder about the file
          setMessages(prev => ({
            ...prev,
            [messageKey]: [...(prev[messageKey] || []), {
              role: 'user',
              content: `[Datei: ${selectedFile.name}]`,
              timestamp: new Date().toISOString()
            }]
          }));
        }
        
        // Define a callback for refreshing the PDF after upload
        const refreshPdfCallback = (docId) => {
          console.log('ProjectView: Refreshing PDF after file upload with message', { docId });
          return fetchPdfPreview(docId);
        };
        
        // Use uploadFileWithMessage with PDF refresh callback
        const response = await uploadFileWithMessage(
          activeProject.documentId,
          selectedFile,
          messageToSend,
          refreshPdfCallback // Pass PDF refresh callback
        );
        
        console.log('File upload with message response:', response);
        
        // Refresh conversation history to get the actual assistant response
        if (response) {
          console.log('File upload successful, refreshing conversation history');
          await fetchSubsectionMessages(activeProject.documentId, activeSectionKey, activeSubsectionKey);
        }
        
        // Clear file after successful upload
        setSelectedFile(null);
        
      } else {
        // If no file, use the regular message sending which already handles loading state
        // and conversation updates
        await sendMessage(messageToSend, activeProject.documentId);
      }
      
      // Input already cleared above
      setFileError('');
    } catch (error) {
      console.error('Error sending message or file:', error);
      setFileError('Fehler beim Senden der Nachricht oder Datei. Bitte versuchen Sie es erneut.');
      
      // Add error message to conversation
      setMessages(prev => ({
        ...prev,
        [messageKey]: [...(prev[messageKey] || []), {
          role: 'assistant',
          content: 'Es gab ein Problem beim Senden der Nachricht. Bitte versuchen Sie es erneut.',
          timestamp: new Date().toISOString()
        }]
      }));
    } finally {
      // Ensure loading state is reset when done
      setIsLoading(false);
    }
  };

  const validateFile = (file) => {
    if (!file) return { valid: false, error: 'Keine Datei ausgewählt' };
    
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return { valid: false, error: 'Ungültiger Dateityp. Bitte wählen Sie eine PDF oder DOCX Datei.' };
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: `Datei zu groß. Die maximale Dateigröße beträgt ${MAX_FILE_SIZE / (1024 * 1024)} MB.` 
      };
    }
    
    return { valid: true, error: '' };
  };

  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      const file = files[0];
      const validation = validateFile(file);
      
      if (validation.valid) {
        // Just store the file and wait for the send button to be pressed
        setSelectedFile(file);
        setFileError('');
      } else {
        setFileError(validation.error);
      }
    }
  };

  const handleDrag = (e, isActive) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(isActive);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const validation = validateFile(file);
      
      if (validation.valid) {
        // Just store the file and wait for the send button to be pressed
        setSelectedFile(file);
        setFileError('');
      } else {
        setFileError(validation.error);
      }
    }
  };

  const handlePdfLoad = () => {
    setIsPdfLoaded(true);
  };

  const handleDownloadPDF = async () => {
    if (activeProject) {
      await downloadPdf(activeProject.topic, activeProject.documentId);
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Cover page handlers
  const handleDeckblattClick = () => {
    console.log('Deckblatt clicked');
    setIsDeckblattActive(true);
    // Clear any active subsection when switching to cover page
    setActiveSection(null);
    setActiveSubsection(null);
    setActiveSectionKey(null);
    setActiveSubsectionKey(null);
  };

  const handleCoverPageSave = async () => {
    console.log('Cover page saved, refreshing PDF');
    // Refresh the PDF after cover page is saved
    if (activeProject?.documentId) {
      await fetchPdfPreview(activeProject.documentId);
    }
  };

  // When project ID changes, reset file cache to ensure fresh data
  useEffect(() => {
    if (projectId) {
      resetFileCache();
    }
  }, [projectId, resetFileCache]);

  // Debug: Track when pdfUrls change
  useEffect(() => {
    if (activeProject?.documentId) {
      const currentPdfUrl = pdfUrls[activeProject.documentId];
      console.log('ProjectView: pdfUrls changed for document:', {
        documentId: activeProject.documentId,
        currentPdfUrl,
        allPdfUrls: pdfUrls
      });
    }
  }, [pdfUrls, activeProject?.documentId]);

  // Debug: Log on every render to see if component is re-rendering
  console.log('ProjectView: Component rendering with pdfUrls:', {
    activeProjectId: activeProject?.documentId,
    pdfUrls,
    currentPdfUrl: activeProject?.documentId ? pdfUrls[activeProject.documentId] : null,
    timestamp: new Date().toISOString()
  });

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-stone-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div>
          </div>
          <h3 className="text-lg font-semibold text-stone-800 mb-2">Loading Project</h3>
          <p className="text-stone-600">Please wait while we load your document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
        <div className="card-erdbaron p-8 max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 text-red-500">⚠</div>
          </div>
          <h2 className="text-xl font-bold text-red-700 mb-4">Error</h2>
          <p className="text-stone-700 mb-6">{error}</p>
          <button
            onClick={handleBackToDashboard}
            className="btn-erdbaron-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-stone-50">
      <Sidebar 
        selectedTopic={activeProject?.topic || ''}
        activeSection={activeSection}
        activeSubsection={activeSubsection}
        onSectionClick={handleSubsectionClick}
        subsectionStatus={subsectionStatus[activeProject?.documentId] || {}}
        isSubsectionApproved={isSubsectionApproved}
        documentId={activeProject?.documentId}
        onBackToDashboard={handleBackToDashboard}
        onDeckblattClick={handleDeckblattClick}
        isDeckblattActive={isDeckblattActive}
        onPdfRefresh={fetchPdfPreview}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <div className="border-r border-stone-200 w-2/5 flex flex-col bg-white">
          {/* Conditional rendering: Cover Page Editor or Chat Interface */}
          {isDeckblattActive ? (
            <CoverPageEditor 
              documentId={activeProject?.documentId}
              onSave={handleCoverPageSave}
            />
          ) : (
            <>
              <ChatMessages
                messages={getCurrentMessages(
                  activeProject?.documentId,
                  activeSectionKey,
                  activeSubsectionKey
                )}
                isLoading={isMessageLoading}
                isStartingConversation={isStartingConversation}
                messagesEndRef={messagesEndRef}
                projectName={activeProject?.name || 'Document'}
                sectionTitle={activeSection}
                subsectionTitle={activeSubsection}
                isDeckblattActive={isDeckblattActive}
              />
              <ChatInput
                inputMessage={inputMessage}
                onInputChange={(e) => setInputMessage(e.target.value)}
                onSubmit={handleSendMessage}
                isLoading={isMessageLoading}
                hasActiveConversation={!!(activeSectionKey && activeSubsectionKey)}
                selectedFile={selectedFile}
                onFileSelect={handleFileSelect}
                onFileRemove={() => setSelectedFile(null)}
                fileError={fileError}
                dragActive={dragActive}
                onDragEnter={(e) => handleDrag(e, true)}
                onDragLeave={(e) => handleDrag(e, false)}
                onDrop={handleDrop}
                fileInputRef={fileInputRef}
                inputRef={inputRef}
                onEditSectionData={handleEditSectionData}
                isApprovingData={isApprovingData || isFetchingSectionData}
                isUploading={isUploading}
                isSubsectionApproved={
                  activeProject && activeSectionKey && activeSubsectionKey ? 
                  isSubsectionApproved(activeProject.documentId, activeSectionKey, activeSubsectionKey) : 
                  false
                }
              />
            </>
          )}
        </div>
        
        {/* Debug: Log PDF URL before passing to PdfPreview */}
        {(() => {
          const currentPdfUrl = activeProject?.documentId ? pdfUrls[activeProject.documentId] : null;
          console.log('ProjectView: Rendering PdfPreview with URL:', {
            documentId: activeProject?.documentId,
            pdfUrl: currentPdfUrl,
            timestamp: new Date().toISOString()
          });
          return null;
        })()}
        
        <PdfPreview
          key={activeProject?.documentId ? `pdf-${activeProject.documentId}-${pdfUrls[activeProject.documentId] || 'no-url'}` : 'no-project'}
          pdfUrl={activeProject?.documentId ? pdfUrls[activeProject.documentId] : null}
          onDownloadPdf={handleDownloadPDF}
          isGeneratingPdf={isGeneratingPdf}
          activeSubsection={activeSubsection}
          onLoad={handlePdfLoad}
          onRefreshPdf={() => {
            console.log('onRefreshPdf called in ProjectView', { 
              documentId: activeProject?.documentId 
            });
            if (!activeProject?.documentId) {
              console.warn('No active project document ID available');
              return Promise.resolve(null);
            }
            console.log('Calling fetchPdfPreview with document ID:', activeProject.documentId);
            return fetchPdfPreview(activeProject.documentId);
          }}
          className="w-3/5"
        />
      </div>
      
      {/* Edit Section Data Modal */}
      <EditSectionDataModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        documentId={activeProject?.documentId}
        section={activeSectionKey}
        sectionTitle={activeSection}
        subsection={activeSubsectionKey}
        subsectionTitle={activeSubsection}
        onUpdateAndApprove={handleUpdateAndApproveSectionData}
        onUpdate={handleUpdateSectionData}
        initialValue={sectionData}
      />
    </div>
  );
};

export default ProjectView; 