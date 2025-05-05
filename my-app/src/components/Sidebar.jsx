import React from 'react'
import { ChevronRight } from 'lucide-react'
import { documentStructure } from '../constants/documentStructure'

export const Sidebar = ({ 
  activeChapter, 
  activeSection, 
  activeSubsection, 
  onChapterClick, 
  onSectionClick,
  isPdfLoaded
}) => {
  const [lastClickedSubsection, setLastClickedSubsection] = React.useState(null)
  const [showNotFoundError, setShowNotFoundError] = React.useState(false)

  const handleSubsectionClick = (sectionTitle, subsection) => {
    if (!isPdfLoaded) return // Do nothing if PDF is not loaded

    // Set this subsection as the last clicked one
    setLastClickedSubsection(subsection)
    
    // Clear any previous error message
    setShowNotFoundError(false)

    // Call the parent handler
    onSectionClick(sectionTitle, subsection)

    // After a delay, if this is still the last clicked subsection,
    // show the error message
    setTimeout(() => {
      if (lastClickedSubsection === subsection) {
        setShowNotFoundError(true)
        setTimeout(() => setShowNotFoundError(false), 3000) // Hide after 3 seconds
      }
    }, 1000) // Wait 1 second for the scroll to happen
  }

  return (
    <aside className="w-72 bg-white border-r p-6 flex flex-col">
      <div className="mb-8">
        <img src="/logo.png" alt="erdbaron" className="h-6" />
      </div>
      <nav className="flex-1">
        <ul className="space-y-4 text-sm">
          {Object.values(documentStructure).map((chapter) => (
            <li 
              key={chapter.title} 
              className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 ${
                chapter.title === activeChapter ? 'bg-gray-50 text-blue-600' : ''
              }`}
              onClick={() => onChapterClick(chapter.title)}
            >
              <span>{chapter.icon}</span>
              <span>{chapter.title}</span>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-6 text-sm">
        <h2 className="font-semibold mb-3">{activeChapter}</h2>
        <div className="space-y-4">
          {documentStructure[activeChapter]?.sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-gray-600 mb-2">{section.title}</h3>
              <ul className="ml-4 space-y-1 text-gray-500">
                {section.subsections.map((subsection) => (
                  <li 
                    key={subsection}
                    className={`flex items-center space-x-2 cursor-pointer hover:text-blue-600 ${
                      !isPdfLoaded ? 'opacity-50 cursor-not-allowed' : ''
                    } ${
                      activeSection === section.title && activeSubsection === subsection
                        ? 'text-blue-600'
                        : ''
                    }`}
                    onClick={() => handleSubsectionClick(section.title, subsection)}
                    title={!isPdfLoaded ? 'Warten Sie bis das PDF geladen ist' : ''}
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>{subsection}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      {showNotFoundError && (
        <div className="mt-4 p-2 bg-red-50 text-red-600 text-sm rounded">
          Abschnitt konnte nicht gefunden werden
        </div>
      )}
    </aside>
  )
} 