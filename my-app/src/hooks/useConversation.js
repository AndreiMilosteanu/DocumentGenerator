import { useState } from 'react'
import { API_BASE_URL } from '../constants/documentStructure'

export const useConversation = () => {
  const [messages, setMessages] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isStartingConversation, setIsStartingConversation] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [pdfUrls, setPdfUrls] = useState({})

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
      
      // Format messages for the UI - skip the first message as it's the instructions
      const formattedMessages = projectData.messages
        .slice(1) // Skip the first message (instructions)
        .map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp
        }))
      
      console.log('Formatted messages (ignoring first instruction message):', formattedMessages);
      
      // Update state with project data - use document_id as the key
      setMessages(prev => ({
        ...prev,
        [documentId]: formattedMessages
      }))
      
      // Fetch PDF for this project if it has a PDF
      if (projectData.has_pdf) {
        console.log('Project has PDF, fetching preview');
        await fetchPdfPreview(documentId)
      } else {
        console.log('Project does not have a PDF yet');
      }
      
      return {
        hasPdf: projectData.has_pdf,
        sectionData: projectData.section_data || {}
      }
    } catch (error) {
      console.error('Failed to load project:', error)
      setMessages(prev => ({
        ...prev,
        [documentId]: [{
          role: 'assistant',
          content: 'Es gab ein Problem beim Laden des Projekts. Bitte versuchen Sie es erneut.'
        }]
      }))
      return {
        hasPdf: false,
        sectionData: {}
      }
    } finally {
      setIsStartingConversation(false)
    }
  }

  const startNewConversation = async (topicName, documentId) => {
    // If we already have messages for this document, return
    if (messages[documentId] && messages[documentId].length > 0) {
      console.log('Using existing conversation for document:', documentId);
      // Fetch existing PDF if available
      await fetchPdfPreview(documentId)
      return { success: true, hasPdf: false }
    }

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
      
      // If there are multiple messages, the first one is instructions - skip it
      let initialMessages = []
      if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
        // Skip the first message (instructions) if there are multiple messages
        initialMessages = data.messages.length > 1 
          ? data.messages.slice(1).map(msg => ({
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp || new Date().toISOString()
            }))
          : [{
              role: 'assistant',
              content: data.message || 'Willkommen zum neuen Projekt! Wie kann ich Ihnen helfen?',
              timestamp: new Date().toISOString()
            }]
      } else {
        // Fallback to using just the message field
        initialMessages = [{
          role: 'assistant',
          content: data.message || 'Willkommen zum neuen Projekt! Wie kann ich Ihnen helfen?',
          timestamp: new Date().toISOString()
        }]
      }
      
      console.log('Initial messages for conversation (skipping instructions):', initialMessages)
      
      setMessages(prev => ({
        ...prev,
        [documentId]: initialMessages
      }))

      console.log('Fetching PDF preview for document:', documentId);
      // Fetch PDF for this document
      await fetchPdfPreview(documentId)
      
      return { 
        success: true, 
        hasPdf: false, // New conversations don't have PDFs yet
        message: data.message
      }
    } catch (error) {
      console.error('Failed to start conversation:', error)
      
      // Create a backup message for this document
      const backupMessage = 'Es gab ein Problem beim Starten der Konversation. Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.';
      console.log('Using backup welcome message:', backupMessage);
      
      setMessages(prev => ({
        ...prev,
        [documentId]: [{
          role: 'assistant',
          content: backupMessage,
          timestamp: new Date().toISOString()
        }]
      }))
      
      return {
        success: false,
        hasPdf: false,
        error: error.message
      }
    } finally {
      setIsStartingConversation(false)
    }
  }

  const sendMessage = async (message, topic, documentId) => {
    if (!message.trim() || !documentId) return

    const userMessage = { role: 'user', content: message }
    
    // Add user message to the conversation
    setMessages(prev => ({
      ...prev,
      [documentId]: [...(prev[documentId] || []), userMessage]
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
      // Check if we have a messages array or just a single message
      if (data.messages && Array.isArray(data.messages)) {
        // If we have a messages array, use it (but skip the first instruction message)
        const newMessages = data.messages.slice(1).map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp || new Date().toISOString()
        }))
        
        console.log('Adding new messages from response:', newMessages)
        
        setMessages(prev => ({
          ...prev,
          [documentId]: [...(prev[documentId] || []), ...newMessages]
        }))
      } else {
        // If we just have a single message field, use that
        console.log('Adding single message from response:', data.message)
        
        setMessages(prev => ({
          ...prev,
          [documentId]: [...(prev[documentId] || []), {
            role: 'assistant',
            content: data.message,
            timestamp: new Date().toISOString()
          }]
        }))
      }

      // Fetch updated PDF
      await fetchPdfPreview(documentId)
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => ({
        ...prev,
        [documentId]: [...(prev[documentId] || []), {
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

  const getMessagesForProject = (projectId) => {
    return messages[projectId] || []
  }

  return {
    messages: messages,
    currentMessages: (projectId) => getMessagesForProject(projectId),
    isLoading,
    isStartingConversation,
    isGeneratingPdf,
    pdfUrls,
    startNewConversation,
    sendMessage,
    setMessages,
    downloadPdf,
    loadExistingProject
  }
} 