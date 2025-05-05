import React, { useRef, useState } from 'react'
import { Copy, Download, Loader, FileText } from 'lucide-react'

export const PdfPreview = ({
  pdfUrl,
  onDownloadPdf,
  isGeneratingPdf
}) => {
  const [isCopyingText, setIsCopyingText] = useState(false)
  const iframeRef = useRef(null)

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
      // Or as a fallback:
      // const selection = iframeWindow.getSelection()
      // const range = iframeWindow.document.createRange()
      // range.selectNodeContents(iframeWindow.document.body)
      // selection.removeAllRanges()
      // selection.addRange(range)

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
    <aside className="flex-1 bg-white p-6 flex flex-col">
      <div className="flex justify-between items-center mb-6">
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

      <div className="flex-1 border border-gray-200 rounded-lg bg-white overflow-hidden flex flex-col">
        {pdfUrl ? (
          <iframe
            ref={iframeRef}
            src={pdfUrl}
            className="w-full h-full"
            title="PDF Preview"
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
    </aside>
  )
} 