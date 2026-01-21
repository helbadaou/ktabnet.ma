// Determine API base URL based on environment
const getApiBase = () => {
  if (typeof window === 'undefined') {
    return 'https://backend-cool-wind8.fly.dev'; // SSR fallback
  }
  
  const hostname = window.location.hostname;
  
  // Localhost development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8080';
  }
  
  // Production - use hosted backend
  return 'https://ktabnet-backend.fly.dev';
};

export const API_BASE = getApiBase();

export const apiUrl = (path: string) => `${API_BASE}${path}`;

export const absoluteUrl = (path: string) =>
  path.startsWith('http://') || path.startsWith('https://') ? path : `${API_BASE}${path}`;

export const wsUrl = (path: string) => `${API_BASE.replace(/^http/, 'ws')}${path}`;
