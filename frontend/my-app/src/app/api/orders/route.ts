import { NextResponse } from 'next/server';

// In-memory array to simulate a database for orders
const sampleOrders = [
  {
    id: 'ORD001',
    userId: 'user-123',
    date: '2025-05-10T14:30:00Z',
    status: 'Delivered',
    total: 1290.00,
    items: [
      { productId: '1', name: 'Ltronix Laptop Pro', quantity: 1, price: 1200.00 },
      { productId: '3', name: 'Ltronix Gaming Headset', quantity: 1, price: 90.00 },
    ],
    shippingAddress: '123 Tech Lane, Nairobi, Kenya',
  },
  {
    id: 'ORD002',
    userId: 'user-123',
    date: '2025-05-15T09:00:00Z',
    status: 'Processing',
    total: 250.00,
    items: [
      { productId: '2', name: 'Ltronix Smartwatch X', quantity: 1, price: 250.00 },
    ],
    shippingAddress: '123 Tech Lane, Nairobi, Kenya',
  },
  {
    id: 'ORD003',
    userId: 'user-456', // Another user's order
    date: '2025-05-01T11:00:00Z',
    status: 'Shipped',
    total: 60.00,
    items: [
      { productId: '4', name: 'Ltronix Wireless Earbuds', quantity: 1, price: 60.00 },
    ],
    shippingAddress: '456 Gadget Street, Mombasa, Kenya',
  },
];

/**
 * GET /api/orders
 * Returns a list of orders. Can be filtered by userId (simulated for now).
 * Example: /api/orders?userId=user-123
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  // Simulate potential backend error (e.g., 10% chance)
  if (Math.random() < 0.1) {
    return NextResponse.json(
      { message: 'Internal Server Error: Order service unavailable (simulated)' },
      { status: 500 }
    );
  }

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600));

  let filteredOrders = sampleOrders;

  if (userId) {
    filteredOrders = sampleOrders.filter(order => order.userId === userId);
  }

  return NextResponse.json(filteredOrders, { status: 200 });
}

/**
 * POST /api/orders
 * Simulates creating a new order.
 * Expects an order object in the request body.
 */
export async function POST(request: Request) {
  try {
    const newOrderData = await request.json();

    // Simulate potential backend error (e.g., 10% chance for a bad request or 500)
    if (Math.random() < 0.1) {
      return NextResponse.json(
        { message: 'Invalid order data provided (simulated)' },
        { status: 400 }
      );
    }
    if (Math.random() < 0.05) { // Smaller chance for 500 on POST
        return NextResponse.json(
            { message: 'Internal Server Error: Failed to process order (simulated)' },
            { status: 500 }
        );
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Basic validation for new order data (e.g., must have items and total)
    if (!newOrderData.items || newOrderData.items.length === 0 || !newOrderData.total) {
      return NextResponse.json({ message: 'Order must contain items and a total' }, { status: 400 });
    }
    if (!newOrderData.userId) { // Ensure a userId is provided for this stub
        return NextResponse.json({ message: 'Order must be associated with a user ID' }, { status: 400 });
    }

    // Assign a unique ID and current date to the new order
    const newOrderId = `ORD${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
    const newOrder = {
      ...newOrderData,
      id: newOrderId,
      date: new Date().toISOString(),
      status: newOrderData.status || 'Pending', // Default status
    };

    sampleOrders.push(newOrder); // Add to our in-memory "database"

    return NextResponse.json(
      {
        message: 'Order placed successfully',
        order: newOrder,
      },
      { status: 201 } // 201 Created
    );
  } catch (error: any) {
    return NextResponse.json({ message: 'Error processing order', error: error.message }, { status: 400 });
  }
}