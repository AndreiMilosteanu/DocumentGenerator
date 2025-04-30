import React from 'react'
import { ChevronRight } from 'lucide-react'
import { documentStructure } from '../constants/documentStructure'

export const Sidebar = ({ 
  activeChapter, 
  activeSection, 
  activeSubsection, 
  onChapterClick, 
  onSectionClick 
}) => {
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
          {documentStructure[activeChapter].sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-gray-600 mb-2">{section.title}</h3>
              <ul className="ml-4 space-y-1 text-gray-500">
                {section.subsections.map((subsection) => (
                  <li 
                    key={subsection}
                    className={`flex items-center space-x-2 cursor-pointer hover:text-blue-600 ${
                      activeSection === section.title && activeSubsection === subsection
                        ? 'text-blue-600'
                        : ''
                    }`}
                    onClick={() => onSectionClick(section.title, subsection)}
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
    </aside>
  )
} 