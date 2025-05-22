import React, { useEffect, useState } from 'react';
import { X, Save, Check, Loader } from 'lucide-react';

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
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-lg font-semibold">
            Daten bearbeiten
            <span className="text-sm font-normal text-gray-500 ml-2">→</span>
            <span className="text-sm ml-2">{sectionTitle}</span>
            <span className="text-sm font-normal text-gray-500 ml-2">→</span>
            <span className="text-sm ml-2">{subsectionTitle}</span>
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-auto">
          <div className="mb-4">
            <label htmlFor="sectionData" className="block text-sm font-medium text-gray-700 mb-1">
              Abschnittsdaten
            </label>
            <textarea
              id="sectionData"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full h-64 p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Hier können Sie die Daten für diesen Abschnitt bearbeiten..."
              disabled={isLoading}
            />
          </div>
          
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="notifyAssistant"
              checked={notifyAssistant}
              onChange={(e) => setNotifyAssistant(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              disabled={isLoading}
            />
            <label htmlFor="notifyAssistant" className="ml-2 block text-sm text-gray-700">
              Assistenten über diese Änderung informieren
            </label>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>
        
        <div className="border-t px-4 py-3 flex justify-end space-x-3">
          <button
            onClick={handleUpdate}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center"
          >
            {isLoading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Nur speichern
          </button>
          <button
            onClick={handleUpdateAndApprove}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
          >
            {isLoading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
            Speichern und in PDF übernehmen
          </button>
        </div>
      </div>
    </div>
  );
}; 