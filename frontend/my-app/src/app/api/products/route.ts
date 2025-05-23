import { NextResponse } from 'next/server';

// Sample product data
const sampleProducts = [
    { id: '1', name: 'Ltronix Laptop Pro', price: 1200, category: 'Laptops', stock: 15, imageUrl: '/images/laptop-pro.jpg' },
    { id: '2', name: 'Ltronix Smartwatch X', price: 250, category: 'Wearables', stock: 50, imageUrl: '/images/smartwatch-x.jpg' },
    { id: '3', name: 'Ltronix Gaming Headset', price: 90, category: 'Gaming', stock: 30, imageUrl: '/images/gaming-headset.jpg' },
    { id: '4', name: 'Ltronix Wireless Earbuds', price: 60, category: 'Audio', stock: 120, imageUrl: '/images/earbuds.jpg' },
];

/**
 * GET /api/products
 * Returns a list of all products or a specific product by ID.
 * Supports:
 * - /api/products (returns all products)
 * - /api/products?id=<productId> (returns a single product)
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Simulate potential backend error (e.g., database down, 10% chance)
    if (Math.random() < 0.1) {
        return NextResponse.json(
            { message: 'Internal Server Error: Database connection failed (simulated)' },
            { status: 500 }
        );
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (id) {
        const product = sampleProducts.find(p => p.id === id);
        if (product) {
            return NextResponse.json(product, { status: 200 });
        } else {
            return NextResponse.json({ message: 'Product not found' }, { status: 404 });
        }
    } else {
        return NextResponse.json(sampleProducts, { status: 200 });
    }
}

// You can add other HTTP methods like POST, PUT, DELETE for creating, updating, deleting products
// For example, a POST endpoint to add a new product:
/*
export async function POST(request: Request) {
  try {
    const newProduct = await request.json();
    // Simulate saving to a database
    sampleProducts.push({ ...newProduct, id: String(sampleProducts.length + 1) });
    return NextResponse.json({ message: 'Product added successfully', product: newProduct }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: 'Error adding product', error: error.message }, { status: 400 });
  }
}
*/