import React, { useState, useRef, useEffect } from 'react'
import {
  Upload,
  Play,
  Copy,
  Download,
  ChevronRight,
  ChevronUp,
  Send,
  User,
  Bot,
  Loader,
  Paperclip,
  XCircle,
  FileText,
} from 'lucide-react'

// Document structure data
const documentStructure = {
  'Deklarationsanalyse': {
    title: 'Deklarationsanalyse',
    icon: '📄',
    sections: [
      {
        title: 'Projekt Details',
        subsections: ['Standort', 'Auftraggeber']
      },
      {
        title: 'Projekt Objectives',
        subsections: ['Ziele', 'Anforderungen']
      },
      {
        title: 'Anhänge',
        subsections: ['Dokumente', 'Bilder']
      }
    ]
  },
  'Bodenuntersuchung': {
    title: 'Bodenuntersuchung',
    icon: '🔍',
    sections: [
      {
        title: 'Projekt Details',
        subsections: ['Untersuchungsmethoden', 'Probenentnahme']
      },
      {
        title: 'Projekt Objectives',
        subsections: ['Bodenbeschaffenheit', 'Analyseergebnisse']
      },
      {
        title: 'Anhänge',
        subsections: ['Laborberichte', 'Fotos']
      }
    ]
  },
  'Baugrundgutachten': {
    title: 'Baugrundgutachten',
    icon: '📋',
    sections: [
      {
        title: 'Projekt Details',
        subsections: ['Grundstücksdaten', 'Bauvorhaben']
      },
      {
        title: 'Projekt Objectives',
        subsections: ['Bewertung', 'Empfehlungen']
      },
      {
        title: 'Anhänge',
        subsections: ['Gutachten', 'Pläne']
      }
    ]
  },
  'Plattendruckversuch': {
    title: 'Plattendruckversuch',
    icon: '🔨',
    sections: [
      {
        title: 'Projekt Details',
        subsections: ['Versuchsaufbau', 'Durchführung']
      },
      {
        title: 'Projekt Objectives',
        subsections: ['Messergebnisse', 'Auswertung']
      },
      {
        title: 'Anhänge',
        subsections: ['Messprotokolle', 'Diagramme']
      }
    ]
  }
}

// Example messages for demonstration
const initialMessages = [
  {
    role: 'assistant',
    content: 'Willkommen! Ich werde Sie durch den Prozess der Dokumentenerstellung führen. Lassen Sie uns mit dem ersten Abschnitt beginnen. Können Sie mir zunächst den Standort des Projekts nennen?'
  }
]

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export default function App() {
  const [activeChapter, setActiveChapter] = useState('Baugrundgutachten')
  const [activeSection, setActiveSection] = useState('Projekt Details')
  const [activeSubsection, setActiveSubsection] = useState(null)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [fileError, setFileError] = useState('')
  const [pdfUrl, setPdfUrl] = useState(null)
  const [isCopyingText, setIsCopyingText] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    // Initial setup - fetch existing conversation if any
    fetchConversation()
  }, [activeChapter])

  const fetchConversation = async () => {
    try {
      const response = await fetch(`/api/conversations/${activeChapter}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Failed to fetch conversation:', error)
    }
  }

  const handleChapterClick = (chapterName) => {
    setActiveChapter(chapterName)
    setActiveSection(documentStructure[chapterName].sections[0].title)
    setActiveSubsection(documentStructure[chapterName].sections[0].subsections[0])
    // Reset messages when changing chapter
    setMessages([
      {
        role: 'assistant',
        content: `Lassen Sie uns mit dem Kapitel "${chapterName}" beginnen. Ich werde Ihnen einige Fragen stellen, um die erforderlichen Informationen zu sammeln.`
      }
    ])
  }

  const handleSectionClick = (sectionTitle, subsection) => {
    setActiveSection(sectionTitle)
    setActiveSubsection(subsection)
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputMessage.trim()) return

    const userMessage = { role: 'user', content: inputMessage }
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          chapter: activeChapter,
          section: activeSection,
          subsection: activeSubsection,
          context: messages,
        }),
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()
      setMessages(prev => [...prev, data.message])
      
      // Update PDF preview if new content is available
      if (data.pdfUrl) {
        setPdfUrl(data.pdfUrl)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      // Add error handling UI if needed
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (file) => {
    if (!validateFile(file)) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('chapter', activeChapter)
    formData.append('section', activeSection)
    formData.append('subsection', activeSubsection)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Upload failed')

      const data = await response.json()
      setSelectedFile(file)
      setMessages(prev => [...prev, {
        role: 'user',
        content: `Datei angehängt: ${file.name}`,
        isFileAttachment: true,
        fileName: file.name
      }])

      // Add AI response if provided by backend
      if (data.message) {
        setMessages(prev => [...prev, data.message])
      }
    } catch (error) {
      console.error('Failed to upload file:', error)
      setFileError('Fehler beim Hochladen der Datei')
    }
  }

  const handleCopyText = async () => {
    setIsCopyingText(true)
    try {
      const response = await fetch(`/api/document/${activeChapter}/text`)
      if (!response.ok) throw new Error('Failed to fetch document text')
      
      const data = await response.json()
      await navigator.clipboard.writeText(data.text)
      // You could add a toast notification here for success
    } catch (error) {
      console.error('Failed to copy text:', error)
      // Add error handling UI if needed
    } finally {
      setIsCopyingText(false)
    }
  }

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true)
    try {
      const response = await fetch(`/api/document/${activeChapter}/pdf`)
      if (!response.ok) throw new Error('Failed to generate PDF')

      // Get the blob from the response
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      // Create a link and trigger download
      const a = document.createElement('a')
      a.href = url
      a.download = `${activeChapter}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to download PDF:', error)
      // Add error handling UI if needed
    } finally {
      setIsGeneratingPdf(false)
    }
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
      handleFileUpload(file)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) handleFile(file)
  }

  const handleFileButtonClick = () => {
    fileInputRef.current?.click()
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

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-72 bg-white border-r p-6 flex flex-col">
          <div className="mb-8">
            <img src="/logo.png" alt="erdbaron" className="h-6" />
          </div>
          <nav className="flex-1">
            <ul className="space-y-4 text-sm">
              {Object.values(documentStructure).map((chapter) => (
                <li 
                  key={chapter.title} 
                  className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 ${
                    chapter.title === activeChapter ? 'bg-gray-50 text-blue-600' : ''
                  }`}
                  onClick={() => handleChapterClick(chapter.title)}
                >
                  <span>{chapter.icon}</span>
                  <span>{chapter.title}</span>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-6 text-sm">
            <h2 className="font-semibold mb-3">{activeChapter}</h2>
            <div className="space-y-4">
              {documentStructure[activeChapter].sections.map((section) => (
                <div key={section.title}>
                  <h3 className="text-gray-600 mb-2">{section.title}</h3>
                  <ul className="ml-4 space-y-1 text-gray-500">
                    {section.subsections.map((subsection) => (
                      <li 
                        key={subsection}
                        className={`flex items-center space-x-2 cursor-pointer hover:text-blue-600 ${
                          activeSection === section.title && activeSubsection === subsection
                            ? 'text-blue-600'
                            : ''
                        }`}
                        onClick={() => handleSectionClick(section.title, subsection)}
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
        </aside>

        {/* Main Content - Chat Interface - reduced width */}
        <main className="w-[600px] flex flex-col bg-white border-r">
          {/* Chat Header */}
          <div className="border-b px-8 py-4">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-semibold">{activeChapter}</h1>
              <span className="text-gray-400">→</span>
              <h2 className="text-lg text-gray-600">{activeSection}</h2>
              {activeSubsection && (
                <>
                  <span className="text-gray-400">→</span>
                  <h3 className="text-base text-gray-500">{activeSubsection}</h3>
                </>
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-4 ${
                    message.role === 'user' ? 'justify-end' : ''
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                  <div
                    className={`flex-1 max-w-[80%] p-4 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100'
                    }`}
                  >
                    {message.isFileAttachment ? (
                      <div className="flex items-center space-x-2">
                        <Paperclip className="w-4 h-4" />
                        <span>{message.content}</span>
                      </div>
                    ) : (
                      message.content
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex space-x-2 p-4 rounded-lg bg-gray-100">
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Schreibe...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Chat Input */}
          <div className="border-t px-4 py-4">
            <div className="max-w-3xl mx-auto">
              <form 
                onSubmit={handleSendMessage} 
                onDragEnter={handleDrag}
                className={`relative flex items-center space-x-4 ${
                  dragActive ? 'opacity-50' : ''
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.docx"
                />
                <button
                  type="button"
                  onClick={handleFileButtonClick}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
                  title="PDF oder DOCX anhängen (max. 10 MB)"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Schreiben Sie Ihre Antwort..."
                  className="flex-1 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>

                {/* Drag & Drop Overlay */}
                {dragActive && (
                  <div
                    className="absolute inset-0 bg-blue-50 border-2 border-blue-500 border-dashed rounded-lg flex items-center justify-center"
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="text-blue-500 flex items-center space-x-2">
                      <Upload className="w-5 h-5" />
                      <span>Datei hier ablegen</span>
                    </div>
                  </div>
                )}
              </form>

              {/* File Preview and Error Message */}
              <div className="mt-2 space-y-2">
                {selectedFile && (
                  <div className="text-sm text-gray-500 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Paperclip className="w-4 h-4" />
                      <span>{selectedFile.name}</span>
                      <span className="text-gray-400">
                        ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {fileError && (
                  <div className="text-sm text-red-500 flex items-center space-x-2">
                    <XCircle className="w-4 h-4" />
                    <span>{fileError}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Right Panel - PDF Preview - expanded */}
        <aside className="flex-1 bg-white p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Dokumentvorschau</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyText}
                disabled={isCopyingText}
                className="p-2 text-gray-600 hover:text-blue-600 focus:outline-none disabled:opacity-50"
                title="Text kopieren"
              >
                {isCopyingText ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPdf}
                className="p-2 text-gray-600 hover:text-blue-600 focus:outline-none disabled:opacity-50"
                title="Als PDF herunterladen"
              >
                {isGeneratingPdf ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <Download className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* PDF Preview */}
          <div className="flex-1 border border-gray-200 rounded-lg bg-white overflow-hidden flex flex-col">
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full h-full"
                title="PDF Preview"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FileText className="w-12 h-12 mb-2" />
                <p>Dokument wird erstellt...</p>
                <p className="text-sm">Beantworten Sie die Fragen des Assistenten</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

