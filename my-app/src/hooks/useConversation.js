import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { API_BASE_URL } from '../constants/documentStructure'

export const useConversation = () => {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isStartingConversation, setIsStartingConversation] = useState(false)
  const [documentIds, setDocumentIds] = useState({})

  const startNewConversation = async (chapterName) => {
    const newDocumentId = uuidv4()
    setIsStartingConversation(true)
    
    try {
      console.log('Starting new conversation:', {
        documentId: newDocumentId,
        chapter: chapterName,
        url: `${API_BASE_URL}/conversation/${newDocumentId}/start`,
        requestBody: {
          topic: chapterName.toLowerCase()
        }
      })

      const response = await fetch(`${API_BASE_URL}/conversation/${newDocumentId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: chapterName.toLowerCase()
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

      setDocumentIds(prev => ({
        ...prev,
        [chapterName]: newDocumentId
      }))
      
      setMessages([{
        role: 'assistant',
        content: data.message
      }])
    } catch (error) {
      console.error('Failed to start conversation:', error)
      setMessages([{
        role: 'assistant',
        content: 'Es gab ein Problem beim Starten der Konversation. Bitte versuchen Sie es erneut.'
      }])
    } finally {
      setIsStartingConversation(false)
    }
  }

  const sendMessage = async (message, activeChapter) => {
    if (!message.trim() || !documentIds[activeChapter]) return

    const userMessage = { role: 'user', content: message }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/conversation/${documentIds[activeChapter]}/reply`, {
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
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message
      }])
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Es gab ein Problem beim Senden der Nachricht. Bitte versuchen Sie es erneut.'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return {
    messages,
    isLoading,
    isStartingConversation,
    documentIds,
    startNewConversation,
    sendMessage,
    setMessages
  }
} 