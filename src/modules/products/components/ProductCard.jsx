// src/modules/products/components/ProductCard.jsx
import React, { useState } from 'react';
import Card from '../../shared/components/Card';
import Button from '../../shared/components/Button'; // Si tienes un Button.jsx genérico

const ProductCard = ({ product, onAddToCart, isLoading }) => {
  // Estado local para la cantidad seleccionada en esta tarjeta
  const [quantity, setQuantity] = useState(1);

  // Asumimos que product.currentUnitPrice es un número o puede ser convertido a uno
  const formattedPrice = product.currentUnitPrice ? `$${product.currentUnitPrice.toFixed(2)}` : '$0.00';
  const isOutOfStock = product.stockQuantity <= 0;

  return (
    <Card className="flex flex-col justify-between h-full hover:shadow-lg transition">

      {/* Placeholder de imagen */}
      <div className="bg-gray-200 h-40 w-full mb-4 flex items-center justify-center rounded-t-lg">

[Image of a product placeholder icon]

      </div>

      <div className="p-4 flex flex-col flex-grow">
        {/* Detalles del Producto */}
        <div>
          <h2 className="text-lg font-bold truncate text-gray-900">{product.name}</h2>
          <p className="text-sm text-gray-500 mb-3 h-10 overflow-hidden">{product.description}</p>
          <p className="text-2xl font-extrabold text-purple-700">
            {formattedPrice}
          </p>
          {isOutOfStock ? (
            <p className="text-sm text-red-600 font-semibold mt-1">Sin Stock</p>
          ) : (
            <p className="text-sm text-green-600 mt-1">Stock: {product.stockQuantity}</p>
          )}
        </div>

        {/* Controles de Cantidad y Botón */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between space-x-2 mb-3">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              disabled={quantity <= 1 || isOutOfStock}
              className="bg-gray-300 text-gray-800 w-8 h-8 rounded-full hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                            -
            </button>
            <span className="text-xl font-mono w-8 text-center text-gray-900">{quantity}</span>
            <button
              onClick={() => setQuantity(q => q + 1)}
              disabled={isOutOfStock}
              className="bg-gray-300 text-gray-800 w-8 h-8 rounded-full hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                            +
            </button>
          </div>

          <button
            onClick={() => onAddToCart(product, quantity)}
            disabled={isOutOfStock || isLoading}
            className={`w-full p-2 rounded font-semibold transition ${
              isOutOfStock
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {isOutOfStock ? 'Agotado' : 'Agregar al Carrito'}
          </button>
        </div>
      </div>
    </Card>
  );
};

export default ProductCard;