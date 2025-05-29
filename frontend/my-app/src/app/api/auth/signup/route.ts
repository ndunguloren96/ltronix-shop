// src/app/api/auth/signup/route.ts
import { NextResponse } from 'next/server';

// Define your Django backend URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://127.0.0.1:8000/api/v1';

/**
 * POST /api/auth/signup
 * Proxies user registration request to the Django backend.
 */
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json(); // Only expecting email and password for now
    // Note: If your Django backend /signup/ endpoint expects 'name', you'll need to
    // add 'name' to the frontend form and include it in this payload.

    // Validate input (basic validation, more robust validation should be on backend)
    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    // Make the actual call to your Django backend's registration endpoint
    // Assuming your Django registration endpoint is /api/v1/auth/register/
    const djangoResponse = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    // Parse the Django backend's response
    const data = await djangoResponse.json();

    if (djangoResponse.ok) {
      // If Django registration is successful, respond with success message
      return NextResponse.json({
        message: data.detail || 'Registration successful. Please log in.',
        user: data.user || { email }, // Include user data if Django returns it
      }, { status: djangoResponse.status }); // Use Django's status code (e.g., 201 Created)
    } else {
      // If Django registration fails, forward the error message and status
      // Django's dj-rest-auth typically returns errors in 'detail' or object format
      const errorMessage = data.detail || (data.email && data.email[0]) || (data.password && data.password[0]) || 'An error occurred during registration.';
      return NextResponse.json({
        message: errorMessage,
        errors: data, // Pass full error object for debugging
      }, { status: djangoResponse.status });
    }
  } catch (error: any) {
    console.error('Proxy signup API error:', error);
    return NextResponse.json({ message: 'Internal server error or network issue.', error: error.message }, { status: 500 });
  }
}