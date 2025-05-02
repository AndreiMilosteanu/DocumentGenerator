import React from 'react'
import { Bot, User, Loader } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export const ChatMessages = ({ 
  messages, 
  isLoading, 
  isStartingConversation, 
  messagesEndRef 
}) => {
  return (
    <div className="flex-1 overflow-y-auto min-h-0">
      <div className="px-4 py-6">
        <div className="space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start space-x-4 ${
                message.role === 'user' ? 'justify-end' : ''
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-blue-600" />
                </div>
              )}
              <div
                className={`flex-1 max-w-[80%] p-4 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100'
                }`}
              >
                <div className={`prose ${message.role === 'user' ? 'text-white' : 'text-gray-900'}`}>
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}
          {(isLoading || isStartingConversation) && (
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex space-x-2 p-4 rounded-lg bg-gray-100">
                <Loader className="w-5 h-5 animate-spin" />
                <span>{isStartingConversation ? 'Starte Konversation...' : 'Schreibe...'}</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  )
} 