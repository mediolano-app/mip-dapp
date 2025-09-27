/**
 * Configuration for API endpoints
 */

// Backend API URL - use environment variable or default to production URL
export const getApiBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'https://mediolano-api-service.onrender.com';
};

// Backend API URL for direct access
export const BACKEND_URL = getApiBaseUrl();

// CORS configuration
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Cache configuration
export const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=60', // Cache for 1 minute
};

// Request timeout configuration
export const REQUEST_TIMEOUT = 10000; // 10 seconds
