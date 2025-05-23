import React, { useRef, useState, useEffect } from 'react'
import { Copy, Download, Loader, FileText, RefreshCw } from 'lucide-react'

export const PdfPreview = ({
  pdfUrl,
  onDownloadPdf,
  isGeneratingPdf,
  activeSubsection,
  onLoad,
  onRefreshPdf,
  className = ""
}) => {
  const [isCopyingText, setIsCopyingText] = useState(false)
  const [iframeKey, setIframeKey] = useState(Date.now()) // Add a key for forcing iframe refresh
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentPdfUrl, setCurrentPdfUrl] = useState(null)
  const iframeRef = useRef(null)
  
  // Effect to reload iframe when pdfUrl changes
  useEffect(() => {
    if (pdfUrl && pdfUrl !== currentPdfUrl) {
      console.log('PDF URL changed, refreshing iframe:', {
        old: currentPdfUrl,
        new: pdfUrl
      })
      
      setIsRefreshing(true)
      
      // Update the key to force a complete iframe reload
      setIframeKey(Date.now())
      
      // Update the current URL
      setCurrentPdfUrl(pdfUrl)
      
      // Directly manipulate the iframe if it exists
      if (iframeRef.current) {
        // This will force the iframe to reload
        try {
          iframeRef.current.src = pdfUrl
        } catch (error) {
          console.error('Error directly setting iframe src:', error)
        }
      }
      
      // Reset refreshing state after a delay
      setTimeout(() => {
        setIsRefreshing(false)
      }, 1000)
    }
  }, [pdfUrl])

  // Function to manually refresh the PDF
  const handleRefreshPdf = () => {
    console.log('handleRefreshPdf clicked', { onRefreshPdf: !!onRefreshPdf });
    if (!onRefreshPdf) {
      console.log('No onRefreshPdf function provided');
      return;
    }
    
    console.log('Manually refreshing PDF via API');
    setIsRefreshing(true);
    
    // Call the API to refresh the PDF
    try {
      const result = onRefreshPdf();
      console.log('onRefreshPdf function called, result:', result);
      
      if (result && typeof result.then === 'function') {
        result
          .then((response) => {
            console.log('PDF refreshed successfully via API, response:', response);
            // The pdfUrl prop will be updated by the parent component
            // which will trigger the useEffect hook above
            
            // No need to do anything else here - the PDF will be refreshed
            // automatically when the pdfUrl changes via the useEffect hook
          })
          .catch(error => {
            console.error('Error refreshing PDF:', error);
          })
          .finally(() => {
            // Delay resetting the refreshing state to ensure user sees feedback
            setTimeout(() => {
              setIsRefreshing(false);
            }, 1000);
          });
      } else {
        console.error('onRefreshPdf did not return a Promise');
        setTimeout(() => {
          setIsRefreshing(false);
        }, 1000);
      }
    } catch (error) {
      console.error('Error executing onRefreshPdf:', error);
      setIsRefreshing(false);
    }
  };

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
          // Highlight the section temporarily with Erdbaron colors
          const originalBackground = element.style.backgroundColor
          element.style.backgroundColor = 'rgba(139, 115, 85, 0.2)' // Light brown highlight
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
    console.log('PDF iframe loaded with URL:', pdfUrl)
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
      <div className="border-b border-stone-200 bg-white flex justify-between items-center px-6 py-3 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-800">Document Preview</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefreshPdf}
            disabled={isRefreshing || isGeneratingPdf || !pdfUrl}
            className="p-2.5 text-stone-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh PDF"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleCopyText}
            disabled={isCopyingText || isGeneratingPdf || !pdfUrl}
            className="p-2.5 text-stone-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Copy text"
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
            className="btn-erdbaron-primary p-2.5"
            title="Download PDF"
          >
            {isGeneratingPdf ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 bg-stone-50 overflow-hidden">
        {pdfUrl ? (
          <>
            {isGeneratingPdf && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
                <div className="text-center">
                  <Loader className="w-8 h-8 animate-spin text-amber-600 mx-auto mb-3" />
                  <p className="text-stone-700 font-medium">Generating document...</p>
                </div>
              </div>
            )}
            <iframe
              key={iframeKey} // Add key to force re-render when it changes
              ref={iframeRef}
              src={pdfUrl}
              className="w-full h-full border-0"
              title="PDF Preview"
              onLoad={handleIframeLoad}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-stone-500 bg-white">
            <div className="text-center max-w-md px-6">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-stone-400" />
              </div>
              <h3 className="text-lg font-semibold text-stone-800 mb-2">
                {isGeneratingPdf ? 'Document is being generated...' : 'No document available'}
              </h3>
              <p className="text-sm text-stone-600">
                {isGeneratingPdf 
                  ? 'Please wait while we generate your document'
                  : 'Answer the assistant\'s questions to generate a document'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 