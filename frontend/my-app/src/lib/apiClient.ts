
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
  const session = await getSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  // Prioritize JWT for authenticated users
  if (session?.user?.accessToken) {
    headers['Authorization'] = `Bearer ${session.user.accessToken}`;
    // Ensure guest key is not sent if the user is authenticated
    if (headers['X-Session-Key']) {
      delete headers['X-Session-Key'];
    }
  } else if (guestSessionKey) {
    headers['X-Session-Key'] = guestSessionKey;
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
        } else if (typeof errorData === 'object' && errorData !== null) {
          errorDetail = Object.entries(errorData)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('; ');
        } else {
          errorDetail = await response.text();
        }
      } catch (e) {
        errorDetail = response.statusText;
      }
      toast.error(`API Error: ${errorDetail}`);
      throw new Error(errorDetail);
    }

    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  } catch (error: any) {
    console.error(`API request to ${endpoint} failed:`, error);
    toast.error(error.message || 'An unexpected network error occurred.');
    throw error;
  }
}

export default apiClient;
