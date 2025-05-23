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
      <div key={fieldKey} className="mb-6">
        <label 
          htmlFor={fieldId}
          className="block text-sm font-semibold text-stone-800 mb-2"
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
            className="input-erdbaron w-full"
            placeholder={`Enter ${fieldConfig.label.toLowerCase()}`}
          />
        ) : fieldConfig.type === 'textarea' ? (
          <textarea
            id={fieldId}
            value={value}
            onChange={(e) => handleFieldChange(categoryKey, fieldKey, e.target.value)}
            rows={3}
            className="input-erdbaron w-full resize-none"
            placeholder={`Enter ${fieldConfig.label.toLowerCase()}`}
          />
        ) : fieldConfig.type === 'date' ? (
          <input
            id={fieldId}
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(categoryKey, fieldKey, e.target.value)}
            className="input-erdbaron w-full"
          />
        ) : (
          <input
            id={fieldId}
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(categoryKey, fieldKey, e.target.value)}
            className="input-erdbaron w-full"
            placeholder={`Enter ${fieldConfig.label.toLowerCase()}`}
          />
        )}
      </div>
    );
  };

  const renderCategory = (categoryKey, categoryData) => {
    return (
      <div key={categoryKey} className="card-erdbaron p-6 mb-6">
        <h3 className="text-xl font-bold text-stone-800 mb-6 pb-3 border-b border-stone-200">
          {categoryKey.replace(/_/g, ' ')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(categoryData.fields).map(([fieldKey, fieldConfig]) =>
            renderField(categoryKey, fieldKey, fieldConfig)
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-stone-50">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-amber-600 mx-auto mb-3" />
          <p className="text-stone-700 font-medium">Loading cover page...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 bg-stone-50">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-red-700 mb-2">Error loading cover page</h3>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!coverPageStructure || !coverPageStructure.categories) {
    return (
      <div className="flex items-center justify-center h-64 bg-stone-50">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-stone-400" />
          </div>
          <h3 className="text-lg font-semibold text-stone-800 mb-2">No cover page available</h3>
          <p className="text-stone-600 text-sm">Cover page structure is not available for this document.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-stone-50">
      <div className="bg-white border-b border-stone-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-stone-800">Edit Cover Page</h2>
            <p className="text-sm text-stone-600 mt-1">Configure the document cover page information</p>
          </div>
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
              hasChanges && !isSaving
                ? 'btn-erdbaron-primary'
                : 'bg-stone-300 text-stone-500 cursor-not-allowed'
            }`}
          >
            {isSaving ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto erdbaron-scrollbar">
        <div className="max-w-4xl mx-auto p-6">
          {Object.entries(coverPageStructure.categories).map(([categoryKey, categoryData]) =>
            renderCategory(categoryKey, categoryData)
          )}
        </div>
      </div>
    </div>
  );
}; 