import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { API_BASE_URL } from '../constants/documentStructure'

const STORAGE_KEYS = {
  DOCUMENT_IDS: 'documentIds',
  MESSAGES: 'conversationMessages'
}

export const useConversation = () => {
  // Initialize state from localStorage or default values
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES)
    return savedMessages ? JSON.parse(savedMessages) : {}
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isStartingConversation, setIsStartingConversation] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [pdfUrls, setPdfUrls] = useState({})
  const [documentIds, setDocumentIds] = useState(() => {
    const savedIds = localStorage.getItem(STORAGE_KEYS.DOCUMENT_IDS)
    return savedIds ? JSON.parse(savedIds) : {}
  })

  // Persist state changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DOCUMENT_IDS, JSON.stringify(documentIds))
  }, [documentIds])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages))
  }, [messages])

  const fetchPdfPreview = async (documentId, chapter) => {
    setIsGeneratingPdf(true)
    try {
      const response = await fetch(`${API_BASE_URL}/documents/${documentId}/pdf`)
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`)
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setPdfUrls(prev => ({
        ...prev,
        [chapter]: url
      }))
    } catch (error) {
      console.error('Failed to fetch PDF:', error)
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const downloadPdf = async (chapter) => {
    const documentId = documentIds[chapter]
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
      a.download = `${chapter}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download PDF:', error)
    }
  }

  const startNewConversation = async (chapterName) => {
    // If we already have a document ID for this chapter, load existing messages
    if (documentIds[chapterName]) {
      setMessages(prev => ({
        ...prev,
        [chapterName]: messages[chapterName] || []
      }))
      // Fetch existing PDF if available
      if (documentIds[chapterName]) {
        await fetchPdfPreview(documentIds[chapterName], chapterName)
      }
      return
    }

    const newDocumentId = uuidv4()
    setIsStartingConversation(true)
    
    try {
      console.log('Starting new conversation:', {
        documentId: newDocumentId,
        chapter: chapterName,
        url: `${API_BASE_URL}/conversation/${newDocumentId}/start`,
        requestBody: {
          topic: chapterName
        }
      })

      const response = await fetch(`${API_BASE_URL}/conversation/${newDocumentId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: chapterName
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Start conversation failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
          documentId: newDocumentId,
          chapter: chapterName
        })
        throw new Error(`Failed to start conversation: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Start conversation response:', {
        documentId: newDocumentId,
        responseData: data,
        chapter: chapterName
      })

      // Save the new document ID
      setDocumentIds(prev => ({
        ...prev,
        [chapterName]: newDocumentId
      }))
      
      // Initialize messages for this chapter
      const initialMessage = [{
        role: 'assistant',
        content: data.message
      }]
      
      setMessages(prev => ({
        ...prev,
        [chapterName]: initialMessage
      }))

      // Only fetch PDF after successful conversation start
      await fetchPdfPreview(newDocumentId, chapterName)
    } catch (error) {
      console.error('Failed to start conversation:', error)
      setMessages(prev => ({
        ...prev,
        [chapterName]: [{
          role: 'assistant',
          content: 'Es gab ein Problem beim Starten der Konversation. Bitte versuchen Sie es erneut.'
        }]
      }))
    } finally {
      setIsStartingConversation(false)
    }
  }

  const sendMessage = async (message, activeChapter) => {
    if (!message.trim() || !documentIds[activeChapter]) return

    const userMessage = { role: 'user', content: message }
    const documentId = documentIds[activeChapter]
    
    // Add user message to the conversation
    setMessages(prev => ({
      ...prev,
      [activeChapter]: [...(prev[activeChapter] || []), userMessage]
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
        [activeChapter]: [...(prev[activeChapter] || []), {
          role: 'assistant',
          content: data.message
        }]
      }))

      // Only fetch PDF after successful reply
      await fetchPdfPreview(documentId, activeChapter)
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => ({
        ...prev,
        [activeChapter]: [...(prev[activeChapter] || []), {
          role: 'assistant',
          content: 'Es gab ein Problem beim Senden der Nachricht. Bitte versuchen Sie es erneut.'
        }]
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const getMessagesForChapter = (chapterName) => {
    return messages[chapterName] || []
  }

  return {
    messages: messages,
    currentMessages: (activeChapter) => getMessagesForChapter(activeChapter),
    isLoading,
    isStartingConversation,
    isGeneratingPdf,
    documentIds,
    pdfUrls,
    startNewConversation,
    sendMessage,
    setMessages,
    downloadPdf
  }
} 