import React from 'react'
import { Send, Paperclip, Upload, XCircle, Check, Loader } from 'lucide-react'

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
  onApproveData,
  isApprovingData,
  isSubsectionApproved,
  isUploading
}) => {
  // Determine button state for rendering
  const isButtonDisabled = isApprovingData || isLoading || isSubsectionApproved || isUploading;
  
  // Get approve button style based on approval state
  const getApproveButtonStyle = () => {
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
          className={`relative flex items-center space-x-2 ${
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
            className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600 disabled:opacity-50"
            title="PDF oder DOCX anhängen (max. 10 MB)"
            disabled={!hasActiveConversation || isUploading}
          >
            {isUploading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </button>
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={onInputChange}
            placeholder="Schreiben Sie Ihre Antwort..."
            className="flex-1 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!hasActiveConversation || isUploading}
          />
          
          {/* Approve button - placed before the send button */}
          {hasActiveConversation && (
            <button
              type="button" 
              onClick={onApproveData}
              disabled={isButtonDisabled}
              className={`p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 flex items-center justify-center ${getApproveButtonStyle()} disabled:cursor-not-allowed`}
              title={isSubsectionApproved ? "Daten sind bereits gespeichert" : "Daten in PDF übernehmen"}
            >
              {isApprovingData ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
            </button>
          )}
          
          <button
            type="submit"
            disabled={(!inputMessage.trim() && !selectedFile) || isLoading || !hasActiveConversation || isUploading}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading || isUploading ? (
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
                disabled={isUploading}
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