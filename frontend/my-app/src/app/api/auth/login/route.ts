import { NextResponse } from 'next/server';

/**
 * POST /api/auth/login
 * Simulates a user login endpoint.
 * Accepts email and password.
 */
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Simulate potential backend error (e.g., 10% chance)
    if (Math.random() < 0.1) {
      return NextResponse.json(
        { message: 'Internal Server Error: Authentication service down (simulated)' },
        { status: 500 }
      );
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Basic stub validation:
    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    if (email === 'user@example.com' && password === 'password123') {
      // Successful login simulation
      return NextResponse.json(
        {
          message: 'Login successful',
          user: {
            id: 'user-123',
            name: 'Test User',
            email: 'user@example.com',
            token: 'mock-jwt-token-12345', // Simulate a JWT token
          },
        },
        { status: 200 }
      );
    } else {
      // Failed login simulation
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ message: 'Request error', error: error.message }, { status: 400 });
  }
}