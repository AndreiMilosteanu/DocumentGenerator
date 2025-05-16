import { API_BASE_URL } from '../constants/documentStructure';

// Function to get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

// Test project creation API call
export const testCreateProject = async (name, topic) => {
  console.log('Testing project creation API with:', { name, topic });
  
  try {
    if (!name || !topic) {
      throw new Error('Name and topic are required');
    }
    
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token found. Please log in first.');
    }
    
    // Create request body
    const requestBody = { name, topic };
    
    // Log request details
    console.group('API Request Details');
    console.log('Endpoint:', `${API_BASE_URL}/projects/create`);
    console.log('Method:', 'POST');
    console.log('Headers:', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token.substring(0, 10)}...`
    });
    console.log('Body:', JSON.stringify(requestBody, null, 2));
    console.groupEnd();
    
    // Make the API call
    const response = await fetch(`${API_BASE_URL}/projects/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });
    
    // Read response as text
    const responseText = await response.text();
    
    // Log response details
    console.group('API Response Details');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Response Headers:', Object.fromEntries([...response.headers]));
    console.log('Response Text:', responseText);
    console.groupEnd();
    
    // Check if response is valid JSON
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('Response parsed as JSON:', responseData);
    } catch (e) {
      console.warn('Response is not valid JSON', e);
      responseData = null;
    }
    
    // Return response details
    return {
      status: response.status,
      statusText: response.statusText,
      text: responseText,
      json: responseData,
      success: response.ok
    };
  } catch (error) {
    console.error('API test failed:', error);
    return {
      status: 0,
      statusText: 'Client Error',
      text: error.message,
      json: null,
      success: false,
      error
    };
  }
}; 