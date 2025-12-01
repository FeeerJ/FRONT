const CART_KEY = 'cart';

// Obtiene el carrito desde localStorage
export function getCart() {
  try {
    const stored = localStorage.getItem(CART_KEY);

    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error('[cartStorage] Error al leer carrito:', e);

    return [];
  }
}

// Guarda el carrito en localStorage
export function saveCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (e) {
    console.error('[cartStorage] Error al guardar carrito:', e);
  }
}

// Añade un producto al carrito
export function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(p => p.id === product.id);

  if (existing) {
    existing.quantity += product.quantity || 1;
  } else {
    cart.push({ ...product, quantity: product.quantity || 1 });
  }

  saveCart(cart);

  return cart;
}

// Elimina un producto
export function removeFromCart(productId) {
  const cart = getCart().filter(p => p.id !== productId);

  saveCart(cart);

  return cart;
}

// Limpia el carrito completo
export function clearCart() {
  saveCart([]);
}
