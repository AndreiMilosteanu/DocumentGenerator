import React, { useRef, useState, useEffect } from 'react'
import { Sidebar } from './components/Sidebar'
import { ChatMessages } from './components/ChatMessages'
import { ChatInput } from './components/ChatInput'
import { PdfPreview } from './components/PdfPreview'
import { useConversation } from './hooks/useConversation'
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from './constants/documentStructure'

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

export default function App() {
  const [activeChapter, setActiveChapter] = useState('Baugrundgutachten')
  const [activeSection, setActiveSection] = useState('Projekt Details')
  const [activeSubsection, setActiveSubsection] = useState(null)
  const [inputMessage, setInputMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [fileError, setFileError] = useState('')
  const [isPdfLoaded, setIsPdfLoaded] = useState(false)

  const {
    currentMessages,
    isLoading,
    isStartingConversation,
    isGeneratingPdf,
    pdfUrls,
    startNewConversation,
    sendMessage,
    downloadPdf
  } = useConversation()

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)

  // Reset PDF loaded state when chapter changes or when generating new PDF
  useEffect(() => {
    if (isGeneratingPdf) {
      setIsPdfLoaded(false)
    }
  }, [isGeneratingPdf])

  useEffect(() => {
    setIsPdfLoaded(false)
  }, [activeChapter])

  const handleChapterClick = (chapterName) => {
    setActiveChapter(chapterName)
    setActiveSection(documentStructure[chapterName].sections[0].title)
    setActiveSubsection(documentStructure[chapterName].sections[0].subsections[0])
    
    // Start a new conversation or load existing one
    startNewConversation(chapterName)
  }

  const handleSectionClick = (sectionTitle, subsection) => {
    setActiveSection(sectionTitle)
    setActiveSubsection(subsection)
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    const message = inputMessage.trim()
    if (!message) return

    setInputMessage('')
    await sendMessage(message, activeChapter)
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
    await downloadPdf(activeChapter)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeChapter={activeChapter}
          activeSection={activeSection}
          activeSubsection={activeSubsection}
          onChapterClick={handleChapterClick}
          onSectionClick={handleSectionClick}
          isPdfLoaded={isPdfLoaded && !isGeneratingPdf && pdfUrls[activeChapter]}
        />

        <main className="w-[600px] flex flex-col bg-white border-r overflow-hidden">
          <div className="border-b px-8 py-4 flex-shrink-0">
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

          <div className="flex-1 min-h-0 flex flex-col">
            <ChatMessages
              messages={currentMessages(activeChapter)}
              isLoading={isLoading}
              isStartingConversation={isStartingConversation}
              messagesEndRef={messagesEndRef}
            />

            <ChatInput
              inputMessage={inputMessage}
              onInputChange={(e) => setInputMessage(e.target.value)}
              onSubmit={handleSendMessage}
              isLoading={isLoading}
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
            />
          </div>
        </main>

        <PdfPreview
          pdfUrl={pdfUrls[activeChapter]}
          onDownloadPdf={handleDownloadPDF}
          isGeneratingPdf={isGeneratingPdf}
          activeSubsection={activeSubsection}
          onLoad={handlePdfLoad}
        />
      </div>
    </div>
  )
}

