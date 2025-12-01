import { useState, useEffect, useCallback } from "react";
import { 
  getCart, 
  saveCart, 
  addToCart, 
  removeFromCart, 
  clearCart 
} from "../services/CartStorage";

export default function useCart() {
  const [cart, setCart] = useState([]);

  // Carga inicial
  useEffect(() => {
    setCart(getCart());

    const handleUpdate = () => setCart(getCart());
    window.addEventListener("cartUpdated", handleUpdate);

    return () => window.removeEventListener("cartUpdated", handleUpdate);
  }, []);

  const addItem = useCallback((product) => {
    const updated = addToCart(product);
    setCart(updated);
    window.dispatchEvent(new Event("cartUpdated"));
  }, []);

  const removeItem = useCallback((id) => {
    const updated = removeFromCart(id);
    setCart(updated);
    window.dispatchEvent(new Event("cartUpdated"));
  }, []);

  const clear = useCallback(() => {
    clearCart();
    setCart([]);
    window.dispatchEvent(new Event("cartUpdated"));
  }, []);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return {
    cart,
    addItem,
    removeItem,
    clear,
    total,
  };
}
