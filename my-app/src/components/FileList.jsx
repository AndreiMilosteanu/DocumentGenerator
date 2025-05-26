import React, { useEffect, useState, useRef } from 'react';
import { File, Upload, Trash2, Loader, XCircle, Paperclip, RefreshCw } from 'lucide-react';
import { useFileUpload } from '../hooks/useFileUpload';
import { useConversation } from '../hooks/useConversation';

export const FileList = ({ documentId }) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fileInputRef = useRef(null);

  const {
    files,
    isUploading,
    uploadError,
    uploadFileToDocument,
    listDocumentFiles,
    deleteFile
  } = useFileUpload();
  
  // Get fetchPdfPreview from useConversation
  const { fetchPdfPreview } = useConversation();

  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
  const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.pdf',
    '.docx'
  ];

  // Fetch files only when component mounts or documentId changes
  useEffect(() => {
    if (documentId) {
      // Initial loading of files - don't force refresh
      listDocumentFiles(documentId).catch(error => {
        console.error('Error fetching files:', error);
      });
    }
  }, [documentId]);

  const handleRefreshFiles = async () => {
    if (!documentId || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      // Force refresh from server
      await listDocumentFiles(documentId, true);
    } catch (error) {
      console.error('Error refreshing files:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const validateFile = (file) => {
    if (!file) return false;
    
    // Check file type
    const isValidType = ALLOWED_FILE_TYPES.some(type => 
      file.type === type || file.name.endsWith(type)
    );
    
    if (!isValidType) {
      setFileError('Nur PDF und DOCX Dateien sind erlaubt');
      return false;
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`Datei ist zu groß (max. ${MAX_FILE_SIZE / (1024 * 1024)} MB)`);
      return false;
    }
    
    setFileError('');
    return true;
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const file = files[0]; // Take only the first file for now
    if (!validateFile(file)) return;

    try {
      console.log('FileList: Uploading file and then refreshing PDF', { fileName: file.name, documentId });
      
      // Define a callback for refreshing the PDF after upload
      const refreshPdfCallback = (docId) => {
        console.log('FileList: Refreshing PDF after file upload', { docId });
        return fetchPdfPreview(docId);
      };
      
      await uploadFileToDocument(documentId, file, null, null, refreshPdfCallback);
      // No need to refresh files explicitly as uploadFileToDocument now does this
      setFileError('');
    } catch (error) {
      console.error('Error uploading file:', error);
      setFileError('Fehler beim Hochladen der Datei.');
    }
  };

  const handleDrag = (e, isActive) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUploading) return;
    setDragActive(isActive);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (isUploading) return;
    
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length === 0) return;

    const file = files[0]; // Take only the first file for now
    if (!validateFile(file)) return;

    try {
      console.log('FileList: Uploading file via drop and then refreshing PDF', { fileName: file.name, documentId });
      
      // Define a callback for refreshing the PDF after upload
      const refreshPdfCallback = (docId) => {
        console.log('FileList: Refreshing PDF after file drop upload', { docId });
        return fetchPdfPreview(docId);
      };
      
      await uploadFileToDocument(documentId, file, null, null, refreshPdfCallback);
      // No need to refresh files explicitly as uploadFileToDocument now does this
      setFileError('');
    } catch (error) {
      console.error('Error uploading file:', error);
      setFileError('Fehler beim Hochladen der Datei.');
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Möchten Sie diese Datei wirklich löschen?')) {
      return;
    }
    
    try {
      console.log('FileList: Deleting file and then refreshing PDF', { fileId, documentId });
      
      // Define a callback for refreshing the PDF after deletion
      const refreshPdfCallback = (docId) => {
        console.log('FileList: Refreshing PDF after file deletion', { docId });
        return fetchPdfPreview(docId);
      };
      
      await deleteFile(documentId, fileId, refreshPdfCallback);
      // No need to refresh files as deleteFile already updates the local state
    } catch (error) {
      console.error('Error deleting file:', error);
      setFileError('Fehler beim Löschen der Datei.');
    }
  };

  // Get status badge color and text
  const getStatusBadge = (status) => {
    const statusConfig = {
      'processing': { color: 'bg-yellow-100 text-yellow-800', text: 'Verarbeitung' },
      'ready': { color: 'bg-green-100 text-green-800', text: 'Bereit' },
      'error': { color: 'bg-red-100 text-red-800', text: 'Fehler' },
      'default': { color: 'bg-gray-100 text-gray-800', text: status }
    };

    const config = statusConfig[status?.toLowerCase()] || statusConfig.default;
    return (
      <span className={`text-xs px-2 py-1 rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  // Get attachment label based on attachment flag
  const getAttachmentLabel = (attachment) => {
    if (attachment === true) {
      return (
        <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800 font-medium">
          Anlage
        </span>
      );
    } else {
      return (
        <span className="text-xs px-2 py-1 rounded-full bg-stone-100 text-stone-600">
          Conversation Only
        </span>
      );
    }
  };

  // Ensure files is always an array
  const fileList = Array.isArray(files) ? files : [];

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <h3 className="font-medium text-xs text-stone-700">Dateien</h3>
        <button 
          onClick={handleRefreshFiles}
          disabled={isRefreshing || isUploading}
          className="text-stone-500 hover:text-amber-600 p-0.5 rounded-full disabled:opacity-50 transition-colors duration-200"
          title="Dateien aktualisieren"
        >
          <RefreshCw className={`w-3.5 h-3.5 flex-shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed ${dragActive ? 'border-amber-500 bg-amber-50' : 'border-stone-300'} 
          rounded-lg p-2 text-center cursor-pointer mb-1.5 transition-all duration-200 ${isUploading ? 'opacity-50' : 'hover:border-amber-400 hover:bg-amber-50'}`}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        onDragEnter={(e) => handleDrag(e, true)}
        onDragOver={(e) => handleDrag(e, true)}
        onDragLeave={(e) => handleDrag(e, false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.docx"
          disabled={isUploading}
        />
        
        {isUploading ? (
          <div className="flex items-center justify-center py-1">
            <Loader className="w-3.5 h-3.5 mr-1.5 animate-spin text-amber-600" />
            <span className="text-xs text-stone-600">Hochladen...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-1">
            <Upload className="w-4 h-4 mb-0.5 text-stone-500" />
            <span className="text-xs text-stone-600">
              Datei hochladen (.pdf, .docx)
            </span>
          </div>
        )}
      </div>
      
      {/* Error messages */}
      {(fileError || uploadError) && (
        <div className="mb-1.5 text-xs text-red-600 flex items-center bg-red-50 p-2 rounded-lg border border-red-200">
          <XCircle className="w-3 h-3 mr-1 flex-shrink-0" />
          <span className="text-xs">{fileError || uploadError}</span>
        </div>
      )}
      
      {/* File List */}
      <div className="overflow-y-auto erdbaron-scrollbar pr-1 space-y-1.5" style={{ maxHeight: '180px' }}>
        {fileList.length === 0 ? (
          <div className="text-center text-stone-500 py-3 text-xs">
            <Paperclip className="w-4 h-4 mx-auto mb-1" />
            <p>Keine Dateien vorhanden</p>
          </div>
        ) : (
          fileList.map((file) => (
            <div 
              key={file.id} 
              className="flex flex-col p-1.5 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors duration-200"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center overflow-hidden">
                  <File className="w-3.5 h-3.5 text-stone-500 flex-shrink-0 mr-1.5" />
                  <span className="text-xs text-stone-700 truncate" title={file.original_filename}>
                    {file.original_filename}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteFile(file.id)}
                  className="text-stone-400 hover:text-red-500 p-0.5 ml-1 transition-colors duration-200"
                  title="Datei löschen"
                >
                  <Trash2 className="w-3 h-3 flex-shrink-0" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-wrap gap-1.5">
                  {getStatusBadge(file.status)}
                  {getAttachmentLabel(file.attachment)}
                  {file.error_message && (
                    <span className="text-xs text-red-600" title={file.error_message}>
                      <XCircle className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <span className="text-xs text-stone-500 flex-shrink-0 ml-2">
                  {(file.file_size / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 