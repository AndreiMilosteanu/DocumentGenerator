import { useState, useCallback } from 'react';
import { API_BASE_URL } from '../constants/documentStructure';
import { useAuth } from '../contexts/AuthContext';

export const useCoverPage = () => {
  const { getAuthHeader } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [coverPageStructure, setCoverPageStructure] = useState(null);
  const [coverPageData, setCoverPageData] = useState(null);

  // Fetch the cover page structure for a document
  const fetchCoverPageStructure = useCallback(async (documentId) => {
    if (!documentId) {
      console.error('Document ID is required to fetch cover page structure');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching cover page structure for document:', documentId);
      
      const response = await fetch(`${API_BASE_URL}/cover-page/${documentId}/structure`, {
        headers: {
          ...getAuthHeader()
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch cover page structure:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`Failed to fetch cover page structure: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Cover page structure fetched successfully:', data);
      
      setCoverPageStructure(data);
      return data;
    } catch (error) {
      console.error('Error fetching cover page structure:', error);
      setError(error.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeader]);

  // Fetch the cover page data for a document
  const fetchCoverPageData = useCallback(async (documentId) => {
    if (!documentId) {
      console.error('Document ID is required to fetch cover page data');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching cover page data for document:', documentId);
      
      const response = await fetch(`${API_BASE_URL}/cover-page/${documentId}/data`, {
        headers: {
          ...getAuthHeader()
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch cover page data:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`Failed to fetch cover page data: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Cover page data fetched successfully:', data);
      
      setCoverPageData(data);
      return data;
    } catch (error) {
      console.error('Error fetching cover page data:', error);
      setError(error.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeader]);

  // Update the cover page data for a document
  const updateCoverPageData = useCallback(async (documentId, data) => {
    if (!documentId) {
      console.error('Document ID is required to update cover page data');
      return null;
    }

    if (!data) {
      console.error('Data is required to update cover page');
      return null;
    }

    setIsSaving(true);
    setError(null);

    try {
      console.log('Updating cover page data for document:', documentId);
      console.log('Update data:', data);
      
      const response = await fetch(`${API_BASE_URL}/cover-page/${documentId}/data`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ data })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to update cover page data:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`Failed to update cover page data: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('Cover page data updated successfully:', responseData);
      
      setCoverPageData(responseData);
      return responseData;
    } catch (error) {
      console.error('Error updating cover page data:', error);
      setError(error.message);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [getAuthHeader]);

  // Reset state
  const resetState = useCallback(() => {
    setCoverPageStructure(null);
    setCoverPageData(null);
    setError(null);
  }, []);

  return {
    isLoading,
    isSaving,
    error,
    coverPageStructure,
    coverPageData,
    fetchCoverPageStructure,
    fetchCoverPageData,
    updateCoverPageData,
    resetState
  };
}; 