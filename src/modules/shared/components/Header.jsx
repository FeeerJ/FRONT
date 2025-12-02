import React, { useState } from 'react'; // ¡Importar useState es necesario!
import { Link, useNavigate } from "react-router-dom";
import { FiShoppingCart, FiSearch } from "react-icons/fi";
import useAuth from "../../auth/hook/useAuth";
import useCart from '../../cart/hooks/useCart';

export default function Header() {
  const { isAuthenticated, singout } = useAuth();
const { cart } = useCart();
  const navigate = useNavigate();
  // Estado para controlar si el buscador móvil está visible
  const [isSearchVisible, setIsSearchVisible] = useState(false); 
  const cartItemCount = cart.reduce((totalUnits, item) => totalUnits + 
      (item.quantity || 0), 0);

  const handleLogout = () => {
    try { singout(); } catch {}
    try { localStorage.removeItem("customerId"); } catch {}
    try { window.dispatchEvent(new Event("cartUpdated")); } catch {}
    navigate("/login");
  };

  const toggleSearch = () => {
    setIsSearchVisible(!isSearchVisible);
  };

  return (
    <header className="w-full bg-purple-600 shadow-md sticky top-0 z-50">
      <div className="w-full flex items-center justify-between px-6 py-3">

        {/* LOGO */}
        <Link to="/" className="text-white text-2xl font-bold">
          MiTienda
        </Link>
        
        {/* ICONOS + BOTONES (Contenedor derecho) */}
        <div className="flex items-center gap-4">
         
          {/* 1. Ícono de Lupa para Mobile (Nuevo - Muestra/Oculta el Buscador) */}
          <button 
              onClick={toggleSearch} 
              className="text-white text-2xl hover:text-purple-200 sm:hidden" // Oculto en Desktop
              aria-label="Toggle Search">
              <FiSearch />
          </button>

          {/* 2. Carrito */}
          {/* Carrito con Insignia (Badge) */}
          <Link 
                to="/cart" 
                className="relative text-white text-2xl hover:text-purple-200" // Agregamos 'relative'
            >
              <FiShoppingCart />
                {/* Lógica de la Insignia: Solo visible si hay items */}
                {cartItemCount > 0 && (
                    <span className="
                        absolute -top-1 -right-1.5 
                        bg-red-500 text-white 
                        rounded-full text-xs font-bold 
                        w-5 h-5 flex items-center justify-center
                        border-2 border-purple-600 // Borde para que resalte
                    ">
                        {cartItemCount}
                    </span>
                )}
          </Link>
          
          {/* 3. Buscador de Escritorio (Oculto en mobile) */}
          <div className="hidden sm:flex items-center bg-white rounded-full 
            px-3 py-2 sm:w-60 md:w-96 lg:w-[420px] shadow-sm transition-all">
            <FiSearch className="text-gray-500 text-lg mr-2" />
            <input 
              type="text"
              placeholder="Buscar productos..."
              className="w-full outline-none text-gray-700"
            />
          </div>

          {/* 4. Botón login/logout (¡RESTAURADO!) */}
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="px-4 py-1 text-sm md:text-base rounded-full bg-white text-purple-600 font-semibold hover:bg-purple-100"
            >
              Cerrar Sesión
            </button>
          ) : (
            <Link
              to="/login"
              className="px-4 py-1 text-sm md:text-base rounded-full bg-white text-purple-600 font-semibold hover:bg-purple-100"
            >
              Iniciar Sesión
            </Link>
          )}
        </div>
      </div>
        
    {/* BUSCADOR DESPLEGABLE PARA MOBILE */}
    {isSearchVisible && (
        <div className="sm:hidden w-full px-6 py-2 bg-purple-700">
            {/* Se utiliza max-w-xs y mx-auto para centrar y reducir el tamaño */}
            <div className="flex items-center bg-white rounded-full px-3 py-1 shadow-sm max-w-xs mx-auto">
                <FiSearch className="text-gray-500 text-lg mr-2" />
                <input 
                    type="text"
                    placeholder="Buscar productos..."
                    className="w-full outline-none text-gray-700"
                />
            </div>
        </div>
    )}

    </header>
  );
}