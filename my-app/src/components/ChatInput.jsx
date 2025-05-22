import React, { useEffect, useRef } from 'react'
import { Send, Paperclip, Upload, XCircle, Edit, Loader } from 'lucide-react'

export const ChatInput = ({
  inputMessage,
  onInputChange,
  onSubmit,
  isLoading,
  hasActiveConversation,
  selectedFile,
  onFileSelect,
  onFileRemove,
  fileError,
  dragActive,
  onDragEnter,
  onDragLeave,
  onDrop,
  fileInputRef,
  inputRef,
  onEditSectionData,
  isApprovingData,
  isSubsectionApproved,
  isUploading
}) => {
  // Determine button state for rendering
  const isButtonDisabled = isApprovingData || isLoading || isUploading;
  const isSendButtonDisabled = (!inputMessage.trim() && !selectedFile) || isLoading || !hasActiveConversation || isUploading;
  const isLoadingOrUploading = isLoading || isUploading;
  const textareaRef = useRef(null);
  
  // Function to adjust textarea height based on content
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Reset height to auto to properly calculate the new height
    textarea.style.height = 'auto';
    
    // Set new height (capped by max-height in CSS)
    const newHeight = Math.min(textarea.scrollHeight, 150); // Maximum height of 150px
    textarea.style.height = `${newHeight}px`;
  };
  
  // Adjust height when the input message changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [inputMessage]);
  
  // Initial adjustment when the component mounts
  useEffect(() => {
    adjustTextareaHeight();
  }, []);
  
  // Handle input changes
  const handleInputChange = (e) => {
    onInputChange(e);
    adjustTextareaHeight();
  };
  
  // Handle keydown to submit form with Enter (unless Shift+Enter for new line)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isSendButtonDisabled) {
      e.preventDefault();
      onSubmit(e);
    }
  };
  
  // Get approve button style based on approval state
  const getEditButtonStyle = () => {
    if (isSubsectionApproved) {
      return 'bg-green-500 text-white';
    }
    return 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50';
  };

  return (
    <div className="border-t px-4 py-4">
      <div className="max-w-3xl mx-auto">
        <form 
          onSubmit={onSubmit} 
          onDragEnter={onDragEnter}
          className={`relative flex items-start space-x-2 ${
            dragActive ? 'opacity-50' : ''
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileSelect}
            className="hidden"
            accept=".pdf,.docx"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 disabled:opacity-50 mt-1"
            title="PDF oder DOCX anhängen (max. 10 MB)"
            disabled={!hasActiveConversation || isLoadingOrUploading}
          >
            {isUploading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </button>
          <textarea
            ref={(el) => {
              // Handle both refs
              textareaRef.current = el;
              if (inputRef) {
                inputRef.current = el;
              }
            }}
            value={inputMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Schreiben Sie Ihre Antwort..."
            className="flex-1 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[44px] max-h-[150px] overflow-y-auto"
            disabled={!hasActiveConversation || isLoadingOrUploading}
            rows={1}
          />
          
          {/* Edit & Approve button - placed before the send button */}
          {hasActiveConversation && (
            <button
              type="button" 
              onClick={onEditSectionData}
              disabled={isButtonDisabled}
              className={`p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 flex items-center justify-center ${getEditButtonStyle()} disabled:cursor-not-allowed mt-1`}
              title={isSubsectionApproved ? "Daten sind bereits gespeichert, aber können bearbeitet werden" : "Daten bearbeiten und in PDF übernehmen"}
            >
              {isApprovingData ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Edit className="w-5 h-5" />
              )}
            </button>
          )}
          
          <button
            type="submit"
            disabled={isSendButtonDisabled}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
          >
            {isLoadingOrUploading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>

          {dragActive && (
            <div
              className="absolute inset-0 bg-blue-50 border-2 border-blue-500 border-dashed rounded-lg flex items-center justify-center"
              onDragEnter={onDragEnter}
              onDragLeave={onDragLeave}
              onDragOver={onDragEnter}
              onDrop={onDrop}
            >
              <div className="text-blue-500 flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Datei hier ablegen</span>
              </div>
            </div>
          )}
        </form>

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
                onClick={onFileRemove}
                className="text-gray-400 hover:text-gray-600"
                disabled={isLoadingOrUploading}
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
          {!hasActiveConversation && (
            <div className="text-sm text-gray-500 mt-2 text-center">
              Bitte wählen Sie einen Abschnitt aus, um die Konversation zu beginnen
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 