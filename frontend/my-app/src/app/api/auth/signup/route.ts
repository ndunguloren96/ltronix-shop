import { NextResponse } from 'next/server';

/**
 * POST /api/auth/signup
 * Simulates a user registration endpoint.
 * Accepts name, email, and password.
 */
export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    // Simulate potential backend error (e.g., 10% chance)
    if (Math.random() < 0.1) {
      return NextResponse.json(
        { message: 'Internal Server Error: Registration service unavailable (simulated)' },
        { status: 500 }
      );
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Basic stub validation:
    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Name, email, and password are required' }, { status: 400 });
    }

    // Simulate if user already exists
    if (email === 'existing@example.com') {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    // Successful signup simulation
    return NextResponse.json(
      {
        message: 'Registration successful',
        user: {
          id: `new-user-${Date.now()}`, // Unique ID for new user
          name,
          email,
        },
      },
      { status: 201 } // 201 Created for successful resource creation
    );
  } catch (error: any) {
    return NextResponse.json({ message: 'Request error', error: error.message }, { status: 400 });
  }
}