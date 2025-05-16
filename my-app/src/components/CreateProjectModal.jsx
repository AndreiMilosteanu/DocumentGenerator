import React, { useState } from 'react'
import { X, Loader } from 'lucide-react'

export const CreateProjectModal = ({ onClose, onCreateProject, documentTypes }) => {
  const [selectedType, setSelectedType] = useState(documentTypes[0] || '')
  const [projectName, setProjectName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    
    try {
      // Validate input - ensure we have a valid document type
      if (!selectedType) {
        setError('Bitte wählen Sie einen Dokumenttyp.')
        setIsSubmitting(false)
        return
      }
      
      // Use a default name if none is provided
      const nameToUse = projectName.trim() || `Neues ${selectedType} Projekt`
      
      // Create project data object for better debugging
      const projectData = {
        name: nameToUse,
        topic: selectedType
      }
      
      console.log('Project data to send:', projectData)
      
      // Create project with the prepared data
      await onCreateProject(selectedType, nameToUse)
      
      // Only close the modal on success
      onClose()
    } catch (error) {
      console.error('Error creating project:', error)
      setError(`Fehler beim Erstellen des Projekts: ${error.message}`)
      // Don't close the modal on error
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-lg font-semibold">Neues Projekt erstellen</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dokumenttyp
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isSubmitting}
            >
              {documentTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Projektname (optional)
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="z.B. Bauleitplanung Hamburg"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            />
          </div>
          
          {error && (
            <div className="text-sm text-red-500">
              {error}
            </div>
          )}
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isSubmitting}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center space-x-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Erstelle...</span>
                </>
              ) : (
                <span>Erstellen</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 