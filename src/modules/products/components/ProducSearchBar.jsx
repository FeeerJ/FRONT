// src/modules/products/components/ProductSearchBar.jsx
import React from 'react';
// Asumo que tienes un componente Button.jsx en shared/components
import Button from '../../shared/components/Button';

const ProductSearchBar = ({ searchTerm, onSearchChange, onSearchSubmit }) => {

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearchSubmit();
  };

  return (
  // Contenedor principal del buscador. Hazlo un poco más estrecho y centrado si es necesario.
    <form
      onSubmit={handleSubmit}
      className="w-full md:w-64">
      <div className="
            relative flex items-center
            border border-gray-300 rounded-full
            bg-white shadow-sm focus-within:ring-2 focus-within:ring-purple-300
            focus-within:border-purple-400
            transition-all
            duration-200">

        {/* Input de Búsqueda */}
        <input
          type="text"
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={onSearchChange}
          // Clases para el input: padding, sin borde, focus invisible.
          className="
                    flex-grow py-2 px-4
                    pl-10 border-none rounded-full
                    focus:ring-0 focus:outline-none
                    text-gray-700 placeholder-gray-400
                    text-sm md:text-base
                    bg-transparent"
        />

        <button
          type="submit"
          className="absolute left-3 text-gray-400 hover:text-purple-600 active:scale-95 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
    </form>
  );
};

export default ProductSearchBar;