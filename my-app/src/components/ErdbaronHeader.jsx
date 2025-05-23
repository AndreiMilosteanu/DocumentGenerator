import React from 'react';

export const ErdbaronHeader = ({ title, showLogo = true }) => {
  return (
    <header className="bg-white border-b border-stone-200 shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showLogo && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-600 to-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">E</span>
                </div>
                <div className="text-stone-800">
                  <h1 className="text-xl font-bold">erdbaron®</h1>
                  <p className="text-xs text-stone-600 -mt-1">Document Generator</p>
                </div>
              </div>
            )}
            {title && (
              <>
                <div className="h-6 w-px bg-stone-300 mx-4"></div>
                <h2 className="text-lg font-semibold text-stone-800">{title}</h2>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default ErdbaronHeader; 