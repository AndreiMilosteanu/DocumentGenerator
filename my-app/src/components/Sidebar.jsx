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
      <div className="px-4 py-4 flex flex-col h-full">
        {/* Back to Dashboard button */}
        <button 
          onClick={onBackToDashboard}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-3 text-sm"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </button>

        <div className="mb-3">
          <h2 className="font-semibold text-base">{selectedTopic || 'Document'}</h2>
        </div>
        
        {/* Document sections - with fixed height and scrollbar */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="text-xs font-medium text-gray-500 mb-1 px-1">Document Sections</div>
          <nav className="overflow-y-auto mb-3 flex-1 pr-1 custom-scrollbar">
            {topicStructure ? (
              <div className="space-y-2">
                {topicStructure.sections.map((section) => (
                  <div key={section.key} className="border-b pb-1 last:border-b-0">
                    <div 
                      className="flex items-center justify-between cursor-pointer p-1.5 hover:bg-gray-50 rounded-md text-sm font-medium"
                      onClick={() => toggleSection(section.key)}
                    >
                      <span>{section.title}</span>
                      {expandedSections[section.key] ? 
                        <ChevronDown className="w-3.5 h-3.5" /> : 
                        <ChevronRight className="w-3.5 h-3.5" />
                      }
                    </div>
                    
                    {expandedSections[section.key] && (
                      <ul className="ml-3 mt-1 space-y-0.5">
                        {section.subsections.map((subsection) => {
                          const isActive = activeSection === section.title && activeSubsection === subsection.title;
                          const hasActiveConversation = hasConversation(section.key, subsection.key);
                          const subsectionApproved = isApproved(section.key, subsection.key);
                          
                          return (
                            <li
                              key={subsection.key}
                              onClick={() => handleSubsectionClick(section.title, subsection.title, section.key, subsection.key)}
                              className={`cursor-pointer py-1.5 px-2 rounded-md flex items-center justify-between text-xs ${
                                isActive ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-gray-50'
                              }`}
                            >
                              <span className="flex-1 mr-2 truncate">{subsection.title}</span>
                              <div className="flex items-center space-x-1.5 flex-shrink-0">
                                {subsectionApproved && (
                                  <span className="w-2 h-2 bg-green-500 rounded-full" title="Approved"></span>
                                )}
                                {hasActiveConversation && (
                                  <MessageCircle className="w-3.5 h-3.5 text-blue-600" title="Has conversation" />
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
                <AlertCircle className="w-5 h-5 mb-2" />
                <p className="text-xs">Document structure not available</p>
              </div>
            )}
          </nav>
          
          {/* File List Component with fixed height */}
          {documentId && (
            <div className="mt-1 mb-2 flex-shrink-0 max-h-60">
              <FileList documentId={documentId} />
            </div>
          )}
        </div>
      </div>
      
      {/* Error message for when we can't find the section in the PDF */}
      {showNotFoundError && (
        <div className="px-4 pb-3">
          <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs">
            <p>Diese Sektion konnte im PDF nicht gefunden werden.</p>
          </div>
        </div>
      )}
    </aside>
  )
} 