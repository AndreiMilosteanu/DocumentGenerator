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
      return 'bg-green-600 hover:bg-green-700 text-white border-green-600';
    }
    return 'btn-erdbaron-primary';
  };

  return (
    <div className="border-t border-stone-200 bg-white px-6 py-4">
      <div className="max-w-4xl mx-auto">
        <form 
          onSubmit={onSubmit} 
          onDragEnter={onDragEnter}
          className={`relative flex items-stretch gap-3 ${
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
          
          {/* File attachment button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 h-12 w-12 border-2 border-stone-300 hover:border-amber-600 text-stone-600 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            title="Attach PDF or DOCX file (max. 10 MB)"
            disabled={!hasActiveConversation || isLoadingOrUploading}
          >
            {isUploading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </button>
          
          {/* Text input area */}
          <div className="flex-1 relative">
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
              placeholder="Type your message..."
              className="w-full h-12 px-4 py-3 border-2 border-stone-300 hover:border-amber-600 focus:border-amber-600 rounded-xl text-stone-900 placeholder-stone-500 bg-white resize-none overflow-hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-tight"
              disabled={!hasActiveConversation || isLoadingOrUploading}
              rows={1}
              style={{ minHeight: '48px', maxHeight: '150px' }}
            />
          </div>
          
          {/* Edit & Approve button */}
          {hasActiveConversation && (
            <button
              type="button" 
              onClick={onEditSectionData}
              disabled={isButtonDisabled}
              className={`flex-shrink-0 h-12 w-12 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center ${getEditButtonStyle()}`}
              title={isSubsectionApproved ? "Data saved - click to edit" : "Edit and save section data"}
            >
              {isApprovingData ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Edit className="w-5 h-5" />
              )}
            </button>
          )}
          
          {/* Send button */}
          <button
            type="submit"
            disabled={isSendButtonDisabled}
            className="flex-shrink-0 h-12 w-12 btn-erdbaron-primary disabled:opacity-50 disabled:cursor-not-allowed rounded-xl flex items-center justify-center"
          >
            {isLoadingOrUploading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>

          {dragActive && (
            <div
              className="absolute inset-0 bg-amber-50 border-2 border-amber-500 border-dashed rounded-xl flex items-center justify-center z-10"
              onDragEnter={onDragEnter}
              onDragLeave={onDragLeave}
              onDragOver={onDragEnter}
              onDrop={onDrop}
            >
              <div className="text-amber-700 flex items-center space-x-3">
                <Upload className="w-6 h-6" />
                <span className="font-medium">Drop file here</span>
              </div>
            </div>
          )}
        </form>

        <div className="mt-3 space-y-2">
          {selectedFile && (
            <div className="text-sm text-stone-600 flex items-center justify-between bg-stone-50 rounded-lg p-3">
              <div className="flex items-center space-x-3">
                <Paperclip className="w-4 h-4 text-amber-600" />
                <span className="font-medium">{selectedFile.name}</span>
                <span className="text-stone-500">
                  ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                </span>
              </div>
              <button
                onClick={onFileRemove}
                className="text-stone-400 hover:text-red-600 transition-colors duration-200"
                disabled={isLoadingOrUploading}
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}
          {fileError && (
            <div className="text-sm text-red-600 flex items-center space-x-2 bg-red-50 rounded-lg p-3">
              <XCircle className="w-4 h-4" />
              <span>{fileError}</span>
            </div>
          )}
          {!hasActiveConversation && (
            <div className="text-sm text-stone-500 text-center py-2">
              Please select a section to begin the conversation
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 