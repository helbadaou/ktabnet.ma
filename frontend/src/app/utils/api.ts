import { apiUrl } from '../config';

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

/**
 * Enhanced fetch function that automatically adds JWT token to requests
 */
export async function authenticatedFetch(path: string, options: FetchOptions = {}): Promise<Response> {
  const token = localStorage.getItem('jwt_token');
  
  const headers: Record<string, string> = {
    ...options.headers,
  };
  
  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Merge options
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    // Keep credentials for backwards compatibility with cookie-based auth
    credentials: options.credentials || 'include',
  };
  
  const response = await fetch(apiUrl(path), fetchOptions);
  
  // If we get a 401, the token might be expired - clear it
  if (response.status === 401 && token) {
    localStorage.removeItem('jwt_token');
  }
  
  return response;
}
