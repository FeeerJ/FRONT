// src/modules/products/pages/ClientProductsPage.jsx
import React, { useState, useEffect } from 'react';
import Button from '../../shared/components/Button';
import ProductCard from '../components/ProductCard';
import ProductSearchBar from '../components/ProducSearchBar';
import CartIcon from '../../cart/components/CartIcon';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../auth/hook/useAuth';
import ClientMenu from '../../client/components/ClientMenu';

const ClientProductsPage = () => {
  // --- Estados ---
  const [products, setProducts] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { isAuthenticated, singout } = useAuth();

  // --- Agregar al carrito ---
  const handleAddToCart = (product, quantity) => {
    if (quantity < 1) {
      alert('Debes seleccionar al menos 1 unidad.');

      return;
    }

    let cart = JSON.parse(localStorage.getItem('cart') || '[]');

    const index = cart.findIndex(item => item.id === product.id);

    if (index !== -1) {
      cart[index].quantity += quantity;
    } else {
      cart.push({
        id: product.id,
        sku: product.sku,
        name: product.name,
        price: product.currentUnitPrice,
        quantity,
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  // --- Fetch de productos ---
  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: currentPage,
      limit: itemsPerPage,
      search: currentSearchTerm,
    }).toString();

    try {
      const response = await fetch(`/api/products?${params}`);

      if (!response.ok) throw new Error(`Error en la red: ${response.status}`);

      const data = await response.json();

      const activeProducts = data.filter(p => p.isActive);

      setProducts(activeProducts);

      setTotalItems(activeProducts.length);
      setTotalPages(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [currentPage, currentSearchTerm]);

  // --- Handlers de búsqueda ---
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleSearchSubmit = () => {
    setCurrentPage(1);
    setCurrentSearchTerm(searchTerm);
  };

  const goToPrevPage = () => setCurrentPage(p => Math.max(p - 1, 1));
  const goToNextPage = () => setCurrentPage(p => Math.min(p + 1, totalPages));

  // --- Render de carga y error ---
  if (isLoading && products.length === 0)
    return <div className="text-center mt-10">Cargando catálogo...</div>;

  if (error)
    return (
      <div className="text-center mt-10 bg-red-100 p-4 rounded text-red-700">
                Error: {error}
      </div>
    );

  return (
    <div className="container mx-auto p-4 md:p-8">

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h1 className="text-4xl font-extrabold text-gray-800">
                    Catálogo de Productos
        </h1>
        </div>

        
      {/* --- PAGINACIÓN --- */}
      <div className="mb-8 p-4 bg-white rounded-xl shadow-md flex justify-between items-center flex-wrap">
        <span className="text-gray-600 text-sm">
                    Mostrando {products.length} de {totalItems} resultados.
        </span>

        <div className="flex items-center space-x-2 text-sm">
          <Button
            variant="secondary"
            onClick={goToPrevPage}
            disabled={currentPage === 1 || isLoading}
            className="px-3 py-1 text-xs rounded-full bg-gray-100"
          >
                        Anterior
          </Button>

          <span className="font-semibold text-gray-800 px-3 py-1 bg-purple-100 rounded-full">
            {currentPage} / {totalPages}
          </span>

          <Button
            variant="secondary"
            onClick={goToNextPage}
            disabled={currentPage === totalPages || isLoading}
            className="px-3 py-1 text-xs rounded-full bg-gray-100"
          >
                        Siguiente
          </Button>
        </div>
      </div>

      {/* --- LISTA DE PRODUCTOS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* --- MENÚ MÓVIL --- */}
      <ClientMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        /* onGoToCart={() => {
                    setMenuOpen(false);
                    navigate('/cart');
                }}*/
        onLogout={() => {
          try { singout(); } catch (e) {
            console.error('[ClientProductsPage] Error during signout:', e);
          }
          try { localStorage.removeItem('customerId'); } catch (e) {
            console.error('[ClientProductsPage] Error removing customerId from localStorage:', e);
          }
          try { window.dispatchEvent(new Event('cartUpdated')); } catch (e) {
            console.error('[ClientProductsPage] Error dispatching cartUpdated event:', e);
          }
          setMenuOpen(false);
          navigate('/login');
        }}
      />

    </div>

  );
};

export default ClientProductsPage;
