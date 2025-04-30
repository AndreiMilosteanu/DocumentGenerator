import React from 'react'
import { Copy, Download, Loader, FileText } from 'lucide-react'

export const PdfPreview = ({
  pdfUrl,
  onCopyText,
  onDownloadPdf,
  isCopyingText,
  isGeneratingPdf
}) => {
  return (
    <aside className="flex-1 bg-white p-6 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Dokumentvorschau</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={onCopyText}
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
            onClick={onDownloadPdf}
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
  )
} 