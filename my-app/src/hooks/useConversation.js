import { useState } from 'react'
import { API_BASE_URL, documentStructure } from '../constants/documentStructure'
import { useAuth } from '../contexts/AuthContext'

// Debug helper to track conversation calls
const debugConversation = (functionName, data) => {
  console.log(`%c [DEBUG-CONVERSATION] ${functionName}`, 'background: #ffa500; color: #000; padding: 2px 5px; border-radius: 3px; font-weight: bold', data);
};

export const useConversation = () => {
  const { getAuthHeader } = useAuth();
  const [messages, setMessages] = useState({}) // Store messages by document ID and subsection
  const [isLoading, setIsLoading] = useState(false)
  const [isStartingConversation, setIsStartingConversation] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [isApprovingData, setIsApprovingData] = useState(false)
  const [pdfUrls, setPdfUrls] = useState({})
  const [activeSubsection, setActiveSubsection] = useState({}) // Track active subsection for each document
  const [subsectionStatus, setSubsectionStatus] = useState({}) // Track subsections with active conversations
  const [approvedSubsections, setApprovedSubsections] = useState({}) // Track subsections that have been approved

  const fetchPdfPreview = async (documentId) => {
    console.log('Fetching PDF preview for document:', documentId);
    setIsGeneratingPdf(true)
    try {
      // If there's an existing PDF URL for this document, revoke it to prevent memory leaks
      const existingPdfUrl = pdfUrls[documentId];
      if (existingPdfUrl && existingPdfUrl.startsWith('blob:')) {
        console.log('Revoking previous blob URL:', existingPdfUrl);
        URL.revokeObjectURL(existingPdfUrl);
      }
      
      // Add timestamp to URL to prevent caching
      const timestamp = new Date().getTime();
      const url = `${API_BASE_URL}/documents/${documentId}/pdf?t=${timestamp}`;
      console.log('Making API request to fetch PDF:', url);
      
      const response = await fetch(url, {
        headers: {
          ...getAuthHeader(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
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
      // Add timestamp to ensure the URL is always unique
      const pdfUrl = URL.createObjectURL(blob) + '#t=' + timestamp;
      console.log('PDF fetched successfully, created URL:', pdfUrl);
      
      // Update the state with the new URL - use function form to ensure we have the latest state
      setPdfUrls(prev => {
        const newUrls = {
          ...prev,
          [documentId]: pdfUrl
        };
        console.log('Updated PDF URLs:', {
          previous: prev[documentId],
          new: pdfUrl
        });
        return newUrls;
      });
      
      return pdfUrl; // Return the URL for potential direct use
    } catch (error) {
      console.error('Failed to fetch PDF:', error)
      return null;
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  // Fetch all subsections for a document and their conversation status
  const fetchSubsections = async (documentId) => {
    console.log('Fetching subsections for document:', documentId);
    debugConversation('fetchSubsections - ENTRY', { documentId });
    
    try {
      const url = `${API_BASE_URL}/conversation/${documentId}/subsections`;
      debugConversation('fetchSubsections - API CALL', { documentId, url });
      
      const response = await fetch(url, {
        headers: {
          ...getAuthHeader()
        }
      });
      
      const responseText = await response.text();
      
      if (!response.ok) {
        console.error('Failed to fetch subsections:', {
          status: response.status,
          statusText: response.statusText,
          responseText
        });
        throw new Error(`Failed to fetch subsections: ${response.status} ${response.statusText}`);
      }
      
      // Try to parse the response
      let subsections;
      try {
        subsections = JSON.parse(responseText);
        debugConversation('fetchSubsections - API RESPONSE', { documentId, subsections });
      } catch (error) {
        console.error('Failed to parse subsections response:', error);
        throw new Error('Invalid subsections response format from server');
      }
      
      if (!Array.isArray(subsections)) {
        console.error('Expected subsections to be an array, but got:', typeof subsections);
        debugConversation('fetchSubsections - INVALID RESPONSE FORMAT', { 
          documentId, responseType: typeof subsections, subsections 
        });
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
          hasMessages: !!sub.has_messages,
          section: sub.section,
          subsection: sub.subsection
        };
      });
      
      debugConversation('fetchSubsections - PROCESSED STATUS MAP', { 
        documentId, mapSize: Object.keys(subsectionStatusMap).length, subsectionStatusMap 
      });
      
      // Log the result
      console.log('Processed subsection status map:', subsectionStatusMap);
      
      // Update state
      setSubsectionStatus(prev => ({
        ...prev,
        [documentId]: subsectionStatusMap
      }));
      
      debugConversation('fetchSubsections - EXIT SUCCESS', { documentId });
      return subsectionStatusMap;
    } catch (error) {
      console.error('Failed to fetch subsections:', error);
      debugConversation('fetchSubsections - EXIT ERROR', { documentId, error: error.message });
      return {};
    }
  }

  // Fetch messages for a specific subsection
  const fetchSubsectionMessages = async (documentId, section, subsection) => {
    debugConversation('fetchSubsectionMessages - ENTRY', { documentId, section, subsection });
    
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
      debugConversation('fetchSubsectionMessages - API CALL', { documentId, section, subsection, url });
      console.log('Messages API URL:', url);
      
      const response = await fetch(url, {
        headers: {
          ...getAuthHeader()
        }
      });
      
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
      
      debugConversation('fetchSubsectionMessages - API RESPONSE', { 
        documentId, section, subsection, data 
      });
      
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
        timestamp: msg.timestamp || new Date().toISOString(),
        source: 'fetchSubsectionMessages'
      }));
      
      // Update messages for this subsection
      const messageKey = `${documentId}/${section}/${subsection}`;
      debugConversation('fetchSubsectionMessages - STORING MESSAGES', { 
        documentId, section, subsection, messageKey, messageCount: formattedMessages.length
      });
      
      setMessages(prev => {
        const newMessages = {
          ...prev,
          [messageKey]: formattedMessages
        };
        debugConversation('setMessages - IN fetchSubsectionMessages', { 
          documentId, messageKey, messagesCount: formattedMessages.length, 
          firstMessage: formattedMessages.length > 0 ? formattedMessages[0].content.substring(0, 50) : 'NONE'
        });
        return newMessages;
      });
      
      debugConversation('fetchSubsectionMessages - EXIT SUCCESS', { 
        documentId, section, subsection, messageCount: formattedMessages.length 
      });
      
      return formattedMessages;
    } catch (error) {
      console.error('Failed to fetch subsection messages:', error);
      debugConversation('fetchSubsectionMessages - EXIT ERROR', { 
        documentId, section, subsection, error: error.message 
      });
      return [];
    }
  }

  // Start a new conversation for a document - should only be used for initial project setup
  // This uses the /conversation/{document_id}/start endpoint with topic, section, and subsection
  const startNewConversation = async (topicName, documentId, section, subsection) => {
    debugConversation('startNewConversation - ENTRY', { documentId, topicName, section, subsection });
    console.log('Starting new conversation for document (INITIAL PROJECT SETUP):', documentId);
    
    // Clear any existing messages for this document's subsections to avoid duplication issues
    setMessages(prev => {
      const newMessages = { ...prev };
      // Filter out any message entries for this document
      Object.keys(newMessages).forEach(key => {
        if (key.startsWith(`${documentId}/`)) {
          delete newMessages[key];
        }
      });
      debugConversation('startNewConversation - CLEARED EXISTING MESSAGES', { documentId });
      return newMessages;
    });
    
    setIsStartingConversation(true)
    
    try {
      // Make sure we have all required parameters
      if (!documentId || !topicName || !section || !subsection) {
        console.error('Missing required parameters for startNewConversation:', { 
          documentId, topicName, section, subsection 
        });
        throw new Error('Missing required parameters for starting conversation');
      }
      
      const requestBody = {
        topic: topicName,
        section: section,
        subsection: subsection
      };
      
      debugConversation('startNewConversation - API CALL', {
        documentId, topicName, section, subsection,
        url: `${API_BASE_URL}/conversation/${documentId}/start`,
        requestBody
      });
      
      console.log('Making API request to start initial conversation:', {
        documentId: documentId,
        topic: topicName,
        section: section,
        subsection: subsection,
        url: `${API_BASE_URL}/conversation/${documentId}/start`,
        requestBody: JSON.stringify(requestBody)
      })

      const response = await fetch(`${API_BASE_URL}/conversation/${documentId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(requestBody),
      })

      const responseText = await response.text();
      
      if (!response.ok) {
        console.error('Start conversation failed:', {
          status: response.status,
          statusText: response.statusText,
          body: responseText,
          documentId: documentId,
          topic: topicName,
          section: section,
          subsection: subsection,
          requestBody
        })
        throw new Error(`Failed to start conversation: ${response.status} ${response.statusText} - ${responseText}`)
      }

      // Parse the response
      let data;
      try {
        data = JSON.parse(responseText);
        debugConversation('startNewConversation - API RESPONSE', { documentId, responseData: data });
      } catch (error) {
        console.error('Failed to parse response JSON:', error);
        throw new Error(`Invalid response format from server: ${responseText}`);
      }
      
      console.log('Start conversation successful. Response:', {
        documentId: documentId,
        responseData: data,
        topic: topicName
      })
      
      // The API returns the section and subsection that was started
      const { section: returnedSection, subsection: returnedSubsection, message } = data;
      
      // Validate section and subsection
      if (!returnedSection || !returnedSubsection) {
        console.error('API response missing section or subsection:', data);
        throw new Error('API response missing required section/subsection data');
      }
      
      console.log('Using section and subsection from API response:', { 
        section: returnedSection, subsection: returnedSubsection 
      });
      
      // Set the active subsection based on the response
      setActiveSubsection(prev => ({
        ...prev,
        [documentId]: { section: returnedSection, subsection: returnedSubsection }
      }));
      
      // Update subsection status
      setSubsectionStatus(prev => {
        const docStatus = prev[documentId] || {};
        const key = `${returnedSection}/${returnedSubsection}`;
        
        return {
          ...prev,
          [documentId]: {
            ...docStatus,
            [key]: {
              hasConversation: true,
              hasMessages: true,
              section: returnedSection,
              subsection: returnedSubsection
            }
          }
        };
      });
      
      // Ensure the message isn't empty
      const welcomeMessage = message || 'Willkommen zum neuen Projekt! Wie kann ich Ihnen helfen?';
      
      // Store the initial message
      const messageKey = `${documentId}/${returnedSection}/${returnedSubsection}`;
      debugConversation('startNewConversation - STORING MESSAGE', { 
        documentId, messageKey, welcomeMessage, returnedSection, returnedSubsection 
      });
      
      setMessages(prev => {
        const newMessages = {
          ...prev,
          [messageKey]: [{
            id: `initial-${Date.now()}`,
            role: 'assistant',
            content: welcomeMessage,
            timestamp: new Date().toISOString(),
            source: 'startNewConversation'
          }]
        };
        debugConversation('setMessages - IN startNewConversation', { 
          documentId, messageKey, newMessages: newMessages[messageKey] 
        });
        return newMessages;
      });

      // Fetch all subsections
      await fetchSubsections(documentId);
      
      // CRUCIAL STEP: Explicitly select this subsection to ensure it's activated in the backend
      // This is needed so the UI can display the conversation properly and avoid duplicate initialization
      debugConversation('startNewConversation - EXPLICITLY SELECTING SUBSECTION', {
        documentId, section: returnedSection, subsection: returnedSubsection
      });
      
      try {
        const selectResult = await selectSubsection(documentId, returnedSection, returnedSubsection);
        debugConversation('startNewConversation - SUBSECTION SELECTION RESULT', {
          documentId, section: returnedSection, subsection: returnedSubsection, selectResult
        });
      } catch (selectError) {
        // Log but don't fail the whole operation if selection fails
        console.error('Failed to select subsection after starting conversation:', selectError);
        debugConversation('startNewConversation - SUBSECTION SELECTION ERROR', {
          documentId, section: returnedSection, subsection: returnedSubsection, error: selectError.message
        });
      }
      
      debugConversation('startNewConversation - EXIT SUCCESS', { 
        documentId, returnedSection, returnedSubsection 
      });
      
      return { 
        success: true, 
        hasPdf: false,
        section: returnedSection,
        subsection: returnedSubsection,
        message: welcomeMessage
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
      debugConversation('startNewConversation - EXIT ERROR', { documentId, error: error.message });
      
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
    debugConversation('startSubsectionConversation - ENTRY', { documentId, section, subsection });
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
    
    // Clear any existing messages for this specific subsection to avoid duplication
    const messageKey = `${documentId}/${section}/${subsection}`;
    setMessages(prev => {
      const newMessages = { ...prev };
      if (newMessages[messageKey]) {
        delete newMessages[messageKey];
        debugConversation('startSubsectionConversation - CLEARED EXISTING MESSAGES', { 
          documentId, section, subsection, messageKey 
        });
      }
      return newMessages;
    });
    
    // Use the subsection/start endpoint for starting conversations for specific subsections
    const requestBody = { section, subsection };
    debugConversation('startSubsectionConversation - API CALL', {
      documentId, section, subsection,
      url: `${API_BASE_URL}/conversation/${documentId}/subsection/start`
    });
    console.log('%c Request body for subsection/start:', 'background: #3b82f6; color: #fff', JSON.stringify(requestBody, null, 2));
    console.log('API URL:', `${API_BASE_URL}/conversation/${documentId}/subsection/start`);
    
    setIsStartingConversation(true)
    
    try {
      const response = await fetch(`${API_BASE_URL}/conversation/${documentId}/subsection/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
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
      
      debugConversation('startSubsectionConversation - API RESPONSE', { documentId, responseData: data });
      console.log('%c Subsection conversation started successfully:', 'background: #34d399; color: #000', data);
      
      // Extract section, subsection and message from the response
      // Use the returned values from the API if available, otherwise fallback to the provided values
      const returnedSection = data.section || section;
      const returnedSubsection = data.subsection || subsection;
      const welcomeMessage = data.message || 'Conversation started';
      
      // Set the active subsection
      setActiveSubsection(prev => ({
        ...prev,
        [documentId]: { section: returnedSection, subsection: returnedSubsection }
      }));
      
      // Update subsection status
      setSubsectionStatus(prev => {
        const docStatus = prev[documentId] || {};
        const key = `${returnedSection}/${returnedSubsection}`;
        
        return {
          ...prev,
          [documentId]: {
            ...docStatus,
            [key]: {
              hasConversation: true,
              hasMessages: true,
              section: returnedSection,
              subsection: returnedSubsection
            }
          }
        };
      });
      
      // Store the initial message
      const updatedMessageKey = `${documentId}/${returnedSection}/${returnedSubsection}`;
      debugConversation('startSubsectionConversation - STORING MESSAGE', {
        documentId, messageKey: updatedMessageKey, message: welcomeMessage, returnedSection, returnedSubsection
      });
      
      setMessages(prev => {
        const newMessages = {
          ...prev,
          [updatedMessageKey]: [{
            id: `subsection-initial-${Date.now()}`,
            role: 'assistant',
            content: welcomeMessage,
            timestamp: new Date().toISOString(),
            source: 'startSubsectionConversation'
          }]
        };
        debugConversation('setMessages - IN startSubsectionConversation', { 
          documentId, messageKey: updatedMessageKey, newMessages: newMessages[updatedMessageKey] 
        });
        return newMessages;
      });
      
      // CRUCIAL STEP: Explicitly select this subsection to ensure it's properly activated
      debugConversation('startSubsectionConversation - EXPLICITLY SELECTING SUBSECTION', {
        documentId, section: returnedSection, subsection: returnedSubsection
      });
      
      try {
        const selectResult = await selectSubsection(documentId, returnedSection, returnedSubsection);
        debugConversation('startSubsectionConversation - SUBSECTION SELECTION RESULT', {
          documentId, section: returnedSection, subsection: returnedSubsection, selectResult
        });
      } catch (selectError) {
        // Log but don't fail the whole operation if selection fails
        console.error('Failed to select subsection after starting conversation:', selectError);
        debugConversation('startSubsectionConversation - SUBSECTION SELECTION ERROR', {
          documentId, section: returnedSection, subsection: returnedSubsection, error: selectError.message
        });
      }
      
      debugConversation('startSubsectionConversation - EXIT SUCCESS', {
        documentId, returnedSection, returnedSubsection, message: welcomeMessage
      });
      
      return {
        success: true,
        section: returnedSection,
        subsection: returnedSubsection,
        message: welcomeMessage
      };
    } catch (error) {
      console.error('%c Failed to start subsection conversation:', 'background: #ef4444; color: #fff', error);
      debugConversation('startSubsectionConversation - EXIT ERROR', { documentId, section, subsection, error: error.message });
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
    debugConversation('selectSubsection - ENTRY', { documentId, section, subsection });
    console.log('%c Selecting subsection:', 'background: #34d399; color: #000', { 
      documentId, 
      section, 
      subsection 
    });
    
    if (!documentId || !section || !subsection) {
      console.error('Missing required parameters for selectSubsection:', { documentId, section, subsection });
      debugConversation('selectSubsection - EXIT EARLY (missing params)', { documentId, section, subsection });
      return { hasConversation: false, hasMessages: false };
    }
    
    // Log the exact request we're about to send
    const requestBody = { section, subsection };
    debugConversation('selectSubsection - API CALL', { 
      documentId, 
      section, 
      subsection,
      url: `${API_BASE_URL}/conversation/${documentId}/select-subsection`,
      requestBody: JSON.stringify(requestBody)
    });
    
    console.log('%c Request body for select-subsection:', 'background: #3b82f6; color: #fff', JSON.stringify(requestBody, null, 2));
    console.log('API URL:', `${API_BASE_URL}/conversation/${documentId}/select-subsection`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/conversation/${documentId}/select-subsection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
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
      
      debugConversation('selectSubsection - API RESPONSE', { documentId, section, subsection, result });
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
      
      debugConversation('selectSubsection - RESPONSE ANALYSIS', { 
        documentId, section, subsection, hasMessages, threadExists
      });
      
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
        debugConversation('selectSubsection - FETCHING MESSAGES', { documentId, section, subsection });
        await fetchSubsectionMessages(documentId, section, subsection);
      } else {
        debugConversation('selectSubsection - NO THREAD EXISTS', { documentId, section, subsection });
      }
      
      debugConversation('selectSubsection - EXIT SUCCESS', { 
        documentId, section, subsection, hasConversation: threadExists, hasMessages
      });
      
      return {
        hasConversation: threadExists,
        hasMessages: hasMessages
      };
    } catch (error) {
      console.error('%c Failed to select subsection:', 'background: #ef4444; color: #fff', error);
      debugConversation('selectSubsection - EXIT ERROR', { documentId, section, subsection, error: error.message });
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
    const subsectionKey = `${section}/${subsection}`;

    const userMessage = { role: 'user', content: message }
    
    // Add user message to the conversation
    setMessages(prev => ({
      ...prev,
      [messageKey]: [...(prev[messageKey] || []), userMessage]
    }))
    
    // Reset approval status for this subsection when sending a new message
    setSubsectionStatus(prev => {
      const docStatus = prev[documentId] || {};
      
      return {
        ...prev,
        [documentId]: {
          ...docStatus,
          [subsectionKey]: {
            ...docStatus[subsectionKey],
            isApproved: false,
            approvedAt: null
          }
        }
      };
    });
    
    // Also clear from approvedSubsections
    setApprovedSubsections(prev => {
      const docApproved = {...(prev[documentId] || {})};
      
      // Remove this subsection's approval
      if (docApproved[subsectionKey]) {
        delete docApproved[subsectionKey];
      }
      
      return {
        ...prev,
        [documentId]: docApproved
      };
    });
    
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/conversation/${documentId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
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
      const response = await fetch(`${API_BASE_URL}/documents/${documentId}/download`, {
        headers: {
          ...getAuthHeader()
        }
      })
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
    debugConversation('loadExistingProject - ENTRY', { projectId, documentId });
    console.log('Loading existing project with ID:', projectId);
    setIsStartingConversation(true)
    
    try {
      // Fetch project details including conversation history and PDF status
      debugConversation('loadExistingProject - FETCH PROJECT', { projectId, documentId });
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        headers: {
          ...getAuthHeader()
        }
      })
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
      debugConversation('loadExistingProject - PROJECT DATA', { projectId, documentId, projectData });
      console.log('Project loaded successfully:', projectData);
      
      // Fetch all subsections and their status
      debugConversation('loadExistingProject - FETCHING SUBSECTIONS', { documentId });
      const subsections = await fetchSubsections(documentId);
      
      // Fetch all approved subsections for this document
      debugConversation('loadExistingProject - FETCHING APPROVED SUBSECTIONS', { documentId });
      const approved = await fetchApprovedSubsections(documentId);
      console.log('Fetched approved subsections:', approved);
      
      // Fetch PDF for this project if it has a PDF
      if (projectData.has_pdf) {
        debugConversation('loadExistingProject - FETCHING PDF', { documentId });
        console.log('Project has PDF, fetching preview');
        await fetchPdfPreview(documentId)
      } else {
        console.log('Project does not have a PDF yet');
      }
      
      // Check if there's an existing active conversation in any subsection
      let hasExistingActiveConversation = false;
      let firstConversationSection = null;
      let firstConversationSubsection = null;
      
      if (subsections) {
        // Look through all subsections to find any with an active conversation
        const subsectionEntries = Object.entries(subsections);
        debugConversation('loadExistingProject - CHECKING FOR EXISTING CONVERSATIONS', { 
          documentId, subsectionCount: subsectionEntries.length 
        });
        
        for (const [key, status] of subsectionEntries) {
          if (status.hasConversation) {
            hasExistingActiveConversation = true;
            // Store the first one we find for possible use later
            if (!firstConversationSection) {
              const [section, subsection] = key.split('/');
              firstConversationSection = section;
              firstConversationSubsection = subsection;
            }
            console.log(`Found existing conversation in subsection: ${key}`);
          }
        }
      }
      
      // Determine which section/subsection to activate
      let sectionToUse = null;
      let subsectionToUse = null;
      let needToStartNewConversation = false;
      
      // If there's no active conversation yet, check if we need to start one
      let currentActiveConv = getActiveSubsection(documentId);
      debugConversation('loadExistingProject - CHECKING ACTIVE CONVERSATION', { 
        documentId, 
        hasActiveConv: !!currentActiveConv, 
        currentActiveConv,
        hasExistingActiveConversation,
        firstConversationSection,
        firstConversationSubsection
      });
      
      if (currentActiveConv && currentActiveConv.section && currentActiveConv.subsection) {
        // We already have an active subsection set (perhaps from a previous operation)
        sectionToUse = currentActiveConv.section;
        subsectionToUse = currentActiveConv.subsection;
        debugConversation('loadExistingProject - USING EXISTING ACTIVE SUBSECTION', { 
          documentId, section: sectionToUse, subsection: subsectionToUse 
        });
      } else if (hasExistingActiveConversation && firstConversationSection && firstConversationSubsection) {
        // No active subsection set, but we found existing conversations - use the first one
        sectionToUse = firstConversationSection;
        subsectionToUse = firstConversationSubsection;
        debugConversation('loadExistingProject - USING FIRST EXISTING CONVERSATION', { 
          documentId, section: sectionToUse, subsection: subsectionToUse 
        });
      } else if (!hasExistingActiveConversation && projectData.topic) {
        // No active subsection and no existing conversations - need to start a new one
        // Find first section and subsection from the document structure
        const topicStructure = documentStructure[projectData.topic];
        if (topicStructure && topicStructure.sections && topicStructure.sections.length > 0) {
          const firstSection = topicStructure.sections[0];
          
          if (firstSection.subsections && firstSection.subsections.length > 0) {
            const firstSubsection = firstSection.subsections[0];
            
            sectionToUse = firstSection.key;
            subsectionToUse = firstSubsection.key;
            needToStartNewConversation = true;
            
            debugConversation('loadExistingProject - NEED TO START NEW CONVERSATION', {
              documentId, topic: projectData.topic, section: sectionToUse, subsection: subsectionToUse
            });
          }
        }
      }
      
      // If we've determined which section/subsection to use, proceed with activation
      if (sectionToUse && subsectionToUse) {
        if (needToStartNewConversation) {
          // Start new conversation for initial project setup
          console.log('No active conversations found, starting initial project conversation:', {
            topic: projectData.topic,
            section: sectionToUse,
            subsection: subsectionToUse
          });
          
          // For initial project setup, we use startNewConversation with the /conversation/{document_id}/start endpoint
          const startResult = await startNewConversation(
            projectData.topic, 
            documentId, 
            sectionToUse, 
            subsectionToUse
          );
          
          debugConversation('loadExistingProject - CONVERSATION STARTED', { 
            documentId, startResult 
          });
          
          // The result contains the actual section/subsection that was used (which might differ from what we requested)
          if (startResult.success) {
            sectionToUse = startResult.section;
            subsectionToUse = startResult.subsection;
            
            // For new projects, fetch the PDF even if the project doesn't initially have one
            // This is only for brand new projects where we just started a conversation
            console.log('Fetching initial PDF preview for new project');
            try {
              await fetchPdfPreview(documentId);
              console.log('Initial PDF preview for new project fetched successfully');
            } catch (pdfError) {
              console.error('Failed to fetch initial PDF preview for new project:', pdfError);
              // Don't fail the operation if PDF fetch fails
            }
          }
        } else {
          // Select the existing conversation
          console.log('Selecting existing conversation:', {
            documentId,
            section: sectionToUse,
            subsection: subsectionToUse
          });
          
          const selectResult = await selectSubsection(documentId, sectionToUse, subsectionToUse);
          
          debugConversation('loadExistingProject - SUBSECTION SELECTED', { 
            documentId, sectionToUse, subsectionToUse, selectResult 
          });
          
          // Ensure we have messages for this subsection
          if (selectResult.hasConversation) {
            const messages = getCurrentMessages(documentId, sectionToUse, subsectionToUse);
            
            if (messages.length === 0) {
              // If we don't have messages yet, fetch them
              console.log('No messages found locally for selected subsection, fetching them:', {
                documentId, section: sectionToUse, subsection: subsectionToUse
              });
              
              await fetchSubsectionMessages(documentId, sectionToUse, subsectionToUse);
            }
          }
        }
        
        // Always update the active subsection in the state
        setActiveSubsection(prev => ({
          ...prev,
          [documentId]: { section: sectionToUse, subsection: subsectionToUse }
        }));
      }
      
      debugConversation('loadExistingProject - EXIT SUCCESS', { 
        documentId, projectId, hasPdf: projectData.has_pdf,
        activatedSection: sectionToUse,
        activatedSubsection: subsectionToUse
      });
      
      return {
        hasPdf: projectData.has_pdf,
        sectionData: projectData.section_data || {},
        subsections,
        approvedSubsections: approved,
        activeSection: sectionToUse,
        activeSubsection: subsectionToUse
      }
    } catch (error) {
      console.error('Failed to load project:', error)
      debugConversation('loadExistingProject - EXIT ERROR', { projectId, documentId, error: error.message });
      return {
        hasPdf: false,
        sectionData: {},
        subsections: {},
        approvedSubsections: {}
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

  // Fetch all approved subsections for a document
  const fetchApprovedSubsections = async (documentId) => {
    console.log('%c Fetching approved subsections:', 'background: #34d399; color: #000', { documentId });
    
    if (!documentId) {
      console.error('Missing documentId for fetchApprovedSubsections');
      return {};
    }
    
    try {
      const url = `${API_BASE_URL}/documents/${documentId}/approved`;
      console.log('Approved subsections API URL:', url);
      
      const response = await fetch(url, {
        headers: {
          ...getAuthHeader()
        }
      });
      
      const responseText = await response.text();
      
      if (!response.ok) {
        console.error('%c Failed to fetch approved subsections:', 'background: #ef4444; color: #fff', {
          status: response.status,
          statusText: response.statusText,
          responseText,
          url
        });
        throw new Error(`Failed to fetch approved subsections: ${response.status}`);
      }
      
      // Try to parse the response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (error) {
        console.error('Failed to parse response JSON:', error);
        throw new Error('Invalid response format from server');
      }
      
      console.log('%c Approved subsections:', 'background: #34d399; color: #000', data);
      
      // Map approved subsections to a more usable format
      const approvedMap = {};
      
      if (Array.isArray(data)) {
        data.forEach(item => {
          const key = `${item.section}/${item.subsection}`;
          approvedMap[key] = {
            value: item.value,
            approvedAt: item.approved_at
          };
        });
      }
      
      // Update approved subsections state
      setApprovedSubsections(prev => ({
        ...prev,
        [documentId]: approvedMap
      }));
      
      return approvedMap;
    } catch (error) {
      console.error('Failed to fetch approved subsections:', error);
      return {};
    }
  }
  
  // Approve data for a subsection
  const approveSubsectionData = async (documentId, section, subsection) => {
    console.log('%c Approving subsection data:', 'background: #34d399; color: #000', { 
      documentId, 
      section, 
      subsection 
    });
    
    if (!documentId || !section || !subsection) {
      console.error('Missing required parameters for approveSubsectionData:', { documentId, section, subsection });
      return { success: false, error: 'Missing required parameters' };
    }
    
    setIsApprovingData(true);
    
    try {
      // Using the new approve-simple endpoint
      const url = `${API_BASE_URL}/documents/${documentId}/approve-simple`;
      console.log('Approving subsection at URL:', url);
      console.log('Request body:', { section, subsection });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          section,
          subsection
        }),
      });
      
      const responseText = await response.text();
      
      if (!response.ok) {
        console.error('%c Failed to approve subsection data:', 'background: #ef4444; color: #fff', {
          status: response.status,
          statusText: response.statusText,
          responseText,
          url
        });
        throw new Error(`Failed to approve subsection data: ${response.status}`);
      }
      
      // Try to parse the response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (error) {
        console.error('Failed to parse response JSON:', error);
        throw new Error('Invalid response format from server');
      }
      
      console.log('%c Subsection data approved successfully:', 'background: #34d399; color: #000', data);
      
      // Update approved subsections state
      setApprovedSubsections(prev => {
        const docApproved = prev[documentId] || {};
        const key = `${section}/${subsection}`;
        
        return {
          ...prev,
          [documentId]: {
            ...docApproved,
            [key]: {
              approvedAt: new Date().toISOString() // Since approved_at may not be in the response now
            }
          }
        };
      });
      
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
              isApproved: true,
              approvedAt: new Date().toISOString() // Since approved_at may not be in the response now
            }
          }
        };
      });
      
      // Fetch the updated PDF
      await fetchPdfPreview(documentId);
      
      return {
        success: true,
        approved: data.approved,
        section: data.section,
        subsection: data.subsection
      };
    } catch (error) {
      console.error('Failed to approve subsection data:', error);
      return {
        success: false,
        error: error.message
      };
    } finally {
      setIsApprovingData(false);
    }
  }

  // Check if a subsection is approved
  const isSubsectionApproved = (documentId, section, subsection) => {
    if (!documentId || !section || !subsection) return false;
    
    const docApproved = approvedSubsections[documentId] || {};
    const key = `${section}/${subsection}`;
    
    return !!docApproved[key];
  }

  // Get all approved subsections for a document
  const getApprovedSubsections = (documentId) => {
    if (!documentId) return {};
    
    return approvedSubsections[documentId] || {};
  }

  return {
    messages,
    getCurrentMessages,
    isLoading,
    isStartingConversation,
    isGeneratingPdf,
    isApprovingData,
    pdfUrls,
    activeSubsection: getActiveSubsection,
    subsectionStatus,
    approvedSubsections: getApprovedSubsections,
    isSubsectionApproved,
    startNewConversation,
    startSubsectionConversation,
    selectSubsection,
    fetchSubsections,
    fetchSubsectionMessages,
    fetchApprovedSubsections,
    approveSubsectionData,
    sendMessage,
    setMessages,
    downloadPdf,
    loadExistingProject,
    fetchPdfPreview,
    setIsLoading
  }
} 