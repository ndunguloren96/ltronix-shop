import React, { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import api from "../utils/api";

const Home = () => {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    api.get("/products?featured=true").then(res => setFeatured(res.data));
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Welcome to Ltronix Shop</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {featured.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default Home;
