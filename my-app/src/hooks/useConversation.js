import { useState } from 'react'
import { API_BASE_URL } from '../constants/documentStructure'

export const useConversation = () => {
  const [messages, setMessages] = useState({}) // Store messages by document ID and subsection
  const [isLoading, setIsLoading] = useState(false)
  const [isStartingConversation, setIsStartingConversation] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [pdfUrls, setPdfUrls] = useState({})
  const [activeSubsection, setActiveSubsection] = useState({}) // Track active subsection for each document
  const [subsectionStatus, setSubsectionStatus] = useState({}) // Track subsections with active conversations

  const fetchPdfPreview = async (documentId) => {
    console.log('Fetching PDF preview for document:', documentId);
    setIsGeneratingPdf(true)
    try {
      const url = `${API_BASE_URL}/documents/${documentId}/pdf`;
      console.log('Making API request to fetch PDF:', url);
      
      const response = await fetch(url)
      if (!response.ok) {
        const errorText = await response.text();
        console.error('PDF fetch failed:', {
          status: response.status, 
          statusText: response.statusText,
          responseText: errorText,
          documentId
        });
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText} - ${errorText}`)
      }
      
      const blob = await response.blob()
      const pdfUrl = URL.createObjectURL(blob)
      console.log('PDF fetched successfully, created URL:', pdfUrl);
      
      setPdfUrls(prev => ({
        ...prev,
        [documentId]: pdfUrl
      }))
    } catch (error) {
      console.error('Failed to fetch PDF:', error)
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  // Fetch all subsections for a document and their conversation status
  const fetchSubsections = async (documentId) => {
    console.log('Fetching subsections for document:', documentId);
    
    try {
      const response = await fetch(`${API_BASE_URL}/conversation/${documentId}/subsections`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch subsections:', {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText
        });
        throw new Error(`Failed to fetch subsections: ${response.status} ${response.statusText}`);
      }
      
      const subsections = await response.json();
      console.log('Fetched subsections:', subsections);
      
      if (!Array.isArray(subsections)) {
        console.error('Expected subsections to be an array, but got:', typeof subsections);
        return {};
      }
      
      // Update subsection status
      const subsectionStatusMap = {};
      
      subsections.forEach(sub => {
        if (!sub || !sub.section || !sub.subsection) {
          console.warn('Invalid subsection entry:', sub);
          return;
        }
        
        const key = `${sub.section}/${sub.subsection}`;
        subsectionStatusMap[key] = {
          hasConversation: !!sub.has_conversation,
          section: sub.section,
          subsection: sub.subsection
        };
      });
      
      console.log('Processed subsection status map:', subsectionStatusMap);
      
      setSubsectionStatus(prev => ({
        ...prev,
        [documentId]: subsectionStatusMap
      }));
      
      return subsectionStatusMap;
    } catch (error) {
      console.error('Failed to fetch subsections:', error);
      return {};
    }
  }

  // Fetch messages for a specific subsection
  const fetchSubsectionMessages = async (documentId, section, subsection) => {
    console.log('%c Fetching messages for subsection:', 'background: #34d399; color: #000', { 
      documentId, 
      section, 
      subsection 
    });
    
    if (!documentId || !section || !subsection) {
      console.error('Missing required parameters for fetchSubsectionMessages:', { documentId, section, subsection });
      return [];
    }
    
    try {
      const url = `${API_BASE_URL}/conversation/${documentId}/messages/${section}/${subsection}`;
      console.log('Messages API URL:', url);
      
      const response = await fetch(url);
      
      const responseText = await response.text();
      
      if (!response.ok) {
        console.error('%c Failed to fetch subsection messages:', 'background: #ef4444; color: #fff', {
          status: response.status,
          statusText: response.statusText,
          responseText,
          url
        });
        
        // Try to parse error response
        let errorDetail = 'Unknown error';
        try {
          const errorJson = JSON.parse(responseText);
          errorDetail = errorJson.detail || responseText;
        } catch {
          errorDetail = responseText;
        }
        
        throw new Error(`Failed to fetch subsection messages: ${errorDetail}`);
      }
      
      // Try to parse the response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (error) {
        console.error('Failed to parse response JSON:', error);
        throw new Error('Invalid response format from server');
      }
      
      console.log('%c Fetched subsection messages:', 'background: #34d399; color: #000', data);
      
      // Check if we have a proper response format
      let messages = [];
      
      if (data && Array.isArray(data.messages)) {
        messages = data.messages;
      } else if (data && typeof data === 'object' && !Array.isArray(data)) {
        // Alternative format where the response might be the messages directly
        const possibleMessages = Object.values(data).find(val => Array.isArray(val));
        if (possibleMessages) {
          messages = possibleMessages;
        } else {
          console.warn('Could not find messages array in response:', data);
        }
      } else if (Array.isArray(data)) {
        // Direct array response
        messages = data;
      } else {
        console.error('Unexpected response format for messages:', data);
      }
      
      // Skip the first message if it's a user message
      if (messages.length > 0 && messages[0].role === 'user') {
        console.log('%c Ignoring first message as it is a user message:', 'background: #f59e0b; color: #000', messages[0]);
        messages = messages.slice(1);
      }
      
      // Ensure all messages have the required fields
      const formattedMessages = messages.map(msg => ({
        id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: msg.role || 'assistant',
        content: msg.content || '',
        timestamp: msg.timestamp || new Date().toISOString()
      }));
      
      // Update messages for this subsection
      const messageKey = `${documentId}/${section}/${subsection}`;
      setMessages(prev => ({
        ...prev,
        [messageKey]: formattedMessages
      }));
      
      return formattedMessages;
    } catch (error) {
      console.error('Failed to fetch subsection messages:', error);
      return [];
    }
  }

  // Start a new conversation for a document
  const startNewConversation = async (topicName, documentId) => {
    console.log('Starting new conversation for document:', documentId);
    setIsStartingConversation(true)
    
    try {
      console.log('Making API request to start conversation:', {
        documentId: documentId,
        topic: topicName,
        url: `${API_BASE_URL}/conversation/${documentId}/start`,
        requestBody: {
          topic: topicName
        }
      })

      const response = await fetch(`${API_BASE_URL}/conversation/${documentId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topicName
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Start conversation failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          documentId: documentId,
          topic: topicName
        })
        throw new Error(`Failed to start conversation: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log('Start conversation successful. Response:', {
        documentId: documentId,
        responseData: data,
        topic: topicName
      })
      
      // The API now returns the section and subsection that was started
      const { section, subsection, message } = data;
      
      // Validate section and subsection
      if (!section || !subsection) {
        console.error('API response missing section or subsection:', data);
        throw new Error('API response missing required section/subsection data');
      }
      
      console.log('Using section and subsection from API response:', { section, subsection });
      
      // Set the active subsection based on the response
      setActiveSubsection(prev => ({
        ...prev,
        [documentId]: { section, subsection }
      }));
      
      // Update subsection status
      setSubsectionStatus(prev => {
        const docStatus = prev[documentId] || {};
        const key = `${section}/${subsection}`;
        
        return {
          ...prev,
          [documentId]: {
            ...docStatus,
            [key]: {
              hasConversation: true,
              hasMessages: true,
              section,
              subsection
            }
          }
        };
      });
      
      // Store the initial message
      const messageKey = `${documentId}/${section}/${subsection}`;
      setMessages(prev => ({
        ...prev,
        [messageKey]: [{
          role: 'assistant',
          content: message || 'Willkommen zum neuen Projekt! Wie kann ich Ihnen helfen?',
          timestamp: new Date().toISOString()
        }]
      }));

      // Fetch PDF preview
      await fetchPdfPreview(documentId)
      
      // Fetch all subsections
      await fetchSubsections(documentId);
      
      return { 
        success: true, 
        hasPdf: false,
        section,
        subsection,
        message
      }
    } catch (error) {
      console.error('Failed to start conversation:', error)
      
      return {
        success: false,
        hasPdf: false,
        error: error.message
      }
    } finally {
      setIsStartingConversation(false)
    }
  }

  // Start a conversation for a specific subsection
  const startSubsectionConversation = async (documentId, section, subsection) => {
    console.log('%c Starting subsection conversation:', 'background: #34d399; color: #000', { 
      documentId, 
      section, 
      subsection 
    });
    
    // Validate inputs
    if (!documentId) {
      console.error('Missing documentId in startSubsectionConversation');
      return { success: false, error: 'Missing documentId' };
    }
    
    if (!section) {
      console.error('Missing section in startSubsectionConversation');
      return { success: false, error: 'Missing section' };
    }
    
    if (!subsection) {
      console.error('Missing subsection in startSubsectionConversation');
      return { success: false, error: 'Missing subsection' };
    }
    
    // Log the exact request we're about to send
    const requestBody = { section, subsection };
    console.log('%c Request body for subsection/start:', 'background: #3b82f6; color: #fff', JSON.stringify(requestBody, null, 2));
    console.log('API URL:', `${API_BASE_URL}/conversation/${documentId}/subsection/start`);
    
    setIsStartingConversation(true)
    
    try {
      const response = await fetch(`${API_BASE_URL}/conversation/${documentId}/subsection/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const responseText = await response.text();
      
      if (!response.ok) {
        console.error('%c Failed to start subsection conversation:', 'background: #ef4444; color: #fff', {
          status: response.status,
          statusText: response.statusText,
          responseText,
          requestBody,
          url: `${API_BASE_URL}/conversation/${documentId}/subsection/start`
        });
        
        // Try to parse error response
        let errorDetail = 'Unknown error';
        try {
          const errorJson = JSON.parse(responseText);
          errorDetail = errorJson.detail || responseText;
        } catch {
          errorDetail = responseText;
        }
        
        throw new Error(`Failed to start subsection conversation: ${errorDetail}`);
      }
      
      // Try to parse the response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (error) {
        console.error('Failed to parse response JSON:', error);
        throw new Error('Invalid response format from server');
      }
      
      console.log('%c Subsection conversation started successfully:', 'background: #34d399; color: #000', data);
      
      // Set the active subsection
      setActiveSubsection(prev => ({
        ...prev,
        [documentId]: { section, subsection }
      }));
      
      // Update subsection status
      setSubsectionStatus(prev => {
        const docStatus = prev[documentId] || {};
        const key = `${section}/${subsection}`;
        
        return {
          ...prev,
          [documentId]: {
            ...docStatus,
            [key]: {
              hasConversation: true,
              hasMessages: true,
              section,
              subsection
            }
          }
        };
      });
      
      // Store the initial message
      const messageKey = `${documentId}/${section}/${subsection}`;
      setMessages(prev => ({
        ...prev,
        [messageKey]: [{
          role: 'assistant',
          content: data.message || 'Willkommen zum Abschnitt!',
          timestamp: new Date().toISOString()
        }]
      }));
      
      return {
        success: true,
        section,
        subsection,
        message: data.message
      };
    } catch (error) {
      console.error('%c Failed to start subsection conversation:', 'background: #ef4444; color: #fff', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      setIsStartingConversation(false)
    }
  }

  // Select a subsection to view/start conversation
  const selectSubsection = async (documentId, section, subsection) => {
    console.log('%c Selecting subsection:', 'background: #34d399; color: #000', { 
      documentId, 
      section, 
      subsection 
    });
    
    if (!documentId || !section || !subsection) {
      console.error('Missing required parameters for selectSubsection:', { documentId, section, subsection });
      return { hasConversation: false, hasMessages: false };
    }
    
    // Log the exact request we're about to send
    const requestBody = { section, subsection };
    console.log('%c Request body for select-subsection:', 'background: #3b82f6; color: #fff', JSON.stringify(requestBody, null, 2));
    console.log('API URL:', `${API_BASE_URL}/conversation/${documentId}/select-subsection`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/conversation/${documentId}/select-subsection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      const responseText = await response.text();
      
      if (!response.ok) {
        console.error('%c Failed to select subsection:', 'background: #ef4444; color: #fff', {
          status: response.status,
          statusText: response.statusText,
          responseText,
          requestBody,
          url: `${API_BASE_URL}/conversation/${documentId}/select-subsection`
        });
        
        // Try to parse error response
        let errorDetail = 'Unknown error';
        try {
          const errorJson = JSON.parse(responseText);
          errorDetail = errorJson.detail || responseText;
        } catch {
          errorDetail = responseText;
        }
        
        throw new Error(`Failed to select subsection: ${errorDetail}`);
      }
      
      // Try to parse the response
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (error) {
        console.error('Failed to parse response JSON:', error);
        throw new Error('Invalid response format from server');
      }
      
      console.log('%c Subsection selection result:', 'background: #34d399; color: #000', result);
      
      // Update active subsection
      setActiveSubsection(prev => ({
        ...prev,
        [documentId]: {
          section,
          subsection
        }
      }));
      
      // Handle different response formats
      const hasMessages = result.has_messages === undefined ? false : !!result.has_messages;
      const threadExists = result.thread_exists === undefined ? false : !!result.thread_exists;
      
      // Update subsection status
      setSubsectionStatus(prev => {
        const docStatus = prev[documentId] || {};
        const key = `${section}/${subsection}`;
        
        return {
          ...prev,
          [documentId]: {
            ...docStatus,
            [key]: {
              ...docStatus[key],
              hasConversation: threadExists,
              hasMessages: hasMessages
            }
          }
        };
      });
      
      // Fetch messages if the thread exists
      if (threadExists) {
        await fetchSubsectionMessages(documentId, section, subsection);
      }
      
      return {
        hasConversation: threadExists,
        hasMessages: hasMessages
      };
    } catch (error) {
      console.error('%c Failed to select subsection:', 'background: #ef4444; color: #fff', error);
      return { hasConversation: false, hasMessages: false };
    }
  }

  // Send a message to the active subsection
  const sendMessage = async (message, documentId) => {
    if (!message.trim() || !documentId) return
    
    // Get the active subsection for this document
    const active = activeSubsection[documentId];
    if (!active || !active.section || !active.subsection) {
      console.error('No active subsection found for document:', documentId);
      return;
    }
    
    const { section, subsection } = active;
    const messageKey = `${documentId}/${section}/${subsection}`;

    const userMessage = { role: 'user', content: message }
    
    // Add user message to the conversation
    setMessages(prev => ({
      ...prev,
      [messageKey]: [...(prev[messageKey] || []), userMessage]
    }))
    
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/conversation/${documentId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Server response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
        throw new Error(`Failed to get response: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      // Add assistant response to the conversation
      setMessages(prev => ({
        ...prev,
        [messageKey]: [...(prev[messageKey] || []), {
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString()
        }]
      }))

      // Fetch updated PDF
      await fetchPdfPreview(documentId)
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => ({
        ...prev,
        [messageKey]: [...(prev[messageKey] || []), {
          role: 'assistant',
          content: 'Es gab ein Problem beim Senden der Nachricht. Bitte versuchen Sie es erneut.'
        }]
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const downloadPdf = async (topic, documentId) => {
    if (!documentId) return

    try {
      const response = await fetch(`${API_BASE_URL}/documents/${documentId}/download`)
      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`)
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${topic}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download PDF:', error)
    }
  }

  const loadExistingProject = async (projectId, documentId) => {
    console.log('Loading existing project with ID:', projectId);
    setIsStartingConversation(true)
    
    try {
      // Fetch project details including conversation history and PDF status
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`)
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to load project:', {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText
        });
        throw new Error(`Failed to load project: ${response.status} ${response.statusText} - ${errorText}`)
      }
      
      const projectData = await response.json()
      console.log('Project loaded successfully:', projectData);
      
      // Fetch all subsections and their status
      const subsections = await fetchSubsections(documentId);
      
      // Fetch PDF for this project if it has a PDF
      if (projectData.has_pdf) {
        console.log('Project has PDF, fetching preview');
        await fetchPdfPreview(documentId)
      } else {
        console.log('Project does not have a PDF yet');
      }
      
      return {
        hasPdf: projectData.has_pdf,
        sectionData: projectData.section_data || {},
        subsections
      }
    } catch (error) {
      console.error('Failed to load project:', error)
      return {
        hasPdf: false,
        sectionData: {},
        subsections: {}
      }
    } finally {
      setIsStartingConversation(false)
    }
  }

  // Get messages for a specific subsection
  const getCurrentMessages = (documentId, section, subsection) => {
    if (!documentId || !section || !subsection) return []
    
    const messageKey = `${documentId}/${section}/${subsection}`
    return messages[messageKey] || []
  }

  // Get the active subsection for a document
  const getActiveSubsection = (documentId) => {
    if (!documentId) {
      console.warn('getActiveSubsection called with null/undefined documentId');
      return null;
    }
    
    const activeData = activeSubsection[documentId];
    
    if (!activeData || typeof activeData !== 'object') {
      return null;
    }
    
    // Ensure we have required properties
    if (!activeData.section || !activeData.subsection) {
      console.warn('Active subsection data is incomplete:', activeData);
      return null;
    }
    
    return {
      section: activeData.section,
      subsection: activeData.subsection
    };
  }

  return {
    messages,
    getCurrentMessages,
    isLoading,
    isStartingConversation,
    isGeneratingPdf,
    pdfUrls,
    activeSubsection: getActiveSubsection,
    subsectionStatus,
    startNewConversation,
    startSubsectionConversation,
    selectSubsection,
    fetchSubsections,
    fetchSubsectionMessages,
    sendMessage,
    setMessages,
    downloadPdf,
    loadExistingProject
  }
} 