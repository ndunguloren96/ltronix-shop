import React from "react";
import { Link } from "react-router-dom";

const ProductCard = ({ product }) => (
  <div className="bg-white rounded shadow p-4 flex flex-col">
    <img src={product.image} alt={product.name} className="h-40 object-contain mb-2" />
    <h3 className="font-semibold text-lg">{product.name}</h3>
    <p className="text-green-600 font-bold mt-1">${product.price}</p>
    <Link to={`/products/${product.id}`} className="mt-2 btn btn-primary">
      View Details
    </Link>
  </div>
);

export default ProductCard;
