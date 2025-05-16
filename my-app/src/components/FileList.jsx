import React, { useEffect, useState, useRef } from 'react';
import { File, Upload, Trash2, Loader, XCircle, Paperclip, RefreshCw } from 'lucide-react';
import { useFileUpload } from '../hooks/useFileUpload';

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

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
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
      await uploadFileToDocument(documentId, file);
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
      await uploadFileToDocument(documentId, file);
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
      await deleteFile(documentId, fileId);
      // No need to refresh files as deleteFile already updates the local state
    } catch (error) {
      console.error('Error deleting file:', error);
      setFileError('Fehler beim Löschen der Datei.');
    }
  };

  // Ensure files is always an array
  const fileList = Array.isArray(files) ? files : [];

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-gray-900">Dateien</h3>
        <button 
          onClick={handleRefreshFiles}
          disabled={isRefreshing || isUploading}
          className="text-gray-500 hover:text-blue-600 p-1 rounded-full disabled:opacity-50"
          title="Dateien aktualisieren"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} 
          rounded-md p-3 text-center cursor-pointer mb-3 ${isUploading ? 'opacity-50' : ''}`}
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
          <div className="flex items-center justify-center py-2">
            <Loader className="w-4 h-4 mr-2 animate-spin text-blue-500" />
            <span className="text-sm text-gray-500">Hochladen...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-2">
            <Upload className="w-5 h-5 mb-1 text-gray-500" />
            <span className="text-xs text-gray-500">
              Datei hochladen (.pdf, .docx)
            </span>
          </div>
        )}
      </div>
      
      {/* Error messages */}
      {(fileError || uploadError) && (
        <div className="mb-3 text-xs text-red-500 flex items-center">
          <XCircle className="w-3 h-3 mr-1 flex-shrink-0" />
          <span>{fileError || uploadError}</span>
        </div>
      )}
      
      {/* File List */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {fileList.length === 0 ? (
          <div className="text-center text-gray-500 py-4 text-sm">
            <Paperclip className="w-5 h-5 mx-auto mb-1" />
            <p>Keine Dateien vorhanden</p>
          </div>
        ) : (
          fileList.map((file) => (
            <div 
              key={file.id} 
              className="flex items-center justify-between p-2 border border-gray-200 rounded-md hover:bg-gray-50"
            >
              <div className="flex items-center overflow-hidden">
                <File className="w-4 h-4 text-gray-500 flex-shrink-0 mr-2" />
                <span className="text-xs text-gray-700 truncate">{file.filename}</span>
              </div>
              <button
                onClick={() => handleDeleteFile(file.id)}
                className="text-gray-400 hover:text-red-500 p-1"
                title="Datei löschen"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 