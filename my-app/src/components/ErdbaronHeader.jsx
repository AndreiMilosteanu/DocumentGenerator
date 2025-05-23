import React from 'react';
import { colors } from '../constants/theme';

export const ErdbaronHeader = ({ title }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 
            className="text-lg font-semibold"
            style={{ color: colors.text.primary }}
          >
            {title || 'Dokument'}
          </h1>
          
          {/* Small Erdbaron branding */}
          <div className="ml-3 flex items-center">
            <span 
              className="text-xs px-2 py-1 rounded"
              style={{ 
                backgroundColor: `${colors.primary.main}15`,
                color: colors.primary.main
              }}
            >
              erdbaron
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ErdbaronHeader; 