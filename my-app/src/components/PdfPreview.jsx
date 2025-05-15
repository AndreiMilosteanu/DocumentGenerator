import React, { useRef, useState } from 'react'
import { Copy, Download, Loader, FileText } from 'lucide-react'

export const PdfPreview = ({
  pdfUrl,
  onDownloadPdf,
  isGeneratingPdf,
  activeSubsection,
  onLoad,
  className = ""
}) => {
  const [isCopyingText, setIsCopyingText] = useState(false)
  const iframeRef = useRef(null)

  // Function to scroll to a specific section in the PDF
  const scrollToSection = async (sectionTitle) => {
    if (!iframeRef.current || !pdfUrl) return false

    try {
      const iframe = iframeRef.current
      const iframeWindow = iframe.contentWindow

      // Search for the section title in the PDF content
      const searchText = sectionTitle.toLowerCase()
      const textElements = iframeWindow.document.querySelectorAll('.textLayer > span')
      
      for (let element of textElements) {
        if (element.textContent.toLowerCase().includes(searchText)) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          // Highlight the section temporarily
          const originalBackground = element.style.backgroundColor
          element.style.backgroundColor = 'rgba(59, 130, 246, 0.2)' // Light blue highlight
          setTimeout(() => {
            element.style.backgroundColor = originalBackground
          }, 2000)
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Failed to scroll to section:', error)
      return false
    }
  }

  // Effect to scroll to active subsection when it changes
  React.useEffect(() => {
    if (activeSubsection) {
      scrollToSection(activeSubsection)
    }
  }, [activeSubsection, pdfUrl])

  const handleIframeLoad = () => {
    console.log('PDF iframe loaded')
    if (onLoad) {
      // Give a small delay to ensure PDF is fully rendered
      setTimeout(() => {
        onLoad()
      }, 500)
    }
  }

  const handleCopyText = async () => {
    if (!iframeRef.current) return

    setIsCopyingText(true)
    try {
      const iframe = iframeRef.current
      const iframeWindow = iframe.contentWindow

      // Focus the iframe
      iframeWindow.focus()

      // Simulate Ctrl+A
      iframeWindow.document.execCommand('selectAll', false, null)

      // Copy the selected text
      await navigator.clipboard.writeText(iframeWindow.getSelection().toString())

      // Clear the selection
      iframeWindow.getSelection().removeAllRanges()
    } catch (error) {
      console.error('Failed to copy text:', error)
    } finally {
      setIsCopyingText(false)
    }
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="border-b bg-white flex justify-between items-center px-4 py-3">
        <h2 className="text-lg font-semibold">Dokumentvorschau</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyText}
            disabled={isCopyingText || isGeneratingPdf || !pdfUrl}
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
            onClick={onDownloadPdf}
            disabled={isGeneratingPdf || !pdfUrl}
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

      <div className="flex-1 bg-white overflow-hidden">
        {pdfUrl ? (
          <iframe
            ref={iframeRef}
            src={pdfUrl}
            className="w-full h-full"
            title="PDF Preview"
            onLoad={handleIframeLoad}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <FileText className="w-12 h-12 mb-2" />
            <p>{isGeneratingPdf ? 'Dokument wird generiert...' : 'Kein Dokument verfügbar'}</p>
            <p className="text-sm">
              {isGeneratingPdf 
                ? 'Bitte warten Sie einen Moment'
                : 'Beantworten Sie die Fragen des Assistenten'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 