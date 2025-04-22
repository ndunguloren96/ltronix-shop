import React, { useState, useEffect } from "react";
import api from "../utils/api";

const Checkout = () => {
  const [cart, setCart] = useState([]);
  const [address, setAddress] = useState("");
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    api.get("/cart/").then(res => setCart(res.data.items || []));
  }, []);

  const handleOrder = async () => {
    setPlacing(true);
    await api.post("/orders/", { items: cart, address });
    setPlacing(false);
    // Redirect or show confirmation
  };

  return (
    <div className="container mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4">Checkout</h2>
      <div>
        <h3 className="font-semibold mb-2">Shipping Address</h3>
        <input
          className="border p-2 w-full mb-4"
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Enter your address"
        />
      </div>
      <div>
        <h3 className="font-semibold mb-2">Order Summary</h3>
        <ul>
          {cart.map(item => (
            <li key={item.id}>
              {item.product_name} x {item.quantity} = ${(item.price_at_add * item.quantity).toFixed(2)}
            </li>
          ))}
        </ul>
      </div>
      <button className="btn btn-primary mt-4" onClick={handleOrder} disabled={placing}>
        {placing ? "Placing Order..." : "Place Order"}
      </button>
    </div>
  );
};

export default Checkout;
