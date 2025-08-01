// src/lib/apiConfig.ts

/**
 * The base URL for the backend API.
 * This should be configured based on your environment (development, production).
 *
 * NOTE: For local development, this typically points to localhost.
 * For a live deployment, you will need to change this to your server's URL.
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

