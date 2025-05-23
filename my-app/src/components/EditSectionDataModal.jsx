import React, { useEffect, useState } from 'react';
import { X, Save, Check, Loader, ChevronRight } from 'lucide-react';

export const EditSectionDataModal = ({
  isOpen,
  onClose,
  sectionTitle,
  subsectionTitle,
  onUpdateAndApprove,
  onUpdate,
  initialValue
}) => {
  const [value, setValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [notifyAssistant, setNotifyAssistant] = useState(true);
  
  // Reset state when modal is opened with new data
  useEffect(() => {
    if (isOpen && initialValue) {
      setValue(initialValue);
      setError('');
    }
  }, [isOpen, initialValue]);
  
  const handleUpdate = async () => {
    if (!value.trim()) {
      setError('Der Inhalt darf nicht leer sein.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await onUpdate(value);
      // Don't close modal - let user decide to either continue editing or approve
    } catch (error) {
      setError('Fehler beim Aktualisieren der Daten: ' + (error.message || 'Unbekannter Fehler'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateAndApprove = async () => {
    if (!value.trim()) {
      setError('Der Inhalt darf nicht leer sein.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await onUpdateAndApprove(value, notifyAssistant);
      onClose();
    } catch (error) {
      setError('Fehler beim Aktualisieren und Genehmigen der Daten: ' + (error.message || 'Unbekannter Fehler'));
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto flex flex-col">
        {/* Header with breadcrumb */}
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4 bg-stone-50">
          <div>
            <h2 className="text-xl font-bold text-stone-800 mb-2">Edit Section Data</h2>
            <div className="flex items-center text-sm text-stone-600">
              <span className="text-stone-700 font-medium">{sectionTitle}</span>
              <ChevronRight className="w-4 h-4 mx-2 text-stone-400" />
              <span className="text-amber-700 font-medium">{subsectionTitle}</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-stone-500 hover:text-stone-700 hover:bg-stone-100 p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 flex-1 overflow-auto bg-white">
          <div className="mb-6">
            <label htmlFor="sectionData" className="block text-sm font-semibold text-stone-800 mb-3">
              Section Content
            </label>
            <textarea
              id="sectionData"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="input-erdbaron w-full h-64 resize-none"
              placeholder="Edit the content for this section..."
              disabled={isLoading}
            />
          </div>
          
          <div className="flex items-center mb-6">
            <input
              type="checkbox"
              id="notifyAssistant"
              checked={notifyAssistant}
              onChange={(e) => setNotifyAssistant(e.target.checked)}
              className="h-4 w-4 text-amber-600 border-stone-300 rounded focus:ring-amber-500 focus:ring-2"
              disabled={isLoading}
            />
            <label htmlFor="notifyAssistant" className="ml-3 block text-sm text-stone-700 font-medium">
              Notify assistant about this change
            </label>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
              {error}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t border-stone-200 px-6 py-4 bg-stone-50 flex justify-end space-x-3">
          <button
            onClick={handleUpdate}
            disabled={isLoading}
            className="btn-erdbaron-outline flex items-center"
          >
            {isLoading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Only
          </button>
          <button
            onClick={handleUpdateAndApprove}
            disabled={isLoading}
            className="btn-erdbaron-primary flex items-center"
          >
            {isLoading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
            Save & Apply to PDF
          </button>
        </div>
      </div>
    </div>
  );
}; 