import React from "react";
import { Link } from "react-router-dom";
import logo from "../../public/assets/logo.png";

const Header = () => (
  <header className="bg-white shadow">
    <div className="container mx-auto flex items-center justify-between py-4 px-6">
      <Link to="/">
        <img src={logo} alt="Ltronix Shop" className="h-10" />
      </Link>
      <nav className="space-x-6">
        <Link to="/" className="text-gray-700 hover:text-green-600 font-semibold">Home</Link>
        <Link to="/products" className="text-gray-700 hover:text-green-600 font-semibold">Products</Link>
        <Link to="/cart" className="text-gray-700 hover:text-green-600 font-semibold">Cart</Link>
      </nav>
      <Link to="/login" className="text-gray-700 hover:text-green-600">
        <span className="material-icons">person</span>
      </Link>
    </div>
  </header>
);

export default Header;
