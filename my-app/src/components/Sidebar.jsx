import React, { useState } from 'react'
import { ChevronRight, ChevronDown, MessageCircle, ChevronLeft, AlertCircle, FileText, CheckCircle2, CircleDashed } from 'lucide-react'
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
  onBackToDashboard,
  onDeckblattClick,
  isDeckblattActive,
  onPdfRefresh
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
    <aside className="w-72 bg-stone-50 border-r border-stone-200 flex flex-col h-full overflow-hidden">
      <div className="px-4 py-4 flex flex-col h-full">
        {/* Back to Dashboard button */}
        <button
          onClick={onBackToDashboard}
          className="flex items-center text-amber-700 hover:text-amber-800 hover:bg-amber-50 p-2 rounded-lg mb-4 text-sm font-medium transition-all duration-200"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Dashboard
        </button>

        <div className="mb-4">
          <h2 className="font-bold text-lg text-stone-800">{selectedTopic || 'Document'}</h2>
          <p className="text-xs text-stone-600 mt-1">Erdbaron Document Generator</p>
        </div>
        
        {/* Deckblatt Section - Always visible for all topics */}
        <div className="mb-6">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3 px-1">Cover Page</div>
          <div
            onClick={onDeckblattClick}
            className={`cursor-pointer py-3 px-4 rounded-xl flex items-center text-sm font-medium transition-all duration-200 ${
              isDeckblattActive 
                ? 'bg-amber-100 text-amber-800 border-2 border-amber-200 shadow-sm' 
                : 'hover:bg-white hover:shadow-sm border-2 border-transparent text-stone-700 hover:text-amber-700'
            }`}
          >
            <FileText className="w-5 h-5 mr-3 text-amber-600" />
            <span>Deckblatt</span>
          </div>
        </div>
        
        {/* Document sections - with fixed height and scrollbar */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3 px-1">Document Sections</div>
          <nav className="overflow-y-auto mb-4 flex-1 pr-1 erdbaron-scrollbar">
            {topicStructure ? (
              <div className="space-y-3">
                {topicStructure.sections.map((section) => (
                  <div key={section.key} className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
                    <div 
                      className="flex items-center justify-between cursor-pointer p-4 hover:bg-stone-50 text-sm font-semibold text-stone-800 transition-colors duration-200"
                      onClick={() => toggleSection(section.key)}
                    >
                      <span>{section.title}</span>
                      {expandedSections[section.key] ? 
                        <ChevronDown className="w-4 h-4 text-stone-500" /> : 
                        <ChevronRight className="w-4 h-4 text-stone-500" />
                      }
                    </div>
                    
                    {expandedSections[section.key] && (
                      <div className="border-t border-stone-200">
                        {section.subsections.map((subsection) => {
                          const isActive = activeSection === section.title && activeSubsection === subsection.title;
                          const hasActiveConversation = hasConversation(section.key, subsection.key);
                          const subsectionApproved = isApproved(section.key, subsection.key);
                          
                          return (
                            <div
                              key={subsection.key}
                              onClick={() => handleSubsectionClick(section.title, subsection.title, section.key, subsection.key)}
                              className={`cursor-pointer py-3 px-4 flex items-center justify-between text-xs transition-all duration-200 ${
                                isActive 
                                  ? 'bg-amber-50 text-amber-800 border-l-4 border-amber-600 font-medium' 
                                  : 'hover:bg-stone-50 text-stone-600 hover:text-amber-700'
                              }`}
                            >
                              <span className="flex-1 mr-3">{subsection.title}</span>
                              <div className="flex items-center space-x-2 flex-shrink-0">
                                {subsectionApproved && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" title="Approved" />
                                )}
                                {hasActiveConversation && (
                                  <CircleDashed className="w-3.5 h-3.5 text-amber-600" title="Has conversation" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-stone-500 bg-white rounded-xl border border-stone-200 p-6">
                <AlertCircle className="w-6 h-6 mb-2 text-stone-400" />
                <p className="text-xs text-center">Document structure not available</p>
              </div>
            )}
          </nav>
          
          {/* File List Component with fixed height */}
          {documentId && (
            <div className="mt-2 flex-shrink-0 max-h-60">
              <FileList documentId={documentId} onPdfRefresh={onPdfRefresh} />
            </div>
          )}
        </div>
      </div>
      
      {/* Error message for when we can't find the section in the PDF */}
      {showNotFoundError && (
        <div className="px-4 pb-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs animate-fade-in">
            <p className="font-medium">Section not found</p>
            <p className="text-red-600 mt-1">This section could not be found in the PDF.</p>
          </div>
        </div>
      )}
    </aside>
  )
} 