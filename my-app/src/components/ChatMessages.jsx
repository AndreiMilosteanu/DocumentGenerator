import React from 'react'
import { Bot, User, Loader, ChevronRight } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export const ChatMessages = ({ 
  messages, 
  isLoading, 
  isStartingConversation, 
  messagesEndRef,
  projectName,
  sectionTitle,
  subsectionTitle,
  isDeckblattActive
}) => {
  const renderBreadcrumb = () => {
    if (isDeckblattActive) {
      return (
        <div className="flex items-center text-sm text-stone-600">
          <span className="font-medium text-stone-800">{projectName}</span>
          <ChevronRight className="w-4 h-4 mx-2 text-stone-400" />
          <span className="text-amber-700 font-medium">Cover Page</span>
        </div>
      );
    }

    if (!sectionTitle) {
      return (
        <div className="flex items-center text-sm">
          <span className="font-medium text-stone-800">{projectName}</span>
          <span className="text-stone-500 ml-2">- Select a section to begin</span>
        </div>
      );
    }

    return (
      <div className="flex items-center text-sm text-stone-600">
        <span className="font-medium text-stone-800">{projectName}</span>
        <ChevronRight className="w-4 h-4 mx-2 text-stone-400" />
        <span className="text-stone-700">{sectionTitle}</span>
        {subsectionTitle && (
          <>
            <ChevronRight className="w-4 h-4 mx-2 text-stone-400" />
            <span className="text-amber-700 font-medium">{subsectionTitle}</span>
          </>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Header with breadcrumb - compact version */}
      <div className="border-b border-stone-200 bg-white px-6 py-3 shadow-sm flex-shrink-0">
        {renderBreadcrumb()}
      </div>

      {/* Messages area - flexible height */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-stone-50">
        <div className="px-6 py-4">
          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start space-x-4 ${
                  message.role === 'user' ? 'justify-end' : ''
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`flex-1 max-w-[80%] px-4 py-3 rounded-2xl shadow-sm ${
                    message.role === 'user'
                      ? 'bg-amber-700 text-white ml-12'
                      : 'bg-white text-stone-800 border border-stone-200'
                  }`}
                >
                  <div className={`prose prose-sm max-w-none ${
                    message.role === 'user' 
                      ? 'prose-invert text-white [&_*]:text-white' 
                      : 'text-stone-800 [&_h1]:text-stone-900 [&_h2]:text-stone-900 [&_h3]:text-stone-900 [&_strong]:text-stone-900'
                  }`}>
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-stone-600 to-stone-700 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            {(isLoading || isStartingConversation) && (
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-sm">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="flex items-center space-x-3 px-4 py-3 rounded-2xl bg-white border border-stone-200 shadow-sm">
                  <Loader className="w-4 h-4 animate-spin text-amber-600" />
                  <span className="text-stone-700 font-medium">
                    {isStartingConversation ? 'Starting conversation...' : 'Typing...'}
                  </span>
                </div>
              </div>
            )}
            
            {messages.length === 0 && !isLoading && !isStartingConversation && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-stone-400" />
                </div>
                <h3 className="text-lg font-semibold text-stone-800 mb-2">No messages yet</h3>
                <p className="text-stone-600 text-sm max-w-md mx-auto">
                  Ask a question to start the conversation and begin generating your document.
                </p>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </>
  )
} 