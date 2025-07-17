// src/lib/apiClient.ts
import { getSession } from 'next-auth/react';
import toast from 'react-hot-toast';

// Ensure the base URL is consistently handled without a trailing slash
const DJANGO_API_BASE_URL = (process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');

/**
 * A centralized API client to handle all fetch requests to the Django backend.
 * It automatically attaches the correct authentication headers (JWT for users, Session Key for guests)
 * and provides consistent error handling.
 */
async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
  guestSessionKey?: string | null
): Promise<T> {
  const session = await getSession(); // Await getSession to get the current session
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Prioritize JWT for authenticated users
  if (session?.user?.accessToken) {
    headers['Authorization'] = `Bearer ${session.user.accessToken}`;
    console.log(`API Client: Attaching JWT for authenticated user. Endpoint: ${endpoint}`);
    // Ensure guest key is not sent if the user is authenticated
    if (headers['X-Session-Key']) {
      delete headers['X-Session-Key'];
    }
  } else if (guestSessionKey) {
    headers['X-Session-Key'] = guestSessionKey;
    console.log(`API Client: Attaching X-Session-Key for guest user. Endpoint: ${endpoint}`);
  } else {
    console.log(`API Client: No auth header for endpoint: ${endpoint}`);
  }

  // Construct the full URL, ensuring no double slashes
  const url = `${DJANGO_API_BASE_URL}/${endpoint.replace(/^\//, '')}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Important for cookies (CSRF, etc.)
    });

    if (!response.ok) {
      let errorDetail = 'An unknown error occurred.';
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorDetail = errorData.detail;
        } else if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
          errorDetail = errorData.non_field_errors.join(', ');
        } else if (typeof errorData === 'object' && errorData !== null) {
          // Flatten all values from the error object
          errorDetail = Object.values(errorData)
            .flat()
            .filter(val => typeof val === 'string')
            .join('; ');
          if (errorDetail === '') { // Fallback if flattened object is empty
            errorDetail = `Server responded with status ${response.status}.`;
          }
        } else if (typeof errorData === 'string') {
          errorDetail = errorData;
        } else {
          errorDetail = response.statusText;
        }
      } catch (e) {
        errorDetail = response.statusText;
      }
      console.error(`API Error for ${url} (Status: ${response.status}):`, errorDetail);
      toast.error(`API Error ${response.status}: ${errorDetail}`);
      throw new Error(errorDetail);
    }

    if (response.status === 204) {
      return null as T; // Handle No Content responses
    }

    return response.json();
  } catch (error: any) {
    console.error(`API request to ${url} failed:`, error);
    toast.error(error.message || `An unexpected network error occurred for ${endpoint}.`);
    throw error;
  }
}

export default apiClient;

