import React, { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { FiShoppingCart, FiSearch } from "react-icons/fi";
import useAuth from "../../auth/hook/useAuth";
import useCart from "../../cart/hooks/useCart";

export default function Header() {
  const { isAuthenticated, singout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [sp] = useSearchParams();

  // usamos "/" como catálogo
  const CATALOG_PATH = "/";

  // precarga el valor si ya estamos en "/"
  const [text, setText] = useState(location.pathname === CATALOG_PATH ? (sp.get("search") || "") : "");
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const cartItemCount = cart.reduce((t, i) => t + (i.quantity || 0), 0);

  const handleLogout = () => {
    try { singout(); } catch {}
    try { localStorage.removeItem("customerId"); } catch {}
    try { window.dispatchEvent(new Event("cartUpdated")); } catch {}
    navigate("/login");
  };

  const goSearch = () => {
    const qs = new URLSearchParams();
    if (text.trim()) qs.set("search", text.trim());
    qs.set("page", "1");
    navigate({ pathname: CATALOG_PATH, search: qs.toString() }); // <-- navega a "/?search=..&page=1"
  };

  const onKeyDown = (e) => { if (e.key === "Enter") goSearch(); };

  return (
    <header className="w-full bg-purple-600 shadow-md sticky top-0 z-50">
      <div className="w-full flex items-center justify-between px-6 py-3">
        <Link to="/" className="text-white text-2xl font-bold">MiTienda</Link>

        <div className="flex items-center gap-4">
          {/* Lupa mobile: abre buscador */}
          <button
            onClick={() => setIsSearchVisible(v => !v)}
            className="text-white text-2xl hover:text-purple-200 sm:hidden"
            aria-label="Buscar"
          >
            <FiSearch />
          </button>

          {/* Carrito */}
          <Link to="/cart" className="relative text-white text-2xl hover:text-purple-200">
            <FiShoppingCart />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1.5 bg-red-500 text-white rounded-full text-xs font-bold w-5 h-5 flex items-center justify-center border-2 border-purple-600">
                {cartItemCount}
              </span>
            )}
          </Link>

          {/* Buscador desktop */}
          <div className="hidden sm:flex items-center bg-white rounded-full px-3 py-2 sm:w-60 md:w-96 lg:w-[420px] shadow-sm">
            <button onClick={goSearch} className="text-gray-600 mr-2" aria-label="Buscar">
              <FiSearch className="text-lg" />
            </button>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Buscar productos..."
              className="w-full outline-none text-gray-700"
            />
          </div>

          {/* Auth */}
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="px-4 py-1 text-sm md:text-base rounded-full bg-white text-purple-600 font-semibold hover:bg-purple-100"
            >Cerrar Sesión</button>
          ) : (
            <Link
              to="/login"
              className="px-4 py-1 text-sm md:text-base rounded-full bg-white text-purple-600 font-semibold hover:bg-purple-100"
            >Iniciar Sesión</Link>
          )}
        </div>
      </div>

      {/* Buscador mobile desplegable */}
      {isSearchVisible && (
        <div className="sm:hidden w-full px-6 pb-3 bg-purple-700">
          <div className="flex items-center bg-white rounded-full px-3 py-1 shadow-sm max-w-xs mx-auto">
            <button onClick={goSearch} className="text-gray-600 mr-2" aria-label="Buscar">
              <FiSearch className="text-lg" />
            </button>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Buscar productos..."
              className="w-full outline-none text-gray-700"
            />
          </div>
        </div>
      )}
    </header>
  );
}
