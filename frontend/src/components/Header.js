import React from "react";
import { Link } from "react-router-dom";

// The problematic import has been removed.
// We directly reference the image path from the public folder below.

const Header = () => (
  <header className="bg-white shadow">
    <div className="container mx-auto flex items-center justify-between py-4 px-6">
      <Link to="/">
        {/* Use process.env.PUBLIC_URL to correctly reference items in the public folder */}
        <img 
          src={process.env.PUBLIC_URL + '/assets/logo.png'} 
          alt="Ltronix Shop" 
          className="h-10" 
        />
      </Link>
      <nav className="space-x-6">
        <Link to="/" className="text-gray-700 hover:text-green-600 font-semibold">Home</Link>
        <Link to="/products" className="text-gray-700 hover:text-green-600 font-semibold">Products</Link>
        <Link to="/cart" className="text-gray-700 hover:text-green-600 font-semibold">Cart</Link>
      </nav>
      <Link to="/login" className="text-gray-700 hover:text-green-600">
        {/* Assuming you have setup for material icons, otherwise this might need adjustment */}
        <span className="material-icons">person</span> 
      </Link>
    </div>
  </header>
);

export default Header;