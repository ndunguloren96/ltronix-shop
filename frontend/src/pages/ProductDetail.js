import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../utils/api";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    api.get(`/products/${id}/`).then(res => setProduct(res.data));
  }, [id]);

  if (!product) return <div>Loading...</div>;

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <img src={product.images?.[0]?.image} alt={product.name} className="w-80 h-80 object-contain" />
        <div>
          <h2 className="text-2xl font-bold">{product.name}</h2>
          <p className="text-green-600 font-bold text-xl mt-2">${product.price}</p>
          <p className="mt-4">{product.description}</p>
          <button className="btn btn-primary mt-6">Add to Cart</button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
