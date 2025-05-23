import React, { useState, useEffect } from 'react';
import { Save, Loader, FileText, AlertCircle } from 'lucide-react';
import { useCoverPage } from '../hooks/useCoverPage';

export const CoverPageEditor = ({ documentId, onSave }) => {
  const {
    isLoading,
    isSaving,
    error,
    coverPageStructure,
    coverPageData,
    fetchCoverPageStructure,
    fetchCoverPageData,
    updateCoverPageData
  } = useCoverPage();

  const [formData, setFormData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Load cover page structure and data when component mounts or documentId changes
  useEffect(() => {
    if (documentId) {
      console.log('Loading cover page for document:', documentId);
      fetchCoverPageStructure(documentId);
      fetchCoverPageData(documentId);
    }
  }, [documentId, fetchCoverPageStructure, fetchCoverPageData]);

  // Initialize form data when cover page data is loaded
  useEffect(() => {
    if (coverPageData?.data) {
      console.log('Initializing form data:', coverPageData.data);
      setFormData(coverPageData.data);
      setHasChanges(false);
    }
  }, [coverPageData]);

  const handleFieldChange = (categoryKey, fieldKey, value) => {
    setFormData(prev => ({
      ...prev,
      [categoryKey]: {
        ...prev[categoryKey],
        [fieldKey]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!documentId || !hasChanges) return;

    console.log('Saving cover page data:', formData);
    
    const result = await updateCoverPageData(documentId, formData);
    
    if (result) {
      setHasChanges(false);
      console.log('Cover page saved successfully');
      
      // Call the onSave callback to refresh the PDF
      if (onSave) {
        onSave();
      }
    }
  };

  const renderField = (categoryKey, fieldKey, fieldConfig) => {
    const value = formData[categoryKey]?.[fieldKey] || '';
    const fieldId = `${categoryKey}-${fieldKey}`;

    return (
      <div key={fieldKey} className="mb-4">
        <label 
          htmlFor={fieldId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {fieldConfig.label}
          {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {fieldConfig.type === 'text' || fieldConfig.type === 'string' ? (
          <input
            id={fieldId}
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(categoryKey, fieldKey, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={`Enter ${fieldConfig.label.toLowerCase()}`}
          />
        ) : fieldConfig.type === 'textarea' ? (
          <textarea
            id={fieldId}
            value={value}
            onChange={(e) => handleFieldChange(categoryKey, fieldKey, e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={`Enter ${fieldConfig.label.toLowerCase()}`}
          />
        ) : fieldConfig.type === 'date' ? (
          <input
            id={fieldId}
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(categoryKey, fieldKey, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        ) : (
          <input
            id={fieldId}
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(categoryKey, fieldKey, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={`Enter ${fieldConfig.label.toLowerCase()}`}
          />
        )}
      </div>
    );
  };

  const renderCategory = (categoryKey, categoryData) => {
    return (
      <div key={categoryKey} className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          {categoryKey.replace(/_/g, ' ')}
        </h3>
        <div className="space-y-4">
          {Object.entries(categoryData.fields).map(([fieldKey, fieldConfig]) =>
            renderField(categoryKey, fieldKey, fieldConfig)
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading cover page...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 font-medium">Error loading cover page</p>
          <p className="text-gray-600 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!coverPageStructure || !coverPageStructure.categories) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No cover page structure available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Edit Cover Page</h2>
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              hasChanges && !isSaving
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          {Object.entries(coverPageStructure.categories).map(([categoryKey, categoryData]) =>
            renderCategory(categoryKey, categoryData)
          )}
        </div>
      </div>
    </div>
  );
}; 