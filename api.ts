// src/api/api.ts

const API_BASE_URL = 'https://crm.simplyfinsure.com/api';

async function callApi<T>(
  endpoint: string,
  method: string = 'GET',
  data?: any
): Promise<T> {

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  };

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  } catch (err) {
    console.error('NETWORK ERROR:', err);
    throw new Error('Network request failed. Please check your internet connection.');
  }

  const text = await response.text();
  const trimmedText = text.trim();

  if (!response.ok) {
    console.error('API ERROR:', response.status, text);
    // Try to extract a useful error message from the response if it might be JSON
    try {
      const errorJson = JSON.parse(trimmedText);
      throw new Error(errorJson.message || `Server error (${response.status})`);
    } catch {
      // If not JSON, it might be HTML (PHP Error)
      if (trimmedText.includes('Fatal error') || trimmedText.includes('mysqli_sql_exception')) {
        throw new Error('Database error: A required column or table might be missing on the server.');
      }
      throw new Error(`Server error (${response.status})`);
    }
  }

  if (trimmedText === '' || trimmedText === 'null') {
    return [] as T; 
  }

  try {
    const result = JSON.parse(trimmedText);
    return (result === null ? [] : result) as T;
  } catch (parseError) {
    console.error('JSON parse error:', parseError, 'Response text:', text);
    // If we got HTML back instead of JSON on a 200 OK, it's likely a PHP warning or error printed to output
    if (trimmedText.startsWith('<') || trimmedText.includes('<b>') || trimmedText.includes('Fatal error')) {
      throw new Error('Server returned an unexpected error message instead of data. Please contact support.');
    }
    throw new Error('Invalid response format from server');
  }
}

export default callApi;