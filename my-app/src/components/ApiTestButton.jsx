import React, { useState } from 'react';
import { testCreateProject } from '../utils/ApiTester';

export const ApiTestButton = () => {
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const runTest = async () => {
    setIsLoading(true);
    
    try {
      // Test with hardcoded values
      const name = "Test Project " + new Date().toISOString();
      const topic = "Deklarationsanalyse";
      
      const result = await testCreateProject(name, topic);
      setTestResult(result);
      
      console.log('API test completed:', result);
    } catch (error) {
      console.error('Test error:', error);
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-4 border border-gray-300 rounded-md m-4 bg-white">
      <h3 className="text-lg font-semibold mb-2">API Test Tool</h3>
      <button
        onClick={runTest}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Testing...' : 'Test Project Creation'}
      </button>
      
      {testResult && (
        <div className="mt-4">
          <h4 className="font-medium">Test Result:</h4>
          <div className={`mt-2 p-3 rounded-md ${testResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
            <p><strong>Success:</strong> {testResult.success ? 'Yes' : 'No'}</p>
            <p><strong>Status:</strong> {testResult.status} {testResult.statusText}</p>
            {testResult.error && <p><strong>Error:</strong> {testResult.error.message}</p>}
            {testResult.text && (
              <div className="mt-2">
                <p><strong>Response:</strong></p>
                <pre className="whitespace-pre-wrap bg-gray-100 p-2 rounded-md text-xs mt-1 max-h-40 overflow-auto">
                  {testResult.text}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 