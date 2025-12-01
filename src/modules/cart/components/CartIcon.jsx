// src/modules/products/components/CartIcon.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const CartIcon = () => {
    const [itemCount, setItemCount] = useState(0);

    // Función para leer el número de artículos del carrito
    const getCartItemCount = () => {
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
            try {
                const cart = JSON.parse(storedCart);
                // Sumamos la cantidad de items ÚNICOS (cart.length), o la suma total de unidades:
                // Usaremos la longitud del array (número de productos únicos diferentes)
                return cart.length; 
            } catch (e) {
                return 0;
            }
        }
        return 0;
    };
    
    // Escucha los cambios en localStorage o en la ventana (para actualizar el contador)
    useEffect(() => {
        const updateCount = () => {
            setItemCount(getCartItemCount());
        };

        // Escucha el evento 'storage' para detectar cambios en localStorage desde otras pestañas
        window.addEventListener('storage', updateCount);
        
        // También escuchamos un evento personalizado que podrías disparar en handleAddToCart
        window.addEventListener('cartUpdated', updateCount); 

        // Carga inicial
        updateCount(); 

        // Limpieza: importante para evitar fugas de memoria
        return () => {
            window.removeEventListener('storage', updateCount);
            window.removeEventListener('cartUpdated', updateCount);
        };
    }, []);


    return (
        <Link 
            to="/cart" 
            className="relative p-2 rounded-full text-gray-700 hover:bg-gray-100 transition duration-150"
            aria-label="Carrito de Compras"
        >
            {/* Ícono de Carrito (usando SVG simple) */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            
            {/* Contador de Artículos (Badge) */}
            {itemCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    {itemCount}
                </span>
            )}
        </Link>
    );
};

export default CartIcon;