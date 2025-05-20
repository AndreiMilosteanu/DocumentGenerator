import { useState, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../constants/documentStructure';
import { useAuth } from '../contexts/AuthContext';

export const useFileUpload = () => {
  const { getAuthHeader } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadError, setUploadError] = useState(null);
  const [files, setFiles] = useState([]);
  
  // Track loaded documents to avoid duplicate API calls
  const loadedDocuments = useRef(new Set());

  // Scenario 2: Add files to existing document (outside conversation)
  const uploadFileToDocument = async (documentId, file, section = null, subsection = null, onFileUploaded = null) => {
    setIsUploading(true);
    setUploadError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (section) formData.append('section', section);
      if (subsection) formData.append('subsection', subsection);
      
      console.log('Uploading file to document:', {
        documentId,
        fileName: file.name,
        section,
        subsection
      });

      // Set initial progress
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: 0
      }));

      const response = await fetch(`${API_BASE_URL}/upload/${documentId}/file`, {
        method: 'POST',
        headers: {
          ...getAuthHeader()
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('File upload to document failed:', {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText
        });
        throw new Error(`Failed to upload file: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('File uploaded successfully:', data);
      
      // Set progress to 100%
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: 100
      }));
      
      // After successful upload, refresh the file list
      await listDocumentFiles(documentId, true);
      
      // Call the callback to refresh the PDF if provided
      if (typeof onFileUploaded === 'function') {
        console.log('Calling callback to refresh PDF after file upload');
        onFileUploaded(documentId);
      }
      
      return data;
    } catch (error) {
      console.error('Error uploading file to document:', error);
      setUploadError(error.message);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Scenario 3: Add files during conversation
  const uploadFileWithMessage = async (documentId, file, message = '', onFileUploaded = null) => {
    setIsUploading(true);
    setUploadError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (message) formData.append('message', message);
      
      console.log('Uploading file with message:', {
        documentId,
        fileName: file.name,
        hasMessage: !!message
      });

      // Set initial progress
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: 0
      }));

      const response = await fetch(`${API_BASE_URL}/upload/${documentId}/message-file`, {
        method: 'POST',
        headers: {
          ...getAuthHeader()
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('File upload with message failed:', {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText
        });
        throw new Error(`Failed to upload file with message: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('File uploaded with message successfully:', data);
      
      // Set progress to 100%
      setUploadProgress(prev => ({
        ...prev,
        [file.name]: 100
      }));
      
      // After successful upload, refresh the file list
      await listDocumentFiles(documentId, true);
      
      // Call the callback to refresh the PDF if provided
      if (typeof onFileUploaded === 'function') {
        console.log('Calling callback to refresh PDF after file upload with message');
        onFileUploaded(documentId);
      }
      
      return data;
    } catch (error) {
      console.error('Error uploading file with message:', error);
      setUploadError(error.message);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Scenario 4: List files for a document
  const listDocumentFiles = useCallback(async (documentId, forceRefresh = false) => {
    setUploadError(null);
    
    // If we've already loaded this document's files and we're not forcing a refresh, use the cached data
    if (loadedDocuments.current.has(documentId) && !forceRefresh) {
      console.log('Using cached files for document:', documentId);
      return files;
    }
    
    try {
      console.log('Fetching files for document:', documentId);
      
      const response = await fetch(`${API_BASE_URL}/upload/${documentId}/files`, {
        method: 'GET',
        headers: {
          ...getAuthHeader()
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Listing files failed:', {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText
        });
        throw new Error(`Failed to fetch files: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Files fetched successfully:', data);
      
      // Extract files array from response
      const fileArray = Array.isArray(data.files) ? data.files : [];
      setFiles(fileArray);
      
      // Mark this document as loaded
      loadedDocuments.current.add(documentId);
      
      return fileArray;
    } catch (error) {
      console.error('Error listing document files:', error);
      setUploadError(error.message);
      // Return empty array on error
      setFiles([]);
      throw error;
    }
  }, [getAuthHeader, files]);

  // Scenario 5: Check file upload status
  const checkFileStatus = async (fileId) => {
    setUploadError(null);
    
    try {
      console.log('Checking file status:', fileId);
      
      const response = await fetch(`${API_BASE_URL}/upload/files/status/${fileId}`, {
        method: 'GET',
        headers: {
          ...getAuthHeader()
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Checking file status failed:', {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText
        });
        throw new Error(`Failed to check file status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('File status checked successfully:', data);
      return data;
    } catch (error) {
      console.error('Error checking file status:', error);
      setUploadError(error.message);
      throw error;
    }
  };

  // Scenario 6: Delete an uploaded file
  const deleteFile = async (documentId, fileId, onFileDeleted = null) => {
    setUploadError(null);
    
    try {
      console.log('Deleting file:', { documentId, fileId });
      
      const response = await fetch(`${API_BASE_URL}/upload/${documentId}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeader()
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Deleting file failed:', {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText
        });
        throw new Error(`Failed to delete file: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('File deleted successfully:', data);
      
      // Update the files list by removing the deleted file
      setFiles(prevFiles => {
        // Ensure prevFiles is always treated as an array
        const fileArray = Array.isArray(prevFiles) ? prevFiles : [];
        return fileArray.filter(file => file.id !== fileId);
      });
      
      // Call the callback to refresh the PDF if provided
      if (typeof onFileDeleted === 'function') {
        console.log('Calling callback to refresh PDF after file deletion');
        onFileDeleted(documentId);
      }
      
      return data;
    } catch (error) {
      console.error('Error deleting file:', error);
      setUploadError(error.message);
      throw error;
    }
  };

  // Utility to reset loaded documents state
  const resetCache = () => {
    loadedDocuments.current.clear();
  };

  return {
    isUploading,
    uploadProgress,
    uploadError,
    files,
    uploadFileToDocument,
    uploadFileWithMessage,
    listDocumentFiles,
    checkFileStatus,
    deleteFile,
    resetCache
  };
}; 