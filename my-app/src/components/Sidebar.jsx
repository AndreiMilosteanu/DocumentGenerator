import React, { useState } from 'react'
import { ChevronRight, ChevronDown, MessageCircle, ChevronLeft, AlertCircle } from 'lucide-react'
import { documentStructure } from '../constants/documentStructure'
import { FileList } from './FileList'

export const Sidebar = ({ 
  selectedTopic,
  activeSection,
  activeSubsection,
  onSectionClick,
  subsectionStatus = {},
  isSubsectionApproved,
  documentId,
  onBackToDashboard
}) => {
  const [expandedSections, setExpandedSections] = useState({});
  const [lastClickedSubsection, setLastClickedSubsection] = useState(null);
  const [showNotFoundError, setShowNotFoundError] = useState(false);

  const toggleSection = (sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const handleSubsectionClick = (sectionTitle, subsectionTitle, sectionKey, subsectionKey) => {
    if (!documentId) return; // Do nothing if document ID is not set

    // Set this subsection as the last clicked one
    setLastClickedSubsection(subsectionTitle);
    
    // Clear any previous error message
    setShowNotFoundError(false);

    // Call the parent handler
    onSectionClick(sectionTitle, subsectionTitle, sectionKey, subsectionKey);

    // After a delay, if this is still the last clicked subsection,
    // show the error message
    setTimeout(() => {
      if (lastClickedSubsection === subsectionTitle) {
        setShowNotFoundError(true);
        setTimeout(() => setShowNotFoundError(false), 3000); // Hide after 3 seconds
      }
    }, 1000); // Wait 1 second for the scroll to happen
  };

  // Check if a subsection has a conversation
  const hasConversation = (sectionKey, subsectionKey) => {
    const key = `${sectionKey}/${subsectionKey}`;
    return subsectionStatus[key]?.hasConversation || false;
  };

  // Check if a subsection is approved
  const isApproved = (sectionKey, subsectionKey) => {
    if (!documentId) return false;
    return isSubsectionApproved(documentId, sectionKey, subsectionKey);
  };

  // Only render the document structure for the selected topic
  const topicStructure = documentStructure[selectedTopic];

  return (
    <aside className="w-72 bg-white border-r flex flex-col h-full overflow-hidden">
      <div className="p-6 flex flex-col flex-1">
        {/* Back to Dashboard button */}
        <button 
          onClick={onBackToDashboard}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6 text-sm"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </button>

        <div className="mb-4">
          <h2 className="font-semibold text-lg">{selectedTopic || 'Document'}</h2>
        </div>
        
        {/* Document sections */}
        <nav className="flex-1 overflow-y-auto pr-2">
          {topicStructure ? (
            <div className="space-y-4">
              {topicStructure.sections.map((section) => (
                <div key={section.key} className="border-b pb-2 last:border-b-0">
                  <div 
                    className="flex items-center justify-between cursor-pointer p-2 hover:bg-gray-50 rounded-lg font-medium"
                    onClick={() => toggleSection(section.key)}
                  >
                    <span>{section.title}</span>
                    {expandedSections[section.key] ? 
                      <ChevronDown className="w-4 h-4" /> : 
                      <ChevronRight className="w-4 h-4" />
                    }
                  </div>
                  
                  {expandedSections[section.key] && (
                    <ul className="ml-4 mt-2 space-y-1">
                      {section.subsections.map((subsection) => {
                        const isActive = activeSection === section.title && activeSubsection === subsection.title;
                        const hasActiveConversation = hasConversation(section.key, subsection.key);
                        const subsectionApproved = isApproved(section.key, subsection.key);
                        
                        return (
                          <li
                            key={subsection.key}
                            onClick={() => handleSubsectionClick(section.title, subsection.title, section.key, subsection.key)}
                            className={`cursor-pointer py-2 px-3 rounded-md flex items-center justify-between ${
                              isActive ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-gray-50'
                            }`}
                          >
                            <span className="flex-1 mr-2">{subsection.title}</span>
                            <div className="flex items-center space-x-2">
                              {subsectionApproved && (
                                <span className="w-2 h-2 bg-green-500 rounded-full" title="Approved"></span>
                              )}
                              {hasActiveConversation && (
                                <MessageCircle className="w-4 h-4 text-blue-600" title="Has conversation" />
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <AlertCircle className="w-6 h-6 mb-2" />
              <p className="text-sm">Document structure not available</p>
            </div>
          )}
        </nav>
        
        {/* File List Component */}
        {documentId && <FileList documentId={documentId} />}
      </div>
      
      {/* Error message for when we can't find the section in the PDF */}
      {showNotFoundError && (
        <div className="p-6 pt-0">
          <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
            <p>Diese Sektion konnte im PDF nicht gefunden werden.</p>
          </div>
        </div>
      )}
    </aside>
  )
} 